import type { Category, Order, Product, Review } from '@/client/types';

// ============================================================
// CATEGORIES
// ============================================================
export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Sầu Riêng Tươi',
    slug: 'sau-rieng-tuoi',
    imageUrl: 'https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=400&q=80',
    sortOrder: 1,
    productCount: 8,
  },
  {
    id: 'cat-2',
    name: 'Sầu Riêng Đông Lạnh',
    slug: 'sau-rieng-dong-lanh',
    imageUrl: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=400&q=80',
    sortOrder: 2,
    productCount: 4,
  },
  {
    id: 'cat-3',
    name: 'Cà Phê Hạt',
    slug: 'ca-phe-hat',
    imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&q=80',
    sortOrder: 3,
    productCount: 6,
  },
  {
    id: 'cat-4',
    name: 'Cà Phê Bột',
    slug: 'ca-phe-bot',
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&q=80',
    sortOrder: 4,
    productCount: 4,
  },
  {
    id: 'cat-5',
    name: 'Cà Phê Đặc Sản',
    slug: 'ca-phe-dac-san',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80',
    sortOrder: 5,
    productCount: 4,
  },
  {
    id: 'cat-6',
    name: 'Combo Quà Tặng',
    slug: 'combo-qua-tang',
    imageUrl: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=400&q=80',
    sortOrder: 6,
    productCount: 3,
  },
];

