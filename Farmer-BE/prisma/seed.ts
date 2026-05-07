import { PrismaClient, Role, PlotStatus, FarmerStatus, AssignStatus, ReportType, ReportStatus, ContractStatus, QualityGrade, ProductStatus, InventoryLotStatus, TransactionType, TransactionAction } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

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

async function clearNonAuthData() {
  // Delete domain data first (children before parents) to satisfy FK constraints.
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
  if (!adminAccount) {
    throw new Error('Admin account seed config is missing');
  }

  const adminUser = await prisma.user.upsert({
    where: { email: adminAccount.email },
    update: {
      fullName: adminAccount.fullName,
      phone: adminAccount.phone,
      role: adminAccount.role,
      passwordHash: hashedPassword,
    },
    create: {
      email: adminAccount.email,
      fullName: adminAccount.fullName,
      phone: adminAccount.phone,
      role: adminAccount.role,
      passwordHash: hashedPassword,
    },
  });

  const adminProfile = await prisma.adminProfile.upsert({
    where: { userId: adminUser.id },
    update: {
      businessName: 'Farmers Core',
      province: 'Hà Nội',
      taxCode: null,
      bankAccount: null,
    },
    create: {
      userId: adminUser.id,
      businessName: 'Farmers Core',
      province: 'Hà Nội',
      taxCode: null,
      bankAccount: null,
    },
  });

  const supervisorAccount = ACCOUNTS.find(
    (account) => account.role === Role.SUPERVISOR,
  );
  if (!supervisorAccount) {
    throw new Error('Supervisor account seed config is missing');
  }

  const supervisorUser = await prisma.user.upsert({
    where: { email: supervisorAccount.email },
    update: {
      fullName: supervisorAccount.fullName,
      phone: supervisorAccount.phone,
      role: supervisorAccount.role,
      passwordHash: hashedPassword,
    },
    create: {
      email: supervisorAccount.email,
      fullName: supervisorAccount.fullName,
      phone: supervisorAccount.phone,
      role: supervisorAccount.role,
      passwordHash: hashedPassword,
    },
  });

  const supervisorProfile = await prisma.supervisorProfile.upsert({
    where: { userId: supervisorUser.id },
    update: {
      adminId: adminProfile.id,
      employeeCode: 'SUP-000001',
      zoneId: null,
    },
    create: {
      userId: supervisorUser.id,
      adminId: adminProfile.id,
      employeeCode: 'SUP-000001',
      zoneId: null,
    },
  });

  const inventoryAccount = ACCOUNTS.find(
    (account) => account.role === Role.INVENTORY,
  );
  if (!inventoryAccount) {
    throw new Error('Inventory account seed config is missing');
  }

  const inventoryUser = await prisma.user.upsert({
    where: { email: inventoryAccount.email },
    update: {
      fullName: inventoryAccount.fullName,
      phone: inventoryAccount.phone,
      role: inventoryAccount.role,
      passwordHash: hashedPassword,
    },
    create: {
      email: inventoryAccount.email,
      fullName: inventoryAccount.fullName,
      phone: inventoryAccount.phone,
      role: inventoryAccount.role,
      passwordHash: hashedPassword,
    },
  });

  await prisma.inventoryProfile.upsert({
    where: { userId: inventoryUser.id },
    update: {
      adminId: adminProfile.id,
      employeeCode: 'INV-000001',
    },
    create: {
      userId: inventoryUser.id,
      adminId: adminProfile.id,
      employeeCode: 'INV-000001',
    },
  });

  const clientAccount = ACCOUNTS.find(
    (account) => account.role === Role.CLIENT,
  );
  if (!clientAccount) {
    throw new Error('Client account seed config is missing');
  }

  const clientUser = await prisma.user.upsert({
    where: { email: clientAccount.email },
    update: {
      fullName: clientAccount.fullName,
      phone: clientAccount.phone,
      role: clientAccount.role,
      passwordHash: hashedPassword,
    },
    create: {
      email: clientAccount.email,
      fullName: clientAccount.fullName,
      phone: clientAccount.phone,
      role: clientAccount.role,
      passwordHash: hashedPassword,
    },
  });

  await prisma.clientProfile.upsert({
    where: { userId: clientUser.id },
    update: {
      adminId: adminProfile.id,
      province: 'Hà Nội',
    },
    create: {
      userId: clientUser.id,
      adminId: adminProfile.id,
      province: 'Hà Nội',
    },
  });

  console.log('[SEED] Login accounts are ready:');
  for (const account of ACCOUNTS) {
    console.log(
      `       ${account.role} -> ${account.email} / ${DEFAULT_PASSWORD}`,
    );
  }

  return { adminProfile, supervisorProfile };
}

