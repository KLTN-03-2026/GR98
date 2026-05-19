/**
 * Script index toàn bộ tài liệu BVTV (PDF) trong `data/bvtv-docs/<crop>/` vào DB.
 *
 * Cách dùng:
 *   cd Farmer-BE
 *   yarn ts-node scripts/index-bvtv-docs.ts
 *
 * Folder structure:
 *   data/bvtv-docs/
 *     ├── sau-rieng/*.pdf    → cropType = 'sau-rieng'
 *     └── ca-phe/*.pdf       → cropType = 'ca-phe'
 *
 * Flow:
 *   1. Scan từng subfolder (sau-rieng, ca-phe).
 *   2. Parse từng PDF → trích xuất text.
 *   3. Cắt thành chunks ~500 từ (overlap 50 từ để không cắt giữa câu).
 *   4. Tạo bản searchable (lowercase + bỏ dấu) phục vụ FTS tiếng Việt.
 *   5. XÓA HẾT KnowledgeChunk cũ rồi insert mới (full reindex).
 *
 * Lý do không dùng embedding API:
 *   Corpus nhỏ (5-10 PDF) → keyword retrieval đủ tốt + không cần API key.
 *   Có thể nâng cấp lên pgvector + OpenAI embeddings sau nếu cần.
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import pdf from 'pdf-parse';

const prisma = new PrismaClient();

const DOCS_ROOT = path.join(__dirname, '..', 'data', 'bvtv-docs');

/** Các cropType + folder tương ứng. Thêm cây mới chỉ cần add 1 entry. */
const CROP_FOLDERS: Array<{ cropType: string; folder: string }> = [
  { cropType: 'sau-rieng', folder: 'sau-rieng' },
  { cropType: 'ca-phe', folder: 'ca-phe' },
];

/** Chunk size config — số từ trong 1 chunk. */
const CHUNK_WORDS = 500;
/** Overlap giữa các chunk — giúp không bị cắt giữa câu/đoạn quan trọng. */
const CHUNK_OVERLAP_WORDS = 50;

/**
 * Chuẩn hoá tiếng Việt: lowercase + bỏ dấu để FTS tìm được cả khi user gõ
 * "than thu" thay vì "thán thư". Cách này đơn giản hơn cài tsvector
 * Vietnamese custom config.
 */
function removeVietnameseDiacritics(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // xoá combining diacritics
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase();
}

/** Cắt text thành các chunk overlap theo số từ. */
function chunkText(text: string): string[] {
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\n+/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  const words = normalized.split(/\s+/);
  if (words.length === 0) return [];

  const chunks: string[] = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + CHUNK_WORDS, words.length);
    const chunk = words.slice(start, end).join(' ');
    chunks.push(chunk);
    if (end === words.length) break;
    start = end - CHUNK_OVERLAP_WORDS;
  }
  return chunks;
}

async function indexFile(filePath: string, cropType: string) {
  const fileName = path.basename(filePath);
  console.log(`\n📄 [${cropType}] ${fileName}`);

  const buffer = fs.readFileSync(filePath);
  let parsed;
  try {
    parsed = await pdf(buffer);
  } catch (err) {
    console.warn(`  ⚠ Không parse được PDF: ${(err as Error).message}`);
    return { fileName, chunks: 0 };
  }

  const text = parsed.text || '';
  if (!text.trim()) {
    console.warn('  ⚠ PDF không có text (có thể là ảnh scan — cần OCR)');
    return { fileName, chunks: 0 };
  }

  const chunks = chunkText(text);
  console.log(`  ✓ Parse ${parsed.numpages} trang → ${chunks.length} chunks`);

  for (let i = 0; i < chunks.length; i += 1) {
    const content = chunks[i];
    await prisma.knowledgeChunk.create({
      data: {
        source: fileName,
        cropType,
        chunkIdx: i,
        content,
        searchable: removeVietnameseDiacritics(content),
      },
    });
  }

  return { fileName, chunks: chunks.length };
}

async function main() {
  if (!fs.existsSync(DOCS_ROOT)) {
    console.error(`❌ Không tìm thấy thư mục: ${DOCS_ROOT}`);
    process.exit(1);
  }

  console.log(`🧹 Xoá toàn bộ KnowledgeChunk cũ...`);
  await prisma.knowledgeChunk.deleteMany();

  const summary: Array<{ fileName: string; cropType: string; chunks: number }> = [];
  let totalChunks = 0;

  for (const { cropType, folder } of CROP_FOLDERS) {
    const cropDir = path.join(DOCS_ROOT, folder);
    if (!fs.existsSync(cropDir)) {
      console.warn(`\n⚠  Folder không tồn tại: ${cropDir} (skip)`);
      continue;
    }
    const files = fs
      .readdirSync(cropDir)
      .filter((f) => f.toLowerCase().endsWith('.pdf'))
      .map((f) => path.join(cropDir, f));

    if (files.length === 0) {
      console.warn(`\n⚠  Không có file PDF trong ${cropDir}`);
      continue;
    }

    console.log(`\n🗂  [${cropType}] Tìm thấy ${files.length} file PDF.`);
    for (const f of files) {
      const result = await indexFile(f, cropType);
      summary.push({ cropType, ...result });
      totalChunks += result.chunks;
    }
  }

  console.log('\n========================================');
  console.log('  INDEX HOÀN TẤT');
  console.log('========================================');
  for (const s of summary) {
    console.log(
      `  [${s.cropType.padEnd(9)}] ${s.chunks.toString().padStart(4)} chunks ← ${s.fileName}`,
    );
  }
  console.log(`  Tổng cộng: ${totalChunks} chunks`);
  console.log('========================================');

  // In số chunks theo cropType
  const byCrop = await prisma.knowledgeChunk.groupBy({
    by: ['cropType'],
    _count: { _all: true },
  });
  console.log('\n  Phân bố theo cây:');
  for (const c of byCrop) {
    console.log(`    ${c.cropType}: ${c._count._all} chunks`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
