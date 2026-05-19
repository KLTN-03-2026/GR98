/**
 * Script kiểm tra xem các bệnh AI Vision có được nhắc đến trong corpus
 * KnowledgeChunk không. Chạy 1 lần sau khi index để biết phạm vi tài liệu.
 *
 *   yarn ts-node scripts/check-bvtv-coverage.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mỗi bệnh kèm vài keyword bằng tiếng Việt + tên khoa học để search.
// Tốt nhất match bằng dạng không dấu (searchable column).
const DISEASES = [
  { vi: 'Phytophthora', keywords: ['phytophthora', 'thoi la', 'thoi than'] },
  { vi: 'Thán thư', keywords: ['than thu', 'anthracnose', 'colletotrichum'] },
  { vi: 'Phyllosticta', keywords: ['phyllosticta', 'chay la', 'dom la'] },
  { vi: 'Rhizoctonia', keywords: ['rhizoctonia', 'chet ngon', 'chay la chet ngon'] },
  { vi: 'Phomopsis', keywords: ['phomopsis', 'dom la phomopsis'] },
  { vi: 'Rust (Rỉ sắt)', keywords: ['ri sat', 'rust', 'hemileia'] },
  { vi: 'Đốm rong (Algal)', keywords: ['dom rong', 'algal', 'cephaleuros'] },
];

async function main() {
  console.log('🔍 Kiểm tra phạm vi tài liệu BVTV trong corpus...\n');

  for (const d of DISEASES) {
    let totalMatches = 0;
    const matchedSources = new Set<string>();
    for (const kw of d.keywords) {
      const rows = await prisma.knowledgeChunk.findMany({
        where: { searchable: { contains: kw } },
        select: { source: true },
        take: 100,
      });
      totalMatches += rows.length;
      rows.forEach((r) => matchedSources.add(r.source));
    }
    const status = totalMatches > 0 ? '✅' : '❌';
    console.log(
      `${status} ${d.vi.padEnd(22)} — ${totalMatches} chunks ` +
        `${matchedSources.size > 0 ? `(${[...matchedSources].length} file)` : ''}`,
    );
  }

  console.log('\n💡 Bệnh ❌ KHÔNG có trong tài liệu sẽ được hệ thống trả về');
  console.log('   "không đủ dữ liệu, vui lòng hỏi kỹ sư" khi gặp ở phiên quét.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