// ============================================================
// PRODUCTS
// ============================================================
export const MOCK_PRODUCTS: Product[] = [
  // === SẦU RIÊNG ===
  {
    id: 'p-001',
    sku: 'SR-RI6-A-001',
    name: 'Sầu Riêng Ri 6 A - Trái Chín Cây',
    slug: 'sau-rieng-ri6-a-trai-chin-cay',
    description:
      'Sầu Riêng Ri 6 hạng A, trồng tại Đắk Lắk, thu hoạch từ vườn đạt chuẩn VietGAP. Trái chín tự nhiên trên cây, không chất bảo quản. Cơm vàng hạt, béo ngậy, hương thơm đặc trưng Tây Nguyên.\n\n**Xuất xứ:** Đắk Lắk\n**Giống:** Ri 6\n**Hạng:** A - ≥2.5kg/trái\n**Cách chọn:** Trái có mùi thơm nhẹ, cầm nặng tay, gõ nhẹ có tiếng kẽo.',
    cropType: 'SAU_RIENG',
    grade: 'A',
    pricePerKg: 89000,
    stockKg: 150,
    minOrderKg: 1,
    qrCode: 'SR-RI6-A-001',
    imageUrls: [
      'https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=800&q=80',
      'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=800&q=80',
      'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=800&q=80',
    ],
    status: 'PUBLISHED',
    harvestDate: '2024-12-15',
    aiConfidenceScore: 0.97,
    createdAt: '2024-12-01T10:00:00Z',
    averageRating: 4.8,
    reviewCount: 124,
  },
  {
    id: 'p-002',
    sku: 'SR-MTG-A-002',
    name: 'Sầu Riêng Monthong A - Nhập Khẩu Thái Lan',
    slug: 'sau-rieng-monthong-a-nhap-khau-thai-lan',
    description:
      'Sầu Riêng Monthong (Crown Princess) hạng A, nhập khẩu chính ngạch từ Thái Lan. Thịt cơm dày màu vàng kem đậm, vị ngọt dịu, ít hơi gas hơn Ri 6. Phù hợp cho người thích vị ngọt nhẹ và béo mượt.\n\n**Xuất xứ:** Thái Lan\n**Giống:** Monthong\n**Hạng:** A\n**Quy cách:** Trái 3-5kg',
    cropType: 'SAU_RIENG',
    grade: 'A',
    pricePerKg: 145000,
    stockKg: 80,
    minOrderKg: 1,
    qrCode: 'SR-MTG-A-002',
    imageUrls: [
      'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=800&q=80',
      'https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=800&q=80',
    ],
    status: 'PUBLISHED',
    harvestDate: '2024-12-10',
    aiConfidenceScore: 0.95,
    createdAt: '2024-12-05T10:00:00Z',
    averageRating: 4.9,
    reviewCount: 89,
  },
  {
    id: 'p-003',
    sku: 'SR-RI6-B-003',
    name: 'Sầu Riêng Ri 6 B - Trái Chín Vườn',
    slug: 'sau-rieng-ri6-b-trai-chin-vuon',
    description:
      'Sầu Riêng Ri 6 hạng B, chất lượng tốt, thích hợp cho gia đình. Trái có trọng lượng 1.8-2.5kg, cơm vàng vừa, hương thơm đặc trưng.\n\n**Xuất xứ:** Đắk Lắk\n**Giống:** Ri 6\n**Hạng:** B',
    cropType: 'SAU_RIENG',
    grade: 'B',
    pricePerKg: 68000,
    stockKg: 200,
    minOrderKg: 1,
    qrCode: 'SR-RI6-B-003',
    imageUrls: [
      'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=800&q=80',
      'https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=800&q=80',
    ],
    status: 'PUBLISHED',
    harvestDate: '2024-12-16',
    aiConfidenceScore: 0.92,
    createdAt: '2024-12-02T10:00:00Z',
    averageRating: 4.5,
    reviewCount: 67,
  },
  {
    id: 'p-004',
    sku: 'SR-FZ-RI6-004',
    name: 'Sầu Riêng Đông Lạnh Ri 6 - Bảo Quản 6 Tháng',
    slug: 'sau-rieng-dong-lanh-ri6-bao-quan-6-thang',
    description:
      'Sầu Riêng Ri 6 đông lạnh IQF, bảo quản tại -18°C, giữ trọn 100% hương vị tươi ngon trong 6 tháng. Phù hợp chế biến kem, sinh tố, bánh. Đóng gói khay 500g tiện lợi.\n\n**Công nghệ:** IQF (Individual Quick Frozen)\n**Đóng gói:** Khay 500g\n**Bảo quản:** -18°C, 6 tháng',
    cropType: 'SAU_RIENG',
    grade: 'A',
    pricePerKg: 120000,
    stockKg: 300,
    minOrderKg: 0.5,
    qrCode: 'SR-FZ-RI6-004',
    imageUrls: [
      'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=800&q=80',
      'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=800&q=80',
    ],
    status: 'PUBLISHED',
    createdAt: '2024-12-03T10:00:00Z',
    averageRating: 4.7,
    reviewCount: 156,
  },
  {
    id: 'p-005',
    sku: 'SR-CS-005',
    name: 'Sầu Riêng Cắt Sẵn Đông Lạnh - Tiện Lợi',
    slug: 'sau-rieng-cat-san-dong-lanh-tien-loi',
    description:
      'Sầu Riêng Ri 6 cắt sẵn từng miếng, đông lạnh đóng gói. Không chất bảo quản, không đường hóa học. Rã đông nhanh trong 15 phút, thích hợp ăn trực tiếp hoặc chế biến.\n\n**Trọng lượng:** 500g/gói\n**Quy cách:** 10-15 miếng/gói\n**Đã rã đông:** Có thể ăn ngay',
    cropType: 'SAU_RIENG',
    grade: 'B',
    pricePerKg: 95000,
    stockKg: 180,
    minOrderKg: 0.5,
    qrCode: 'SR-CS-005',
    imageUrls: [
      'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=800&q=80',
      'https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=800&q=80',
    ],
    status: 'PUBLISHED',
    createdAt: '2024-12-04T10:00:00Z',
    averageRating: 4.6,
    reviewCount: 98,
  },
  {
    id: 'p-006',
    sku: 'SR-MTG-B-006',
    name: 'Sầu Riêng Monthong B - Nhập Khẩu Chính Ngạch',
    slug: 'sau-rieng-monthong-b-nhap-khau-chinh-ngach',
    description:
      'Sầu Riêng Monthong hạng B, nhập khẩu từ Thái Lan. Chất lượng tốt, giá hợp lý hơn hạng A. Thịt màu vàng nhạt, vị ngọt dịu, độ béo vừa phải.\n\n**Xuất xứ:** Thái Lan\n**Hạng:** B',
    cropType: 'SAU_RIENG',
    grade: 'B',
    pricePerKg: 110000,
    stockKg: 120,
    minOrderKg: 1,
    qrCode: 'SR-MTG-B-006',
    imageUrls: [
      'https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=800&q=80',
      'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=800&q=80',
    ],
    status: 'PUBLISHED',
    createdAt: '2024-12-06T10:00:00Z',
    averageRating: 4.4,
    reviewCount: 45,
  },

  // === CÀ PHÊ ===
  {
    id: 'p-007',
    sku: 'CP-ARA-DL-007',
    name: 'Cà Phê Arabica Đắk Lắk - Hạt Rang Mộc',
    slug: 'ca-phe-arabica-dak-lak-hat-rang-moc',
    description:
      'Cà phê Arabica Cầu Đất Đắk Lắk, rang mộc 100%, không tẩm hương nhân tạo. Hạt rang vừa, giữ trọn vị chua thanh, hậu ngọt tự nhiên đặc trưng của vùng Tây Nguyên.\n\n**Vùng:** Đắk Lắk\n**Giống:** Arabica Cầu Đất\n**Rang:** Medium (vừa phải)\n**Xử lý:** Ướt',
    cropType: 'CA_PHE',
    grade: 'A',
    pricePerKg: 180000,
    stockKg: 200,
    minOrderKg: 0.25,
    qrCode: 'CP-ARA-DL-007',
    imageUrls: [
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80',
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80',
    ],
    status: 'PUBLISHED',
    createdAt: '2024-11-20T10:00:00Z',
    averageRating: 4.9,
    reviewCount: 234,
  },
  {
    id: 'p-008',
    sku: 'CP-ROB-BMT-008',
    name: 'Cà Phê Robusta Buôn Ma Thuột - Hạt Rang Mộc',
    slug: 'ca-phe-robusta-buon-ma-thuot-hat-rang-moc',
    description:
      'Cà phê Robusta Buôn Ma Thuột, rang mộc đậm đà. Đây là loại cà phê nổi tiếng nhất Việt Nam với hương vị đắng mạnh, thơm nồng, không chất phụ gia.\n\n**Vùng:** Buôn Ma Thuột, Đắk Lắk\n**Giống:** Robusta\n**Rang:** Dark (đậm)\n**Xử lý:** Ướt',
    cropType: 'CA_PHE',
    grade: 'A',
    pricePerKg: 125000,
    stockKg: 350,
    minOrderKg: 0.25,
    qrCode: 'CP-ROB-BMT-008',
    imageUrls: [
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80',
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80',
    ],
    status: 'PUBLISHED',
    createdAt: '2024-11-21T10:00:00Z',
    averageRating: 4.8,
    reviewCount: 312,
  },
  {
    id: 'p-009',
    sku: 'CP-ARA-DL-PW-009',
    name: 'Cà Phê Arabica Đắk Lắk - Bột Xay Sẵn',
    slug: 'ca-phe-arabica-dak-lak-bot-xay-san',
    description:
      'Cà phê Arabica Đắk Lắk xay sẵn mịn, phù hợp pha máy, pha phin hoặc French Press. Rang mộc 100%, đóng gói hút chân không giữ độ tươi.\n\n**Độ mịn:** Phù hợp nhiều phương pháp pha\n**Đóng gói:** Túi 250g, hút chân không\n**Bảo quản:** Nơi khô ráo, tránh ánh sáng',
    cropType: 'CA_PHE',
    grade: 'A',
    pricePerKg: 200000,
    stockKg: 150,
    minOrderKg: 0.25,
    qrCode: 'CP-ARA-DL-PW-009',
    imageUrls: [
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
    ],
    status: 'PUBLISHED',
    createdAt: '2024-11-22T10:00:00Z',
    averageRating: 4.7,
    reviewCount: 187,
  },
  {
    id: 'p-010',
    sku: 'CP-CD-DS-010',
    name: 'Cà Phê Cầu Đất - Đặc Sản Single Origin',
    slug: 'ca-phe-cau-dat-dac-san-single-origin',
    description:
      'Cà phê đặc sản Cầu Đất, trồng ở độ cao 1.500m. Đây là loại cà phê premium với hương vị tinh tế: chua thanh dịu, hậu ngọt caramel, hương trái cây và một chút chocolate.\n\n**Độ cao:** 1.500m\n**Xử lý:** Ướt (Washed)\n**Điểm cupping:** 84+\n**Suitable for:** Pour over, Chemex, AeroPress',
    cropType: 'CA_PHE',
    grade: 'A',
    pricePerKg: 350000,
    stockKg: 50,
    minOrderKg: 0.25,
    qrCode: 'CP-CD-DS-010',
    imageUrls: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80',
    ],
    status: 'PUBLISHED',
    createdAt: '2024-11-25T10:00:00Z',
    averageRating: 4.95,
    reviewCount: 76,
  },
  {
    id: 'p-011',
    sku: 'CP-MOKA-LD-011',
    name: 'Cà Phê Moka Lâm Đồng - Hạt Rang Vừa',
    slug: 'ca-phe-moka-lam-dong-hat-rang-vua',
    description:
      'Cà phê Moka Lâm Đồng nổi tiếng với hương vị thơm ngát, chua dịu và đắng nhẹ. Được mệnh danh là "vàng đỏ" của Tây Nguyên.\n\n**Vùng:** Lâm Đồng\n**Giống:** Moka\n**Rang:** Medium\n**Xử lý:** Ướt',
    cropType: 'CA_PHE',
    grade: 'B',
    pricePerKg: 160000,
    stockKg: 100,
    minOrderKg: 0.25,
    qrCode: 'CP-MOKA-LD-011',
    imageUrls: [
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80',
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80',
    ],
    status: 'PUBLISHED',
    createdAt: '2024-11-23T10:00:00Z',
    averageRating: 4.6,
    reviewCount: 143,
  },
  {
    id: 'p-012',
    sku: 'CP-ROB-DK-012',
    name: 'Cà Phê Robusta Rang Dark - Đậm Đà',
    slug: 'ca-phe-robusta-buon-ma-thuot-rang-dark',
    description:
      'Cà phê Robusta Buôn Ma Thuột rang đậm (Dark Roast), hạt giãn nở, dầu tự nhiên trên bề mặt. Vị đắng đậm đà, thơm nồng, phù hợp pha máy pha cà phê hoặc phin.\n\n**Rang:** Dark (rất đậm)\n**Phù hợp:** Máy pha, phin\n**Không chất phụ gia:** 100% rang mộc',
    cropType: 'CA_PHE',
    grade: 'B',
    pricePerKg: 135000,
    stockKg: 250,
    minOrderKg: 0.25,
    qrCode: 'CP-ROB-DK-012',
    imageUrls: [
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
    ],
    status: 'PUBLISHED',
    createdAt: '2024-11-24T10:00:00Z',
    averageRating: 4.5,
    reviewCount: 201,
  },

  // === COMBO ===
  {
    id: 'p-013',
    sku: 'COMBO-001',
    name: 'Combo Quà Tặng Cao Cấp - Sầu Riêng + Cà Phê',
    slug: 'combo-qua-tang-cao-cap-sau-rieng-ca-phe',
    description:
      'Bộ quà tặng cao cấp gồm: 1kg Sầu Riêng Ri 6 A đông lạnh + 500g Cà phê Arabica Đắk Lắk hạt rang mộc. Bao bì quà tặng sang trọng, phù hợp biếu bố mẹ, người yêu, đối tác.\n\n**Bao bì:** Hộp quà cao cấp\n**Thẻ chúc:** Đi kèm thẻ chúc viết tay\n**Giao hàng:** Giao tận nơi, đảm bảo chất lượng',
    cropType: 'SAU_RIENG',
    grade: 'A',
    pricePerKg: 0,
    stockKg: 50,
    minOrderKg: 1,
    qrCode: 'COMBO-001',
    imageUrls: [
      'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=800&q=80',
      'https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=800&q=80',
    ],
    status: 'PUBLISHED',
    createdAt: '2024-12-01T10:00:00Z',
    averageRating: 4.9,
    reviewCount: 45,
  },
];

