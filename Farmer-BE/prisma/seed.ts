import {
  PrismaClient,
  Role,
  PlotStatus,
  FarmerStatus,
  AssignStatus,
  ReportType,
  ReportStatus,
  ContractStatus,
  QualityGrade,
  ProductStatus,
  InventoryLotStatus,
  TransactionType,
  TransactionAction,
  PaymentMethod,
  PaymentStatus,
  FulfillStatus,
  ReviewStatus,
  ShipperStatus,
  VehicleType,
  AddressType,
  IncidentHandlingStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = '123123';

// ============================================================
// CLEAR ALL DATA (children first to respect FK constraints)
// ============================================================
async function clearAll() {
  await prisma.$transaction([
    // 1. Leaf tables (no one references them)
    prisma.plantScanRecord.deleteMany(),
    prisma.warehouseTransaction.deleteMany(),
    prisma.review.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.productCategory.deleteMany(),
    // 2. Mid-level tables
    prisma.inventoryLot.deleteMany(),
    prisma.warehouse.deleteMany(),
    prisma.order.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.product.deleteMany(),
    prisma.contract.deleteMany(),
    prisma.dailyReport.deleteMany(),
    prisma.assignment.deleteMany(),
    prisma.plot.deleteMany(),
    prisma.farmer.deleteMany(),
    prisma.priceBoard.deleteMany(),
    prisma.category.deleteMany(),
    prisma.clientShippingAddress.deleteMany(),
    // 3. Zone (supervisorProfile references zone, so delete after supervisorProfile below)
    // 4. Profiles that reference adminProfile — must go BEFORE adminProfile
    prisma.inventoryProfile.deleteMany(),
    prisma.supervisorProfile.deleteMany(),
    prisma.shipperProfile.deleteMany(),
    prisma.clientProfile.deleteMany(),
    // 5. Zone can now be deleted (supervisorProfile gone)
    prisma.zone.deleteMany(),
    // 6. Auth helpers
    prisma.refreshToken.deleteMany(),
    prisma.passwordReset.deleteMany(),
    // 7. adminProfile (all referencing profiles already deleted)
    prisma.adminProfile.deleteMany(),
    // 8. Users last
    prisma.user.deleteMany(),
  ]);
  console.log('[SEED] ✅ Cleared all tables');
}

// ============================================================
// MAIN SEED
// ============================================================
async function main() {
  console.log('\n========================================');
  console.log('  FARMERS — FULL DATABASE SEED');
  console.log('========================================\n');

  await clearAll();

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // ==================== USERS & PROFILES ====================
  const adminUser = await prisma.user.create({
    data: {
      id: 'user-admin',
      email: 'admin@farmers.com',
      fullName: 'Quản Trị Viên',
      phone: '0123456789',
      role: Role.ADMIN,
      passwordHash: hashedPassword,
    },
  });

  const adminProfile = await prisma.adminProfile.create({
    data: {
      id: 'profile-admin',
      userId: adminUser.id,
      businessName: 'Farmers Core',
      province: 'Hà Nội',
      taxCode: '0123456789',
      bankAccount: '1234567890',
    },
  });

  const supervisorUser = await prisma.user.create({
    data: {
      id: 'user-supervisor',
      email: 'supervisor@farmers.com',
      fullName: 'Giám Sát Viên',
      phone: '0912333444',
      role: Role.SUPERVISOR,
      passwordHash: hashedPassword,
    },
  });

  const inventoryUser = await prisma.user.create({
    data: {
      id: 'user-inventory',
      email: 'inventory@farmers.com',
      fullName: 'Quản Lý Kho',
      phone: '0944555666',
      role: Role.INVENTORY,
      passwordHash: hashedPassword,
    },
  });

  const shipperUser = await prisma.user.create({
    data: {
      id: 'user-shipper',
      email: 'shipper@farmers.com',
      fullName: 'Nhân Viên Giao Hàng',
      phone: '0933444555',
      role: Role.SHIPPER,
      passwordHash: hashedPassword,
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      id: 'user-client',
      email: 'client@farmers.com',
      fullName: 'Khách Hàng',
      phone: '0987654321',
      role: Role.CLIENT,
      passwordHash: hashedPassword,
    },
  });

  console.log('[SEED] ✅ Created 5 users');

  // ==================== ZONES (3) ====================
  const zonesData = [
    {
      id: 'zone-1',
      name: 'Vùng Tây Nguyên',
      province: 'Đắk Lắk',
      district: 'Buôn Ma Thuột',
      centerLat: 12.6667,
      centerLng: 108.0333,
      totalAreaHa: 800,
    },
    {
      id: 'zone-2',
      name: 'Vùng Đồng Bằng Sông Cửu Long',
      province: 'Cần Thơ',
      district: 'Ninh Kiều',
      centerLat: 10.0452,
      centerLng: 105.7469,
      totalAreaHa: 600,
    },
    {
      id: 'zone-3',
      name: 'Vùng Tây Bắc',
      province: 'Sơn La',
      district: 'Mộc Châu',
      centerLat: 20.8392,
      centerLng: 104.6869,
      totalAreaHa: 500,
    },
  ];
  const zones = await Promise.all(
    zonesData.map((z) =>
      prisma.zone.create({ data: { ...z, adminId: adminProfile.id } }),
    ),
  );

  // ==================== SUPERVISOR PROFILE (linked to zone-1) ====================
  const supervisorProfile = await prisma.supervisorProfile.create({
    data: {
      id: 'profile-supervisor',
      userId: supervisorUser.id,
      adminId: adminProfile.id,
      employeeCode: 'SUP-000001',
      zoneId: zones[0].id,
      lat: 12.67,
      lng: 108.04,
    },
  });

  // ==================== INVENTORY PROFILE ====================
  const inventoryProfile = await prisma.inventoryProfile.create({
    data: {
      id: 'profile-inventory',
      userId: inventoryUser.id,
      adminId: adminProfile.id,
      employeeCode: 'INV-000001',
    },
  });

  // ==================== SHIPPER PROFILE ====================
  const shipperProfile = await prisma.shipperProfile.create({
    data: {
      id: 'profile-shipper',
      userId: shipperUser.id,
      adminId: adminProfile.id,
      employeeCode: 'SHP-000001',
      vehicleType: VehicleType.MOTORBIKE,
      licensePlate: '29-A1 12345',
      status: ShipperStatus.AVAILABLE,
    },
  });

  // ==================== CLIENT PROFILE ====================
  const clientProfile = await prisma.clientProfile.create({
    data: {
      id: 'profile-client',
      userId: clientUser.id,
      province: 'Hà Nội',
    },
  });

  console.log('[SEED] ✅ Created all profiles');

  // ==================== CLIENT SHIPPING ADDRESSES (3) ====================
  const shippingAddressesData = [
    {
      id: 'addr-1',
      fullName: 'Khách Hàng',
      phone: '0987654321',
      addressLine: '123 Đường Láng',
      district: 'Đống Đa',
      province: 'Hà Nội',
      addressType: AddressType.HOME,
      isDefault: true,
    },
    {
      id: 'addr-2',
      fullName: 'Khách Hàng',
      phone: '0987654321',
      addressLine: '45 Trần Hưng Đạo',
      district: 'Hoàn Kiếm',
      province: 'Hà Nội',
      addressType: AddressType.OFFICE,
      isDefault: false,
    },
    {
      id: 'addr-3',
      fullName: 'Khách Hàng',
      phone: '0987654321',
      addressLine: '78 Nguyễn Trãi',
      district: 'Thanh Xuân',
      province: 'Hà Nội',
      addressType: AddressType.HOME,
      isDefault: false,
    },
  ];
  await Promise.all(
    shippingAddressesData.map((a) =>
      prisma.clientShippingAddress.create({
        data: { ...a, clientProfileId: clientProfile.id },
      }),
    ),
  );

  // ==================== FARMERS (3) ====================
  const farmersData = [
    {
      id: 'farmer-1',
      fullName: 'Nguyễn Văn A',
      phone: '0912345671',
      cccd: '079201012345',
      bankAccount: '1234567890',
      bankName: 'Agribank',
      bankBranch: 'Chi nhánh Đắk Lắk',
      address: 'Thôn 1, Buôn Ma Thuột',
      province: 'Đắk Lắk',
    },
    {
      id: 'farmer-2',
      fullName: 'Trần Thị B',
      phone: '0912345672',
      cccd: '079201012346',
      bankAccount: '2345678901',
      bankName: 'Vietcombank',
      bankBranch: 'Chi nhánh Cần Thơ',
      address: 'Phường An Hòa, Ninh Kiều',
      province: 'Cần Thơ',
    },
    {
      id: 'farmer-3',
      fullName: 'Lê Văn C',
      phone: '0912345673',
      cccd: '079201012347',
      bankAccount: '3456789012',
      bankName: 'BIDV',
      bankBranch: 'Chi nhánh Sơn La',
      address: 'Bản Ang, Mộc Châu',
      province: 'Sơn La',
    },
  ];
  const farmers = await Promise.all(
    farmersData.map((f) =>
      prisma.farmer.create({
        data: {
          ...f,
          adminId: adminProfile.id,
          supervisorId: supervisorProfile.id,
          status: FarmerStatus.ACTIVE,
        },
      }),
    ),
  );

  console.log('[SEED] ✅ Created 3 zones, 3 farmers');

  // ==================== PLOTS (3) — mỗi farmer 1 plot ====================
  const plotsData = [
    {
      id: 'plot-1',
      farmerId: farmers[0].id,
      zoneId: zones[0].id,
      plotCode: 'PLOT-001',
      cropType: 'ca-phe',
      areaHa: 5.5,
      lat: 12.6667,
      lng: 108.0333,
      plantingDate: new Date('2023-06-01'),
      expectedHarvest: new Date('2024-11-30'),
      estimatedYieldKg: 8250,
    },
    {
      id: 'plot-2',
      farmerId: farmers[1].id,
      zoneId: zones[1].id,
      plotCode: 'PLOT-002',
      cropType: 'lua',
      areaHa: 3.2,
      lat: 10.0452,
      lng: 105.7469,
      plantingDate: new Date('2024-02-10'),
      expectedHarvest: new Date('2024-06-30'),
      estimatedYieldKg: 19200,
    },
    {
      id: 'plot-3',
      farmerId: farmers[2].id,
      zoneId: zones[2].id,
      plotCode: 'PLOT-003',
      cropType: 'che',
      areaHa: 4.0,
      lat: 20.8392,
      lng: 104.6869,
      plantingDate: new Date('2022-03-15'),
      expectedHarvest: new Date('2024-10-15'),
      estimatedYieldKg: 6000,
    },
  ];
  const plots = await Promise.all(
    plotsData.map((p) =>
      prisma.plot.create({
        data: {
          ...p,
          adminId: adminProfile.id,
          status: PlotStatus.CONTRACTED,
        },
      }),
    ),
  );

  // ==================== ASSIGNMENTS (3) — 1 per plot ====================
  const assignmentsData = [
    {
      id: 'assign-1',
      plotId: plots[0].id,
      assignedAt: new Date('2024-01-15'),
      dueDate: new Date('2024-12-31'),
      note: 'Giám sát định kỳ vụ thu hoạch cà phê 2024',
    },
    {
      id: 'assign-2',
      plotId: plots[1].id,
      assignedAt: new Date('2024-02-15'),
      dueDate: new Date('2024-07-31'),
      note: 'Giám sát vụ lúa đông xuân 2024',
    },
    {
      id: 'assign-3',
      plotId: plots[2].id,
      assignedAt: new Date('2024-03-01'),
      dueDate: new Date('2024-11-30'),
      note: 'Giám sát vườn chè Shan Tuyết mùa xuân',
    },
  ];
  await Promise.all(
    assignmentsData.map((a) =>
      prisma.assignment.create({
        data: {
          ...a,
          supervisorId: supervisorProfile.id,
          adminId: adminProfile.id,
          status: AssignStatus.ACTIVE,
        },
      }),
    ),
  );

  console.log('[SEED] ✅ Created 3 plots, 3 assignments');

  // ==================== DAILY REPORTS (3) — 1 per plot, 3 types ====================
  await prisma.dailyReport.create({
    data: {
      id: 'report-1',
      supervisorId: supervisorProfile.id,
      plotId: plots[0].id,
      adminId: adminProfile.id,
      type: ReportType.ROUTINE,
      content:
        'Cây cà phê đang phát triển bình thường, không phát hiện sâu bệnh. Độ ẩm đất đạt yêu cầu.',
      imageUrls: ['https://placehold.co/600x400?text=Routine+Report'],
      status: ReportStatus.APPROVED,
      reportedAt: new Date('2024-10-01'),
      yieldEstimateKg: 8000,
    },
  });

  await prisma.dailyReport.create({
    data: {
      id: 'report-2',
      supervisorId: supervisorProfile.id,
      plotId: plots[1].id,
      adminId: adminProfile.id,
      type: ReportType.INCIDENT,
      content:
        'Phát hiện rầy nâu xuất hiện trên ruộng lúa. Đã phun thuốc xử lý cục bộ.',
      imageUrls: ['https://placehold.co/600x400?text=Incident+Report'],
      status: ReportStatus.REVIEWED,
      reportedAt: new Date('2024-05-10'),
      incidentHandlingStatus: IncidentHandlingStatus.RESOLVED,
      incidentHandlingNote:
        'Đã xử lý bằng thuốc Applaud 25WP, rầy đã giảm mạnh.',
      incidentHandledAt: new Date('2024-05-12'),
    },
  });

  await prisma.dailyReport.create({
    data: {
      id: 'report-3',
      supervisorId: supervisorProfile.id,
      plotId: plots[2].id,
      adminId: adminProfile.id,
      type: ReportType.HARVEST,
      content:
        'Chè Shan Tuyết đã đến thời điểm thu hoạch búp một tôm hai lá. Dự kiến sản lượng 6000kg.',
      imageUrls: ['https://placehold.co/600x400?text=Harvest+Report'],
      status: ReportStatus.SUBMITTED,
      reportedAt: new Date('2024-10-05'),
      yieldEstimateKg: 6000,
    },
  });

  console.log('[SEED] ✅ Created 3 daily reports');

  // ==================== PLANT SCAN RECORDS (3) — 1 per plot ====================
  const plantScansData = [
    {
      id: 'scan-1',
      plotId: plots[0].id,
      diseaseEn: 'Coffee Berry Borer',
      diseaseVi: 'Sâu đục quả cà phê',
      causingAgent: 'Hypothenemus hampei',
      dangerLevel: 'HIGH',
      category: 'Insect Pest',
      symptoms:
        'Quả cà phê bị đục lỗ nhỏ, bên trong có ấu trùng, quả rụng sớm.',
      treatment: 'Phun thuốc Actara 25WG, thu gom và tiêu hủy quả bị nhiễm.',
      confidence: 0.94,
      processingMs: 1230,
      scannedAt: new Date('2024-10-10'),
    },
    {
      id: 'scan-2',
      plotId: plots[1].id,
      diseaseEn: 'Rice Brown Planthopper',
      diseaseVi: 'Rầy nâu hại lúa',
      causingAgent: 'Nilaparvata lugens',
      dangerLevel: 'HIGH',
      category: 'Insect Pest',
      symptoms:
        'Lúa bị vàng lá, cháy chóp lá, thân mềm, có thể gây cháy rầy nếu không xử lý.',
      treatment:
        'Phun thuốc Applaud 25WP hoặc Chess 50WG theo liều khuyến cáo.',
      confidence: 0.91,
      processingMs: 1100,
      scannedAt: new Date('2024-05-09'),
    },
    {
      id: 'scan-3',
      plotId: plots[2].id,
      diseaseEn: 'Tea Leaf Blight',
      diseaseVi: 'Bệnh đốm nâu lá chè',
      causingAgent: 'Colletotrichum camelliae',
      dangerLevel: 'MEDIUM',
      category: 'Fungal Disease',
      symptoms: 'Lá chè xuất hiện đốm nâu viền vàng, lan rộng làm rụng lá sớm.',
      treatment: 'Cắt tỉa lá bệnh, phun Score 250EC hoặc Anvil 5SC luân phiên.',
      confidence: 0.88,
      processingMs: 1350,
      scannedAt: new Date('2024-09-20'),
    },
  ];
  await Promise.all(
    plantScansData.map((s) =>
      prisma.plantScanRecord.create({
        data: {
          ...s,
          adminId: adminProfile.id,
          supervisorId: supervisorProfile.id,
        },
      }),
    ),
  );

  console.log('[SEED] ✅ Created 3 plant scan records');

  // ==================== PRICE BOARDS (3) ====================
  const priceBoardsData = [
    {
      id: 'pb-1',
      cropType: 'ca-phe',
      grade: QualityGrade.A,
      buyPrice: 230000,
      sellPrice: 260000,
    },
    {
      id: 'pb-2',
      cropType: 'lua',
      grade: QualityGrade.STANDARD,
      buyPrice: 15000,
      sellPrice: 25000,
    },
    {
      id: 'pb-3',
      cropType: 'che',
      grade: QualityGrade.PREMIUM,
      buyPrice: 180000,
      sellPrice: 220000,
    },
  ];
  await Promise.all(
    priceBoardsData.map((p) =>
      prisma.priceBoard.create({
        data: {
          ...p,
          adminId: adminProfile.id,
          effectiveDate: new Date('2024-01-01'),
          isActive: true,
        },
      }),
    ),
  );

  // ==================== CONTRACTS (3) — 1 per farmer-plot ====================
  const contractsData = [
    {
      id: 'contract-1',
      farmerId: farmers[0].id,
      plotId: plots[0].id,
      contractNo: 'CT-2024-001',
      cropType: 'ca-phe',
      variety: 'Arabica',
      grade: QualityGrade.A,
      signedAt: new Date('2023-12-01'),
      harvestDue: new Date('2024-11-30'),
      traceabilityQr: 'QR-CT-2024-001',
      approvedAt: new Date('2023-12-03'),
    },
    {
      id: 'contract-2',
      farmerId: farmers[1].id,
      plotId: plots[1].id,
      contractNo: 'CT-2024-002',
      cropType: 'lua',
      variety: 'ST25',
      grade: QualityGrade.STANDARD,
      signedAt: new Date('2024-01-20'),
      harvestDue: new Date('2024-06-30'),
      traceabilityQr: 'QR-CT-2024-002',
      approvedAt: new Date('2024-01-22'),
    },
    {
      id: 'contract-3',
      farmerId: farmers[2].id,
      plotId: plots[2].id,
      contractNo: 'CT-2024-003',
      cropType: 'che',
      variety: 'Shan Tuyết',
      grade: QualityGrade.PREMIUM,
      signedAt: new Date('2024-02-15'),
      harvestDue: new Date('2024-10-15'),
      traceabilityQr: 'QR-CT-2024-003',
      approvedAt: new Date('2024-02-18'),
    },
  ];
  const contracts = await Promise.all(
    contractsData.map((c) =>
      prisma.contract.create({
        data: {
          ...c,
          adminId: adminProfile.id,
          supervisorId: supervisorProfile.id,
          status: ContractStatus.ACTIVE,
          approvedBy: adminUser.id,
        },
      }),
    ),
  );

  console.log('[SEED] ✅ Created 3 price boards, 3 contracts');

  // ==================== CATEGORIES (3) ====================
  const categoriesData = [
    {
      id: 'cat-1',
      name: 'Cà phê nguyên chất',
      slug: 'ca-phe-nguyen-chat',
      description: 'Cà phê 100% Arabica từ nông trại trực tiếp',
      sortOrder: 1,
    },
    {
      id: 'cat-2',
      name: 'Gạo sạch',
      slug: 'gao-sach',
      description: 'Gạo đặc sản canh tác theo hướng hữu cơ',
      sortOrder: 2,
    },
    {
      id: 'cat-3',
      name: 'Trà đặc sản',
      slug: 'tra-dac-san',
      description: 'Trà Shan Tuyết cổ thụ vùng núi cao',
      sortOrder: 3,
    },
  ];
  const categories = await Promise.all(
    categoriesData.map((c) =>
      prisma.category.create({
        data: { ...c, isActive: true },
      }),
    ),
  );

  // ==================== PRODUCTS (3) — 1 per contract/plot ====================
  const productsData = [
    {
      id: 'product-1',
      plotId: plots[0].id,
      contractId: contracts[0].id,
      name: 'Cà phê Arabica Đắk Lắk - Hạng A',
      slug: 'ca-phe-arabica-dak-lak-hang-a',
      sku: 'SKU-CAFE-A-001',
      description:
        'Cà phê Arabica nguyên chất từ Đắk Lắk, độ cao 1200m, hương vị đặc biệt với ghi chú chocolate và hoa quả.',
      cropType: 'ca-phe',
      variety: 'Arabica',
      grade: QualityGrade.A,
      pricePerKg: 260000,
      stockKg: 5000,
      reservedKg: 50,
      minOrderKg: 5,
      qrCode: 'QR-PROD-001',
      imageUrls: ['https://placehold.co/800x600?text=Ca+Phe+Arabica'],
      thumbnailUrl: 'https://placehold.co/400x300?text=Ca+Phe+Arabica',
      harvestDate: new Date('2024-11-01'),
      aiConfidenceScore: 0.97,
    },
    {
      id: 'product-2',
      plotId: plots[1].id,
      contractId: contracts[1].id,
      name: 'Gạo ST25 Cần Thơ - Tiêu chuẩn',
      slug: 'gao-st25-can-tho-tieu-chuan',
      sku: 'SKU-GAO-ST25-002',
      description:
        'Gạo ST25 thơm ngon nổi tiếng từ đồng bằng sông Cửu Long, hạt dài, cơm dẻo và ngọt.',
      cropType: 'lua',
      variety: 'ST25',
      grade: QualityGrade.STANDARD,
      pricePerKg: 25000,
      stockKg: 8000,
      reservedKg: 100,
      minOrderKg: 10,
      qrCode: 'QR-PROD-002',
      imageUrls: ['https://placehold.co/800x600?text=Gao+ST25'],
      thumbnailUrl: 'https://placehold.co/400x300?text=Gao+ST25',
      harvestDate: new Date('2024-06-20'),
      aiConfidenceScore: 0.95,
    },
    {
      id: 'product-3',
      plotId: plots[2].id,
      contractId: contracts[2].id,
      name: 'Trà Shan Tuyết Sơn La - Premium',
      slug: 'tra-shan-tuyet-son-la-premium',
      sku: 'SKU-TRA-SHAN-003',
      description:
        'Trà Shan Tuyết cổ thụ Mộc Châu, búp một tôm hai lá, hương thơm đặc trưng và hậu vị ngọt thanh.',
      cropType: 'che',
      variety: 'Shan Tuyết',
      grade: QualityGrade.PREMIUM,
      pricePerKg: 220000,
      stockKg: 3000,
      reservedKg: 20,
      minOrderKg: 2,
      qrCode: 'QR-PROD-003',
      imageUrls: ['https://placehold.co/800x600?text=Tra+Shan+Tuyet'],
      thumbnailUrl: 'https://placehold.co/400x300?text=Tra+Shan+Tuyet',
      harvestDate: new Date('2024-10-10'),
      aiConfidenceScore: 0.93,
    },
  ];
  const products = await Promise.all(
    productsData.map((p) =>
      prisma.product.create({
        data: {
          ...p,
          adminId: adminProfile.id,
          status: ProductStatus.PUBLISHED,
        },
      }),
    ),
  );

  // Link mỗi product với category tương ứng (product[i] ↔ category[i])
  await Promise.all(
    products.map((p, idx) =>
      prisma.productCategory.create({
        data: { productId: p.id, categoryId: categories[idx].id },
      }),
    ),
  );

  console.log(
    '[SEED] ✅ Created 3 categories, 3 products, 3 product-category links',
  );

  // ==================== WAREHOUSES (3) ====================
  const warehousesData = [
    {
      id: 'wh-1',
      name: 'Kho Đắk Lắk',
      locationAddress: 'Km 5, Quốc lộ 14, Buôn Ma Thuột, Đắk Lắk',
      capacityKg: 50000,
    },
    {
      id: 'wh-2',
      name: 'Kho Cần Thơ',
      locationAddress: '12 Đường 30/4, Ninh Kiều, Cần Thơ',
      capacityKg: 80000,
    },
    {
      id: 'wh-3',
      name: 'Kho Sơn La',
      locationAddress: 'Tiểu khu 8, Thị trấn Mộc Châu, Sơn La',
      capacityKg: 30000,
    },
  ];
  const warehouses = await Promise.all(
    warehousesData.map((w) =>
      prisma.warehouse.create({
        data: {
          ...w,
          adminId: adminProfile.id,
          managedBy: inventoryProfile.id,
          isActive: true,
        },
      }),
    ),
  );

  // ==================== INVENTORY LOTS (3) — 1 per warehouse/product/contract ====================
  const inventoryLotsData = [
    {
      id: 'invlot-1',
      warehouseId: warehouses[0].id,
      productId: products[0].id,
      contractId: contracts[0].id,
      quantityKg: 5000,
      harvestDate: new Date('2024-11-01'),
      expiryDate: new Date('2025-11-01'),
      qualityGrade: QualityGrade.A,
    },
    {
      id: 'invlot-2',
      warehouseId: warehouses[1].id,
      productId: products[1].id,
      contractId: contracts[1].id,
      quantityKg: 8000,
      harvestDate: new Date('2024-06-20'),
      expiryDate: new Date('2025-06-20'),
      qualityGrade: QualityGrade.STANDARD,
    },
    {
      id: 'invlot-3',
      warehouseId: warehouses[2].id,
      productId: products[2].id,
      contractId: contracts[2].id,
      quantityKg: 3000,
      harvestDate: new Date('2024-10-10'),
      expiryDate: new Date('2026-10-10'),
      qualityGrade: QualityGrade.PREMIUM,
    },
  ];
  const inventoryLots = await Promise.all(
    inventoryLotsData.map((l) =>
      prisma.inventoryLot.create({
        data: { ...l, status: InventoryLotStatus.RECEIVED },
      }),
    ),
  );

  // ==================== WAREHOUSE TRANSACTIONS (3) — 1 RECEIPT per lot ====================
  await Promise.all(
    inventoryLots.map((lot, idx) =>
      prisma.warehouseTransaction.create({
        data: {
          id: `wtx-${idx + 1}`,
          warehouseId: lot.warehouseId,
          productId: lot.productId,
          inventoryLotId: lot.id,
          quantityKg: lot.quantityKg,
          action: TransactionAction.RECEIPT,
          type: TransactionType.INBOUND,
          createdBy: inventoryProfile.userId,
          note: `Nhập kho lần đầu từ hợp đồng ${contracts[idx].contractNo}`,
        },
      }),
    ),
  );

  console.log(
    '[SEED] ✅ Created 3 warehouses, 3 inventory lots, 3 transactions',
  );

  // ==================== CART + 3 CART ITEMS (1 cart, 3 items — schema unique clientId) ====================
  const cart = await prisma.cart.create({
    data: { id: 'cart-1', clientId: clientProfile.id },
  });
  await Promise.all(
    products.map((p, idx) =>
      prisma.cartItem.create({
        data: {
          id: `cartitem-${idx + 1}`,
          cartId: cart.id,
          productId: p.id,
          quantityKg: [10, 20, 5][idx],
        },
      }),
    ),
  );

  console.log('[SEED] ✅ Created 1 cart with 3 items');

  // ==================== ORDERS (3) + 3 ORDER ITEMS ====================
  const ordersData = [
    {
      id: 'order-1',
      productIdx: 0,
      orderNo: 'ORD-2024-0001',
      orderCode: 'OC-20241115-0001',
      quantityKg: 50,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.PAID,
      fulfillStatus: FulfillStatus.DELIVERED,
      trackingCode: 'TRK-001-VN',
      orderedAt: new Date('2024-11-15'),
      paidAt: new Date('2024-11-15'),
      packedAt: new Date('2024-11-16'),
      shippedAt: new Date('2024-11-17'),
      deliveredAt: new Date('2024-11-18'),
    },
    {
      id: 'order-2',
      productIdx: 1,
      orderNo: 'ORD-2024-0002',
      orderCode: 'OC-20241120-0002',
      quantityKg: 100,
      paymentMethod: PaymentMethod.VNPAY,
      paymentStatus: PaymentStatus.PAID,
      fulfillStatus: FulfillStatus.DELIVERED,
      trackingCode: 'TRK-002-VN',
      orderedAt: new Date('2024-11-20'),
      paidAt: new Date('2024-11-20'),
      packedAt: new Date('2024-11-21'),
      shippedAt: new Date('2024-11-22'),
      deliveredAt: new Date('2024-11-24'),
    },
    {
      id: 'order-3',
      productIdx: 2,
      orderNo: 'ORD-2024-0003',
      orderCode: 'OC-20241125-0003',
      quantityKg: 20,
      paymentMethod: PaymentMethod.MOMO,
      paymentStatus: PaymentStatus.PAID,
      fulfillStatus: FulfillStatus.DELIVERED,
      trackingCode: 'TRK-003-VN',
      orderedAt: new Date('2024-11-25'),
      paidAt: new Date('2024-11-25'),
      packedAt: new Date('2024-11-26'),
      shippedAt: new Date('2024-11-27'),
      deliveredAt: new Date('2024-11-29'),
    },
  ];
  await Promise.all(
    ordersData.map((o) => {
      const product = products[o.productIdx];
      const subtotal = product.pricePerKg * o.quantityKg;
      const shippingFee = 50000;
      return prisma.order.create({
        data: {
          id: o.id,
          clientId: clientProfile.id,
          adminId: adminProfile.id,
          shipperId: shipperProfile.id,
          orderNo: o.orderNo,
          orderCode: o.orderCode,
          subtotal,
          shippingFee,
          discount: 0,
          total: subtotal + shippingFee,
          paymentMethod: o.paymentMethod,
          paymentStatus: o.paymentStatus,
          fulfillStatus: o.fulfillStatus,
          shippingAddr: {
            fullName: 'Khách Hàng',
            phone: '0987654321',
            addressLine: '123 Đường Láng',
            district: 'Đống Đa',
            province: 'Hà Nội',
          },
          shippingAddrText: '123 Đường Láng, Đống Đa, Hà Nội',
          trackingCode: o.trackingCode,
          orderedAt: o.orderedAt,
          paidAt: o.paidAt,
          packedAt: o.packedAt,
          shippedAt: o.shippedAt,
          deliveredAt: o.deliveredAt,
          orderItems: {
            create: {
              id: `orderitem-${o.id.split('-')[1]}`,
              productId: product.id,
              nameSnapshot: product.name,
              priceSnapshot: product.pricePerKg,
              quantityKg: o.quantityKg,
              subtotal,
            },
          },
        },
      });
    }),
  );

  console.log('[SEED] ✅ Created 3 orders with 3 order items');

  // ==================== REVIEWS (3) — 1 per product ====================
  const reviewsData = [
    {
      id: 'review-1',
      productId: products[0].id,
      rating: 5,
      comment:
        'Cà phê rất thơm ngon, chất lượng tốt, đóng gói cẩn thận. Sẽ mua lại lần sau!',
    },
    {
      id: 'review-2',
      productId: products[1].id,
      rating: 4,
      comment:
        'Gạo ST25 dẻo thơm đúng chuẩn, cơm ngon. Giao hàng nhanh, đóng gói chắc chắn.',
    },
    {
      id: 'review-3',
      productId: products[2].id,
      rating: 5,
      comment:
        'Trà Shan Tuyết hương vị rất đặc biệt, nước xanh đẹp, hậu ngọt. Rất hài lòng.',
    },
  ];
  await Promise.all(
    reviewsData.map((r) =>
      prisma.review.create({
        data: {
          ...r,
          clientId: clientProfile.id,
          imageUrls: ['https://placehold.co/400x300?text=Review+Image'],
          verifiedPurchase: true,
          status: ReviewStatus.APPROVED,
        },
      }),
    ),
  );

  console.log('[SEED] ✅ Created 3 reviews');

  // ==================== SUMMARY ====================
  console.log('\n========================================');
  console.log('  SEED COMPLETE');
  console.log('========================================');
  console.log('\n📋 Tài khoản đăng nhập (mật khẩu: 123123):');
  console.log('   ADMIN      → admin@farmers.com');
  console.log('   SUPERVISOR → supervisor@farmers.com');
  console.log('   INVENTORY  → inventory@farmers.com');
  console.log('   SHIPPER    → shipper@farmers.com');
  console.log('   CLIENT     → client@farmers.com');
  console.log('\n🔗 Luồng dữ liệu liên kết (mỗi nhóm 3 record):');
  console.log('   Admin → 3 Zones (Đắk Lắk / Cần Thơ / Sơn La)');
  console.log(
    '   Supervisor → 3 Farmers → 3 Plots (mỗi farmer 1 plot ở 1 zone)',
  );
  console.log('   Plots → 3 Assignments + 3 DailyReports + 3 PlantScanRecords');
  console.log('   3 Contracts → 3 Products → 3 Categories (1-1)');
  console.log('   3 Warehouses → 3 InventoryLots → 3 WarehouseTransactions');
  console.log('   Client → 1 Cart + 3 CartItems / 3 ShippingAddresses');
  console.log(
    '   Client → 3 Orders (COD/VNPAY/MOMO) → 3 OrderItems → Shipper giao',
  );
  console.log('   Client → 3 Reviews (1 cho mỗi product, verified purchase)');
  console.log('');
}

main()
  .catch((e) => {
    console.error('[SEED] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
