import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Trợ lý canh tác — Q&A interactive với supervisor. Khác với AiAdvisor (sinh
 * khuyến nghị từ session quét đa điểm), chat ở đây cho phép user **hỏi bất
 * kỳ câu nào** về kỹ thuật canh tác, BVTV, lịch phun xịt... và nhận trả lời
 * có grounding theo tài liệu PDF đã index.
 *
 * Stack giống AiAdvisor:
 *   - Anthropic SDK (hỗ trợ cả proxy GwAI Cloud qua ANTHROPIC_BASE_URL).
 *   - Retrieve top-K chunks từ KnowledgeChunk dùng keyword search trên cột
 *     `searchable` (đã chuẩn hoá bỏ dấu tiếng Việt).
 *   - System prompt nghiêm: chỉ trả lời theo tài liệu, không bịa.
 *
 * Lưu ý dev: hiện không lưu lịch sử hội thoại — mỗi request là 1-turn độc
 * lập. Nếu cần multi-turn sau, thêm bảng ChatSession + ChatMessage.
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  private readonly anthropic = (() => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;
    const baseURL = process.env.ANTHROPIC_BASE_URL;
    if (baseURL) {
      return new Anthropic({
        authToken: apiKey,
        baseURL,
        defaultHeaders: { 'User-Agent': 'curl/8.7.1' },
      });
    }
    return new Anthropic({ apiKey });
  })();
  private readonly model =
    process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';

  constructor(private prisma: PrismaService) {}

  /** Hỏi 1 câu, retrieve tài liệu liên quan, trả về câu trả lời + citations. */
  async ask(question: string) {
    const q = (question ?? '').trim();
    if (!q) throw new BadRequestException('Câu hỏi không được rỗng');
    if (q.length > 1000) {
      throw new BadRequestException('Câu hỏi quá dài (giới hạn 1000 ký tự)');
    }
    if (!this.anthropic) {
      throw new BadRequestException(
        'Chat chưa được cấu hình (thiếu ANTHROPIC_API_KEY)',
      );
    }

    const chunks = await this.retrieveChunks(q);

    const SYSTEM_PROMPT = `Bạn là trợ lý canh tác cây sầu riêng và cà phê cho nông dân Việt Nam. Văn phong thân thiện, gần gũi, trả lời ngắn gọn (<300 từ).

CÁCH TRẢ LỜI:

1. Câu xã giao (chào, cảm ơn, tạm biệt, giới thiệu...) → trả lời tự nhiên, thân thiện như con người. KHÔNG nói "không có tài liệu".

2. Câu hỏi kỹ thuật canh tác / bệnh / thuốc:
   - Nếu TÀI LIỆU THAM KHẢO có thông tin → ưu tiên dùng, ghi rõ nguồn ở cuối câu trả lời, vd: (theo Quy trình canh tác cà phê an toàn).
   - Nếu tài liệu KHÔNG có hoặc thiếu → có thể bổ sung bằng kiến thức nông nghiệp phổ biến, NHƯNG ghi rõ "(theo kinh nghiệm canh tác phổ biến, không có trong tài liệu)".
   - Khi đề cập LIỀU LƯỢNG / NỒNG ĐỘ / CHU KỲ PHUN cụ thể: chỉ đưa số nếu tài liệu có HOẶC đây là chuẩn nông nghiệp VN ai cũng biết. Trường hợp không chắc → ghi "tham khảo kỹ sư nông học để có liều chính xác cho điều kiện cụ thể".

3. Câu hỏi NGOÀI lĩnh vực canh tác (giá nông sản, pháp lý, code...) → trả lời ngắn "Tôi chuyên về kỹ thuật canh tác sầu riêng và cà phê thôi, mảng đó tôi không hỗ trợ được" rồi gợi ý hỏi gì hợp scope.

4. Văn phong: tiếng Việt, ngắn gọn, có bullet đơn giản (- item) nếu cần liệt kê. KHÔNG markdown phức tạp.

NGUYÊN TẮC AN TOÀN:
- KHÔNG bịa tên thuốc thương mại không tồn tại.
- LUÔN khuyên tham vấn kỹ sư khi xử lý vấn đề nghiêm trọng.
- Nếu user hỏi về cây không phải cà phê/sầu riêng (vd lúa, chè) → trả lời "tôi chưa được train cho cây này".`;

    const docsContext =
      chunks.length === 0
        ? '(không tìm thấy đoạn tài liệu phù hợp — bạn có thể trả lời dựa vào kiến thức nông nghiệp phổ biến, nhớ ghi rõ là tham khảo chung)'
        : chunks
            .map(
              (c, i) =>
                `[Đoạn ${i + 1}] Nguồn: "${c.source}"\n${c.content}`,
            )
            .join('\n\n---\n\n');

    const userMessage = `CÂU HỎI: ${q}\n\nTÀI LIỆU THAM KHẢO:\n${docsContext}`;

    let response;
    try {
      response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      });
    } catch (err: any) {
      const detail =
        err?.error?.error?.message ||
        err?.message ||
        err?.toString?.() ||
        'unknown error';
      this.logger.error(`Claude API call failed: ${detail}`, err);
      throw new BadRequestException(`Claude API lỗi: ${detail}`);
    }

    const textBlock = response.content.find((b) => b.type === 'text');
    const answer =
      textBlock && textBlock.type === 'text'
        ? textBlock.text.trim()
        : 'Xin lỗi, tôi không tạo được câu trả lời.';

    return {
      answer,
      citations: chunks.map((c) => ({
        source: c.source,
        excerpt: c.content.slice(0, 200),
      })),
    };
  }

  /**
   * Phát hiện crop type từ nội dung câu hỏi.
   * Trả về 'ca-phe' / 'sau-rieng' / null (không xác định → search cả 2).
   */
  private detectCropType(question: string): string | null {
    const normalized = question
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .toLowerCase();
    if (
      normalized.includes('ca phe') ||
      normalized.includes('caphe') ||
      normalized.includes('coffee')
    ) {
      return 'ca-phe';
    }
    if (
      normalized.includes('sau rieng') ||
      normalized.includes('saurieng') ||
      normalized.includes('durian')
    ) {
      return 'sau-rieng';
    }
    return null;
  }

  /**
   * Retrieve top-K chunks bằng keyword search trên cột `searchable` của
   * KnowledgeChunk (đã lowercase + bỏ dấu). Score đơn giản: số keyword match.
   *
   * Auto-filter theo cropType: nếu câu hỏi có "cà phê" → chỉ search chunks
   * coffee. Có "sầu riêng" → chỉ search durian. Không có → search cả 2.
   */
  private async retrieveChunks(question: string, topK = 4) {
    const removeDiacritics = (s: string) =>
      s
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .toLowerCase();

    // Tách câu hỏi thành keyword, loại stopword ngắn.
    const STOPWORDS = new Set([
      'la', 'va', 'co', 'cua', 'cho', 'voi', 'thi', 'de', 'nhu',
      'mot', 'cac', 'cay', 'sau', 'rieng', 'lam', 'sao', 'gi',
      'the', 'nao', 'khi', 'bi', 'nay', 'do', 'thuoc', 'phai',
    ]);

    const tokens = removeDiacritics(question)
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w));

    if (tokens.length === 0) return [];

    const cropType = this.detectCropType(question);

    const chunks = await this.prisma.knowledgeChunk.findMany({
      where: {
        ...(cropType ? { cropType } : {}),
        OR: tokens.map((t) => ({ searchable: { contains: t } })),
      },
      take: 50,
    });

    const scored = chunks.map((c) => {
      let score = 0;
      for (const t of tokens) {
        const matches = (c.searchable.match(new RegExp(t, 'g')) || []).length;
        score += matches;
      }
      return { ...c, score };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, topK);
  }
}
