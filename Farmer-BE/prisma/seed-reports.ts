import { PrismaClient, Role, ReportType, ReportStatus, PlotStatus, ContractStatus, QualityGrade, FarmerStatus, ProductStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Helper functions for seeding
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function generateSku(cropType: string): Promise<string> {
  const normalized = toSlug(cropType).toUpperCase().replace(/-/g, '');
  const prefix = normalized.slice(0, 3);
  const date = new Date().getFullYear();
  const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
  const timestampPart = Date.now().toString().slice(-4);
  return `PROD-${prefix}-${date}-${timestampPart}${randomStr}`;
}

async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = toSlug(name);
  let slug = baseSlug;
  let count = 1;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing) break;
    slug = `${baseSlug}-${count}`;
    count++;
  }
  return slug;
}

async function main() {
  console.log('Seeding 10 reports (5 Daily, 5 Harvest)...');

  // 1. Get existing Admin and Supervisor Core
  const admin = await prisma.adminProfile.findFirst();
  const supervisor = await prisma.supervisorProfile.findFirst({
    where: {
      user: {
        email: 'supervisor@farmers.com'
      }
    }
  });

  if (!admin || !supervisor) {
    throw new Error('Admin or Core Supervisor profile not found. Please run yarn seed first.');
  }

  // 2. Get existing Inventory manager
  const inventory = await prisma.inventoryProfile.findFirst();

  // 3. Create Warehouses
  console.log('Creating warehouses...');
  // Find the core inventory staff profile
  const inventoryUser = await prisma.user.findUnique({ where: { email: 'inventory@farmers.com' } });
  let staffProfileId: string | undefined;
  
  if (inventoryUser) {
    const profile = await prisma.inventoryProfile.findUnique({ where: { userId: inventoryUser.id } });
    staffProfileId = profile?.id;
  }

  const warehouse1 = await prisma.warehouse.upsert({
    where: { id: 'wh-center-001' },
    update: { managedBy: staffProfileId },
    create: {
      id: 'wh-center-001',
      adminId: admin.id,
      name: 'Kho Trung Tâm - Long Khánh',
      locationAddress: 'Long Khánh, Đồng Nai',
      managedBy: staffProfileId,
    }
  });

  const warehouse2 = await prisma.warehouse.upsert({
    where: { id: 'wh-satellite-001' },
    update: { managedBy: staffProfileId },
    create: {
      id: 'wh-satellite-001',
      adminId: admin.id,
      name: 'Kho Vệ Tinh - Xuân Lộc',
      locationAddress: 'Xuân Lộc, Đồng Nai',
      managedBy: staffProfileId,
    }
  });

  if (staffProfileId) {
    console.log('Assigned core inventory staff as manager for warehouses.');
  }

  // 4. Create a Zone
  const zone = await prisma.zone.create({
    data: {
      adminId: admin.id,
      name: 'Vùng canh tác A1',
      province: 'Đồng Nai',
      district: 'Long Khánh',
    },
  });

  // 5. Create Farmers, Plots, and Contracts
  let count = 0;
  
  for (let i = 1; i <= 10; i++) {
    try {
      const uniqueId = `${Date.now()}-${i}`;

      // Create Farmer
      const farmer = await prisma.farmer.create({
        data: {
          adminId: admin.id,
          fullName: `Nông dân ${i}`,
          phone: `090000000${i}`,
          cccd: `1234567890${i.toString().padStart(2, '0')}`, // Ensure 12 digits
          address: `Địa chỉ nông dân ${i}`,
          status: FarmerStatus.ACTIVE,
        },
      });

      // Create Plot
      const plot = await prisma.plot.create({
        data: {
          adminId: admin.id,
          farmerId: farmer.id,
          zoneId: zone.id,
          plotCode: `PLOT-${uniqueId}`,
          cropType: i <= 5 ? 'Sầu riêng Ri6' : 'Sầu riêng Thái',
          areaHa: 1.5 + i * 0.1,
          status: PlotStatus.ACTIVE,
        },
      });

      // Create Contract (Set to SETTLED so it appears in "New Listing" UI)
      const contract = await prisma.contract.create({
        data: {
          adminId: admin.id,
          supervisorId: supervisor.id,
          farmerId: farmer.id,
          plotId: plot.id,
          contractNo: `CONT-${uniqueId}`,
          cropType: plot.cropType!,
          grade: QualityGrade.A,
          status: ContractStatus.SETTLED,
          signedAt: new Date(),
          harvestDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      });

      // Create PriceBoard for this crop type and grade
      const priceBoard = await prisma.priceBoard.upsert({
        where: { id: `pb-${plot.cropType}-${i}` },
        update: {},
        create: {
          adminId: admin.id,
          cropType: plot.cropType!,
          grade: QualityGrade.A,
          buyPrice: 40000,
          sellPrice: 65000,
          isActive: true,
        }
      });

      // Create a Product linked to this contract (ONLY for the first 5 records to demo "Xuất lô" immediately)
      if (i <= 5) {
        const productSlug = await generateUniqueSlug(`${plot.cropType} - ${farmer.fullName}`);
        const productSku = await generateSku(plot.cropType!);
        
        await prisma.product.create({
          data: {
            adminId: admin.id,
            contractId: contract.id,
            plotId: plot.id,
            name: `${plot.cropType} - ${farmer.fullName}`,
            slug: productSlug,
            sku: productSku,
            pricePerKg: priceBoard.sellPrice,
            cropType: plot.cropType!,
            grade: QualityGrade.A,
            status: ProductStatus.PUBLISHED,
            qrCode: `QR-${uniqueId}`,
            stockKg: 0,
          }
        });
      }

      // Determine Report Type
      const type = i <= 5 ? ReportType.ROUTINE : ReportType.HARVEST;
      const typeLabel = type === ReportType.ROUTINE ? 'Hàng ngày' : 'Thu hoạch';

      // Create Report (Set to APPROVED - Ready for Lot creation demo)
      await prisma.dailyReport.create({
        data: {
          adminId: admin.id,
          supervisorId: supervisor.id,
          plotId: plot.id,
          type: type,
          content: i <= 5 
            ? `Báo cáo ${typeLabel} - Hợp đồng này ĐÃ CÓ sản phẩm. Bạn có thể demo XUẤT LÔ ngay.`
            : `Báo cáo ${typeLabel} - Hợp đồng này CHƯA CÓ sản phẩm. Bạn hãy demo TẠO NIÊM YẾT trước.`,
          status: ReportStatus.APPROVED,
          reportedAt: new Date(),
          imageUrls: ['https://images.unsplash.com/photo-1595011326442-8822521c768a?auto=format&fit=crop&q=80&w=500'],
          yieldEstimateKg: 1000,
        },
      });

      console.log(`- [${i}] Created APPROVED ${typeLabel} report. ${i <= 5 ? '(Has Product)' : '(No Product)'}`);
      count++;
    } catch (err) {
      console.error(`Error at index ${i}:`, err);
    }
  }

  console.log(`Successfully created ${count} approved reports.`);
  console.log(`- Records 1-5: Ready for "Create Lot" demo (Already has Product).`);
  console.log(`- Records 6-10: Ready for "Create Product" demo (No Product yet).`);
}

main()
  .catch((e) => {
    console.error('Fatal Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