// ============================================================
// REVIEWS
// ============================================================
export const MOCK_REVIEWS: Review[] = [
  {
    id: 'r-001',
    productId: 'p-001',
    clientId: 'u-101',
    clientName: 'Nguyễn Thị Lan',
    clientAvatar: 'https://i.pravatar.cc/150?u=lan',
    rating: 5,
    comment:
      'Sầu riêng ngon nhất từ trước đến giờ tôi ăn! Trái chín cây, cơm vàng ròng, ngọt dịu. Giao hàng nhanh, đóng gói cẩn thận. Sẽ ủng hộ dài dài!',
    imageUrls: [],
    verifiedPurchase: true,
    status: 'APPROVED',
    createdAt: '2024-12-20T14:30:00Z',
  },
  {
    id: 'r-002',
    productId: 'p-001',
    clientId: 'u-102',
    clientName: 'Trần Văn Minh',
    clientAvatar: 'https://i.pravatar.cc/150?u=minh',
    rating: 5,
    comment:
      'Mua làm quà biếu, người nhận rất thích. Sầu riêng tươi, đúng hạng A như mô tả. Cảm ơn shop!',
    imageUrls: [],
    verifiedPurchase: true,
    status: 'APPROVED',
    createdAt: '2024-12-18T09:15:00Z',
  },
  {
    id: 'r-003',
    productId: 'p-001',
    clientId: 'u-103',
    clientName: 'Lê Hoàng Nam',
    clientAvatar: 'https://i.pravatar.cc/150?u=nam',
    rating: 4,
    comment:
      'Sản phẩm chất lượng tốt, giao đúng ngày hẹn. Trái sầu hơi nhỏ hơn so với hình nhưng vẫn rất ngon.',
    imageUrls: [],
    verifiedPurchase: true,
    status: 'APPROVED',
    createdAt: '2024-12-15T16:45:00Z',
  },
  {
    id: 'r-004',
    productId: 'p-007',
    clientId: 'u-104',
    clientName: 'Phạm Thu Hà',
    clientAvatar: 'https://i.pravatar.cc/150?u=ha',
    rating: 5,
    comment:
      'Mình mua cà phê Arabica Đắk Lắk về pha pour over, tuyệt vời! Vị chua thanh, hậu ngọt caramel rõ ràng. Đúng chuẩn cà phê đặc sản. Giá cũng hợp lý.',
    imageUrls: [],
    verifiedPurchase: true,
    status: 'APPROVED',
    createdAt: '2024-12-22T08:00:00Z',
  },
  {
    id: 'r-005',
    productId: 'p-008',
    clientId: 'u-105',
    clientName: 'Đặng Minh Tuấn',
    clientAvatar: 'https://i.pravatar.cc/150?u=tuan',
    rating: 5,
    comment:
      'Robusta Buôn Ma Thuột rang mộc, đắng đậm đúng gu mình. Pha phin uống sáng cực kỳ tỉnh táo. Không thích cà phê nhạt, các bạn nên thử loại này.',
    imageUrls: [],
    verifiedPurchase: true,
    status: 'APPROVED',
    createdAt: '2024-12-21T07:30:00Z',
  },
  {
    id: 'r-006',
    productId: 'p-004',
    clientId: 'u-106',
    clientName: 'Trương Thị Mai',
    clientAvatar: 'https://i.pravatar.cc/150?u=mai',
    rating: 5,
    comment:
      'Đông lạnh mà vẫn thơm ngon như sầu tươi! Làm kem sầu riêng cho cả nhà ăn, ai cũng khen. Đóng gói kỹ, có túi zip nên bảo quản dễ.',
    imageUrls: [],
    verifiedPurchase: true,
    status: 'APPROVED',
    createdAt: '2024-12-19T11:20:00Z',
  },
];