async function seedBusinessData(adminProfile: any, supervisorProfile: any) {
  // ==================== ZONES ====================
  const zones = await Promise.all([
    prisma.zone.upsert({
      where: { id: 'zone-1' },
      update: {},
      create: {
        id: 'zone-1',
        adminId: adminProfile.id,
        name: 'Vùng Đông Bắc',
        province: 'Tuyên Quang',
        district: 'Yên Sơn',
        centerLat: 22.1234,
        centerLng: 104.5678,
        totalAreaHa: 500,
      },
    }),
    prisma.zone.upsert({
      where: { id: 'zone-2' },
      update: {},
      create: {
        id: 'zone-2',
        adminId: adminProfile.id,
        name: 'Vùng Tây Nguyên',
        province: 'Đắk Lắk',
        district: 'Buôn Ma Thuột',
        centerLat: 12.6667,
        centerLng: 108.0333,
        totalAreaHa: 800,
      },
    }),
    prisma.zone.upsert({
      where: { id: 'zone-3' },
      update: {},
      create: {
        id: 'zone-3',
        adminId: adminProfile.id,
        name: 'Vùng Mekong',
        province: 'Cần Thơ',
        district: 'Cờ Đỏ',
        centerLat: 10.0123,
        centerLng: 105.7891,
        totalAreaHa: 1200,
      },
    }),
  ]);
  console.log(`[SEED] Created ${zones.length} zones`);

  // ==================== FARMERS ====================
  const farmers = await Promise.all([
    prisma.farmer.upsert({
      where: { cccd: 'cccd-001' },
      update: {},
      create: {
        id: 'farmer-1',
        adminId: adminProfile.id,
        fullName: 'Nguyễn Văn A',
        phone: '0912345678',
        cccd: 'cccd-001',
        bankAccount: '1234567890',
        bankName: 'Agribank',
        bankBranch: 'Chi nhánh Tuyên Quang',
        address: 'Thôn 1, Yên Sơn',
        province: 'Tuyên Quang',
        status: FarmerStatus.ACTIVE,
        supervisorId: supervisorProfile.id,
      },
    }),
    prisma.farmer.upsert({
      where: { cccd: 'cccd-002' },
      update: {},
      create: {
        id: 'farmer-2',
        adminId: adminProfile.id,
        fullName: 'Trần Thị B',
        phone: '0987654321',
        cccd: 'cccd-002',
        bankAccount: '0987654321',
        bankName: 'Vietcombank',
        bankBranch: 'Chi nhánh Đắk Lắk',
        address: 'Thôn 5, Buôn Ma Thuột',
        province: 'Đắk Lắk',
        status: FarmerStatus.ACTIVE,
        supervisorId: supervisorProfile.id,
      },
    }),
    prisma.farmer.upsert({
      where: { cccd: 'cccd-003' },
      update: {},
      create: {
        id: 'farmer-3',
        adminId: adminProfile.id,
        fullName: 'Phạm Quốc C',
        phone: '0901234567',
        cccd: 'cccd-003',
        bankAccount: '5555555555',
        bankName: 'TPBank',
        bankBranch: 'Chi nhánh Cần Thơ',
        address: 'Ấp 2, Cờ Đỏ',
        province: 'Cần Thơ',
        status: FarmerStatus.ACTIVE,
        supervisorId: supervisorProfile.id,
      },
    }),
  ]);
  console.log(`[SEED] Created ${farmers.length} farmers`);

  // ==================== PLOTS ====================
  const plots = await Promise.all([
    prisma.plot.upsert({
      where: { plotCode: 'PLOT-001' },
      update: {},
      create: {
        id: 'plot-1',
        farmerId: farmers[0].id,
        adminId: adminProfile.id,
        zoneId: zones[0].id,
        plotCode: 'PLOT-001',
        cropType: 'ca-phe',
        areaHa: 5.5,
        lat: 22.1234,
        lng: 104.5678,
        status: PlotStatus.ACTIVE,
        plantingDate: new Date('2023-06-01'),
        expectedHarvest: new Date('2024-11-30'),
        estimatedYieldKg: 8250,
      },
    }),
    prisma.plot.upsert({
      where: { plotCode: 'PLOT-002' },
      update: {},
      create: {
        id: 'plot-2',
        farmerId: farmers[1].id,
        adminId: adminProfile.id,
        zoneId: zones[1].id,
        plotCode: 'PLOT-002',
        cropType: 'sau-rieng',
        areaHa: 3.2,
        lat: 12.6667,
        lng: 108.0333,
        status: PlotStatus.ACTIVE,
        plantingDate: new Date('2023-05-15'),
        expectedHarvest: new Date('2024-10-15'),
        estimatedYieldKg: 4800,
      },
    }),
    prisma.plot.upsert({
      where: { plotCode: 'PLOT-003' },
      update: {},
      create: {
        id: 'plot-3',
        farmerId: farmers[2].id,
        adminId: adminProfile.id,
        zoneId: zones[2].id,
        plotCode: 'PLOT-003',
        cropType: 'ca-phe',
        areaHa: 6.0,
        lat: 10.0123,
        lng: 105.7891,
        status: PlotStatus.ACTIVE,
        plantingDate: new Date('2023-07-01'),
        expectedHarvest: new Date('2024-12-01'),
        estimatedYieldKg: 9000,
      },
    }),
  ]);
  console.log(`[SEED] Created ${plots.length} plots`);

  // ==================== ASSIGNMENTS ====================
  await Promise.all([
    prisma.assignment.upsert({
      where: { id: 'assign-1' },
      update: {},
      create: {
        id: 'assign-1',
        supervisorId: supervisorProfile.id,
        plotId: plots[0].id,
        adminId: adminProfile.id,
        status: AssignStatus.ACTIVE,
        assignedAt: new Date('2024-01-15'),
        dueDate: new Date('2024-03-31'),
        note: 'Giám sát định kỳ vụ Đông Xuân 2024',
      },
    }),
    prisma.assignment.upsert({
      where: { id: 'assign-2' },
      update: {},
      create: {
        id: 'assign-2',
        supervisorId: supervisorProfile.id,
        plotId: plots[1].id,
        adminId: adminProfile.id,
        status: AssignStatus.ACTIVE,
        assignedAt: new Date('2024-01-10'),
        dueDate: new Date('2024-02-29'),
        note: 'Kiểm tra tình trạng cây sầu riêng',
      },
    }),
    prisma.assignment.upsert({
      where: { id: 'assign-3' },
      update: {},
      create: {
        id: 'assign-3',
        supervisorId: supervisorProfile.id,
        plotId: plots[2].id,
        adminId: adminProfile.id,
        status: AssignStatus.ACTIVE,
        assignedAt: new Date('2024-01-20'),
        dueDate: new Date('2024-04-15'),
        note: 'Báo cáo hàng ngày về tiến độ thu hoạch',
      },
    }),
  ]);
  console.log('[SEED] Created 3 assignments');

  // ==================== DAILY REPORTS ====================
  await Promise.all([
    prisma.dailyReport.upsert({
      where: { id: 'report-1' },
      update: {},
      create: {
        id: 'report-1',
        supervisorId: supervisorProfile.id,
        plotId: plots[0].id,
        adminId: adminProfile.id,
        type: ReportType.ROUTINE,
        content: 'Cây cà phê đang phát triển bình thường, không phát hiện sâu bệnh.',
        imageUrls: ['https://example.com/image1.jpg'],
        status: ReportStatus.SUBMITTED,
        reportedAt: new Date('2024-01-25'),
        yieldEstimateKg: 8250,
      },
    }),
    prisma.dailyReport.upsert({
      where: { id: 'report-2' },
      update: {},
      create: {
        id: 'report-2',
        supervisorId: supervisorProfile.id,
        plotId: plots[1].id,
        adminId: adminProfile.id,
        type: ReportType.INCIDENT,
        content: 'Phát hiện sâu kỷ tại khu vực phía Tây. Đã phun thuốc trừ sâu.',
        imageUrls: ['https://example.com/image2.jpg', 'https://example.com/image3.jpg'],
        status: ReportStatus.SUBMITTED,
        reportedAt: new Date('2024-01-26'),
      },
    }),
    prisma.dailyReport.upsert({
      where: { id: 'report-3' },
      update: {},
      create: {
        id: 'report-3',
        supervisorId: supervisorProfile.id,
        plotId: plots[2].id,
        adminId: adminProfile.id,
        type: ReportType.HARVEST,
        content: 'Sẵn sàng thu hoạch, ước tính sản lượng 9000kg.',
        imageUrls: ['https://example.com/image4.jpg'],
        status: ReportStatus.DRAFT,
        reportedAt: new Date('2024-01-27'),
        yieldEstimateKg: 9000,
      },
    }),
  ]);
  console.log('[SEED] Created 3 daily reports');

  // ==================== CONTRACTS ====================
  const contracts = await Promise.all([
    prisma.contract.upsert({
      where: { contractNo: 'CT-2024-001' },
      update: {},
      create: {
        id: 'contract-1',
        adminId: adminProfile.id,
        supervisorId: supervisorProfile.id,
        farmerId: farmers[0].id,
        plotId: plots[0].id,
        contractNo: 'CT-2024-001',
        cropType: 'ca-phe',
        grade: QualityGrade.A,
        status: ContractStatus.ACTIVE,
        signedAt: new Date('2023-12-01'),
        harvestDue: new Date('2024-11-30'),
      },
    }),
    prisma.contract.upsert({
      where: { contractNo: 'CT-2024-002' },
      update: {},
      create: {
        id: 'contract-2',
        adminId: adminProfile.id,
        supervisorId: supervisorProfile.id,
        farmerId: farmers[1].id,
        plotId: plots[1].id,
        contractNo: 'CT-2024-002',
        cropType: 'sau-rieng',
        grade: QualityGrade.A,
        status: ContractStatus.ACTIVE,
        signedAt: new Date('2023-11-15'),
        harvestDue: new Date('2024-10-15'),
      },
    }),
    prisma.contract.upsert({
      where: { contractNo: 'CT-2024-003' },
      update: {},
      create: {
        id: 'contract-3',
        adminId: adminProfile.id,
        supervisorId: supervisorProfile.id,
        farmerId: farmers[2].id,
        plotId: plots[2].id,
        contractNo: 'CT-2024-003',
        cropType: 'ca-phe',
        grade: QualityGrade.B,
        status: ContractStatus.SIGNED,
        signedAt: new Date('2023-12-15'),
        harvestDue: new Date('2024-12-01'),
      },
    }),
  ]);
  console.log(`[SEED] Created ${contracts.length} contracts`);

  // ==================== CATEGORIES ====================
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'ca-phe-nguyen-chat' },
      update: {},
      create: {
        id: 'cat-1',
        name: 'Cà phê nguyên chất',
        slug: 'ca-phe-nguyen-chat',
        description: 'Cà phê 100% Arabica hoặc Robusta từ nông trại',
        isActive: true,
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'sau-rieng-tron' },
      update: {},
      create: {
        id: 'cat-2',
        name: 'Sầu riêng tròn',
        slug: 'sau-rieng-tron',
        description: 'Sầu riêng tròn chất lượng cao',
        isActive: true,
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'nong-san-huu-co' },
      update: {},
      create: {
        id: 'cat-3',
        name: 'Nông sản hữu cơ',
        slug: 'nong-san-huu-co',
        description: 'Nông sản trồng theo tiêu chuẩn hữu cơ',
        isActive: true,
        sortOrder: 3,
      },
    }),
  ]);
  console.log(`[SEED] Created ${categories.length} categories`);

  // ==================== PRODUCTS ====================
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'SKU-001' },
      update: {},
      create: {
        id: 'product-1',
        adminId: adminProfile.id,
        plotId: plots[0].id,
        contractId: contracts[0].id,
        name: 'Cà phê Arabica Tuyên Quang - Grade A',
        slug: 'ca-phe-arabica-tuyen-quang-grade-a',
        sku: 'SKU-001',
        description: 'Cà phê Arabica nguyên chất từ Tuyên Quang, hương vị đặc biệt',
        cropType: 'ca-phe',
        grade: QualityGrade.A,
        pricePerKg: 250000,
        stockKg: 5000,
        minOrderKg: 10,
        qrCode: 'QR-001',
        thumbnailUrl: 'https://example.com/thumb1.jpg',
        status: ProductStatus.PUBLISHED,
        harvestDate: new Date('2024-10-15'),
        aiConfidenceScore: 0.95,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'SKU-002' },
      update: {},
      create: {
        id: 'product-2',
        adminId: adminProfile.id,
        plotId: plots[1].id,
        contractId: contracts[1].id,
        name: 'Sầu riêng Đắk Lắk - Grade A',
        slug: 'sau-rieng-dak-lak-grade-a',
        sku: 'SKU-002',
        description: 'Sầu riêng tròn Đắk Lắk, thơm ngon, thịt chắc',
        cropType: 'sau-rieng',
        grade: QualityGrade.A,
        pricePerKg: 180000,
        stockKg: 2000,
        minOrderKg: 5,
        qrCode: 'QR-002',
        thumbnailUrl: 'https://example.com/thumb2.jpg',
        status: ProductStatus.PUBLISHED,
        harvestDate: new Date('2024-08-20'),
        aiConfidenceScore: 0.92,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'SKU-003' },
      update: {},
      create: {
        id: 'product-3',
        adminId: adminProfile.id,
        plotId: plots[2].id,
        contractId: contracts[2].id,
        name: 'Cà phê Robusta Cần Thơ - Grade B',
        slug: 'ca-phe-robusta-can-tho-grade-b',
        sku: 'SKU-003',
        description: 'Cà phê Robusta từ Cần Thơ, chất lượng tốt, giá cạnh tranh',
        cropType: 'ca-phe',
        grade: QualityGrade.B,
        pricePerKg: 180000,
        stockKg: 3500,
        minOrderKg: 15,
        qrCode: 'QR-003',
        thumbnailUrl: 'https://example.com/thumb3.jpg',
        status: ProductStatus.DRAFT,
        harvestDate: new Date('2024-11-10'),
        aiConfidenceScore: 0.88,
      },
    }),
  ]);
  console.log(`[SEED] Created ${products.length} products`);

  // ==================== PRODUCT CATEGORIES ====================
  await Promise.all([
    prisma.productCategory.upsert({
      where: { productId_categoryId: { productId: products[0].id, categoryId: categories[0].id } },
      update: {},
      create: { productId: products[0].id, categoryId: categories[0].id },
    }),
    prisma.productCategory.upsert({
      where: { productId_categoryId: { productId: products[1].id, categoryId: categories[1].id } },
      update: {},
      create: { productId: products[1].id, categoryId: categories[1].id },
    }),
    prisma.productCategory.upsert({
      where: { productId_categoryId: { productId: products[2].id, categoryId: categories[0].id } },
      update: {},
      create: { productId: products[2].id, categoryId: categories[0].id },
    }),
  ]);
  console.log('[SEED] Created product-category associations');

  // ==================== PRICE BOARDS ====================
  await Promise.all([
    prisma.priceBoard.upsert({
      where: { id: 'pb-1' },
      update: {},
      create: {
        id: 'pb-1',
        adminId: adminProfile.id,
        cropType: 'ca-phe',
        grade: QualityGrade.A,
        buyPrice: 230000,
        sellPrice: 250000,
        effectiveDate: new Date('2024-01-01'),
        isActive: true,
      },
    }),
    prisma.priceBoard.upsert({
      where: { id: 'pb-2' },
      update: {},
      create: {
        id: 'pb-2',
        adminId: adminProfile.id,
        cropType: 'sau-rieng',
        grade: QualityGrade.A,
        buyPrice: 160000,
        sellPrice: 180000,
        effectiveDate: new Date('2024-01-01'),
        isActive: true,
      },
    }),
    prisma.priceBoard.upsert({
      where: { id: 'pb-3' },
      update: {},
      create: {
        id: 'pb-3',
        adminId: adminProfile.id,
        cropType: 'ca-phe',
        grade: QualityGrade.B,
        buyPrice: 160000,
        sellPrice: 180000,
        effectiveDate: new Date('2024-01-01'),
        isActive: true,
      },
    }),
  ]);
  console.log('[SEED] Created 3 price boards');

  // ==================== WAREHOUSES ====================
  const warehouses = await Promise.all([
    prisma.warehouse.upsert({
      where: { id: 'wh-1' },
      update: {},
      create: {
        id: 'wh-1',
        adminId: adminProfile.id,
        name: 'Kho Tuyên Quang',
        locationAddress: 'Yên Sơn, Tuyên Quang',
        isActive: true,
      },
    }),
    prisma.warehouse.upsert({
      where: { id: 'wh-2' },
      update: {},
      create: {
        id: 'wh-2',
        adminId: adminProfile.id,
        name: 'Kho Đắk Lắk',
        locationAddress: 'Buôn Ma Thuột, Đắk Lắk',
        isActive: true,
      },
    }),
    prisma.warehouse.upsert({
      where: { id: 'wh-3' },
      update: {},
      create: {
        id: 'wh-3',
        adminId: adminProfile.id,
        name: 'Kho Cần Thơ',
        locationAddress: 'Cờ Đỏ, Cần Thơ',
        isActive: true,
      },
    }),
  ]);
  console.log(`[SEED] Created ${warehouses.length} warehouses`);

  // ==================== INVENTORY LOTS ====================
  const inventoryLots = await Promise.all([
    prisma.inventoryLot.upsert({
      where: { id: 'invlot-1' },
      update: {},
      create: {
        id: 'invlot-1',
        warehouseId: warehouses[0].id,
        productId: products[0].id,
        contractId: contracts[0].id,
        quantityKg: 5000,
        harvestDate: new Date('2024-10-15'),
        expiryDate: new Date('2025-10-15'),
        qualityGrade: QualityGrade.A,
        status: InventoryLotStatus.RECEIVED,
      },
    }),
    prisma.inventoryLot.upsert({
      where: { id: 'invlot-2' },
      update: {},
      create: {
        id: 'invlot-2',
        warehouseId: warehouses[1].id,
        productId: products[1].id,
        contractId: contracts[1].id,
        quantityKg: 2000,
        harvestDate: new Date('2024-08-20'),
        expiryDate: new Date('2025-08-20'),
        qualityGrade: QualityGrade.A,
        status: InventoryLotStatus.RECEIVED,
      },
    }),
    prisma.inventoryLot.upsert({
      where: { id: 'invlot-3' },
      update: {},
      create: {
        id: 'invlot-3',
        warehouseId: warehouses[2].id,
        productId: products[2].id,
        contractId: contracts[2].id,
        quantityKg: 3500,
        harvestDate: new Date('2024-11-10'),
        expiryDate: new Date('2025-11-10'),
        qualityGrade: QualityGrade.B,
        status: InventoryLotStatus.ARRIVED,
      },
    }),
  ]);
  console.log(`[SEED] Created ${inventoryLots.length} inventory lots`);

  // ==================== WAREHOUSE TRANSACTIONS ====================
  await Promise.all([
    prisma.warehouseTransaction.create({
      data: {
        warehouseId: warehouses[0].id,
        productId: products[0].id,
        inventoryLotId: inventoryLots[0].id,
        quantityKg: 5000,
        action: TransactionAction.RECEIPT,
        type: TransactionType.INBOUND,
        createdBy: supervisorProfile.userId,
        note: 'Nhận hàng từ nông trại',
      },
    }),
    prisma.warehouseTransaction.create({
      data: {
        warehouseId: warehouses[1].id,
        productId: products[1].id,
        inventoryLotId: inventoryLots[1].id,
        quantityKg: 2000,
        action: TransactionAction.RECEIPT,
        type: TransactionType.INBOUND,
        createdBy: supervisorProfile.userId,
        note: 'Nhận hàng từ nông trại',
      },
    }),
    prisma.warehouseTransaction.create({
      data: {
        warehouseId: warehouses[2].id,
        productId: products[2].id,
        inventoryLotId: inventoryLots[2].id,
        quantityKg: 1000,
        action: TransactionAction.SALE,
        type: TransactionType.OUTBOUND,
        createdBy: supervisorProfile.userId,
        note: 'Xuất hàng bán lẻ',
      },
    }),
  ]);
  console.log('[SEED] Created 3 warehouse transactions');

  console.log('[SEED] All business data created successfully!');
}

async function main() {
  console.log('\n========================================');
  console.log('  FARMERS — FULL DATABASE SEED');
  console.log('========================================\n');

  await clearNonAuthData();
  console.log('[SEED] Cleared non-auth tables');

  const { adminProfile, supervisorProfile } = await upsertLoginUsersOnly();

  await seedBusinessData(adminProfile, supervisorProfile);

  console.log('\n========================================');
  console.log('  SEED COMPLETE - All business data ready');
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
