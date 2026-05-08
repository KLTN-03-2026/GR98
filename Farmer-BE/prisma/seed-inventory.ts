import { PrismaClient, QualityGrade, InventoryLotStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seedInventory() {
  console.log('--- Seeding Incoming Inventory Lots (Đơn hàng sắp về) ---');

  const admin = await prisma.adminProfile.findFirst();
  if (!admin) {
    console.error('Admin profile not found. Please run seed.ts first.');
    return;
  }

  // 1. Get Inventory Staff Profile
  const inventoryUser = await prisma.user.findUnique({ 
    where: { email: 'inventory@farmers.com' },
    include: { inventoryProfile: true }
  });

  if (!inventoryUser?.inventoryProfile) {
    console.error('Inventory staff profile not found. Please run seed.ts first.');
    return;
  }

  const staffProfileId = inventoryUser.inventoryProfile.id;

  // 2. Ensure Warehouse exists and is managed by this staff
  const warehouse = await prisma.warehouse.upsert({
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

  console.log(`Warehouse ${warehouse.name} is now managed by ${inventoryUser.fullName}`);

  const products = await prisma.product.findMany({
    take: 5
  });

  if (products.length === 0) {
    console.error('No products found. Please run seed-reports.ts first.');
    return;
  }

  const incomingLotsData = [
    {
      quantityKg: 500,
      qualityGrade: QualityGrade.A,
      harvestDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
      expiryDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      status: InventoryLotStatus.SCHEDULED,
    },
    {
      quantityKg: 1200,
      qualityGrade: QualityGrade.B,
      harvestDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // In 3 days
      expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: InventoryLotStatus.SCHEDULED,
    },
    {
      quantityKg: 850,
      qualityGrade: QualityGrade.A,
      harvestDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      expiryDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
      status: InventoryLotStatus.SCHEDULED,
    },
    {
      quantityKg: 2000,
      qualityGrade: QualityGrade.C,
      harvestDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // In 5 days
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: InventoryLotStatus.SCHEDULED,
    },
    {
      quantityKg: 300,
      qualityGrade: QualityGrade.A,
      harvestDate: new Date(), // Today
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: InventoryLotStatus.SCHEDULED,
    },
  ];

  console.log(`Creating ${incomingLotsData.length} scheduled lots...`);

  for (let i = 0; i < incomingLotsData.length; i++) {
    const product = products[i % products.length];
    const lotData = incomingLotsData[i];

    await prisma.inventoryLot.create({
      data: {
        ...lotData,
        warehouseId: warehouse.id,
        productId: product.id,
        contractId: product.contractId, // Optional link to contract if available
      },
    });
  }

  console.log('--- Incoming Inventory Seed Complete ---');
}

seedInventory()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
