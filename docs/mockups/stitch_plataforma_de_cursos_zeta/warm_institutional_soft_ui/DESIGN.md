---
name: Warm Institutional Soft-UI
colors:
  surface: '#fef9f0'
  surface-dim: '#ded9d1'
  surface-bright: '#fef9f0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f3ea'
  surface-container: '#f2ede4'
  surface-container-high: '#ece8df'
  surface-container-highest: '#e7e2d9'
  on-surface: '#1d1c16'
  on-surface-variant: '#5a4139'
  inverse-surface: '#32302b'
  inverse-on-surface: '#f5f0e7'
  outline: '#8e7067'
  outline-variant: '#e3bfb4'
  surface-tint: '#ad3300'
  primary: '#a93200'
  on-primary: '#ffffff'
  primary-container: '#d24206'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb59e'
  secondary: '#645d58'
  on-secondary: '#ffffff'
  secondary-container: '#e7ded7'
  on-secondary-container: '#68615c'
  tertiary: '#5a601d'
  on-tertiary: '#ffffff'
  tertiary-container: '#727934'
  on-tertiary-container: '#feffdb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#ffb59e'
  on-primary-fixed: '#390b00'
  on-primary-fixed-variant: '#842500'
  secondary-fixed: '#eae1da'
  secondary-fixed-dim: '#cec5be'
  on-secondary-fixed: '#1f1b17'
  on-secondary-fixed-variant: '#4b4641'
  tertiary-fixed: '#e1e996'
  tertiary-fixed-dim: '#c5cc7d'
  on-tertiary-fixed: '#1a1d00'
  on-tertiary-fixed-variant: '#444b07'
  background: '#fef9f0'
  on-background: '#1d1c16'
  surface-variant: '#e7e2d9'
typography:
  display-lg:
    fontFamily: Poppins
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.3px
  display-lg-mobile:
    fontFamily: Poppins
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.3px
  display-md:
    fontFamily: Poppins
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.2px
  display-md-mobile:
    fontFamily: Poppins
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.2px
  display-sm:
    fontFamily: Poppins
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-base:
    fontFamily: Poppins
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-bold:
    fontFamily: Poppins
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 22px
  label-caps:
    fontFamily: Poppins
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.6px
  helper-text:
    fontFamily: Poppins
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  gutter: 24px
  sidebar-width: 220px
  margin-mobile: 12px
  margin-desktop: 32px
---

## Brand & Style

The design system balances institutional prestige with a human-centric, entrepreneurial spirit. It moves away from cold, clinical corporate aesthetics in favor of a **Soft-UI** approach that feels tactile and organic. The visual narrative is inspired by natural textures—sandy clays, warm woods, and terracotta—reflecting the local Costa Rican context of the laboratory.

The style is characterized by:
- **Professional Warmth:** A foundation of sandy cream and white surfaces that reduce eye strain and feel approachable.
- **Structural Authority:** A heavy, near-black sidebar that grounds the application, providing a sense of permanence and reliability.
- **Tactile Softness:** Subtle shadows and thin, colored borders ("Arena") that give components a physical, layered presence without the harshness of traditional flat design.
- **Accessibility-First:** A commitment to WCAG AA standards, ensuring high legibility through careful color contrast and generous typographic scaling.

## Colors

The palette is built on a "Warm Neutral" foundation accented by high-energy institutional colors.

- **Primary (Orange):** Used for primary actions, active states, and brand highlights. It represents energy and entrepreneurship.
- **Secondary (Charcoal):** Reserved for the navigation sidebar and primary text to provide maximum contrast and structural grounding.
- **Tertiary (Olive):** Used for success states and specific academic programs, providing a professional balance to the vibrant orange.
- **Neutral (Cream & White):** The background uses a soft cream (`#FAF5EC`) to differentiate the application from standard white-label SaaS products. Surfaces (cards, modals) use pure white to "pop" against this cream backdrop.
- **Semantic Accents:** A specialized 10-color matrix is used for categorization tags, ensuring each program type (Taller, Curso, Seminario) has a distinct, accessible visual identifier.

