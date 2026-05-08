import { PrismaClient, PaymentMethod, PaymentStatus, FulfillStatus, ReviewStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seedEcom() {
  console.log('--- Seeding E-commerce Data (Categories, Orders, Reviews) ---');

  const admin = await prisma.adminProfile.findFirst();
  const client = await prisma.clientProfile.findFirst();
  const products = await prisma.product.findMany();

  if (!admin || !client || products.length === 0) {
    console.error('Required data (Admin/Client/Products) not found. Please run seed.ts and seed-reports.ts first.');
    return;
  }

  // 1. Categories
  console.log('Creating Categories...');
  const categoriesData = [
    {
      name: 'Nông sản tươi',
      slug: 'nong-san-tuoi',
      description: 'Sản phẩm nông sản tươi sạch từ trang trại',
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
      sortOrder: 1,
    },
    {
      name: 'Sầu riêng đặc sản',
      slug: 'sau-rieng-dac-san',
      description: 'Các loại sầu riêng chín cây, chất lượng cao',
      imageUrl: 'https://images.unsplash.com/photo-1595424213982-87ca72ff985c?auto=format&fit=crop&q=80&w=800',
      sortOrder: 2,
    },
    {
      name: 'Cà phê nguyên chất',
      slug: 'ca-phe-nguyen-chat',
      description: 'Hạt cà phê Robusta và Arabica tuyển chọn',
      imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800',
      sortOrder: 3,
    },
  ];

  const categories: any = {};
  for (const c of categoriesData) {
    categories[c.slug] = await prisma.category.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
  }

  // 2. Link Products to Categories
  console.log('Linking Products to Categories...');
  for (const product of products) {
    let categorySlug = 'nong-san-tuoi';
    if (product.name.toLowerCase().includes('sầu riêng')) categorySlug = 'sau-rieng-dac-san';
    if (product.name.toLowerCase().includes('cà phê')) categorySlug = 'ca-phe-nguyen-chat';

    const category = categories[categorySlug];
    if (category) {
      await prisma.productCategory.upsert({
        where: {
          productId_categoryId: {
            productId: product.id,
            categoryId: category.id,
          },
        },
        update: {},
        create: {
          productId: product.id,
          categoryId: category.id,
        },
      });
    }
  }

  // 3. Orders
  console.log('Creating Orders...');
  const ordersData = [
    {
      orderNo: `ORD-${Date.now()}-001`,
      orderCode: `CODE${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      subtotal: 150000,
      shippingFee: 30000,
      discount: 0,
      total: 180000,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.PENDING,
      fulfillStatus: FulfillStatus.PENDING,
      shippingAddr: {
        fullName: 'Nguyễn Khách Hàng',
        phone: '0987654321',
        addressLine: 'Số 1 Đại Cồ Việt, Bách Khoa',
        province: 'Hà Nội',
        district: 'Hai Bà Trưng',
      },
      note: 'Giao giờ hành chính',
    },
    {
      orderNo: `ORD-${Date.now()}-002`,
      orderCode: `CODE${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      subtotal: 450000,
      shippingFee: 0,
      discount: 50000,
      total: 400000,
      paymentMethod: PaymentMethod.VNPAY,
      paymentStatus: PaymentStatus.PAID,
      fulfillStatus: FulfillStatus.SHIPPED,
      shippingAddr: {
        fullName: 'Nguyễn Khách Hàng',
        phone: '0987654321',
        addressLine: '45 Lê Duẩn',
        province: 'Đắk Lắk',
        district: 'Buôn Ma Thuột',
      },
      paidAt: new Date(),
    },
  ];

  for (const o of ordersData) {
    const order = await prisma.order.upsert({
      where: { orderNo: o.orderNo },
      update: o as any,
      create: {
        ...o,
        adminId: admin.id,
        clientId: client.id,
      } as any,
    });

    // Create Order Items for each order
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: randomProduct.id,
        nameSnapshot: randomProduct.name,
        priceSnapshot: randomProduct.pricePerKg,
        quantityKg: 2,
        subtotal: randomProduct.pricePerKg * 2,
      },
    });
  }

  // 4. Reviews
  console.log('Creating Reviews...');
  const reviewsData = [
    {
      rating: 5,
      comment: 'Sản phẩm rất tươi ngon, giao hàng nhanh chóng!',
      verifiedPurchase: true,
      status: ReviewStatus.APPROVED,
    },
    {
      rating: 4,
      comment: 'Chất lượng tốt, giá cả hợp lý. Sẽ ủng hộ tiếp.',
      verifiedPurchase: true,
      status: ReviewStatus.APPROVED,
    },
    {
      rating: 5,
      comment: 'Đóng gói cẩn thận, sầu riêng chín đều, rất thơm.',
      verifiedPurchase: true,
      status: ReviewStatus.APPROVED,
    },
  ];

  for (let i = 0; i < reviewsData.length; i++) {
    const product = products[i % products.length];
    await prisma.review.create({
      data: {
        ...reviewsData[i],
        productId: product.id,
        clientId: client.id,
      },
    });
  }

  console.log('--- E-commerce Seed Complete ---');
}

seedEcom()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
