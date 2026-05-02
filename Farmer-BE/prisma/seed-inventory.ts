import { PrismaClient, QualityGrade, InventoryLotStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n========================================');
  console.log('  FARMERS — INVENTORY DEMO SEED');
  console.log('========================================\n');

  const admin = await prisma.adminProfile.findFirst();
  const inventory = await prisma.inventoryProfile.findFirst();

  if (!admin || !inventory) {
    console.error('[ERROR] Core profiles not found. Please run seed.ts first.');
    return;
  }

  // 1. Warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { id: 'wh-demo-01' },
    update: {},
    create: {
      id: 'wh-demo-01',
      name: 'Kho Tổng Hợp Hà Nội',
      locationAddress: 'Khu công nghiệp Quang Minh, Mê Linh, Hà Nội',
      adminId: admin.id,
      managedBy: inventory.id,
    },
  });

  // 2. Products
  const productA = await prisma.product.upsert({
    where: { sku: 'GAO-ST25-DEMO' },
    update: {},
    create: {
      name: 'Gạo ST25 Sóc Trăng',
      slug: 'gao-st25-soc-trang-demo',
      sku: 'GAO-ST25-DEMO',
      cropType: 'Gạo ST25',
      grade: QualityGrade.A,
      pricePerKg: 32000,
      qrCode: 'QR-GAO-ST25-DEMO',
      adminId: admin.id,
      unit: 'kg',
      status: 'PUBLISHED',
    },
  });

  const productB = await prisma.product.upsert({
    where: { sku: 'CAFE-ROB-DEMO' },
    update: {},
    create: {
      name: 'Cà phê Robusta Đắk Lắk',
      slug: 'cafe-robusta-dak-lak-demo',
      sku: 'CAFE-ROB-DEMO',
      cropType: 'Cà phê',
      grade: QualityGrade.B,
      pricePerKg: 65000,
      qrCode: 'QR-CAFE-ROB-DEMO',
      adminId: admin.id,
      unit: 'kg',
      status: 'PUBLISHED',
    },
  });

  // 3. LOTS
  const now = new Date();

  // A. RECEIVED LOT (Đã nhập kho)
  console.log('[SEED] Creating RECEIVED lot...');
  const lotReceived = await prisma.inventoryLot.upsert({
    where: { id: 'LOT-REC-001' },
    update: {},
    create: {
      id: 'LOT-REC-001',
      warehouseId: warehouse.id,
      productId: productA.id,
      quantityKg: 1500,
      qualityGrade: QualityGrade.A,
      status: 'RECEIVED',
      harvestDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.warehouseTransaction.upsert({
    where: { id: 'TX-REC-001' },
    update: {},
    create: {
      id: 'TX-REC-001',
      warehouseId: warehouse.id,
      productId: productA.id,
      inventoryLotId: lotReceived.id,
      type: 'inbound',
      quantityKg: 1500,
      note: 'Nhập kho lô hàng mẫu (đã xác nhận)',
      createdBy: inventory.userId,
      createdAt: lotReceived.createdAt,
    },
  });

  await prisma.product.update({
    where: { id: productA.id },
    data: { stockKg: 1500 }
  });

  // B. ARRIVED LOTS (Chờ xác nhận)
  console.log('[SEED] Creating 6 ARRIVED lots (1 initial + 5 extra)...');
  const pendingItems = [
    { id: 'LOT-ARR-001', productId: productB.id, qty: 850, grade: QualityGrade.B },
    { id: 'LOT-ARR-002', productId: productA.id, qty: 1200, grade: QualityGrade.A },
    { id: 'LOT-ARR-003', productId: productB.id, qty: 450, grade: QualityGrade.B },
    { id: 'LOT-ARR-004', productId: productA.id, qty: 3000, grade: QualityGrade.A },
    { id: 'LOT-ARR-005', productId: productB.id, qty: 180, grade: QualityGrade.C },
    { id: 'LOT-ARR-006', productId: productA.id, qty: 550, grade: QualityGrade.B },
  ];

  for (let i = 0; i < pendingItems.length; i++) {
    const item = pendingItems[i];
    await (prisma.inventoryLot as any).upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        warehouseId: warehouse.id,
        productId: item.productId,
        quantityKg: item.qty,
        qualityGrade: item.grade,
        status: 'ARRIVED',
        harvestDate: now,
        createdAt: new Date(now.getTime() - i * 3600000),
      },
    });
  }

  // C. SCHEDULED LOT (Sắp về)
  console.log('[SEED] Creating SCHEDULED lot...');
  await prisma.inventoryLot.upsert({
    where: { id: 'LOT-SCH-001' },
    update: {},
    create: {
      id: 'LOT-SCH-001',
      warehouseId: warehouse.id,
      productId: productA.id,
      quantityKg: 2500,
      qualityGrade: QualityGrade.A,
      status: 'SCHEDULED',
      harvestDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      createdAt: now,
    },
  });

  console.log('\n========================================');
  console.log('  SEED COMPLETE');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('[SEED] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
