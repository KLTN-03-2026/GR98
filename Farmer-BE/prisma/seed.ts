import { PrismaClient, Role, ContractStatus, InventoryLotStatus, QualityGrade, ProductStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = '123123';

type LoginSeedAccount = {
  email: string;
  fullName: string;
  phone: string;
  role: Role;
};

const ACCOUNTS: LoginSeedAccount[] = [
  {
    email: 'admin@farmers.com',
    fullName: 'Quản Trị Viên',
    phone: '0123456789',
    role: Role.ADMIN,
  },
  {
    email: 'supervisor@farmers.com',
    fullName: 'Giám Sát Viên',
    phone: '0912333444',
    role: Role.SUPERVISOR,
  },
  {
    email: 'inventory@farmers.com',
    fullName: 'Quản Lý Kho',
    phone: '0944555666',
    role: Role.INVENTORY,
  },
  {
    email: 'client@farmers.com',
    fullName: 'Khách Hàng',
    phone: '0987654321',
    role: Role.CLIENT,
  },
];

async function clearAllData() {
  await prisma.$transaction([
    prisma.warehouseTransaction.deleteMany(),
    prisma.inventoryLot.deleteMany(),
    prisma.warehouse.deleteMany(),
    prisma.review.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.productCategory.deleteMany(),
    prisma.product.deleteMany(),
    prisma.contract.deleteMany(),
    prisma.dailyReport.deleteMany(),
    prisma.assignment.deleteMany(),
    prisma.plot.deleteMany(),
    prisma.farmer.deleteMany(),
    prisma.zone.deleteMany(),
    prisma.priceBoard.deleteMany(),
    prisma.category.deleteMany(),
    prisma.clientShippingAddress.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.passwordReset.deleteMany(),
  ]);
}

async function upsertLoginUsersOnly() {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const adminAccount = ACCOUNTS.find((account) => account.role === Role.ADMIN);
  const adminUser = await prisma.user.upsert({
    where: { email: adminAccount!.email },
    update: { passwordHash: hashedPassword },
    create: {
      email: adminAccount!.email,
      fullName: adminAccount!.fullName,
      phone: adminAccount!.phone,
      role: Role.ADMIN,
      passwordHash: hashedPassword,
    },
  });

  const adminProfile = await prisma.adminProfile.upsert({
    where: { userId: adminUser.id },
    update: { businessName: 'Farmers Core', province: 'Hà Nội' },
    create: { userId: adminUser.id, businessName: 'Farmers Core', province: 'Hà Nội' },
  });

  const supervisorAccount = ACCOUNTS.find((account) => account.role === Role.SUPERVISOR);
  const supervisorUser = await prisma.user.upsert({
    where: { email: supervisorAccount!.email },
    update: { passwordHash: hashedPassword },
    create: {
      email: supervisorAccount!.email,
      fullName: supervisorAccount!.fullName,
      phone: supervisorAccount!.phone,
      role: Role.SUPERVISOR,
      passwordHash: hashedPassword,
    },
  });

  const supervisorProfile = await prisma.supervisorProfile.upsert({
    where: { userId: supervisorUser.id },
    update: { adminId: adminProfile.id, employeeCode: 'SUP-001' },
    create: { userId: supervisorUser.id, adminId: adminProfile.id, employeeCode: 'SUP-001' },
  });

  const inventoryAccount = ACCOUNTS.find((account) => account.role === Role.INVENTORY);
  const inventoryUser = await prisma.user.upsert({
    where: { email: inventoryAccount!.email },
    update: { passwordHash: hashedPassword },
    create: {
      email: inventoryAccount!.email,
      fullName: inventoryAccount!.fullName,
      phone: inventoryAccount!.phone,
      role: Role.INVENTORY,
      passwordHash: hashedPassword,
    },
  });

  const inventoryProfile = await prisma.inventoryProfile.upsert({
    where: { userId: inventoryUser.id },
    update: { adminId: adminProfile.id, employeeCode: 'INV-001' },
    create: { userId: inventoryUser.id, adminId: adminProfile.id, employeeCode: 'INV-001' },
  });

  const clientAccount = ACCOUNTS.find((account) => account.role === Role.CLIENT);
  const clientUser = await prisma.user.upsert({
    where: { email: clientAccount!.email },
    update: { passwordHash: hashedPassword },
    create: {
      email: clientAccount!.email,
      fullName: clientAccount!.fullName,
      phone: clientAccount!.phone,
      role: Role.CLIENT,
      passwordHash: hashedPassword,
    },
  });

  await prisma.clientProfile.upsert({
    where: { userId: clientUser.id },
    update: { adminId: adminProfile.id },
    create: { userId: clientUser.id, adminId: adminProfile.id },
  });

  return { adminProfile, supervisorProfile, inventoryProfile };
}

async function main() {
  await clearAllData();
  const { adminProfile, supervisorProfile, inventoryProfile } = await upsertLoginUsersOnly();

  // 1. Warehouse
  const warehouse = await prisma.warehouse.create({
    data: {
      name: 'Kho Tổng Miền Tây',
      locationAddress: 'Cần Thơ',
      adminId: adminProfile.id,
      managedBy: inventoryProfile.id,
      isActive: true,
    },
  });

  // 2. Categories & PriceBoards
  const category = await prisma.category.create({
    data: { name: 'Nông sản đóng gói', slug: 'nong-san-dong-goi' },
  });

  await prisma.priceBoard.createMany({
    data: [
      { adminId: adminProfile.id, cropType: 'Gạo ST25', grade: QualityGrade.A, buyPrice: 20000, sellPrice: 35000, isActive: true, effectiveDate: new Date() },
      { adminId: adminProfile.id, cropType: 'Cà phê Robusta', grade: QualityGrade.B, buyPrice: 45000, sellPrice: 68000, isActive: true, effectiveDate: new Date() },
    ]
  });

  // 3. Contracts & Products (STOCK 0) & ARRIVED Lots
  // Gạo ST25
  const farmer1 = await prisma.farmer.create({
    data: { fullName: 'Nguyễn Văn Nông', phone: '0909123456', cccd: '123456789012', adminId: adminProfile.id }
  });
  const plot1 = await prisma.plot.create({
    data: { farmerId: farmer1.id, adminId: adminProfile.id, plotCode: 'PLOT-ST25-001', cropType: 'Gạo ST25', areaHa: 2.5 }
  });
  const contract1 = await prisma.contract.create({
    data: {
      adminId: adminProfile.id,
      supervisorId: supervisorProfile.id,
      farmerId: farmer1.id,
      plotId: plot1.id,
      contractNo: 'CONT-ST25-2026',
      cropType: 'Gạo ST25',
      grade: QualityGrade.A,
      status: ContractStatus.SETTLED,
    },
  });
  const product1 = await prisma.product.create({
    data: {
      adminId: adminProfile.id,
      name: 'Gạo ST25 Đặc Sản',
      slug: 'gao-st25-dac-san',
      sku: 'PROD-ST25-A',
      cropType: 'Gạo ST25',
      grade: QualityGrade.A,
      pricePerKg: 35000,
      stockKg: 0,
      qrCode: uuidv4(),
      status: ProductStatus.PUBLISHED,
      contractId: contract1.id,
      plotId: plot1.id,
    },
  });
  await prisma.inventoryLot.create({
    data: {
      warehouseId: warehouse.id,
      productId: product1.id,
      contractId: contract1.id,
      quantityKg: 2000,
      qualityGrade: QualityGrade.A,
      status: InventoryLotStatus.ARRIVED,
      harvestDate: new Date(),
    },
  });

  // Cà phê Robusta
  const farmer2 = await prisma.farmer.create({
    data: { fullName: 'Trần Văn Cà', phone: '0911222333', cccd: '111222333444', adminId: adminProfile.id }
  });
  const plot2 = await prisma.plot.create({
    data: { farmerId: farmer2.id, adminId: adminProfile.id, plotCode: 'PLOT-CAFE-001', cropType: 'Cà phê Robusta', areaHa: 5.0 }
  });
  const contract2 = await prisma.contract.create({
    data: {
      adminId: adminProfile.id,
      supervisorId: supervisorProfile.id,
      farmerId: farmer2.id,
      plotId: plot2.id,
      contractNo: 'CONT-CAFE-2026',
      cropType: 'Cà phê Robusta',
      grade: QualityGrade.B,
      status: ContractStatus.SETTLED,
    },
  });
  const product2 = await prisma.product.create({
    data: {
      adminId: adminProfile.id,
      name: 'Cà phê Robusta Đắk Lắk',
      slug: 'ca-phe-robusta-dak-lak',
      sku: 'PROD-CAFE-B',
      cropType: 'Cà phê Robusta',
      grade: QualityGrade.B,
      pricePerKg: 68000,
      stockKg: 0,
      qrCode: uuidv4(),
      status: ProductStatus.PUBLISHED,
      contractId: contract2.id,
      plotId: plot2.id,
    },
  });
  await prisma.inventoryLot.create({
    data: {
      warehouseId: warehouse.id,
      productId: product2.id,
      contractId: contract2.id,
      quantityKg: 2500,
      qualityGrade: QualityGrade.B,
      status: InventoryLotStatus.ARRIVED,
      harvestDate: new Date(),
    },
  });

  console.log('[SEED] Core ready with ARRIVED lots. Products stock is currently 0.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
