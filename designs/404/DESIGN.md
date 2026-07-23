---
name: Crispy Golden Narrative
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#514532'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#837560'
  outline-variant: '#d5c4ab'
  surface-tint: '#7c5800'
  primary: '#7c5800'
  on-primary: '#ffffff'
  primary-container: '#ffb800'
  on-primary-container: '#6b4c00'
  inverse-primary: '#ffba20'
  secondary: '#bc0000'
  on-secondary: '#ffffff'
  secondary-container: '#e41f13'
  on-secondary-container: '#fffbff'
  tertiary: '#5d5f5f'
  on-tertiary: '#ffffff'
  tertiary-container: '#c4c5c5'
  on-tertiary-container: '#505252'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdea8'
  primary-fixed-dim: '#ffba20'
  on-primary-fixed: '#271900'
  on-primary-fixed-variant: '#5e4200'
  secondary-fixed: '#ffdad4'
  secondary-fixed-dim: '#ffb4a8'
  on-secondary-fixed: '#410000'
  on-secondary-fixed-variant: '#930000'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 34px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 120px
---

## Brand & Style

The brand personality is exuberant, communal, and unpretentiously Dutch. It captures the "gezellig" feeling of a late-night snack bar visit. The target audience includes foodies, casual diners, and late-night revelers looking for comfort food. 

The design style is **Modern-Tactile with a hint of Pop-Art**. It utilizes high-contrast colors, bold typography, and soft, pillowy shapes to evoke the physical sensation of dipping a warm fry into sauce. The UI should feel energetic and approachable, avoiding corporate stiffness in favor of a "snackable" interface that prioritizes speed of choice and visual appetite appeal.

## Colors

The palette is driven by the culinary staples of the Dutch "frietkot":
- **Deep Fryer Gold (#FFB800):** Used for primary actions, highlights, and energy. It represents the perfect crisp.
- **Ketchup Red (#CC0000):** Reserved for secondary call-to-actions, urgent notifications, and "hot" deals.
- **Mayo White (#F5F5F5):** The primary background color, providing a clean, high-contrast canvas for the warmer tones.
- **Bitterbal Brown (#4A2C2A):** (Implicit Neutral) Used for text and deep shadows to ensure legibility and grounding.

The default mode is **Light**, mimicking the bright, tiled environments of traditional snack bars.

## Typography

The typography strategy balances high-impact friendliness with technical precision. 
- **Headlines:** Uses **Plus Jakarta Sans** in extra-bold weights. The soft curves feel modern and appetizing.
- **Body:** **Be Vietnam Pro** provides a warm, contemporary feel that remains highly legible during quick scrolling.
- **Labels/UI Elements:** **Space Grotesk** adds a slight "tech-snack" quirkiness, making price tags and nutritional info feel distinct and organized.

## Layout & Spacing

This design system uses a **Fluid-Responsive Grid** based on an 8px rhythm. 
- **Mobile:** 4-column layout with 20px side margins. Cards usually span the full width to maximize food photography.
- **Desktop:** 12-column centered layout (max-width 1280px) with 24px gutters. 

Spacing is generous to maintain a "fun" and "airy" feel. Avoid cramped lists; instead, use large card containers with significant internal padding (24px) to make the content feel substantial and "chunky."

## Elevation & Depth

To match the playful nature of the brand, depth is created through **Tonal Stacking and Soft Diffusion**:
- **Level 1 (Cards):** Use a very soft, "buttery" shadow tinted with a hint of gold (#FFB800 at 8% opacity) rather than pure grey.
- **Level 2 (Active/Hover):** Increase the shadow spread and move the Y-offset down to make the element appear to "pop" off the page toward the user.
- **Floating Actions:** Buttons use a high-contrast border (2px) in a darker shade of the primary color to give them a "sticker" or "patch" aesthetic, reinforcing the tactile, fun theme.

## Shapes

The shape language is defined by **Friendly Radii**. 
- Standard components (Inputs, Buttons) use `rounded-md` (0.5rem).
- Primary Containers and Cards use `rounded-xl` (1.5rem) to mimic the soft edges of a croquette or a bun.
- Interactive chips and tags should be fully **Pill-shaped** to contrast against the more structural cards.

## Components

### Buttons
- **Primary:** Deep Fryer Gold background with Bitterbal Brown text. Bold weight. High-contrast shadow on press.
- **Secondary:** Mayo White background with a 2px Ketchup Red border. 

### Cards
Cards are the primary vehicle for snack discovery. They feature large-scale imagery with a "Price Badge" in the top right corner. The badge should be a circular Ketchup Red element with white Space Grotesk text.

### Selection Controls
- **Checkboxes/Radios:** Oversized for easy tapping. When selected, they should fill with Deep Fryer Gold and use a custom "fry" icon for the checkmark.

### Input Fields
- **Search:** A thick, rounded bar with a Mayo White fill and a 2px gold border. Use playful placeholder text like "What are you craving?" or "Find your frikandel...".

### Iconic Navigation
The bottom navigation bar or sidebar should use custom-drawn, thick-stroke icons representing snacks (e.g., a "Home" icon shaped like a snack-shack, a "Favorites" heart shaped like a pretzel or croquette).