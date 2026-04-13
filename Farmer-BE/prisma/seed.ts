import { PrismaClient, Role, FarmerStatus, PlotStatus, AssignStatus, ReportType, ContractStatus, QualityGrade, ProductStatus, PaymentMethod, PaymentStatus, FulfillStatus, ReviewStatus, ReportStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('\n========================================');
  console.log('  FARMERS — DATABASE SEED');
  console.log('========================================\n');

  // ─────────────────────────────────────────────────────────────────────────
  // 1. ADMIN  (phone: 0123456789 / password: 123123)
  // ─────────────────────────────────────────────────────────────────────────
  const adminEmail = 'admin@farmers.com';
  const adminPhone = '0123456789';
  const adminPassword = '123123';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  let adminUserId: string;
  let adminId: string;

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        fullName: 'Quản Trị Viên',
        phone: adminPhone,
        role: Role.ADMIN,
      },
    });
    adminUserId = adminUser.id;

    const adminProfile = await prisma.adminProfile.create({
      data: {
        userId: adminUserId,
        businessName: 'Farmes Core',
        province: 'Hà Nội',
        taxCode: null,
        bankAccount: null,
      },
    });
    adminId = adminProfile.id;

    console.log(`[SEED] ADMIN created`);
    console.log(`       email    : ${adminEmail}`);
    console.log(`       phone    : ${adminPhone}`);
    console.log(`       password : ${adminPassword}`);
  } else {
    adminUserId = existingAdmin.id;
    const adminProfile = await prisma.adminProfile.findUnique({
      where: { userId: adminUserId },
    });
    if (!adminProfile) {
      throw new Error('AdminProfile not found');
    }
    adminId = adminProfile.id;
    console.log(`[SEED] ADMIN already exists — skipping (id: ${adminUserId}, adminId: ${adminId})`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. SUPERVISOR  (phone: 0912333444 / password: 123123)
  // ─────────────────────────────────────────────────────────────────────────
  const supervisorEmail = 'supervisor@farmers.com';
  const supervisorPhone = '0912333444';
  const supervisorPassword = '123123';

  const existingSupervisor = await prisma.user.findUnique({
    where: { email: supervisorEmail },
  });

  let supervisorUserId: string;

  if (!existingSupervisor) {
    const hashedPassword = await bcrypt.hash(supervisorPassword, 10);

    let zone = await prisma.zone.findFirst({
      where: { adminId },
    });

    if (!zone) {
      zone = await prisma.zone.create({
        data: {
          adminId,
          name: 'Khu Vực 1',
          province: 'Hà Nội',
          district: 'Thanh Xuân',
          totalAreaHa: 10,
        },
      });
      console.log(`[SEED] Default Zone created (id: ${zone.id})`);
    }

    const supervisorUser = await prisma.user.create({
      data: {
        email: supervisorEmail,
        passwordHash: hashedPassword,
        fullName: 'Giám Sát Viên',
        phone: supervisorPhone,
        role: Role.SUPERVISOR,
      },
    });
    supervisorUserId = supervisorUser.id;

    await prisma.supervisorProfile.create({
      data: {
        userId: supervisorUserId,
        adminId,
        zoneId: zone.id,
        employeeCode: 'SUP-000001',
      },
    });

    console.log(`[SEED] SUPERVISOR created`);
    console.log(`       email        : ${supervisorEmail}`);
    console.log(`       phone        : ${supervisorPhone}`);
    console.log(`       password     : ${supervisorPassword}`);
    console.log(`       employeeCode : SUP-000001`);
  } else {
    supervisorUserId = existingSupervisor.id;
    console.log(
      `[SEED] SUPERVISOR already exists — skipping (id: ${existingSupervisor.id})`,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. CLIENT  (phone: 0987654321 / password: 123123)
  // ─────────────────────────────────────────────────────────────────────────
  const clientEmail = 'client@farmers.com';
  const clientPhone = '0987654321';
  const clientPassword = '123123';

  const existingClient = await prisma.user.findUnique({
    where: { email: clientEmail },
  });

  if (!existingClient) {
    const hashedPassword = await bcrypt.hash(clientPassword, 10);

    const clientUser = await prisma.user.create({
      data: {
        email: clientEmail,
        passwordHash: hashedPassword,
        fullName: 'Khách Hàng',
        phone: clientPhone,
        role: Role.CLIENT,
      },
    });

    await prisma.clientProfile.create({
      data: {
        userId: clientUser.id,
        adminId,
        province: 'Hà Nội',
      },
    });

    console.log(`[SEED] CLIENT created`);
    console.log(`       email    : ${clientEmail}`);
    console.log(`       phone    : ${clientPhone}`);
    console.log(`       password : ${clientPassword}`);
  } else {
    console.log(
      `[SEED] CLIENT already exists — skipping (id: ${existingClient.id})`,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3.5. INVENTORY MANAGER (phone: 0944555666 / password: 123123)
  // ─────────────────────────────────────────────────────────────────────────
  const inventoryEmail = 'inventory@farmers.com';
  const inventoryPhone = '0944555666';
  const inventoryPassword = '123123';

  const existingInventory = await prisma.user.findUnique({
    where: { email: inventoryEmail },
  });

  let inventoryProfileId: string;

  if (!existingInventory) {
    const hashedPassword = await bcrypt.hash(inventoryPassword, 10);

    const inventoryUser = await prisma.user.create({
      data: {
        email: inventoryEmail,
        passwordHash: hashedPassword,
        fullName: 'Quản Lý Kho',
        phone: inventoryPhone,
        role: Role.INVENTORY,
      },
    });

    const invProfile = await prisma.inventoryProfile.create({
      data: {
        userId: inventoryUser.id,
        adminId,
        employeeCode: 'INV-000001',
      },
    });
    inventoryProfileId = invProfile.id;

    console.log(`[SEED] INVENTORY created`);
    console.log(`       email        : ${inventoryEmail}`);
    console.log(`       phone        : ${inventoryPhone}`);
    console.log(`       password     : ${inventoryPassword}`);
    console.log(`       employeeCode : INV-000001`);
  } else {
    const invProfile = await prisma.inventoryProfile.findUnique({
      where: { userId: existingInventory.id },
    });
    inventoryProfileId = invProfile?.id ?? '';
    console.log(
      `[SEED] INVENTORY already exists — skipping (id: ${existingInventory.id})`,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. ZONE — thêm 3 record
  // ─────────────────────────────────────────────────────────────────────────
  const existingZoneCount = await prisma.zone.count();

  if (existingZoneCount === 0) {
    const zones = await Promise.all([
      prisma.zone.create({
        data: {
          adminId,
          name: 'Khu Vực 1',
          province: 'Hà Nội',
          district: 'Thanh Xuân',
          centerLat: 20.9876,
          centerLng: 105.8234,
          totalAreaHa: 10,
        },
      }),
      prisma.zone.create({
        data: {
          adminId,
          name: 'Khu Vực 2',
          province: 'Hà Nội',
          district: 'Đống Đa',
          centerLat: 21.0123,
          centerLng: 105.8456,
          totalAreaHa: 8,
        },
      }),
      prisma.zone.create({
        data: {
          adminId,
          name: 'Khu Vực 3',
          province: 'Hà Nội',
          district: 'Ba Đình',
          centerLat: 21.0356,
          centerLng: 105.8021,
          totalAreaHa: 12,
        },
      }),
    ]);
    console.log(`[SEED] 3 Zones created`);
  } else {
    console.log(`[SEED] Zones already exist — skipping`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. FARMER — thêm 3 record
  // ─────────────────────────────────────────────────────────────────────────
  const existingFarmerCount = await prisma.farmer.count({
    where: { adminId },
  });

  let farmerIds: string[] = [];

  if (existingFarmerCount === 0) {
    const farmers = await Promise.all([
      prisma.farmer.create({
        data: {
          adminId,
          fullName: 'Nguyễn Văn A',
          phone: '0901111222',
          cccd: '001201001234',
          bankAccount: '1234567890',
          address: '123 Đường ABC, Thanh Xuân, Hà Nội',
          province: 'Hà Nội',
          status: FarmerStatus.ACTIVE,
        },
      }),
      prisma.farmer.create({
        data: {
          adminId,
          fullName: 'Trần Thị B',
          phone: '0902222333',
          cccd: '001201001235',
          bankAccount: '0987654321',
          address: '456 Đường XYZ, Đống Đa, Hà Nội',
          province: 'Hà Nội',
          status: FarmerStatus.ACTIVE,
        },
      }),
      prisma.farmer.create({
        data: {
          adminId,
          fullName: 'Lê Văn C',
          phone: '0903333444',
          cccd: '001201001236',
          bankAccount: '1122334455',
          address: '789 Đường DEF, Ba Đình, Hà Nội',
          province: 'Hà Nội',
          status: FarmerStatus.ACTIVE,
        },
      }),
    ]);
    farmerIds = farmers.map((f) => f.id);
    console.log(`[SEED] 3 Farmers created`);
  } else {
    farmerIds = (await prisma.farmer.findMany({ where: { adminId } })).map((f) => f.id);
    console.log(`[SEED] Farmers already exist — skipping`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. PLOT — thêm 3 record
  // ─────────────────────────────────────────────────────────────────────────
  const existingPlotCount = await prisma.plot.count({
    where: { adminId },
  });

  let plotIds: string[] = [];
  const zones = await prisma.zone.findMany({ where: { adminId } });
  const zoneId = zones[0]?.id ?? null;

  if (existingPlotCount === 0 && farmerIds.length > 0) {
    const plots = await Promise.all([
      prisma.plot.create({
        data: {
          farmerId: farmerIds[0],
          adminId,
          zoneId,
          plotCode: 'PLOT-001',
          cropType: 'Rau muống',
          areaHa: 2.5,
          lat: 20.9900,
          lng: 105.8200,
          status: PlotStatus.ACTIVE,
          plantingDate: new Date('2026-01-15'),
          expectedHarvest: new Date('2026-04-15'),
          estimatedYieldKg: 5000,
        },
      }),
      prisma.plot.create({
        data: {
          farmerId: farmerIds[1] ?? farmerIds[0],
          adminId,
          zoneId,
          plotCode: 'PLOT-002',
          cropType: 'Cải xanh',
          areaHa: 1.8,
          lat: 21.0000,
          lng: 105.8300,
          status: PlotStatus.ACTIVE,
          plantingDate: new Date('2026-02-01'),
          expectedHarvest: new Date('2026-05-01'),
          estimatedYieldKg: 3500,
        },
      }),
      prisma.plot.create({
        data: {
          farmerId: farmerIds[2] ?? farmerIds[0],
          adminId,
          zoneId,
          plotCode: 'PLOT-003',
          cropType: 'Xà lách',
          areaHa: 1.2,
          lat: 21.0100,
          lng: 105.8400,
          status: PlotStatus.IDLE,
          plantingDate: null,
          expectedHarvest: null,
          estimatedYieldKg: null,
        },
      }),
    ]);
    plotIds = plots.map((p) => p.id);
    console.log(`[SEED] 3 Plots created`);
  } else {
    plotIds = (await prisma.plot.findMany({ where: { adminId } })).map((p) => p.id);
    console.log(`[SEED] Plots already exist — skipping`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7. PRICE BOARD — thêm 3 record
  // ─────────────────────────────────────────────────────────────────────────
  const existingPriceBoardCount = await prisma.priceBoard.count({
    where: { adminId },
  });

  if (existingPriceBoardCount === 0) {
    await Promise.all([
      prisma.priceBoard.create({
        data: {
          adminId,
          cropType: 'Rau muống',
          grade: QualityGrade.A,
          buyPrice: 5000,
          sellPrice: 8000,
          effectiveDate: new Date(),
          isActive: true,
        },
      }),
      prisma.priceBoard.create({
        data: {
          adminId,
          cropType: 'Cải xanh',
          grade: QualityGrade.A,
          buyPrice: 6000,
          sellPrice: 10000,
          effectiveDate: new Date(),
          isActive: true,
        },
      }),
      prisma.priceBoard.create({
        data: {
          adminId,
          cropType: 'Xà lách',
          grade: QualityGrade.B,
          buyPrice: 4000,
          sellPrice: 7000,
          effectiveDate: new Date(),
          isActive: true,
        },
      }),
    ]);
    console.log(`[SEED] 3 PriceBoards created`);
  } else {
    console.log(`[SEED] PriceBoards already exist — skipping`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 8. ASSIGNMENT — thêm 3 record
  // ─────────────────────────────────────────────────────────────────────────
  const existingAssignmentCount = await prisma.assignment.count({
    where: { adminId },
  });

  const supervisorProfile = await prisma.supervisorProfile.findFirst({
    where: { adminId },
  });
  const supProfileId = supervisorProfile?.id ?? null;

  if (existingAssignmentCount === 0 && plotIds.length > 0 && supProfileId) {
    await prisma.$transaction(async (tx) => {
      await tx.assignment.create({
        data: {
          supervisorId: supProfileId,
          plotId: plotIds[0],
          adminId,
          status: AssignStatus.ACTIVE,
          dueDate: new Date('2026-04-10'),
          note: 'Kiểm tra sâu bệnh trên rau muống',
        },
      });
      await tx.assignment.create({
        data: {
          supervisorId: supProfileId,
          plotId: plotIds[1],
          adminId,
          status: AssignStatus.PENDING,
          dueDate: new Date('2026-04-15'),
          note: 'Theo dõi tưới nước cải xanh',
        },
      });
      await tx.assignment.create({
        data: {
          supervisorId: supProfileId,
          plotId: plotIds[2],
          adminId,
          status: AssignStatus.PENDING,
          dueDate: new Date('2026-04-20'),
          note: 'Chuẩn bị đất trồng xà lách',
        },
      });
    });
    console.log(`[SEED] 3 Assignments created`);
  } else {
    console.log(`[SEED] Assignments already exist — skipping`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 9. DAILY REPORT — thêm 3 record
  // ─────────────────────────────────────────────────────────────────────────
  const existingReportCount = await prisma.dailyReport.count({
    where: { adminId },
  });

  if (existingReportCount === 0 && plotIds.length > 0 && supProfileId) {
    await Promise.all([
      prisma.dailyReport.create({
        data: {
          supervisorId: supProfileId,
          plotId: plotIds[0],
          adminId,
          type: ReportType.ROUTINE,
          content: 'Rau muống phát triển tốt, không có sâu bệnh. Đã tưới nước buổi sáng.',
          imageUrls: [],
          isSynced: true,
          syncedAt: new Date(),
          status: ReportStatus.SUBMITTED,
          yieldEstimateKg: 5000,
        },
      }),
      prisma.dailyReport.create({
        data: {
          supervisorId: supProfileId,
          plotId: plotIds[1],
          adminId,
          type: ReportType.INCIDENT,
          content: 'Phát hiện lá vàng trên cải xanh, có thể thiếu phân. Đề xuất bổ sung NPK.',
          imageUrls: [],
          isSynced: true,
          syncedAt: new Date(),
          status: ReportStatus.REVIEWED,
          yieldEstimateKg: 3500,
        },
      }),
      prisma.dailyReport.create({
        data: {
          supervisorId: supProfileId,
          plotId: plotIds[2],
          adminId,
          type: ReportType.ROUTINE,
          content: 'Khu đất đã được cày bừa, chuẩn bị gieo hạt xà lách trong tuần này.',
          imageUrls: [],
          isSynced: false,
          status: ReportStatus.DRAFT,
          yieldEstimateKg: 1500,
        },
      }),
    ]);
    console.log(`[SEED] 3 DailyReports created`);
  } else {
    console.log(`[SEED] DailyReports already exist — skipping`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 9.5. CLIENT SHIPPING ADDRESS
  // ─────────────────────────────────────────────────────────────────────────
  const clientUser = await prisma.user.findUnique({ where: { email: clientEmail } });
  const clientProfile = await prisma.clientProfile.findUnique({ where: { userId: clientUser?.id } });

  if (clientProfile) {
    const existingAddress = await prisma.clientShippingAddress.findFirst({
      where: { clientProfileId: clientProfile.id },
    });

    if (!existingAddress) {
      await prisma.clientShippingAddress.create({
        data: {
          clientProfileId: clientProfile.id,
          fullName: 'Khách Hàng',
          phone: clientPhone,
          addressLine: '123 Nguyễn Trãi',
          district: 'Thanh Xuân',
          province: 'Hà Nội',
          isDefault: true,
        },
      });
      console.log(`[SEED] ClientShippingAddress created`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 10. CATEGORY — thêm 3 record
  // ─────────────────────────────────────────────────────────────────────────
  const existingCategoryCount = await prisma.category.count();

  if (existingCategoryCount === 0) {
    await Promise.all([
      prisma.category.create({
        data: {
          name: 'Rau ăn lá',
          slug: 'rau-an-la',
          sortOrder: 1,
        },
      }),
      prisma.category.create({
        data: {
          name: 'Rau ăn củ',
          slug: 'rau-an-cu',
          sortOrder: 2,
        },
      }),
      prisma.category.create({
        data: {
          name: 'Rau gia vị',
          slug: 'rau-gia-vi',
          sortOrder: 3,
        },
      }),
    ]);
    console.log(`[SEED] 3 Categories created`);
  } else {
    console.log(`[SEED] Categories already exist — skipping`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 11. CONTRACT — thêm 3 record
  // ─────────────────────────────────────────────────────────────────────────
  const existingContractCount = await prisma.contract.count({
    where: { adminId },
  });

  const priceBoards = await prisma.priceBoard.findMany({
    where: { adminId },
  });
  const priceBoardId = priceBoards[0]?.id ?? null;

  if (existingContractCount === 0 && farmerIds.length > 0 && plotIds.length > 0) {
    await Promise.all([
      prisma.contract.create({
        data: {
          adminId,
          farmerId: farmerIds[0],
          plotId: plotIds[0],
          priceBoardId,
          contractNo: 'HD-2026-001',
          cropType: 'Rau muống',
          quantityKg: 5000,
          pricePerKg: 5000,
          totalAmount: 5000 * 5000,
          grade: QualityGrade.A,
          status: ContractStatus.SIGNED,
          signedAt: new Date('2026-01-20'),
          harvestDue: new Date('2026-04-15'),
        },
      }),
      prisma.contract.create({
        data: {
          adminId,
          farmerId: farmerIds[1] ?? farmerIds[0],
          plotId: plotIds[1],
          priceBoardId,
          contractNo: 'HD-2026-002',
          cropType: 'Cải xanh',
          quantityKg: 3500,
          pricePerKg: 6000,
          totalAmount: 3500 * 6000,
          grade: QualityGrade.A,
          status: ContractStatus.DRAFT,
        },
      }),
      prisma.contract.create({
        data: {
          adminId,
          farmerId: farmerIds[2] ?? farmerIds[0],
          plotId: plotIds[2],
          priceBoardId,
          contractNo: 'HD-2026-003',
          cropType: 'Xà lách',
          quantityKg: 2000,
          pricePerKg: 4000,
          totalAmount: 2000 * 4000,
          grade: QualityGrade.B,
          status: ContractStatus.DRAFT,
        },
      }),
    ]);
    console.log(`[SEED] 3 Contracts created`);
  } else {
    console.log(`[SEED] Contracts already exist — skipping`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 12. PRODUCT — thêm 3 record
  // ─────────────────────────────────────────────────────────────────────────
  const existingProductCount = await prisma.product.count({
    where: { adminId },
  });

  if (existingProductCount === 0) {
    await Promise.all([
      prisma.product.create({
        data: {
          adminId,
          plotId: plotIds[0],
          name: 'Rau muống tươi A',
          slug: 'rau-muong-tuoi-a',
          sku: 'SKU-RM-001',
          description: 'Rau muống tươi loại A, không thuốc trừ sâu',
          cropType: 'Rau muống',
          grade: QualityGrade.A,
          pricePerKg: 8000,
          stockKg: 500,
          minOrderKg: 1,
          qrCode: 'QR-P001',
          imageUrls: [],
          status: ProductStatus.PUBLISHED,
          harvestDate: new Date('2026-03-01'),
          aiConfidenceScore: 0.95,
        },
      }),
      prisma.product.create({
        data: {
          adminId,
          plotId: plotIds[1],
          name: 'Cải xanh tươi A',
          slug: 'cai-xanh-tuoi-a',
          sku: 'SKU-CX-001',
          description: 'Cải xanh tươi loại A, trồng hữu cơ',
          cropType: 'Cải xanh',
          grade: QualityGrade.A,
          pricePerKg: 10000,
          stockKg: 300,
          minOrderKg: 1,
          qrCode: 'QR-P002',
          imageUrls: [],
          status: ProductStatus.PUBLISHED,
          harvestDate: new Date('2026-03-05'),
          aiConfidenceScore: 0.92,
        },
      }),
      prisma.product.create({
        data: {
          adminId,
          plotId: plotIds[2],
          name: 'Xà lách tươi B',
          slug: 'xa-lach-tuoi-b',
          sku: 'SKU-XL-001',
          description: 'Xà lách tươi loại B, giòn ngon',
          cropType: 'Xà lách',
          grade: QualityGrade.B,
          pricePerKg: 7000,
          stockKg: 200,
          minOrderKg: 1,
          qrCode: 'QR-P003',
          imageUrls: [],
          status: ProductStatus.DRAFT,
          harvestDate: null,
        },
      }),
    ]);
    console.log(`[SEED] 3 Products created`);
  } else {
    console.log(`[SEED] Products already exist — skipping`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 13. PRODUCT CATEGORY — thêm 3 record (liên kết Product với Category)
  // ─────────────────────────────────────────────────────────────────────────
  const existingPCCount = await prisma.productCategory.count();

  const products = await prisma.product.findMany({ where: { adminId } });
  const categories = await prisma.category.findMany();

  if (existingPCCount === 0 && products.length > 0 && categories.length > 0) {
    await Promise.all([
      prisma.productCategory.create({
        data: {
          productId: products[0].id,
          categoryId: categories[0].id,
        },
      }),
      prisma.productCategory.create({
        data: {
          productId: products[1].id,
          categoryId: categories[0].id,
        },
      }),
      prisma.productCategory.create({
        data: {
          productId: products[2].id,
          categoryId: categories[0].id,
        },
      }),
    ]);
    console.log(`[SEED] 3 ProductCategories created`);
  } else {
    console.log(`[SEED] ProductCategories already exist — skipping`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 14. ORDER — thêm 3 record
  // ─────────────────────────────────────────────────────────────────────────
  const existingOrderCount = await prisma.order.count();

  const clients = await prisma.clientProfile.findMany({
    where: { adminId },
  });
  const clientId = clients[0]?.id ?? '';

  if (existingOrderCount === 0 && products.length > 0 && clientId) {
    await Promise.all([
      prisma.order.create({
        data: {
          clientId,
          adminId,
          orderNo: 'ORD-2026-001',
          orderCode: 'ĐH-20260409-001',
          subtotal: 80000,
          shippingFee: 15000,
          discount: 0,
          total: 95000,
          paymentMethod: PaymentMethod.COD,
          paymentStatus: PaymentStatus.PAID,
          fulfillStatus: FulfillStatus.DELIVERED,
          shippingAddr: { fullName: 'Khách Hàng', phone: '0987654321', addressLine: '123 Nguyễn Trãi', district: 'Thanh Xuân', province: 'Hà Nội' },
          shippingAddrText: '123 Nguyễn Trãi, Thanh Xuân, Hà Nội',
          trackingCode: 'TRACK001',
          paidAt: new Date(),
        },
      }),
      prisma.order.create({
        data: {
          clientId,
          adminId,
          orderNo: 'ORD-2026-002',
          orderCode: 'ĐH-20260409-002',
          subtotal: 150000,
          shippingFee: 20000,
          discount: 10000,
          total: 160000,
          paymentMethod: PaymentMethod.VNPAY,
          paymentStatus: PaymentStatus.PENDING,
          fulfillStatus: FulfillStatus.PACKING,
          shippingAddr: { fullName: 'Khách Hàng', phone: '0987654321', addressLine: '456 Láng Hạ', district: 'Đống Đa', province: 'Hà Nội' },
          shippingAddrText: '456 Láng Hạ, Đống Đa, Hà Nội',
        },
      }),
      prisma.order.create({
        data: {
          clientId,
          adminId,
          orderNo: 'ORD-2026-003',
          orderCode: 'ĐH-20260409-003',
          subtotal: 50000,
          shippingFee: 10000,
          discount: 0,
          total: 60000,
          paymentMethod: PaymentMethod.MOMO,
          paymentStatus: PaymentStatus.PENDING,
          fulfillStatus: FulfillStatus.PENDING,
          shippingAddr: { fullName: 'Khách Hàng', phone: '0987654321', addressLine: '789 Kim Mã', district: 'Ba Đình', province: 'Hà Nội' },
          shippingAddrText: '789 Kim Mã, Ba Đình, Hà Nội',
        },
      }),
    ]);
    console.log(`[SEED] 3 Orders created`);
  } else {
    console.log(`[SEED] Orders already exist — skipping`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 15. ORDER ITEM — thêm 3 record
  // ─────────────────────────────────────────────────────────────────────────
  const existingOrderItemCount = await prisma.orderItem.count();

  const orders = await prisma.order.findMany({ where: { adminId } });

  if (existingOrderItemCount === 0 && orders.length > 0 && products.length > 0) {
    await Promise.all([
      prisma.orderItem.create({
        data: {
          orderId: orders[0].id,
          productId: products[0].id,
          nameSnapshot: 'Rau muống tươi A',
          priceSnapshot: 8000,
          quantityKg: 10,
          subtotal: 80000,
        },
      }),
      prisma.orderItem.create({
        data: {
          orderId: orders[1].id,
          productId: products[1].id,
          nameSnapshot: 'Cải xanh tươi A',
          priceSnapshot: 10000,
          quantityKg: 15,
          subtotal: 150000,
        },
      }),
      prisma.orderItem.create({
        data: {
          orderId: orders[2].id,
          productId: products[2].id,
          nameSnapshot: 'Xà lách tươi B',
          priceSnapshot: 7000,
          quantityKg: 7,
          subtotal: 49000,
        },
      }),
    ]);
    console.log(`[SEED] 3 OrderItems created`);
  } else {
    console.log(`[SEED] OrderItems already exist — skipping`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 16. REVIEW — thêm 3 record
  // ─────────────────────────────────────────────────────────────────────────
  const existingReviewCount = await prisma.review.count();

  if (existingReviewCount === 0 && products.length > 0 && clientId) {
    await Promise.all([
      prisma.review.create({
        data: {
          productId: products[0].id,
          clientId,
          rating: 5,
          comment: 'Rau muống rất tươi, giao hàng nhanh, sẽ ủng hộ lần sau!',
          imageUrls: [],
          verifiedPurchase: true,
          status: ReviewStatus.APPROVED,
        },
      }),
      prisma.review.create({
        data: {
          productId: products[1].id,
          clientId,
          rating: 4,
          comment: 'Cải xanh ngon, đóng gói cẩn thận. Giao hàng đúng hẹn.',
          imageUrls: [],
          verifiedPurchase: true,
          status: ReviewStatus.APPROVED,
        },
      }),
      prisma.review.create({
        data: {
          productId: products[2].id,
          clientId,
          rating: 3,
          comment: 'Sản phẩm tạm được, hy vọng lần sau tốt hơn.',
          imageUrls: [],
          verifiedPurchase: false,
          status: ReviewStatus.PENDING,
        },
      }),
    ]);
    console.log(`[SEED] 3 Reviews created`);
  } else {
    console.log(`[SEED] Reviews already exist — skipping`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 17. WAREHOUSE — thêm 2 record
  // ─────────────────────────────────────────────────────────────────────────
  const existingWHCount = await prisma.warehouse.count({ where: { adminId } });
  let warehouseIds: string[] = [];

  if (existingWHCount === 0 && inventoryProfileId) {
    const warehouses = await Promise.all([
      prisma.warehouse.create({
        data: {
          name: 'Kho Tổng Miền Bắc',
          locationAddress: 'Cảng Hà Nội, Hai Bà Trưng, Hà Nội',
          adminId,
          managedBy: inventoryProfileId,
          isActive: true,
        },
      }),
      prisma.warehouse.create({
        data: {
          name: 'Kho Phân Phối Hà Nội 1',
          locationAddress: 'KCN Từ Liêm, Hà Nội',
          adminId,
          managedBy: inventoryProfileId,
          isActive: true,
        },
      }),
    ]);
    warehouseIds = warehouses.map((w) => w.id);
    console.log(`[SEED] 2 Warehouses created (Managed by INV-000001)`);
  } else {
    warehouseIds = (await prisma.warehouse.findMany({ where: { adminId } })).map((w) => w.id);
    console.log(`[SEED] Warehouses already exist — skipping`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 18. INVENTORY LOT & TRANSACTION — thêm 3 record
  // ─────────────────────────────────────────────────────────────────────────
  const existingLotCount = await prisma.inventoryLot.count();
  const productsList = await prisma.product.findMany({ where: { adminId } });
  const contractsList = await prisma.contract.findMany({ where: { adminId } });

  if (existingLotCount === 0 && warehouseIds.length > 0 && productsList.length > 0) {
    await prisma.$transaction(async (tx) => {
      // Lot 1
      const lot1 = await tx.inventoryLot.create({
        data: {
          warehouseId: warehouseIds[0],
          productId: productsList[0].id,
          contractId: contractsList[0]?.id,
          quantityKg: 1000,
          qualityGrade: QualityGrade.A,
          harvestDate: new Date('2026-03-20'),
        },
      });

      await tx.warehouseTransaction.create({
        data: {
          warehouseId: warehouseIds[0],
          productId: productsList[0].id,
          inventoryLotId: lot1.id,
          type: 'inbound',
          quantityKg: 1000,
          note: 'Nhập kho từ hợp đồng HD-2026-001',
          createdBy: inventoryProfileId,
        },
      });

      // Lot 2
      const lot2 = await tx.inventoryLot.create({
        data: {
          warehouseId: warehouseIds[1],
          productId: productsList[1].id,
          contractId: contractsList[1]?.id,
          quantityKg: 500,
          qualityGrade: QualityGrade.A,
          harvestDate: new Date('2026-03-25'),
        },
      });

      await tx.warehouseTransaction.create({
        data: {
          warehouseId: warehouseIds[1],
          productId: productsList[1].id,
          inventoryLotId: lot2.id,
          type: 'inbound',
          quantityKg: 500,
          note: 'Nhập kho cải xanh',
          createdBy: inventoryProfileId,
        },
      });
    });
    console.log(`[SEED] 2 InventoryLots & Transactions created`);
  } else {
    console.log(`[SEED] Inventory entries already exist — skipping`);
  }

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
