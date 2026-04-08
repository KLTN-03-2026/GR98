import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Instagram, Youtube } from 'lucide-react';

// Vite resolve @/assets
import logoSrc from '@/assets/Logo Agri-Intergration.png';

const FOOTER_LINKS = {
  products: {
    title: 'Sản Phẩm',
    links: [
      { label: 'Sầu Riêng Tươi', href: '/categories/sau-rieng-tuoi' },
      { label: 'Sầu Riêng Đông Lạnh', href: '/categories/sau-rieng-dong-lanh' },
      { label: 'Cà Phê Hạt', href: '/categories/ca-phe-hat' },
      { label: 'Cà Phê Bột', href: '/categories/ca-phe-bot' },
      { label: 'Cà Phê Đặc Sản', href: '/categories/ca-phe-dac-san' },
      { label: 'Combo Quà Tặng', href: '/categories/combo-qua-tang' },
    ],
  },
  support: {
    title: 'Hỗ Trợ',
    links: [
      { label: 'Chính Sách Giao Hàng', href: '/shipping' },
      { label: 'Chính Sách Đổi Trả', href: '/return' },
      { label: 'Hướng Dẫn Mua Hàng', href: '/guide' },
      { label: 'Câu Hỏi Thường Gặp', href: '/faq' },
      { label: 'Theo Dõi Đơn Hàng', href: '/orders' },
    ],
  },
  about: {
    title: 'Về Chúng Tôi',
    links: [
      { label: 'Giới Thiệu', href: '/about' },
      { label: 'Câu Chuyện Nguồn Gốc', href: '/story' },
      { label: 'Quy Trình Sản Xuất', href: '/process' },
      { label: 'Liên Hệ', href: '/contact' },
      { label: 'Tuyển Dụng', href: '/careers' },
    ],
  },
};

export default function ClientFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-background">
      {/* Main Footer */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-8">
            <img
              src={logoSrc}
              alt="Vietnam Farmer"
              className="h-35 w-auto object-contain"
            />

            <p className="text-sm text-foreground/70 leading-relaxed max-w-sm">
              Nền tảng thương mại điện tử chuyên cung cấp sầu riêng và cà phê Việt Nam chất lượng cao, nguồn gốc rõ ràng từ Tây Nguyên. Cam kết 100% sản phẩm tự nhiên.
            </p>

            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground/70">
                  123 Đường ABC, P.5, Q.3, TP. Hồ Chí Minh
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <a href="tel:0901234567" className="text-sm text-foreground/70 hover:text-primary transition-colors duration-200">
                  0901 234 567
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <a href="mailto:contact@farmers.vn" className="text-sm text-foreground/70 hover:text-primary transition-colors duration-200">
                  contact@farmers.vn
                </a>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-lg bg-muted/60 flex items-center justify-center hover:bg-primary/90 hover:text-white transition-colors duration-200"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-lg bg-muted/60 flex items-center justify-center hover:bg-primary/90 hover:text-white transition-colors duration-200"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-lg bg-muted/60 flex items-center justify-center hover:bg-primary/90 hover:text-white transition-colors duration-200"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Link Sections */}
          {Object.values(FOOTER_LINKS).map((section) => (
            <div key={section.title} className="space-y-5">
              <h3 className="font-semibold text-foreground text-sm">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-foreground/70 hover:text-primary transition-colors duration-200 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mt-16 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <p className="text-xs text-foreground/50">
              © {currentYear} Vietnam Farmer. Tất cả quyền được bảo lưu.
            </p>
            <div className="flex items-center gap-8">
              <Link to="/privacy" className="text-xs text-foreground/50 hover:text-primary transition-colors duration-200">
                Chính Sách Bảo Mật
              </Link>
              <Link to="/terms" className="text-xs text-foreground/50 hover:text-primary transition-colors duration-200">
                Điều Khoản Sử Dụng
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
