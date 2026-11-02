# UI/UX STANDARDS

**Project:** THE INNS — Hotel, Lodge & Restaurant Management SaaS  
**Version:** 1.0  
**Date:** 2026-10-29

---

## DESIGN TOKENS

### Colors

| Purpose | Color | Tailwind |
|---|---|---|
| Primary brand | Deep navy `#1E3A5F` | `bg-[#1E3A5F]` |
| Primary action | Professional blue `#2563EB` | `bg-[#2563EB]` |
| Page background | Soft neutral `#F8FAFC` | `bg-[#F8FAFC]` |
| Card background | White `#FFFFFF` | `bg-white` |
| Main text | Dark slate `#1E293B` | `text-[#1E293B]` |
| Secondary text | Muted slate `#64748B` | `text-[#64748B]` |
| Success | `#15803D` | `text-[#15803D]` / `bg-[#15803D]` |
| Warning | `#B45309` | `text-[#B45309]` / `bg-[#B45309]` |
| Error | `#B91C1C` | `text-[#B91C1C]` / `bg-[#B91C1C]` |
| Borders | Light slate `#E2E8F0` | `border-[#E2E8F0]` |

### Typography

| Element | Size | Weight |
|---|---|---|
| Page title | `text-2xl` | `font-bold` |
| Section heading | `text-lg` | `font-bold` |
| Card label | `text-sm` | `font-medium` |
| Body text | `text-sm` | `font-normal` |
| Helper text | `text-xs` | `font-normal` |

### Spacing

| Use | Value |
|---|---|
| Section spacing | `space-y-6` |
| Card spacing | `gap-4` |
| Element spacing | `gap-3` |
| Tight spacing | `gap-2` |

### Borders & Radii

| Element | Radius |
|---|---|
| Inputs | `rounded-lg` |
| Cards | `rounded-lg` |
| Buttons | `rounded-lg` |
| Modals | `rounded-xl` |

### Shadows

| Use | Class |
|---|---|
| Cards | `shadow-sm` |
| Hover | `shadow-md` |
| Modals | `shadow-xl` |

---

## COMPONENT GUIDELINES

### Buttons

- Primary: `bg-[#2563EB] text-white px-4 py-2 rounded-lg hover:bg-[#1E3A5F]`
- Secondary: `border border-[#E2E8F0] px-4 py-2 rounded-lg hover:bg-[#F8FAFC]`
- Destructive: `bg-[#B91C1C] text-white px-4 py-2 rounded-lg hover:bg-[#7F1D1D]`

### Cards

- Background: `bg-white`
- Border: `border border-[#E2E8F0]`
- Padding: `p-4` or `p-6`
- Hover: `hover:border-[#2563EB] hover:shadow-md`

### Tables

- Header: `text-left py-2 px-3 font-medium text-[#64748B]`
- Row: `border-b border-[#E2E8F0]`
- Cell: `py-2 px-3 text-[#1E293B]`

### Forms

- Label: `text-sm font-medium text-[#1E293B]`
- Input: `border border-[#E2E8F0] rounded-lg px-3 py-2`
- Error: `text-[#B91C1C] text-xs`
- Helper: `text-[#64748B] text-xs`

---

## RESPONSIVE BREAKPOINTS

| Breakpoint | Width | Target |
|---|---|---|
| Mobile | 360-639px | Stacked cards, simplified tables |
| Tablet | 640-1023px | POS, KDS, reception |
| Desktop | 1024-1439px | Full dashboard |
| Wide | 1440px+ | Full dashboard |

---

## ACCESSIBILITY

- WCAG 2.2 AA target
- Contrast ≥ 4.5:1
- Keyboard navigation support
- Visible focus indicators
- Semantic HTML
- ARIA labels where needed
- `prefers-reduced-motion` support

---

**Last Updated:** 2026-10-29