## Typography

This design system uses **Poppins** for all interface levels to maintain a clean, geometric, yet friendly appearance.

- **Headings:** Utilize a semibold weight (600) with slight negative letter-spacing to ensure titles feel tight and professional.
- **Body:** Set at 14px with a 1.6 line-height to maximize readability for dense information like course descriptions and student data.
- **Labels:** Small labels and table headers use an uppercase, increased-tracking style (0.6px) to improve legibility at small sizes.
- **Hierarchy:** Use color (Secondary Charcoal vs. Warm Gray) to establish secondary hierarchy rather than relying solely on font size.

## Layout & Spacing

The layout utilizes a **Fixed Sidebar + Fluid Content** model.

- **Sidebar:** A fixed 220px vertical column on the left. It remains dark in both light and dark modes to maintain institutional identity.
- **Content Area:** On desktop, the main content area has a 32px margin. On mobile, this reduces to 12px.
- **Grid:** Use a 12-column fluid grid for dashboard widgets. Cards should span 3 columns (quarter-width), 4 columns (third-width), or 6 columns (half-width) depending on the complexity of the data.
- **Responsive Behavior:** Under 1024px, the sidebar transitions into a hidden drawer. Under 768px (Tablet), data tables should reflow into a "Card Stack" layout where each row becomes an independent card surface.

## Elevation & Depth

Visual hierarchy is achieved through a combination of **Tonal Layering** and **Soft Ambient Shadows**.

- **Layer 0 (Background):** The Cream (`#FAF5EC`) canvas serves as the bottom-most layer.
- **Layer 1 (Surfaces):** White cards sit on top of the cream background. They are defined by a 1px border in "Arena" (`#CEBF98`) and a very low-opacity shadow (`rgba(26, 22, 18, 0.04)`) with a 2px blur.
- **Layer 2 (Interactive/Modals):** Elements like dropdowns and modals use a slightly more pronounced shadow to indicate they are floating above the card layer.
- **Depth Metaphor:** Instead of heavy blurs, depth is primarily communicated by the contrast between the white surface and the cream background, creating a "cut-out" or "layered paper" feel.

## Shapes

The design system uses a **Rounded** shape language to reinforce the "Soft-UI" narrative and make the interface feel modern and accessible.

- **Base Radius (8px):** Applied to buttons, input fields, and small containers.
- **Large Radius (12px):** Applied to standard StatCards and main content containers.
- **Extra Large Radius (16px):** Used for modals and bottom sheets on mobile.
- **Pill (Full Round):** Specifically reserved for status tags (TagPills) and specific program badges to distinguish them from interactive buttons.

## Components

### Buttons
- **Primary:** Solid Orange (`#E8521A`) with white text. 8px rounded corners.
- **Secondary:** Solid Charcoal (`#1A1612`) with cream text.
- **Ghost:** Transparent background with an Arena (`#CEBF98`) border.
- **Focus State:** Always include a 2px solid orange outline with a 2px offset for accessibility.

### Cards & StatCards
- **Visuals:** White background, 12px radius, Arena border.
- **StatCards:** Feature a large 26px semibold number in Primary Orange or Tertiary Olive, with a 12px label in Warm Gray.

### TagPills & Badges
- **Shape:** Full pill (20px radius).
- **Styling:** Use the semantic matrix (e.g., Orange follow-up uses light orange background, dark orange text, and a small 6px circular dot on the left).
- **Course Badges:** Use distinct pastel backgrounds for Taller (Orange), Curso (Blue), and Seminario (Purple).

### Inputs & Tables
- **Inputs:** 8px rounded corners with a 1px Arena border. Focus state changes the border to Primary Orange.
- **Tables:** Use alternating row colors (`#F2E8D0`) to improve scanability across large datasets. Headers should be uppercase with 0.6px tracking.

### AccessBars
- **Concept:** A custom progress bar tracking time remaining.
- **Logic:** 6px height, rounded. Use Olive Green for >5 days, Primary Orange for 1-5 days, and Siena (`#A84020`) for expired states.