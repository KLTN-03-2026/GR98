import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';
import {
  RecommendationStatus,
  Role,
  ScanSessionStatus,
} from '@prisma/client';

interface Actor {
  userId: string;
  role: Role;
  adminId: string;
  supervisorProfileId: string | null;
}

interface RetrievedChunk {
  source: string;
  chunkIdx: number;
  content: string;
  score: number;
}

/**
 * Chuẩn hoá plot.cropType về slug để khớp với KnowledgeChunk.cropType.
 * Plot có thể lưu "Cà phê" / "ca-phe" / "coffee"... do form và seed data khác nhau.
 * → Mọi biến thể về 2 slug chuẩn 'ca-phe' | 'sau-rieng'. Trả null nếu không khớp
 *   loại cây nào trong KB (vd. lúa, chè) → caller skip filter cropType.
 */
function normalizeCropType(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
  if (s.includes('ca phe') || s === 'ca-phe' || s === 'caphe' || s === 'coffee') {
    return 'ca-phe';
  }
  if (s.includes('sau rieng') || s === 'sau-rieng' || s === 'saurieng' || s === 'durian') {
    return 'sau-rieng';
  }
  return null;
}

/**
 * Payload mà BE kỳ vọng Claude trả về (JSON) — schema cố định để FE
 * render được và để BE validate. Mọi field tuỳ chọn có thể null khi
 * Claude không đủ dữ liệu kết luận.
 */
interface ClaudeRecommendationPayload {
  diagnosisSummary: string;
  severityAssessment: string;
  recommendation: {
    product: string | null;
    dosagePerHa: string | null;
    totalDosage: string | null;
    sprayInterval: string | null;
    duration: string | null;
  };
  warnings: string[];
  confidence: 'high' | 'medium' | 'low';
  /// Trích đoạn ngắn từ tài liệu được retrieve, để FE hiển thị khi user
  /// bấm "Xem nguồn tham khảo". Phải có ≥1 nếu confidence != low.
  citations: Array<{
    source: string;
    excerpt: string;
  }>;
}

