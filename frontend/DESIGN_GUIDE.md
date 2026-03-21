# TrackCodex Design & Development Guide

This document defines the rules and standards for styling and developing new features and pages in the TrackCodex project to ensure visual and functional consistency.

## 1. Theming & Colors

**Rule: Never use hardcoded hex colors or standard Tailwind color names for UI elements.**
Always use the TrackCodex theme variables. This ensures the component supports Light and Dark modes automatically.

### Theme Variables Mapping

| Use Case | CSS Variable | Tailwind Class |
| :--- | :--- | :--- |
| Main Background | `--gh-bg` | `bg-gh-bg` |
| Secondary Background | `--gh-bg-secondary` | `bg-gh-bg-secondary` |
| Tertiary/Hover Background | `--gh-bg-tertiary` | `bg-gh-bg-tertiary` |
| Primary Accent | `--gh-primary` | `bg-primary` / `text-primary` |
| Primary Text | `--gh-text` | `text-gh-text` |
| Secondary/Muted Text | `--gh-text-secondary` | `text-gh-text-secondary` |
| Borders | `--gh-border` | `border-gh-border` |

### Dark Mode (Premium)

- **Background**: Pure Black (#000000)
- **Secondary**: Deep Gray (#0A0A0A)
- **Borders**: Subtle (#1A1A1A)

## 2. Typography

**Rule: Use the standardized font scale and typography utility classes.**
TrackCodex uses the **Geist** and **Inter** font family.

### Font Scale

- `xs`: 12px (text-xs)
- `sm`: 13px (text-sm) - Preferred for sidebar/small UI.
- `base`: 14px (text-base) - **Standard body text.**
- `md`: 16px (text-md)
- `lg`: 18px (text-lg) - Headings/Titles.
- `xl`: 20px (text-xl) - Page titles.
- `2xl`: 24px (text-2xl)

### Utility Classes

| Class | Usage |
| :--- | :--- |
| `.tc-page-title` | Main page headings (20px, Semi-bold) |
| `.tc-heading` | Section headers (18px, Semi-bold) |
| `.tc-label` | Uppercase labels (13px, Medium) |
| `.tc-body` | Standard body text (14px) |
| `.tc-caption` | Muted small text (12px) |

## 3. Component Standards

### 3.1. Interactive Elements
- **Buttons**: Use standard components or follow the `btn-glow` style for premium actions.
- **Cards**: Use `bg-gh-bg-secondary` and `border-gh-border`. Apply `hover-lift` for interactive cards.
- **Scrollbars**: Apply the `.custom-scrollbar` class to all scrollable containers.

### 3.2. Responsive Design
- Design for both desktop and mobile.
- Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) appropriately.

### 3.3. Theme Synchronization
- Always test your changes in both **Light** and **Dark** themes.
- If using `ThemeContext`, ensure logic relies on `resolvedThemeId`.

## 4. Coding Cleanliness
- **No Inline Styles**: Avoid the `style={{ ... }}` prop unless absolutely necessary for dynamic values (e.g., progress bars).
- **Material Symbols**: Use the `.material-symbols-outlined` class for icons.
- **Accessibility**: Include `aria-label` for all icon-only buttons.