// ============================================================
// MOCK ORDERS
// ============================================================
export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-001',
    orderNo: 'EC-20241201-0001',
    subtotal: 267000,
    shippingFee: 25000,
    discount: 0,
    total: 292000,
    paymentMethod: 'COD',
    paymentStatus: 'PAID',
    fulfillStatus: 'DELIVERED',
    shippingAddr: {
      fullName: 'Nguyễn Văn A',
      phone: '0901234567',
      addressLine: '123 Nguyễn Trãi, P.5, Q.3',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 3',
      ward: 'Phường 5',
    },
    trackingCode: 'GHTK-1234567890',
    orderedAt: '2024-12-01T10:30:00Z',
    paidAt: '2024-12-01T10:30:00Z',
    orderItems: [
      {
        id: 'oi-001',
        productId: 'p-001',
        nameSnapshot: 'Sầu Riêng Ri 6 A - Trái Chín Cây',
        priceSnapshot: 89000,
        quantityKg: 3,
        subtotal: 267000,
        productImage: MOCK_PRODUCTS[0].imageUrls[0],
      },
    ],
  },
  {
    id: 'ord-002',
    orderNo: 'EC-20241210-0002',
    subtotal: 475000,
    shippingFee: 0,
    discount: 0,
    total: 475000,
    paymentMethod: 'VNPAY',
    paymentStatus: 'PAID',
    fulfillStatus: 'SHIPPED',
    shippingAddr: {
      fullName: 'Nguyễn Văn A',
      phone: '0901234567',
      addressLine: '123 Nguyễn Trãi, P.5, Q.3',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 3',
      ward: 'Phường 5',
    },
    trackingCode: 'GHTK-0987654321',
    orderedAt: '2024-12-10T14:20:00Z',
    paidAt: '2024-12-10T14:25:00Z',
    orderItems: [
      {
        id: 'oi-002',
        productId: 'p-007',
        nameSnapshot: 'Cà Phê Arabica Đắk Lắk - Hạt Rang Mộc',
        priceSnapshot: 180000,
        quantityKg: 2,
        subtotal: 360000,
        productImage: MOCK_PRODUCTS[6].imageUrls[0],
      },
      {
        id: 'oi-003',
        productId: 'p-008',
        nameSnapshot: 'Cà Phê Robusta Buôn Ma Thuột - Hạt Rang Mộc',
        priceSnapshot: 115000,
        quantityKg: 1,
        subtotal: 115000,
        productImage: MOCK_PRODUCTS[7].imageUrls[0],
      },
    ],
  },
  {
    id: 'ord-003',
    orderNo: 'EC-20241220-0003',
    subtotal: 360000,
    shippingFee: 30000,
    discount: 30000,
    total: 360000,
    paymentMethod: 'MOMO',
    paymentStatus: 'PENDING',
    fulfillStatus: 'PACKING',
    shippingAddr: {
      fullName: 'Nguyễn Văn A',
      phone: '0901234567',
      addressLine: '456 Lê Lợi, P.3, Q.1',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường 3',
    },
    orderedAt: '2024-12-20T09:00:00Z',
    orderItems: [
      {
        id: 'oi-004',
        productId: 'p-010',
        nameSnapshot: 'Cà Phê Cầu Đất - Đặc Sản Single Origin',
        priceSnapshot: 350000,
        quantityKg: 1,
        subtotal: 350000,
        productImage: MOCK_PRODUCTS[9].imageUrls[0],
      },
      {
        id: 'oi-005',
        productId: 'p-005',
        nameSnapshot: 'Sầu Riêng Cắt Sẵn Đông Lạnh - Tiện Lợi',
        priceSnapshot: 10000,
        quantityKg: 1,
        subtotal: 10000,
        productImage: MOCK_PRODUCTS[4].imageUrls[0],
      },
    ],
  },
];

