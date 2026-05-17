import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  CreateProductFromLotDto,
  CreateProductFromContractDto,
} from './dto/create-product.dto';
import { Role, InventoryLotStatus, ProductStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

  // ─── helpers ────────────────────────────────────────────────────────────────

  private toSlug(text: string): string {
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

  private async generateSku(cropType: string): Promise<string> {
    const normalized = this.toSlug(cropType).toUpperCase().replace(/-/g, '');
    const prefix = normalized.slice(0, 3);
    const date = new Date().getFullYear();
    const count = await this.prisma.product.count();
    return `PROD-${prefix}-${date}-${(count + 1).toString().padStart(4, '0')}`;
  }

  private async resolveAdminId(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    if (user.role === Role.ADMIN) {
      const profile = await this.prisma.adminProfile.findUnique({
        where: { userId },
      });
      if (!profile) throw new ForbiddenException('Không tìm thấy hồ sơ Admin');
      return profile.id;
    }

    if (user.role === Role.INVENTORY) {
      const profile = await this.prisma.inventoryProfile.findUnique({
        where: { userId },
      });
      if (!profile)
        throw new ForbiddenException('Không tìm thấy hồ sơ Nhân viên kho');
      return profile.adminId;
    }

    throw new ForbiddenException('Không có quyền truy cập sản phẩm');
  }

  private async calculateDynamicStock(productId: string) {
    const now = new Date();
    const [actual, upcoming] = await Promise.all([
      // Chỉ tính các lô đã thực nhập (RECEIVED)
      this.prisma.inventoryLot.aggregate({
        where: { 
          productId, 
          status: InventoryLotStatus.RECEIVED 
        },
        _sum: { quantityKg: true }
      }),
      // Tính các lô đang chờ xác nhận hoặc dự kiến về
      this.prisma.inventoryLot.aggregate({
        where: { 
          productId, 
          status: { in: [InventoryLotStatus.ARRIVED, InventoryLotStatus.SCHEDULED] }
        },
        _sum: { quantityKg: true }
      })
    ]);
    return {
      actualStockKg: actual._sum.quantityKg || 0,
      upcomingStockKg: upcoming._sum.quantityKg || 0
    };
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  async findAll(query: ProductQueryDto, userId?: string) {
    const adminId = userId ? await this.resolveAdminId(userId) : null;
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '15', 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    // Nếu là public query -> chỉ lấy PUBLISHED
    if (!adminId) {
      where.status = ProductStatus.PUBLISHED;
    } else {
      where.adminId = adminId;
      if (query.status) where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.cropType) where.cropType = query.cropType;
    if (query.variety) where.variety = { contains: query.variety, mode: 'insensitive' };
    if (query.grade) where.grade = query.grade;
    if (query.categoryId) {
      where.categories = {
        some: { categoryId: query.categoryId },
      };
    }

    // Lọc theo giá
    if (query.minPrice || query.maxPrice) {
      where.pricePerKg = {};
      if (query.minPrice) where.pricePerKg.gte = parseFloat(query.minPrice);
      if (query.maxPrice) where.pricePerKg.lte = parseFloat(query.maxPrice);
    }

    // Sắp xếp
    let orderBy: any = { createdAt: 'desc' };
    if (query.sortBy) {
      switch (query.sortBy) {
        case 'price_asc':
          orderBy = { pricePerKg: 'asc' };
          break;
        case 'price_desc':
          orderBy = { pricePerKg: 'desc' };
          break;
        case 'name':
          orderBy = { name: 'asc' };
          break;
        case 'rating':
          orderBy = { averageRating: 'desc' };
          break;
        case 'newest':
        default:
          orderBy = { createdAt: 'desc' };
          break;
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          categories: {
            include: { category: true },
          },
          _count: {
            select: { orderItems: true },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: await Promise.all(items.map(async (item) => {
        const dynamicStock = await this.calculateDynamicStock(item.id);
        return {
          ...item,
          ...dynamicStock,
          categories: item.categories.map((pc) => pc.category),
          orderCount: item._count.orderItems,
          _count: undefined,
        };
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string) {
    const adminId = await this.resolveAdminId(userId);
    const item = await this.prisma.product.findFirst({
      where: { id, adminId },
      include: {
        categories: {
          include: { category: true },
        },
        contract: {
          include: { farmer: true },
        },
        plot: true,
        inventoryLots: {
          include: {
            contract: { select: { plotId: true } },
          },
        },
      },
    });

    if (!item) throw new NotFoundException('Sản phẩm không tồn tại');

    const dynamicStock = await this.calculateDynamicStock(item.id);

    // Đếm số nông trại (plot) thực sự đóng góp vào sản phẩm này — bao gồm cả
    // plot gốc + các plot khác đến từ inventoryLots của các hợp đồng liên kết.
    const contributingPlotIds = new Set<string>();
    if (item.plotId) contributingPlotIds.add(item.plotId);
    for (const lot of item.inventoryLots) {
      const lotPlotId = lot.contract?.plotId;
      if (lotPlotId) contributingPlotIds.add(lotPlotId);
    }
    const contributingFarmCount = contributingPlotIds.size;

    return {
      ...item,
      ...dynamicStock,
      categories: item.categories.map((pc) => pc.category),
      contributingFarmCount,
    };
  }

  async findBySlug(slug: string) {
    const item = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        categories: {
          include: { category: true },
        },
      },
    });

    if (!item) throw new NotFoundException('Sản phẩm không tồn tại');

    return {
      ...item,
      categories: item.categories.map((pc) => pc.category),
    };
  }

  async findTraceability(slug: string) {
    // ── Query 1: product + primary contract info + lots (với contract/plot metadata) + reviews
    const product = await this.prisma.product.findUnique({
      where: { slug, status: ProductStatus.PUBLISHED },
      include: {
        categories: { include: { category: true } },
        contract: {
          include: {
            farmer: true,
            supervisor: { include: { user: { select: { fullName: true, avatar: true } } } },
          },
        },
        // Lấy TẤT CẢ inventory lots của product (bao gồm lots từ các hợp đồng gộp chung)
        inventoryLots: {
          include: {
            warehouse: true,
            transactions: { orderBy: { createdAt: 'asc' } },
            // Lấy contract + farmer của từng lot để gắn tag nguồn trên timeline
            contract: {
              select: {
                id: true,
                contractNo: true,
                plotId: true,
                farmer: { select: { fullName: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        reviews: {
          where: { status: 'APPROVED' },
          include: {
            client: { include: { user: { select: { fullName: true, avatar: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');

    // ── Query 2: thu thập tất cả plotIds đóng góp vào product này
    const contributingPlotIds = [
      ...new Set([
        ...(product.plotId ? [product.plotId] : []),
        ...product.inventoryLots
          .map((l) => l.contract?.plotId)
          .filter((id): id is string => Boolean(id)),
      ]),
    ];

    // ── Query 3: fetch tất cả plots đóng góp với đầy đủ dữ liệu canh tác
    const contributingPlots = contributingPlotIds.length > 0
      ? await this.prisma.plot.findMany({
          where: { id: { in: contributingPlotIds } },
          include: {
            farmer: true,
            zone: true,
            dailyReports: {
              include: { supervisor: { include: { user: { select: { fullName: true, avatar: true } } } } },
              orderBy: { reportedAt: 'asc' },
            },
            plantScanRecords: {
              include: { supervisor: { include: { user: { select: { fullName: true, avatar: true } } } } },
              orderBy: { scannedAt: 'asc' },
            },
          },
        })
      : [];

    // Map plotId → { contractNo, farmerName } từ lots để dùng cho source tag
    const plotToLotMeta = new Map<string, { contractNo: string; farmerName: string | null }>();
    for (const lot of product.inventoryLots) {
      if (lot.contract?.plotId && !plotToLotMeta.has(lot.contract.plotId)) {
        plotToLotMeta.set(lot.contract.plotId, {
          contractNo: lot.contract.contractNo ?? '',
          farmerName: lot.contract.farmer?.fullName ?? null,
        });
      }
    }

    // ── Build unified timeline (Hướng A: gộp tất cả plots, kèm source tag)
    const timeline: any[] = [];

    for (const plot of contributingPlots) {
      const lotMeta = plotToLotMeta.get(plot.id);
      // Source tag gắn vào từng event để FE phân biệt nguồn gốc
      const source = {
        plotCode: plot.plotCode,
        farmerName: plot.farmer?.fullName ?? lotMeta?.farmerName ?? null,
        contractNo: lotMeta?.contractNo ?? null,
      };

      if (plot.plantingDate) {
        timeline.push({
          date: plot.plantingDate,
          type: 'planting',
          title: 'Gieo trồng',
          description: `Gieo trồng ${product.cropType} trên lô ${plot.plotCode}`,
          source,
        });
      }

      if (plot.expectedHarvest) {
        timeline.push({
          date: plot.expectedHarvest,
          type: 'expected_harvest',
          title: 'Dự kiến thu hoạch',
          description: `Lô ${plot.plotCode} dự kiến thu hoạch vào ${plot.expectedHarvest.toISOString().split('T')[0]}`,
          source,
        });
      }

      for (const report of plot.dailyReports) {
        timeline.push({
          date: report.reportedAt,
          type: report.type === 'ROUTINE' ? 'report' : report.type === 'INCIDENT' ? 'incident' : 'harvest',
          title: report.type === 'ROUTINE' ? 'Báo cáo định kỳ' : report.type === 'INCIDENT' ? 'Sự cố' : 'Báo cáo thu hoạch',
          description: report.content,
          imageUrls: report.imageUrls,
          meta: {
            yieldEstimateKg: report.yieldEstimateKg,
            supervisorName: report.supervisor?.user?.fullName,
          },
          source,
        });
      }

      for (const scan of plot.plantScanRecords) {
        timeline.push({
          date: scan.scannedAt,
          type: 'scan',
          title: `Phát hiện: ${scan.diseaseVi}`,
          description: scan.symptoms,
          meta: {
            dangerLevel: scan.dangerLevel,
            confidence: scan.confidence,
            treatment: scan.treatment,
            supervisorName: scan.supervisor?.user?.fullName,
          },
          source,
        });
      }
    }

    // Warehouse events — mỗi lot kèm source tag riêng
    for (const lot of product.inventoryLots) {
      const plotCode = lot.contract?.plotId
        ? contributingPlots.find((p) => p.id === lot.contract?.plotId)?.plotCode ?? null
        : null;
      const lotSource = lot.contract
        ? {
            plotCode,
            farmerName: lot.contract.farmer?.fullName ?? null,
            contractNo: lot.contract.contractNo ?? null,
          }
        : null;

      timeline.push({
        date: lot.harvestDate ?? lot.createdAt,
        type: 'warehouse',
        title: 'Nhập kho',
        description: `Nhập ${lot.quantityKg}kg vào kho ${lot.warehouse?.name}`,
        meta: {
          quantityKg: lot.quantityKg,
          qualityGrade: lot.qualityGrade,
          warehouseName: lot.warehouse?.name,
        },
        source: lotSource,
      });

      for (const tx of lot.transactions ?? []) {
        timeline.push({
          date: tx.createdAt,
          type: 'transaction',
          title: tx.type === 'INBOUND' ? 'Nhập kho' : tx.type === 'OUTBOUND' ? 'Xuất kho' : 'Điều chỉnh',
          description: tx.note || `${tx.action} ${tx.quantityKg}kg`,
          meta: { quantityKg: tx.quantityKg, action: tx.action },
        });
      }
    }

    if (product.harvestDate) {
      timeline.push({
        date: product.harvestDate,
        type: 'harvest',
        title: 'Thu hoạch sản phẩm',
        description: `Thu hoạch ${product.name}`,
      });
    }

    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // ── Stats: tổng hợp từ TẤT CẢ plots đóng góp
    const allReports = contributingPlots.flatMap((p) => p.dailyReports);
    const allScans = contributingPlots.flatMap((p) => p.plantScanRecords);
    const lots = product.inventoryLots;

    const reportTypeCounts: Record<string, number> = {};
    for (const r of allReports) {
      reportTypeCounts[r.type] = (reportTypeCounts[r.type] || 0) + 1;
    }

    const scanCategoryCounts: Record<string, number> = {};
    for (const s of allScans) {
      scanCategoryCounts[s.category] = (scanCategoryCounts[s.category] || 0) + 1;
    }

    const yieldHistory = allReports
      .filter((r) => r.yieldEstimateKg != null)
      .map((r) => ({ date: r.reportedAt, value: r.yieldEstimateKg! }));

    const totalYieldEstimate = yieldHistory.reduce((sum, y) => sum + y.value, 0);
    const avgYieldEstimate = yieldHistory.length > 0 ? totalYieldEstimate / yieldHistory.length : 0;

    // Primary plot cho backward compat (Farm tab single-plot view)
    const primaryPlot =
      contributingPlots.find((p) => p.id === product.plotId) ?? contributingPlots[0] ?? null;

    return {
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        description: product.description,
        cropType: product.cropType,
        variety: product.variety,
        grade: product.grade,
        pricePerKg: product.pricePerKg,
        unit: product.unit,
        imageUrls: product.imageUrls,
        thumbnailUrl: product.thumbnailUrl,
        harvestDate: product.harvestDate,
        qrCode: product.qrCode,
        categories: product.categories.map((pc) => pc.category),
        averageRating: product.reviews?.length
          ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
          : 0,
        reviewCount: product.reviews?.length ?? 0,
      },
      // Primary plot — cho Farm tab (giữ backward compat)
      plot: primaryPlot
        ? {
            id: primaryPlot.id,
            plotCode: primaryPlot.plotCode,
            cropType: primaryPlot.cropType,
            areaHa: primaryPlot.areaHa,
            plantingDate: primaryPlot.plantingDate,
            expectedHarvest: primaryPlot.expectedHarvest,
            estimatedYieldKg: primaryPlot.estimatedYieldKg,
            farmer: primaryPlot.farmer
              ? { fullName: primaryPlot.farmer.fullName, province: primaryPlot.farmer.province }
              : null,
            zone: primaryPlot.zone
              ? { name: primaryPlot.zone.name, province: primaryPlot.zone.province, district: primaryPlot.zone.district }
              : null,
          }
        : null,
      // TẤT CẢ plots đóng góp — cho multi-farm display
      contributingPlots: contributingPlots.map((p) => ({
        id: p.id,
        plotCode: p.plotCode,
        areaHa: p.areaHa,
        plantingDate: p.plantingDate,
        farmer: p.farmer
          ? { fullName: p.farmer.fullName, province: p.farmer.province }
          : null,
        zone: p.zone
          ? { name: p.zone.name, province: p.zone.province, district: p.zone.district }
          : null,
      })),
      contract: product.contract
        ? {
            id: product.contract.id,
            contractNo: product.contract.contractNo,
            cropType: product.contract.cropType,
            variety: product.contract.variety,
            grade: product.contract.grade,
            signedAt: product.contract.signedAt,
            harvestDue: product.contract.harvestDue,
            traceabilityQr: product.contract.traceabilityQr,
            farmer: product.contract.farmer
              ? { fullName: product.contract.farmer.fullName }
              : null,
            supervisor: product.contract.supervisor
              ? { fullName: product.contract.supervisor.user?.fullName }
              : null,
          }
        : null,
      timeline,
      inventoryLots: lots.map((lot) => ({
        id: lot.id,
        quantityKg: lot.quantityKg,
        harvestDate: lot.harvestDate,
        expiryDate: lot.expiryDate,
        qualityGrade: lot.qualityGrade,
        warehouseName: lot.warehouse?.name,
      })),
      reviews: product.reviews?.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        imageUrls: r.imageUrls,
        clientName: r.client?.user?.fullName,
        clientAvatar: r.client?.user?.avatar,
        createdAt: r.createdAt,
      })),
      stats: {
        totalReports: allReports.length,
        totalIncidents: allReports.filter((r) => r.type === 'INCIDENT').length,
        totalHarvestReports: allReports.filter((r) => r.type === 'HARVEST').length,
        totalScans: allScans.length,
        avgYieldEstimate,
        yieldHistory,
        reportTypeCounts,
        scanCategoryCounts,
        totalInventoryKg: lots.reduce((sum, l) => sum + l.quantityKg, 0),
        contributingFarmCount: contributingPlots.length,
      },
    };
  }

  async findFeatured(limit: number) {
    const items = await this.prisma.product.findMany({
      where: { status: ProductStatus.PUBLISHED },
      take: limit,
      orderBy: { createdAt: 'desc' }, // Or averageRating if implemented
      include: {
        categories: {
          include: { category: true },
        },
      },
    });

    return Promise.all(items.map(async (item) => {
      const dynamicStock = await this.calculateDynamicStock(item.id);
      return {
        ...item,
        ...dynamicStock,
        categories: item.categories.map((pc) => pc.category),
      };
    }));
  }

  async findByCategory(categorySlug: string, query: { page?: string; limit?: string }) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '15', 10);
    const skip = (page - 1) * limit;

    const where: any = {
      status: ProductStatus.PUBLISHED,
      categories: {
        some: {
          category: { slug: categorySlug },
        },
      },
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          categories: {
            include: { category: true },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: await Promise.all(items.map(async (item) => {
        const dynamicStock = await this.calculateDynamicStock(item.id);
        return {
          ...item,
          ...dynamicStock,
          categories: item.categories.map((pc) => pc.category),
        };
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findRelated(productId: string, limit: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { categories: true },
    });

    if (!product) return [];

    const categoryIds = product.categories.map((c) => c.categoryId);

    const items = await this.prisma.product.findMany({
      where: {
        id: { not: productId },
        status: ProductStatus.PUBLISHED,
        OR: [
          { categories: { some: { categoryId: { in: categoryIds } } } },
          { cropType: product.cropType },
        ],
      },
      take: limit,
      include: {
        categories: {
          include: { category: true },
        },
      },
    });

    return Promise.all(items.map(async (item) => {
      const dynamicStock = await this.calculateDynamicStock(item.id);
      return {
        ...item,
        ...dynamicStock,
        categories: item.categories.map((pc) => pc.category),
      };
    }));
  }

  async create(dto: CreateProductDto, userId: string) {
    const adminId = await this.resolveAdminId(userId);

    const slug = dto.slug || this.toSlug(dto.name);
    const sku = dto.sku || (await this.generateSku(dto.cropType));

    // Kiểm tra trùng lặp
    const existing = await this.prisma.product.findFirst({
      where: { OR: [{ slug }, { sku }] },
    });
    if (existing) throw new ConflictException('Mã SKU hoặc Slug đã tồn tại');

    const { categoryIds, ...rest } = dto;

    return this.prisma.product.create({
      data: {
        ...rest,
        adminId,
        slug,
        sku,
        qrCode: uuidv4(),
        categories: categoryIds
          ? {
            create: categoryIds.map((cid) => ({ categoryId: cid })),
          }
          : undefined,
      },
    });
  }



  async update(id: string, dto: UpdateProductDto, userId: string) {
    const adminId = await this.resolveAdminId(userId);

    // 1. Kiểm tra tồn tại và quyền sở hữu
    const existing = await this.prisma.product.findFirst({
      where: { id, adminId },
      include: { categories: true }
    });
    if (!existing) throw new NotFoundException('Không tìm thấy sản phẩm');

    // 2. Xử lý kiểm tra trùng lặp nếu có thay đổi Slug hoặc SKU
    if (dto.name || dto.slug) {
      const newSlug = dto.slug || (dto.name ? this.toSlug(dto.name) : existing.slug);
      if (newSlug !== existing.slug) {
        const duplicate = await this.prisma.product.findUnique({ where: { slug: newSlug } });
        if (duplicate) throw new ConflictException('Đường dẫn (Slug) này đã tồn tại');
        (dto as any).slug = newSlug;
      }
    }

    if (dto.sku && dto.sku !== existing.sku) {
      const duplicate = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
      if (duplicate) throw new ConflictException('Mã SKU này đã tồn tại');
    }

    // 3. Kiểm tra tồn kho trước khi cho phép đăng bán
    if (dto.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      if (existing.stockKg <= 0) {
        throw new BadRequestException(
          'Sản phẩm chưa có hàng trong kho (tồn kho = 0kg). Vui lòng nhập hàng trước khi đăng bán.',
        );
      }
    }

    // 4. Phân tách dữ liệu: Loại bỏ các trường Traceability khỏi DTO để bảo vệ dữ liệu gốc
    const { categoryIds, ...updateData } = dto;

    // Loại bỏ các trường không được phép sửa (frozen fields)
    const forbiddenFields = ['plotId', 'contractId', 'cropType', 'grade', 'qrCode', 'adminId', 'stockKg'];
    forbiddenFields.forEach(f => delete (updateData as any)[f]);

    // 5. Thực hiện cập nhật trong Transaction
    return this.prisma.$transaction(async (tx) => {
      // Cập nhật quan hệ danh mục nếu có
      if (categoryIds) {
        await tx.productCategory.deleteMany({ where: { productId: id } });
        await tx.productCategory.createMany({
          data: categoryIds.map(cid => ({ productId: id, categoryId: cid }))
        });
      }

      // Cập nhật thông tin sản phẩm
      return tx.product.update({
        where: { id },
        data: updateData,
      });
    });
  }

  async remove(id: string, userId: string) {
    const adminId = await this.resolveAdminId(userId);
    const item = await this.prisma.product.findFirst({
      where: { id, adminId },
      include: { _count: { select: { orderItems: true } } },
    });

    if (!item) throw new NotFoundException('Sản phẩm không tồn tại');

    await this.prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    });
    return { success: true };
  }

  async createFromLot(dto: CreateProductFromLotDto, userId: string) {
    const adminId = await this.resolveAdminId(userId);

    // 1. Truy xuất Lô hàng gốc kèm đầy đủ thông tin nguồn gốc (Plot, Contract)
    const lot = await this.prisma.inventoryLot.findFirst({
      where: { id: dto.inventoryLotId, warehouse: { adminId } },
      include: {
        product: true,
        contract: {
          include: { plot: true }
        }
      },
    });
    if (!lot) throw new NotFoundException('Không tìm thấy lô hàng hoặc lô hàng không thuộc quyền quản lý');

    // 2. Xác định các thông tin kế thừa từ nguồn gốc (Traceability Data)
    const inheritedCropType = lot.contract?.plot?.cropType || lot.product.cropType;
    const inheritedGrade = lot.qualityGrade;
    const inheritedPlotId = lot.contract?.plotId || lot.product.plotId;
    const inheritedContractId = lot.contractId;

    // 3. Tự động sinh mã định danh
    const slug = dto.slug || this.toSlug(dto.name);
    const sku = dto.sku || (await this.generateSku(inheritedCropType));

    // Kiểm tra trùng lặp chi tiết
    const existingSlug = await this.prisma.product.findUnique({ where: { slug } });
    if (existingSlug) throw new ConflictException('Tên niêm yết này đã tồn tại (trùng Slug), vui lòng đổi tên khác');

    const existingSku = await this.prisma.product.findUnique({ where: { sku } });
    if (existingSku) throw new ConflictException('Mã SKU tự động đã tồn tại, vui lòng thử lại hoặc điều chỉnh tên');

    // 4. Tra cứu giá bán lẻ (PriceBoard)
    const priceConfig = await this.prisma.priceBoard.findFirst({
      where: {
        adminId,
        cropType: inheritedCropType,
        grade: inheritedGrade,
        isActive: true,
      },
      orderBy: { effectiveDate: 'desc' },
    });

    // Ưu tiên giá từ PriceBoard, sau đó mới đến giá từ DTO
    const finalPrice = priceConfig ? priceConfig.sellPrice : (dto.pricePerKg || 0);

    // 5. Tạo Sản phẩm thương mại mới với liên kết nguồn gốc
    const { categoryIds, inventoryLotId, pricePerKg, ...rest } = dto;
    const inheritedVariety = dto.variety || (lot.contract as any)?.variety || undefined;

    return this.prisma.product.create({
      data: {
        ...rest,
        adminId,
        slug,
        sku,
        name: dto.name,
        description: dto.description,
        pricePerKg: finalPrice,
        cropType: inheritedCropType,
        variety: inheritedVariety,
        grade: inheritedGrade,
        plotId: inheritedPlotId,
        contractId: inheritedContractId,
        qrCode: uuidv4(),
        status: ProductStatus.PUBLISHED, // Niêm yết ngay
        categories: categoryIds
          ? {
            create: categoryIds.map((cid) => ({ categoryId: cid })),
          }
          : undefined,
      },
    });
  }

  async createFromContract(dto: CreateProductFromContractDto, userId: string) {
    const adminId = await this.resolveAdminId(userId);

    // 1. Truy xuất Hợp đồng và kiểm tra trạng thái SETTLED
    const contract = await this.prisma.contract.findFirst({
      where: { id: dto.contractId, adminId },
      include: { plot: true }
    });

    if (!contract) {
      throw new NotFoundException('Không tìm thấy hợp đồng hoặc hợp đồng không thuộc quyền quản lý');
    }

    if (contract.status !== 'ACTIVE' && contract.status !== 'SETTLED') {
      throw new BadRequestException('Chỉ có thể tạo sản phẩm từ hợp đồng đang hiệu lực (ACTIVE) hoặc đã tất toán (SETTLED)');
    }

    // Kiểm tra xem hợp đồng đã có sản phẩm chưa
    const existingProduct = await this.prisma.product.findUnique({
      where: { contractId: dto.contractId }
    });
    if (existingProduct) {
      throw new ConflictException('Hợp đồng này đã được tạo sản phẩm niêm yết');
    }

    // 2. Tra cứu giá bán lẻ từ PriceBoard
    const priceConfig = await this.prisma.priceBoard.findFirst({
      where: {
        adminId,
        cropType: contract.cropType,
        grade: contract.grade,
        isActive: true,
      },
      orderBy: { effectiveDate: 'desc' },
    });

    if (!priceConfig) {
      throw new BadRequestException(
        `Không tìm thấy giá bán niêm yết cho ${contract.cropType} - Loại ${contract.grade}. Vui lòng cập nhật Bảng giá trước.`
      );
    }

    // 3. Tự động sinh mã định danh
    const slug = dto.slug || this.toSlug(dto.name);
    const sku = dto.sku || (await this.generateSku(contract.cropType));

    // 4. Tạo sản phẩm với tồn kho mặc định = 0
    const { categoryIds, ...rest } = dto;

    return this.prisma.product.create({
      data: {
        ...rest,
        adminId,
        slug,
        sku,
        pricePerKg: priceConfig.sellPrice,
        cropType: contract.cropType,
        variety: dto.variety ?? (contract as any).variety ?? undefined,
        grade: contract.grade,
        plotId: contract.plotId,
        contractId: contract.id,
        harvestDate: contract.harvestDue,
        stockKg: 0, // Mặc định bằng 0 như yêu cầu
        qrCode: uuidv4(),
        status: ProductStatus.PUBLISHED,
        categories: categoryIds
          ? {
            create: categoryIds.map((cid) => ({ categoryId: cid })),
          }
          : undefined,
      },
    });
  }
}
