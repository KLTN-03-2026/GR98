# Design Patterns Reference

Quick copy-paste patterns for consistent design implementation across the Farmers E-Commerce platform.

## Navigation & Layout

### Modern Header with Glass Effect
```tsx
<header className="sticky top-0 z-50 transition-all duration-300 bg-background/80 backdrop-blur-xl border-b border-white/10 shadow-sm">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16 gap-4">
      {/* Content */}
    </div>
  </div>
</header>
```

### Section Header (Large)
```tsx
<section className="py-20 md:py-28 border-t border-white/10">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-16 space-y-3">
      <p className="text-sm font-semibold text-primary uppercase tracking-wider">Label</p>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
        Section Title
      </h2>
      <p className="text-base text-foreground/70 max-w-2xl mx-auto">
        Description text
      </p>
    </div>
  </div>
</section>
```

### Container with Subtle Border
```tsx
<div className="rounded-xl border border-white/10 bg-card hover:border-primary/20 transition-all duration-300">
  {/* Content */}
</div>
```

---

## Buttons & Interactive Elements

### Primary Button
```tsx
<Button 
  variant="primary" 
  className="transition-all duration-200 active:scale-95"
>
  Click Me
</Button>
```

### Secondary Button
```tsx
<Button 
  variant="outline" 
  className="border-white/20 hover:bg-white/5 transition-all duration-200"
>
  Alternative Action
</Button>
```

### Ghost Button (Minimal)
```tsx
<Button 
  variant="ghost" 
  size="icon" 
  className="h-9 w-9"
>
  <Icon className="h-4 w-4" />
</Button>
```

### Icon with Label
```tsx
<button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted/60 transition-colors duration-200">
  <Icon className="h-4 w-4" />
  <span className="text-sm font-medium">Label</span>
</button>
```

---

## Typography

### Heading - Extra Large
```tsx
<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
  Page Title
</h1>
```

### Heading - Large
```tsx
<h2 className="text-2xl md:text-3xl font-bold text-foreground">
  Section Title
</h2>
```

### Heading - Medium
```tsx
<h3 className="text-lg md:text-xl font-semibold text-foreground">
  Small Title
</h3>
```

### Body Text - Standard
```tsx
<p className="text-base text-foreground/70 leading-relaxed">
  Readable paragraph text with proper line-height.
</p>
```

### Body Text - Small
```tsx
<p className="text-sm text-foreground/60">
  Secondary information text.
</p>
```

### Small Label
```tsx
<p className="text-xs text-foreground/50 uppercase tracking-wider font-semibold">
  LABEL
</p>
```

---

## Cards & Containers

### Product Card
```tsx
<div className="overflow-hidden rounded-xl border border-white/10 bg-card hover:border-primary/20 transition-all duration-300 group">
  <div className="aspect-square overflow-hidden bg-muted">
    <img 
      src={image} 
      alt={title}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    />
  </div>
  <div className="p-4 space-y-2">
    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
      Product Name
    </h3>
    <p className="text-xs text-foreground/60">
      Product description
    </p>
  </div>
</div>
```

### Feature Card
```tsx
<div className="rounded-lg p-6 border border-white/10 bg-card/50 hover:bg-card/80 transition-all duration-300 space-y-3">
  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
    <Icon className="h-6 w-6 text-primary" />
  </div>
  <h3 className="font-semibold text-foreground">Feature Title</h3>
  <p className="text-sm text-foreground/70">Feature description text</p>
</div>
```

### Info Card
```tsx
<div className="rounded-xl border border-white/10 bg-card p-6 space-y-4">
  <div className="flex items-start gap-3">
    <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
    <div>
      <p className="text-sm font-semibold text-foreground">Title</p>
      <p className="text-sm text-foreground/70">Description text</p>
    </div>
  </div>
</div>
```

---

## Forms & Inputs

### Input Field
```tsx
<div className="space-y-2">
  <label className="text-sm font-medium text-foreground">Label</label>
  <input 
    type="text"
    placeholder="Placeholder..."
    className="w-full px-4 py-2 rounded-lg border border-white/10 bg-card focus:border-primary/30 focus:bg-card transition-all duration-200"
  />
</div>
```

### Input with Icon
```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
  <input 
    type="text"
    placeholder="Search..."
    className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/10 bg-card focus:border-primary/30 transition-all"
  />
</div>
```

### Select Dropdown
```tsx
<div className="space-y-2">
  <label className="text-sm font-medium text-foreground">Select Option</label>
  <select className="w-full px-4 py-2 rounded-lg border border-white/10 bg-card focus:border-primary/30 transition-all">
    <option>Option 1</option>
    <option>Option 2</option>
  </select>
</div>
```

### Checkbox
```tsx
<label className="flex items-center gap-2 cursor-pointer">
  <input type="checkbox" className="rounded border border-white/20" />
  <span className="text-sm text-foreground">Checkbox label</span>
</label>
```

