# Theme Guide

This project uses shadcn/ui with a custom theme based on the blue color palette. The theme implementation uses CSS variables for easy customization.

## Theme Configuration

The theme is configured in the following files:
- `components.json` - Main configuration file for shadcn/ui
- `app/globals.css` - CSS variables for light and dark modes
- `tailwind.config.ts` - Color configuration for Tailwind

## Color Palette

Using shadcn/ui's blue theme with proper contrast ratios for accessibility.

### Light Mode
- Primary: `hsl(221.2 83.2% 53.3%)` - Professional blue
- Background: `hsl(0 0% 100%)` - White
- Foreground: `hsl(222.2 84% 4.9%)` - Near black
- Secondary: `hsl(210 40% 96.1%)` - Light blue-gray
- Border: `hsl(214.3 31.8% 91.4%)` - Blue-tinted gray

### Dark Mode
- Primary: `hsl(217.2 91.2% 59.8%)` - Bright blue
- Background: `hsl(222.2 84% 4.9%)` - Deep navy
- Foreground: `hsl(210 40% 98%)` - Near white
- Secondary: `hsl(217.2 32.6% 17.5%)` - Dark blue-gray
- Border: `hsl(217.2 32.6% 17.5%)` - Dark blue border

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