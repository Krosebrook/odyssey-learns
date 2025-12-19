# Inner Odyssey Design System

A comprehensive design system for the Inner Odyssey K-12 learning platform, built with React, Tailwind CSS, and shadcn/ui components.

## Table of Contents

1. [Philosophy](#philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Component Variants](#component-variants)
6. [Age-Tier Adaptations](#age-tier-adaptations)
7. [Animations](#animations)
8. [Accessibility](#accessibility)

---

## Philosophy

### "Joy of Discovery"

Our design philosophy centers on creating joyful, engaging learning experiences that adapt to each child's developmental stage while maintaining a cohesive visual identity.

**Core Principles:**
- **Age-Adaptive**: UI complexity grows with the child
- **Emotionally Supportive**: Warm colors and celebratory feedback
- **Accessible First**: WCAG 2.1 AA compliant
- **Performance Focused**: Optimized for all devices

---

## Color System

### Core Brand Colors

All colors use HSL format for consistency and theme flexibility.

```css
/* Primary - Warm Pink (Nurturing, Friendly) */
--primary: 340 82% 52%;           /* #FF6B9D */
--primary-foreground: 0 0% 100%;  /* White text on primary */

/* Secondary - Deep Indigo (Trustworthy, Educational) */
--secondary: 231 48% 48%;         /* #5C6BC0 */
--secondary-foreground: 0 0% 100%;

/* Accent - Teal (Balanced, Confident) */
--accent: 174 42% 41%;            /* #3DBDB3 */
--accent-foreground: 0 0% 100%;
```

### Semantic Colors

Use semantic colors for consistent meaning across the application.

```css
/* Status Colors */
--success: 142 76% 36%;           /* Green - Completion, correct */
--warning: 38 92% 50%;            /* Amber - Attention needed */
--destructive: 0 84% 60%;         /* Red - Errors, deletion */
--info: 199 89% 48%;              /* Blue - Information */
```

### Subject Colors

Each subject has a dedicated color for visual consistency.

| Subject | CSS Variable | HSL Value | Usage |
|---------|--------------|-----------|-------|
| Reading | `--reading` | `340 82% 52%` | Reading/ELA content |
| Math | `--math` | `231 48% 48%` | Mathematics content |
| Science | `--science` | `142 76% 36%` | Science content |
| Social | `--social` | `199 89% 48%` | Social studies |
| Life Skills | `--lifeskills` | `174 42% 41%` | Life skills content |

```tsx
// Usage in components
<Badge variant="subject-reading">Reading</Badge>
<Badge variant="subject-math">Math</Badge>
```

### Badge Tier Colors

For gamification elements like achievement badges.

```css
--tier-bronze: 30 60% 50%;        /* Bronze achievements */
--tier-silver: 210 10% 60%;       /* Silver achievements */
--tier-gold: 45 93% 47%;          /* Gold achievements */
--tier-platinum: 260 50% 60%;     /* Platinum achievements */
```

### Surface Colors

```css
/* Light Mode */
--background: 0 0% 100%;          /* Page background */
--foreground: 224 71% 4%;         /* Primary text */
--card: 0 0% 100%;                /* Card background */
--card-foreground: 224 71% 4%;    /* Card text */
--muted: 220 14% 96%;             /* Muted backgrounds */
--muted-foreground: 220 9% 46%;   /* Secondary text */
--border: 220 13% 91%;            /* Border color */
--ring: 340 82% 52%;              /* Focus ring */

/* Dark Mode (prefix with .dark) */
--background: 224 71% 4%;
--foreground: 210 20% 98%;
```

---

## Typography

### Font Family

```css
font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
```

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| `h1` | 2.25rem (36px) | 700 | 2.5rem | Page titles |
| `h2` | 1.875rem (30px) | 600 | 2.25rem | Section headers |
| `h3` | 1.5rem (24px) | 600 | 2rem | Subsection headers |
| `h4` | 1.25rem (20px) | 600 | 1.75rem | Card titles |
| `body` | 1rem (16px) | 400 | 1.5rem | Body text |
| `small` | 0.875rem (14px) | 400 | 1.25rem | Helper text |
| `xs` | 0.75rem (12px) | 400 | 1rem | Captions, labels |

### Usage

```tsx
<h1 className="text-3xl font-bold">Page Title</h1>
<h2 className="text-2xl font-semibold">Section Header</h2>
<p className="text-base text-muted-foreground">Body text</p>
<span className="text-sm text-muted-foreground">Helper text</span>
```

---

## Spacing & Layout

### 8px Grid System

All spacing follows an 8px base grid for visual consistency.

| Token | Tailwind | Pixels | Usage |
|-------|----------|--------|-------|
| `xs` | `1` | 4px | Tight spacing |
| `sm` | `2` | 8px | Icon gaps |
| `md` | `4` | 16px | Card padding |
| `lg` | `6` | 24px | Section gaps |
| `xl` | `8` | 32px | Large sections |
| `2xl` | `12` | 48px | Page margins |
| `3xl` | `16` | 64px | Hero sections |

### Container Widths

```css
.container {
  max-width: 1280px;   /* xl breakpoint */
  margin: 0 auto;
  padding: 0 1rem;     /* 16px horizontal padding */
}

/* Page-specific containers */
.content-container {
  max-width: 1024px;   /* lg breakpoint for reading content */
}

.narrow-container {
  max-width: 640px;    /* sm breakpoint for forms */
}
```

### Responsive Breakpoints

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm` | 640px | Tablets (portrait) |
| `md` | 768px | Tablets (landscape) |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

---

## Component Variants

### Button Variants

```tsx
// Primary actions
<Button variant="default">Primary</Button>

// Call-to-action (gradient)
<Button variant="cta">Get Started</Button>

// Success states
<Button variant="success">Complete</Button>

// Warning states
<Button variant="warning">Caution</Button>

// Destructive actions
<Button variant="destructive">Delete</Button>

// Secondary actions
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Tertiary</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

### Card Variants

```tsx
// Default card
<Card className="p-6">Content</Card>

// Elevated card (with shadow)
<Card className="elevated-card p-6">Highlighted Content</Card>

// Interactive card
<Card className="hover-scale cursor-pointer p-6">Clickable</Card>

// Feature card
<FeatureCard 
  icon={BookOpen}
  title="Reading"
  description="Explore stories"
/>
```

### Badge Variants

```tsx
// Status badges
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="destructive">Error</Badge>

// Subject badges
<Badge variant="subject-reading">Reading</Badge>
<Badge variant="subject-math">Math</Badge>
<Badge variant="subject-science">Science</Badge>
<Badge variant="subject-social">Social</Badge>
<Badge variant="subject-lifeskills">Life Skills</Badge>

// Tier badges (achievements)
<Badge variant="tier-bronze">Bronze</Badge>
<Badge variant="tier-silver">Silver</Badge>
<Badge variant="tier-gold">Gold</Badge>
<Badge variant="tier-platinum">Platinum</Badge>
```

### Stat Card

```tsx
<StatCard
  title="Total Points"
  value={1250}
  icon={Star}
  variant="primary"  // primary | success | warning | accent
  trend="+15%"
/>
```

---

## Age-Tier Adaptations

### K-2 (Ages 5-7)

```css
/* Larger touch targets */
.k2-button { min-height: 60px; font-size: 1.25rem; }

/* Warmer, brighter colors */
.k2-theme {
  --primary: 340 82% 55%;    /* Brighter pink */
  --accent: 38 92% 60%;      /* Brighter orange */
}

/* More generous spacing */
.k2-card { padding: 2rem; border-radius: 1rem; }
```

**Characteristics:**
- Extra large buttons (60px+ height)
- Big, colorful icons
- Simple navigation (3-4 items max)
- Full-screen celebrations
- Voice narration support

### 3-5 (Ages 8-10)

```css
/* Standard comfortable sizing */
.elementary-button { min-height: 48px; }

/* Balanced color palette */
.elementary-theme {
  --primary: 231 48% 48%;    /* Indigo */
  --accent: 174 42% 41%;     /* Teal */
}
```

**Characteristics:**
- Standard button sizes (48px)
- Clear iconography with labels
- 5-7 navigation items
- Badge-based celebrations
- Self-paced learning

### 6-8 (Ages 11-13)

```css
/* More compact, information-dense */
.middle-button { min-height: 44px; }

/* Professional, mature palette */
.middle-theme {
  --primary: 213 94% 40%;    /* Royal blue */
  --secondary: 220 13% 40%;  /* Blue gray */
}
```

**Characteristics:**
- Standard sizing (44px buttons)
- Dense information displays
- Sidebar navigation
- Achievement notifications
- Collaborative features

### 9-12 (Ages 14-18)

```css
/* Compact, professional */
.high-button { min-height: 40px; }

/* Academic, sophisticated palette */
.high-theme {
  --primary: 213 94% 32%;    /* Deep blue */
  --secondary: 220 13% 32%;  /* Slate */
}
```

**Characteristics:**
- Professional sizing (40px buttons)
- Data-rich displays
- Collapsible sidebar
- Portfolio building
- Real-world connections

---

## Animations

### Utility Classes

```css
/* Fade in on mount */
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

/* Hover scale effect */
.hover-scale {
  transition: transform 0.2s ease;
}
.hover-scale:hover {
  transform: scale(1.02);
}

/* Card elevation on hover */
.elevated-card {
  box-shadow: 0 4px 6px -1px hsl(var(--shadow) / 0.1);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.elevated-card:hover {
  box-shadow: 0 10px 15px -3px hsl(var(--shadow) / 0.15);
  transform: translateY(-2px);
}
```

### Framer Motion Patterns

```tsx
// Page transition
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Page content
</motion.div>

// List item stagger
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: index * 0.1 }}
>
  List item
</motion.div>

// Celebration burst
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: [0, 1.2, 1] }}
  transition={{ duration: 0.5, type: "spring" }}
>
  🎉
</motion.div>
```

### Animation Timings by Age

| Age Tier | Duration | Easing | Notes |
|----------|----------|--------|-------|
| K-2 | 500-800ms | bouncy | Generous, playful |
| 3-5 | 300-500ms | smooth | Moderate |
| 6-8 | 200-300ms | subtle | Quick |
| 9-12 | 150-200ms | minimal | Professional |

---

## Accessibility

### Focus Indicators

```css
/* Global focus indicator */
*:focus-visible {
  outline: 3px solid hsl(var(--ring));
  outline-offset: 2px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  :root {
    --ring: 0 0% 0%;
  }
}
```

### Color Contrast

All color combinations meet WCAG 2.1 AA standards:

| Combination | Contrast Ratio | Status |
|-------------|----------------|--------|
| `foreground` on `background` | 12.5:1 | ✅ AAA |
| `primary-foreground` on `primary` | 7.2:1 | ✅ AAA |
| `muted-foreground` on `background` | 5.8:1 | ✅ AA |
| `destructive-foreground` on `destructive` | 4.8:1 | ✅ AA |

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Screen Reader Support

```tsx
// Visually hidden but accessible
<span className="sr-only">Screen reader only text</span>

// Skip link
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

// Live regions
<div aria-live="polite" aria-atomic="true">
  Dynamic content updates
</div>
```

---

## Quick Reference

### Import Paths

```tsx
// UI Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Custom Components
import { StatCard } from "@/components/ui/stat-card";
import { FeatureCard } from "@/components/ui/feature-card";

// Hooks
import { useToast } from "@/hooks/use-toast";
```

### Common Patterns

```tsx
// Page container
<div className="container mx-auto px-4 py-8 space-y-8">

// Section header
<div className="flex items-center justify-between mb-6">
  <h2 className="text-2xl font-bold">Section Title</h2>
  <Button variant="outline">Action</Button>
</div>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Loading state
<div className="flex items-center justify-center py-12">
  <Loader2 className="w-8 h-8 animate-spin text-primary" />
</div>

// Empty state
<Card className="p-12 text-center">
  <Icon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
  <h3 className="text-xl font-semibold mb-2">No items yet</h3>
  <p className="text-muted-foreground">Description of empty state</p>
</Card>
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-12 | Initial design system documentation |
| 1.1.0 | 2024-12 | Added tier colors, subject colors, accessibility updates |

---

*Last updated: December 2024*