---

## Lists & Grids

### Grid - 2 Columns (Mobile)
```tsx
<div className="grid grid-cols-2 gap-4">
  {items.map(item => (
    <div key={item.id}>{item.name}</div>
  ))}
</div>
```

### Grid - Responsive (Mobile → Tablet → Desktop)
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
  {items.map(item => (
    <div key={item.id}>{item.name}</div>
  ))}
</div>
```

### Grid - 6 Column (Categories)
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-5">
  {categories.map(cat => (
    <div key={cat.id}>{cat.name}</div>
  ))}
</div>
```

### Flex Layout - Space Between
```tsx
<div className="flex items-center justify-between gap-4">
  <div>Left Content</div>
  <div>Right Content</div>
</div>
```

### Flex Layout - Center
```tsx
<div className="flex items-center justify-center gap-4">
  <Icon className="h-5 w-5" />
  <span>Centered Content</span>
</div>
```

---

## Animations & Motion

### Staggered List Animation
```tsx
<div className="space-y-4">
  {items.map((item, i) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.08 }}
    >
      {item.name}
    </motion.div>
  ))}
</div>
```

### Scroll Triggered Animation
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
>
  Content that animates when scrolled into view
</motion.div>
```

### Hover Scale Effect
```tsx
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.2 }}
>
  Interactive Content
</motion.div>
```

### Fade In on Load
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.6, delay: 0.3 }}
>
  Content
</motion.div>
```

---

## Spacing Reference

### Padding
- `p-4` = 1rem (16px)
- `p-6` = 1.5rem (24px)
- `p-8` = 2rem (32px)

### Margin
- `mt-6` = margin-top: 1.5rem
- `mb-4` = margin-bottom: 1rem
- `mx-auto` = horizontal center

### Gap (Flexbox/Grid)
- `gap-4` = 1rem between items
- `gap-6` = 1.5rem between items
- `gap-8` = 2rem between items

---

## Color Reference

### Text Colors
- `text-foreground` - Primary text (black in light, white in dark)
- `text-foreground/70` - Secondary text (70% opacity)
- `text-foreground/50` - Tertiary text (50% opacity)
- `text-primary` - Interactive/important text
- `text-destructive` - Error/warning text

### Background Colors
- `bg-background` - Page background
- `bg-card` - Card/container background
- `bg-card/50` - Subtle card background
- `bg-muted` - Inactive/disabled background
- `bg-primary` - Primary action background

### Border Colors
- `border-white/10` - Subtle border
- `border-white/20` - Medium border
- `border-primary/20` - Accent border (on hover)

---

## Responsive Design Quick Reference

### Screen Sizes
- Mobile: 320px - 640px (default)
- Tablet: 768px - 1024px (md:)
- Desktop: 1024px + (lg:)

### Common Patterns
```tsx
// Hidden on mobile, visible on tablet+
<div className="hidden md:block">Content</div>

// Visible on mobile, hidden on tablet+
<div className="md:hidden">Content</div>

// Responsive text size
<h1 className="text-2xl md:text-3xl lg:text-4xl">Title</h1>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {items.map(item => <div key={item.id}>{item.name}</div>)}
</div>

// Responsive padding
<div className="px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
  Content
</div>
```

---

## Dark Mode Support

### Text that adapts
```tsx
<p className="text-foreground/70 dark:text-foreground/60">
  Text that is readable in both light and dark modes
</p>
```

### Conditional styling
```tsx
<div className="bg-white dark:bg-slate-950 text-black dark:text-white">
  Adapts to dark mode
</div>
```

### Glass effect
```tsx
<div className="bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10">
  Glass morphism effect
</div>
```

---

## Accessibility Patterns

### Icon Button with Label
```tsx
<button 
  className="p-2 rounded-lg hover:bg-muted transition-colors"
  aria-label="Close"
>
  <X className="h-5 w-5" />
</button>
```

### Skip to Content Link
```tsx
<a 
  href="#main" 
  className="sr-only focus:not-sr-only"
>
  Skip to main content
</a>
```

### Form with Proper Labels
```tsx
<div className="space-y-2">
  <label htmlFor="email" className="text-sm font-medium">
    Email Address
  </label>
  <input 
    id="email"
    type="email"
    placeholder="you@example.com"
  />
</div>
```

---

## Common Mistakes to Avoid

❌ **DON'T**
```tsx
<div className="p-[16px] mx-[8px]">Don't use arbitrary values</div>
<p className="text-white bg-white">No contrast</p>
<button className="p-1 h-4">Touch target too small</button>
```

✅ **DO**
```tsx
<div className="p-4 mx-2">Use Tailwind scale</div>
<p className="text-foreground bg-background">Proper contrast</p>
<button className="p-2 h-10">Proper touch target (44px+)</button>
```

---

**Last Updated**: March 31, 2026  
**Version**: 1.0  
**Status**: Complete Reference