@Injectable()
export class AiAdvisorService {
  private readonly logger = new Logger(AiAdvisorService.name);
  /**
   * Khởi tạo Anthropic SDK. Hỗ trợ 2 mode:
   *   1. Chính chủ Anthropic (api.anthropic.com): set `ANTHROPIC_API_KEY`
   *      với key `sk-ant-...`. SDK dùng header `x-api-key`.
   *   2. Proxy (vd. gwai.cloud, OpenRouter): set thêm `ANTHROPIC_BASE_URL`
   *      → SDK chuyển sang Bearer token để khớp với proxy contract.
   */
  private readonly anthropic = (() => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;
    const baseURL = process.env.ANTHROPIC_BASE_URL;
    if (baseURL) {
      // Proxy mode — Bearer token + spoof User-Agent = curl. GwAI proxy
      // (theo cấu hình OpenClaw chính thức của họ) bắt User-Agent dạng
      // "curl/..." để qua được Cloudflare WAF + APISIX gateway. SDK của
      // Anthropic mặc định gửi UA "anthropic-sdk-typescript/..." nên bị
      // chặn — phải override.
      return new Anthropic({
        authToken: apiKey,
        baseURL,
        defaultHeaders: {
          'User-Agent': 'curl/8.7.1',
        },
      });
    }
    return new Anthropic({ apiKey });
  })();
  private readonly model =
    process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';

  constructor(private prisma: PrismaService) {}

  /**
   * Sinh khuyến nghị xử lý cho 1 phiên quét đã CLOSED. Flow:
   *   1. Lấy session + plot + breakdown bệnh.
   *   2. Tìm bệnh "chủ đạo" (most frequent infected disease).
   *   3. Retrieve chunks từ corpus BVTV liên quan bệnh đó.
   *   4. Gọi Claude với prompt nghiêm: bắt grounding theo tài liệu, không bịa.
   *   5. Validate output, lưu TreatmentRecommendation DRAFT.
   */
  async recommend(sessionId: string, userId: string) {
    if (!this.anthropic) {
      throw new BadRequestException(
        'Tính năng AI Advisor chưa được cấu hình (thiếu ANTHROPIC_API_KEY)',
      );
    }
    const actor = await this.resolveActor(userId);

    const session = await this.prisma.scanSession.findFirst({
      where: {
        id: sessionId,
        adminId: actor.adminId,
        ...(actor.role === Role.SUPERVISOR
          ? { supervisorId: actor.supervisorProfileId ?? undefined }
          : {}),
      },
      include: {
        plot: {
          select: { plotCode: true, areaHa: true, cropType: true, plantingDate: true },
        },
        scans: {
          select: { diseaseEn: true, diseaseVi: true, category: true, confidence: true },
        },
      },
    });
    if (!session) throw new NotFoundException('Phiên quét không tồn tại');
    if (session.status !== ScanSessionStatus.CLOSED) {
      throw new BadRequestException(
        'Phiên chưa được đóng — đóng phiên trước khi lấy khuyến nghị',
      );
    }

    // === CACHE LAYER ===
    // Nếu session này đã có recommendation rồi → trả ngay, không gọi lại Claude.
    // Tiết kiệm ~30-50s và quota API. User bấm "Lấy khuyến nghị" lần 2+ sẽ
    // instant. Để force regenerate phải tạo phiên quét mới.
    const existing = await this.prisma.treatmentRecommendation.findFirst({
      where: { sessionId: session.id, adminId: actor.adminId },
    });
    if (existing) {
      this.logger.log(`Trả cached recommendation cho session=${session.id}`);
      return existing;
    }

    // Xác định bệnh chủ đạo (frequency cao nhất, loại trừ "healthy").
    const counter: Record<string, { en: string; vi: string; count: number }> = {};
    for (const s of session.scans) {
      if (s.category && s.category.toLowerCase() === 'healthy') continue;
      const key = s.diseaseEn || s.diseaseVi;
      if (!counter[key]) counter[key] = { en: s.diseaseEn, vi: s.diseaseVi, count: 0 };
      counter[key].count += 1;
    }
    const sorted = Object.values(counter).sort((a, b) => b.count - a.count);
    const primary = sorted[0];

    if (!primary) {
      // Toàn cây khoẻ — không cần khuyến nghị.
      return this.savePayload(session.id, actor.adminId, {
        diagnosisSummary: 'Toàn bộ cây trong phiên quét đều khoẻ mạnh.',
        severityAssessment: 'none',
        recommendation: {
          product: null,
          dosagePerHa: null,
          totalDosage: null,
          sprayInterval: null,
          duration: null,
        },
        warnings: ['Không cần xử lý. Tiếp tục chăm sóc thường xuyên.'],
        confidence: 'high',
        citations: [],
      });
    }

    // Retrieve top-K chunks từ KnowledgeChunk — FILTER theo cropType của plot
    // để không trộn KB sầu riêng với KB cà phê. Plot lưu cropType lung tung
    // ("Cà phê" / "ca-phe" / "coffee"...) nên cần normalize trước khi filter.
    // topK=3 thay vì 4 → tiết kiệm ~25% input tokens → Claude inference nhanh hơn.
    const normalizedCrop = normalizeCropType(session.plot.cropType);
    const chunks = await this.retrieveChunks(
      primary.vi,
      primary.en,
      3,
      normalizedCrop ?? undefined,
    );
    if (chunks.length === 0) {
      // Không có tài liệu phù hợp → trả thẳng "không đủ dữ liệu".
      return this.savePayload(session.id, actor.adminId, {
        diagnosisSummary: `Phát hiện ${primary.vi} (${primary.count}/${session.totalScans} cây).`,
        severityAssessment: session.severity ?? 'unknown',
        recommendation: {
          product: null,
          dosagePerHa: null,
          totalDosage: null,
          sprayInterval: null,
          duration: null,
        },
        warnings: [
          `Hệ thống không có tài liệu BVTV về "${primary.vi}". Vui lòng tham vấn kỹ sư nông học trực tiếp.`,
        ],
        confidence: 'low',
        citations: [],
      });
    }

    // Gọi Claude với prompt nghiêm.
    const payload = await this.callClaude({
      primaryDisease: primary,
      severity: session.severity ?? 'medium',
      infectedCount: session.infectedCount,
      totalScans: session.totalScans,
      areaHa: session.plot.areaHa,
      cropType: session.plot.cropType,
      retrievedChunks: chunks,
    });

    return this.savePayload(session.id, actor.adminId, payload);
  }

  /** Duyệt 1 khuyến nghị — set status APPROVED. */
  async approve(id: string, note: string | undefined, userId: string) {
    const actor = await this.resolveActor(userId);
    const reco = await this.prisma.treatmentRecommendation.findFirst({
      where: { id, adminId: actor.adminId },
    });
    if (!reco) throw new NotFoundException('Khuyến nghị không tồn tại');
    if (reco.status !== RecommendationStatus.DRAFT) {
      throw new BadRequestException('Khuyến nghị đã được xử lý trước đó');
    }
    if (reco.confidence === 'low') {
      throw new BadRequestException(
        'Khuyến nghị có độ tin cậy thấp — không thể duyệt tự động. Vui lòng tham vấn kỹ sư nông học.',
      );
    }
    return this.prisma.treatmentRecommendation.update({
      where: { id },
      data: {
        status: RecommendationStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedBy: actor.userId,
        reviewNote: note ?? null,
      },
    });
  }

  /** Từ chối 1 khuyến nghị — set status REJECTED. */
  async reject(id: string, note: string | undefined, userId: string) {
    const actor = await this.resolveActor(userId);
    const reco = await this.prisma.treatmentRecommendation.findFirst({
      where: { id, adminId: actor.adminId },
    });
    if (!reco) throw new NotFoundException('Khuyến nghị không tồn tại');
    if (reco.status !== RecommendationStatus.DRAFT) {
      throw new BadRequestException('Khuyến nghị đã được xử lý trước đó');
    }
    return this.prisma.treatmentRecommendation.update({
      where: { id },
      data: {
        status: RecommendationStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedBy: actor.userId,
        reviewNote: note ?? null,
      },
    });
  }

  // ─── Internals ────────────────────────────────────────────────────────

  /**
   * Retrieve top-K chunks dùng keyword search trên `searchable` (đã bỏ dấu
   * + lowercase). Score đơn giản: số keyword match × 10 + ưu tiên match
   * trong content. Đủ tốt cho corpus ~80 chunks.
   */
  private async retrieveChunks(
    diseaseVi: string,
    diseaseEn: string,
    topK = 4,
    cropType?: string,
  ): Promise<RetrievedChunk[]> {
    const removeDiacritics = (s: string) =>
      s
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .toLowerCase();

    // Tạo danh sách keyword từ tên bệnh tiếng Việt + tiếng Anh.
    const keywords = [
      removeDiacritics(diseaseVi),
      diseaseEn.toLowerCase(),
      ...diseaseVi.split(/\s+/).map((w) => removeDiacritics(w)),
      ...diseaseEn.split(/\s+/).map((w) => w.toLowerCase()),
    ]
      .filter((k) => k.length >= 3)
      .filter((k, i, arr) => arr.indexOf(k) === i);

    if (keywords.length === 0) return [];

    // Lấy tất cả chunk match ÍT NHẤT 1 keyword (lo OR).
    // Nếu có cropType → filter chỉ chunks của cây tương ứng.
    const chunks = await this.prisma.knowledgeChunk.findMany({
      where: {
        ...(cropType ? { cropType } : {}),
        OR: keywords.map((k) => ({ searchable: { contains: k } })),
      },
      take: 50,
    });

    // Score theo số keyword match (đếm cả số lần xuất hiện).
    const scored: RetrievedChunk[] = chunks.map((c) => {
      let score = 0;
      for (const k of keywords) {
        const matches = (c.searchable.match(new RegExp(k, 'g')) || []).length;
        score += matches;
      }
      return {
        source: c.source,
        chunkIdx: c.chunkIdx,
        content: c.content,
        score,
      };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  /** Build prompt + call Claude, parse JSON output. */
  private async callClaude(params: {
    primaryDisease: { en: string; vi: string; count: number };
    severity: string;
    infectedCount: number;
    totalScans: number;
    areaHa: number;
    cropType: string;
    retrievedChunks: RetrievedChunk[];
  }): Promise<ClaudeRecommendationPayload> {
    const {
      primaryDisease,
      severity,
      infectedCount,
      totalScans,
      areaHa,
      cropType,
      retrievedChunks,
    } = params;

    const cropDisplay =
      cropType === 'ca-phe' || cropType?.toLowerCase().includes('cà phê')
        ? 'cà phê'
        : cropType === 'sau-rieng' ||
            cropType?.toLowerCase().includes('sầu riêng')
          ? 'sầu riêng'
          : cropType;

    const SYSTEM_PROMPT = `Bạn là cố vấn BVTV cho cây ${cropDisplay} ở Việt Nam.

Đưa ra khuyến nghị THAM KHẢO: thuốc, liều, chu kỳ phun dựa trên hoạt chất nêu trong TÀI LIỆU + suy luận theo mức độ nặng.

QUY TẮC:
- Mỗi hoạt chất nhắc PHẢI có citation từ tài liệu.
- Liều: ưu tiên số từ tài liệu (confidence=high). Nếu chỉ có tên hoạt chất → suy luận liều chuẩn VN (confidence=medium). VD Hexaconazole 5% → 0.3-0.5 L/ha.
- Số lần phun: light=1, medium=2 (7-10 ngày/lần), severe=3-4 (5-7 ngày/lần).
- KHÔNG bịa thương hiệu — dùng tên hoạt chất, có thể ghi "vd Anvil 5SC".
- Warnings bắt buộc nhắc: tham khảo, quyết định cuối do kỹ sư nông học.
- Output CHỈ JSON đúng schema. KHÔNG có text khác.`;

    const docsContext = retrievedChunks
      .map(
        (c, i) =>
          `[Đoạn ${i + 1}] Nguồn: "${c.source}" (đoạn #${c.chunkIdx})\n${c.content}`,
      )
      .join('\n\n---\n\n');

    const userMessage = `BỐI CẢNH:
- Cây trồng: ${cropType}
- Diện tích lô: ${areaHa} ha
- Bệnh phát hiện: ${primaryDisease.vi} (${primaryDisease.en})
- Tỉ lệ nhiễm: ${infectedCount}/${totalScans} cây (${Math.round((infectedCount / totalScans) * 100)}%)
- Mức độ nghiêm trọng: ${severity}

TÀI LIỆU THAM KHẢO:
${docsContext}

YÊU CẦU: Đưa ra khuyến nghị xử lý bệnh ${primaryDisease.vi} cho lô ${areaHa} ha trên dạng JSON đúng schema sau (chỉ JSON, không text thêm):

{
  "diagnosisSummary": "tóm tắt ngắn 1-2 câu về tình trạng bệnh trên lô",
  "severityAssessment": "${severity}",
  "recommendation": {
    "product": "tên thuốc cụ thể hoặc null",
    "dosagePerHa": "liều cho 1 ha, vd '1.5 kg/ha' hoặc null",
    "totalDosage": "tổng liều cho ${areaHa} ha, vd '15 kg' hoặc null",
    "sprayInterval": "khoảng cách giữa các lần phun, vd '7-10 ngày' hoặc null",
    "duration": "số lần phun, vd '2 lần' hoặc null"
  },
  "warnings": ["mảng cảnh báo, vd 'tham vấn kỹ sư trước khi áp dụng', 'không phun khi sắp mưa'..."],
  "confidence": "high | medium | low",
  "citations": [
    { "source": "tên file gốc", "excerpt": "trích đoạn ngắn từ tài liệu chứng minh" }
  ]
}`;

    let response;
    try {
      response = await this.anthropic!.messages.create({
        model: this.model,
        // Giảm 2048 → 1200: output khuyến nghị ngắn gọn hơn, generate nhanh hơn
        // ~40%. Schema vẫn đủ chỗ cho 4-6 warnings + 2-3 citations.
        max_tokens: 1200,
        // Temperature thấp để response ngắn gọn + deterministic hơn.
        temperature: 0.3,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      });
    } catch (err: any) {
      // Expose chi tiết lỗi để dễ debug (rate limit, sai model name, sai key,
      // mạng…). Trong production có thể giấu bớt nhưng dev cần thấy.
      const detail =
        err?.error?.error?.message ||
        err?.message ||
        err?.toString?.() ||
        'unknown error';
      this.logger.error(`Claude API call failed: ${detail}`, err);
      throw new BadRequestException(`Claude API lỗi: ${detail}`);
    }

    const textBlock = response.content.find((b) => b.type === 'text');
    const raw = textBlock && textBlock.type === 'text' ? textBlock.text : '';

    // Extract JSON: Claude có thể wrap trong code fence ```json ... ``` hoặc
    // thêm text giải thích trước/sau. Lấy substring từ `{` đầu tiên đến `}`
    // cuối cùng để bỏ qua mọi nhiễu xung quanh.
    let parsed: ClaudeRecommendationPayload;
    try {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start < 0 || end <= start) {
        throw new Error('Không tìm thấy JSON object trong response');
      }
      const cleaned = raw.slice(start, end + 1);
      parsed = JSON.parse(cleaned);
    } catch (err) {
      this.logger.warn(
        `Claude trả output không parse được JSON. Raw (500 chars đầu): ${raw.slice(0, 500)}`,
      );
      throw new BadRequestException(
        `AI trả về định dạng JSON không hợp lệ. Nội dung Claude trả: ${raw.slice(0, 200)}...`,
      );
    }

    // Validate: confidence != low thì BẮT BUỘC có citations.
    if (parsed.confidence !== 'low' && (!parsed.citations || parsed.citations.length === 0)) {
      this.logger.warn(
        'Claude trả khuyến nghị không có citation → ép confidence=low',
      );
      parsed.confidence = 'low';
      parsed.warnings = [
        ...(parsed.warnings ?? []),
        'Hệ thống không tìm thấy trích dẫn rõ ràng — vui lòng tham vấn kỹ sư nông học.',
      ];
    }

    return parsed;
  }

  private async savePayload(
    sessionId: string,
    adminId: string,
    payload: ClaudeRecommendationPayload,
  ) {
    return this.prisma.treatmentRecommendation.create({
      data: {
        sessionId,
        adminId,
        confidence: payload.confidence,
        payload: payload as any,
        citations: payload.citations as any,
      },
    });
  }

  private async resolveActor(userId: string): Promise<Actor> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        adminProfile: { select: { id: true } },
        supervisorProfile: { select: { id: true, adminId: true } },
      },
    });
    if (!user) throw new ForbiddenException('Người dùng không tồn tại');

    let adminId = '';
    if (user.role === Role.ADMIN) {
      adminId = user.adminProfile?.id ?? '';
    } else if (user.role === Role.SUPERVISOR && user.supervisorProfile) {
      adminId = user.supervisorProfile.adminId;
    }
    if (!adminId) {
      throw new ForbiddenException('Không xác định được tenant');
    }

    return {
      userId,
      role: user.role,
      adminId,
      supervisorProfileId: user.supervisorProfile?.id ?? null,
    };
  }
}
