# Theme Guide

This project uses shadcn/ui with a custom theme based on the blue color palette. The theme implementation uses CSS variables for easy customization.

## Theme Configuration

The theme is configured in the following files:
- `components.json` - Main configuration file for shadcn/ui
- `app/globals.css` - CSS variables for light and dark modes
- `tailwind.config.ts` - Color configuration for Tailwind

## Color Palette

The theme uses a blue-based color palette with proper contrast ratios for accessibility:

### Light Mode
- Primary: Blue hue (221.2 83.2% 53.3%)
- Background: White
- Foreground: Dark blue-gray
- Accent and secondary colors follow a similar blue-gray palette

### Dark Mode
- Primary: Bright blue (217.2 91.2% 59.8%)
- Background: Deep blue-gray (222.2 84% 4.9%)
- Foreground: Very light blue-gray
- Secondary and accent colors in darker blue-gray shades

## Usage

To use the theme, you can apply the following classes to your components:

```jsx
// Background and text colors
<div className="bg-sky-600  text-foreground">
  <h1>Content with theme colors</h1>
</div>

// Primary button
<button className="bg-primary text-primary-foreground">
  Primary Button
</button>

// Secondary button
<button className="bg-secondary text-secondary-foreground">
  Secondary Button
</button>

// Accent elements
<div className="bg-accent text-accent-foreground">
  Accent Element
</div>

// Muted elements
<div className="bg-muted text-muted-foreground">
  Muted Element
</div>

// Destructive elements
<div className="bg-destructive text-destructive-foreground">
  Destructive Element
</div>
```

## Theme Switching

The project includes a theme switcher component (`components/theme-switcher.tsx`) that allows users to toggle between light, dark, and system themes. The theme is persisted using `next-themes`.

To use the theme switcher, include it in your layout:

```jsx
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function Layout() {
  return (
    <div>
      <ThemeSwitcher />
      {/* Rest of your layout */}
    </div>
  );
}
```

## Customization

To modify the theme colors, edit the CSS variables in `app/globals.css`. The format uses HSL values (hue, saturation, lightness).

For example, to change the primary color:

```css
:root {
  --primary: 240 100% 50%; /* New primary color: pure blue */
}
```

Make sure to update both light and dark mode variables for consistency.