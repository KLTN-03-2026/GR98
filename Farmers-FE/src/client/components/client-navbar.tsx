import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Menu,
  Search,
  X,
  ChevronDown,
  LogOut,
  Settings,
} from 'lucide-react';
import { AppLogo } from '@/components/global/app-logo';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/client/store';
import { useAuthStore } from '@/client/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ModeToggle } from '@/components/custom/mode-toggle';

const CATEGORIES_NAV = [
  {
    label: 'Sầu Riêng',
    href: '/categories/sau-rieng-tuoi',
    children: [
      { label: 'Sầu Riêng Tươi', href: '/categories/sau-rieng-tuoi' },
      { label: 'Sầu Riêng Đông Lạnh', href: '/categories/sau-rieng-dong-lanh' },
    ],
  },
  {
    label: 'Cà Phê',
    href: '/categories/ca-phe-hat',
    children: [
      { label: 'Cà Phê Hạt', href: '/categories/ca-phe-hat' },
      { label: 'Cà Phê Bột', href: '/categories/ca-phe-bot' },
      { label: 'Cà Phê Đặc Sản', href: '/categories/ca-phe-dac-san' },
    ],
  },
  { label: 'Combo Quà', href: '/categories/combo-qua-tang', children: [] },
];

const TOPBAR_LINKS = [
  { label: 'Về Chúng Tôi', href: '/about' },
  { label: 'Liên Hệ', href: '/contact' },
  { label: 'Theo Dõi Đơn Hàng', href: '/orders' },
];

export default function ClientNavbar() {
  const location = useLocation();
  const { getItemCount } = useCartStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  const cartCount = getItemCount();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchValue.trim())}`;
    }
  };

  return (
    <>
      {/* ===== FLOATING NAVBAR ===== */}
      <header
        className={cn(
          'fixed z-50 transition-all duration-500',
          scrolled
            ? 'top-3 left-3 right-3 lg:left-6 lg:right-6'
            : 'top-0 left-0 right-0',
        )}
      >
        <nav
          className={cn(
            'mx-auto transition-all duration-500 overflow-hidden',
            scrolled || mobileMenuOpen
              ? 'bg-background/80 backdrop-blur-xl border border-white/10 shadow-lg max-w-7xl mx-auto rounded-2xl'
              : 'bg-background/70 backdrop-blur-[0px] border-b border-white/5 max-w-full',
          )}
        >
          <div
            className={cn(
              'container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all duration-500',
              scrolled ? 'h-14' : 'h-16 lg:h-[72px]',
            )}
          >
            {/* Logo */}
            <Link to="/" className="flex items-center shrink-0 hover:opacity-80 transition-opacity">
              <AppLogo height={40} />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8 flex-1 ml-12 ">
              <Link
                to="/products"
                className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-300 relative group"
              >
                Tất Cả Sản Phẩm
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-foreground/70 transition-all duration-300 group-hover:w-full" />
              </Link>
              {CATEGORIES_NAV.map((cat) =>
                cat.children.length > 0 ? (
                  <DropdownMenu key={cat.href}>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          'text-sm font-medium transition-colors duration-300 relative group inline-flex items-center gap-1.5',
                          location.pathname.startsWith(cat.href)
                            ? 'text-foreground'
                            : 'text-foreground/70 hover:text-foreground',
                        )}
                      >
                        {cat.label}
                        <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-foreground/70 transition-all duration-300 group-hover:w-full" />
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      {cat.children.map((child) => (
                        <DropdownMenuItem key={child.href} asChild>
                          <Link to={child.href} className="cursor-pointer">
                            {child.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link
                    key={cat.href}
                    to={cat.href}
                    className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-300 relative group"
                  >
                    {cat.label}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-foreground/70 transition-all duration-300 group-hover:w-full" />
                  </Link>
                ),
              )}
            </nav>

            {/* Search Bar - Desktop */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-xs items-center"
            >
              <div className="relative w-full -ml-4">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Tìm sản phẩm..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pl-10 h-9 rounded-full bg-muted/40 border border-white/10 focus:border-primary/30 focus:bg-muted transition-all"
                />
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile Search Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                <Search className="h-4 w-4" />
              </Button>

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 relative"
                asChild
              >
                <Link to="/cart">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center"
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </motion.span>
                  )}
                </Link>
              </Button>

              {/* Auth Section */}
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 hidden sm:flex">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback className="text-xs bg-primary text-white font-medium">
                          {user.fullName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-4 py-3">
                      <p className="font-semibold text-sm">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Tài Khoản Của Tôi
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="cursor-pointer flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Đơn Hàng
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="text-destructive cursor-pointer flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng Xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  className="hidden sm:flex h-9 text-sm text-foreground/70 hover:text-foreground transition-all duration-300"
                  asChild
                >
                  <Link to="/auth/login">Đăng Nhập</Link>
                </Button>
              )}

              <ModeToggle />

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden pb-3 px-4 sm:px-6 overflow-hidden"
              >
                <form onSubmit={handleSearch}>
                  <Input
                    type="text"
                    placeholder="Tìm sầu riêng, cà phê..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="h-10 rounded-full"
                    autoFocus
                  />
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>

      {/* ===== FULL-SCREEN MOBILE MENU ===== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl lg:hidden"
            style={{ top: 0 }}
          >
            <div className="flex flex-col h-full px-8 pt-24 pb-8">
              {/* Close button */}
              <div className="absolute top-4 right-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 flex flex-col justify-center gap-6">
                <Link
                  to="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-4xl font-display text-foreground hover:text-muted-foreground transition-colors duration-300"
                >
                  Tất Cả Sản Phẩm
                </Link>
                {CATEGORIES_NAV.map((cat) => (
                  <div key={cat.href}>
                    <Link
                      to={cat.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-4xl font-display text-foreground hover:text-muted-foreground transition-colors duration-300"
                    >
                      {cat.label}
                    </Link>
                    {cat.children.length > 0 && (
                      <div className="mt-2 ml-2 space-y-1">
                        {cat.children.map((child) => (
                          <Link
                            key={child.href}
                            to={child.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block text-base text-foreground/50 hover:text-foreground/80 transition-colors duration-300 py-1"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {TOPBAR_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-4xl font-display text-foreground hover:text-muted-foreground transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Bottom CTAs */}
              <div className="pt-6 border-t border-foreground/10 flex gap-3">
                {!isAuthenticated && (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-full h-12 text-base"
                      asChild
                    >
                      <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                        Đăng Nhập
                      </Link>
                    </Button>
                    <Button
                      className="flex-1 bg-foreground text-background rounded-full h-12 text-base hover:bg-foreground/90"
                      asChild
                    >
                      <Link to="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                        Đăng Ký
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