// ============================================================
// FILTER OPTIONS
// ============================================================
export const CROP_TYPE_OPTIONS = [
  { value: 'SAU_RIENG', label: 'Sầu Riêng' },
  { value: 'CA_PHE', label: 'Cà Phê' },
];

export const GRADE_OPTIONS = [
  { value: 'A', label: 'Hạng A - Cao Cấp' },
  { value: 'B', label: 'Hạng B - Chất Lượng Tốt' },
  { value: 'C', label: 'Hạng C - Tiết Kiệm' },
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá: Thấp → Cao' },
  { value: 'price_desc', label: 'Giá: Cao → Thấp' },
  { value: 'rating', label: 'Đánh giá cao nhất' },
  { value: 'name', label: 'Tên A → Z' },
];

export const PRICE_RANGES = [
  { value: '0-100000', label: 'Dưới 100.000đ' },
  { value: '100000-200000', label: '100.000đ - 200.000đ' },
  { value: '200000-500000', label: '200.000đ - 500.000đ' },
  { value: '500000+', label: 'Trên 500.000đ' },
];

// ============================================================
// HELPERS
// ============================================================
export function getProductsByCategory(categorySlug: string): Product[] {
  const cat = MOCK_CATEGORIES.find((c) => c.slug === categorySlug);
  if (!cat) return [];
  return MOCK_PRODUCTS.filter((p) => p.cropType === 'SAU_RIENG' && categorySlug.includes('sau'))
    .concat(
      MOCK_PRODUCTS.filter(
        (p) => p.cropType === 'CA_PHE' && categorySlug.includes('ca-phe'),
      ),
    );
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return MOCK_PRODUCTS.filter(
    (p) => p.id !== product.id && p.cropType === product.cropType,
  ).slice(0, limit);
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase();
  return MOCK_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.cropType.toLowerCase().includes(q),
  );
}

export function getFeaturedProducts(limit = 8): Product[] {
  return [...MOCK_PRODUCTS]
    .filter((p) => p.status === 'PUBLISHED' && p.stockKg > 0)
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, limit);
}

export function getProductBySlug(slug: string): Product | undefined {
  return MOCK_PRODUCTS.find((p) => p.slug === slug);
}

export function getProductReviews(productId: string): Review[] {
  return MOCK_REVIEWS.filter((r) => r.productId === productId && r.status === 'APPROVED');
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(price);
}
