# Integrated App Layout Plan

## Module Overview
- **Name**: app-layout
- **Path**: components/app-layout
- **Description**: Comprehensive layout system for authenticated pages with integrated header, sidebar, content area, and footer
- **Tech Stack**: Next.js, Tailwind CSS, shadcn/ui

## Project Structure Alignment

This integrated plan follows a modular architecture while ensuring a cohesive user experience. Following the "Shared Code Policy" that states "UI components should never be shared to prevent cascading breakage" and "Each module should be able to evolve independently", we'll implement all layout components as standalone modules within a unified structure.

```
components/
├── app-layout/               # Main layout container
│   ├── index.tsx             # Main export with integrated components
│   ├── app-header/           # Header component and subcomponents
│   │   ├── index.tsx         # Main header export
│   │   ├── logo-section.tsx  # Logo and branding
│   │   ├── mobile-menu.tsx   # Mobile navigation menu
│   │   ├── navigation-section.tsx # Main navigation links
│   │   └── user-section.tsx  # User profile and actions
│   ├── app-sidebar/          # Sidebar component and subcomponents
│   │   ├── index.tsx         # Main sidebar export
│   │   ├── sidebar-item.tsx  # Individual navigation item
│   │   └── sidebar-section.tsx # Grouping for sidebar items
│   ├── app-footer/           # Footer component
│   │   └── index.tsx         # Footer implementation
│   └── content-container.tsx # Main content wrapper
```

## Component Structure

### Visual Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Header (AppHeader)                                                       │
├───────────────┬───────────────────────────────────────────────────────┐ │
│               │                                                       │ │
│               │                                                       │ │
│               │                                                       │ │
│  Sidebar      │            Content Container                          │ │
│  (Optional)   │                                                       │ │
│               │                                                       │ │
│               │                                                       │ │
│               │                                                       │ │
├───────────────┴───────────────────────────────────────────────────────┤ │
│ Footer                                                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Implementation Components

1. **AppLayout (Main Container)**
   - Integrates all components into a cohesive layout
   - Controls overall structure and responsive behavior
   - Manages optional sidebar visibility

2. **AppHeader (New Implementation)**
   - Primary-colored header with logo, navigation, theme switcher, and user profile
   - Composed of several subcomponents:
     - **LogoSection**: Company logo and name (responsive)
     - **NavigationSection**: Main navigation links with active state indicators
     - **UserSection**: User avatar with dropdown for profile and logout
     - **MobileMenu**: Hamburger menu for mobile navigation
     - **ThemeSwitcher**: Toggle for light/dark modes
   - Sticky positioning at the top of the viewport
   - Responsive design for all device sizes
   - Accessible with proper ARIA attributes and keyboard navigation

3. **ContentContainer**
   - Main content area with proper padding and max-width
   - Integrates background patterns or design elements
   - Adjusts width based on sidebar visibility

4. **AppSidebar (Optional)**
   - Collapsible sidebar for desktop
   - Hidden on mobile (complementing header mobile navigation)
   - Toggle functionality coordinated with header

5. **AppFooter**
   - Simple footer with copyright and links
   - Responsive design with proper spacing

## Implementation Approach

1. **Create Base Structure**:
   ```tsx
   // components/app-layout/index.tsx
   import { AppHeader } from "./app-header";
   import { AppSidebar } from "./app-sidebar";
   import { AppFooter } from "./app-footer";
   import { ContentContainer } from "./content-container";

   interface AppLayoutProps {
     children: React.ReactNode;
     showSidebar?: boolean;
   }

   export function AppLayout({ children, showSidebar = false }: AppLayoutProps) {
     return (
       <div className="min-h-screen flex flex-col">
         <AppHeader />
         <div className="flex flex-1">
           {showSidebar && <AppSidebar />}
           <ContentContainer>{children}</ContentContainer>
         </div>
         <AppFooter />
       </div>
     );
   }
   ```

2. **Implement Header Component**:
   ```tsx
   // components/app-layout/app-header/index.tsx
   import { ThemeSwitcher } from "@/components/theme-switcher";
   import { LogoSection } from "./logo-section";
   import { MobileMenu } from "./mobile-menu";
   import { NavigationSection } from "./navigation-section";
   import { UserSection } from "./user-section";

   export interface AppHeaderProps {
     className?: string;
   }

   export function AppHeader({ className }: AppHeaderProps) {
     return (
       <header
         className="sticky top-0 z-40 w-full border-b bg-primary text-primary-foreground shadow-sm"
         aria-label="Main navigation"
       >
         <div className="container flex h-16 items-center justify-between">
           <div className="flex items-center gap-2">
             <MobileMenu />
             <LogoSection />
           </div>
           
           <NavigationSection />
           
           <div className="flex items-center gap-2">
             <ThemeSwitcher />
             <UserSection />
           </div>
         </div>
       </header>
     );
   }
   ```

3. **Implement Header Subcomponents**:
   ```tsx
   // components/app-layout/app-header/logo-section.tsx
   export function LogoSection() {
     return (
       <div className="flex items-center">
         <span className="text-xl font-bold">Company Name</span>
       </div>
     );
   }

   // components/app-layout/app-header/navigation-section.tsx
   export function NavigationSection() {
     return (
       <nav className="hidden md:flex space-x-4">
         <a href="/dashboard" className="hover:text-primary-foreground/80">Dashboard</a>
         <a href="/jobs" className="hover:text-primary-foreground/80">Jobs</a>
         <a href="/candidates" className="hover:text-primary-foreground/80">Candidates</a>
       </nav>
     );
   }

   // components/app-layout/app-header/mobile-menu.tsx
   export function MobileMenu() {
     return (
       <button className="md:hidden p-2" aria-label="Menu">
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
           <line x1="3" y1="12" x2="21" y2="12"></line>
           <line x1="3" y1="6" x2="21" y2="6"></line>
           <line x1="3" y1="18" x2="21" y2="18"></line>
         </svg>
       </button>
     );
   }

   // components/app-layout/app-header/user-section.tsx
   export function UserSection() {
     return (
       <div className="relative">
         <button className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
           <span className="sr-only">User menu</span>
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
             <circle cx="12" cy="7" r="4"></circle>
           </svg>
         </button>
       </div>
     );
   }
   ```

4. **Implement Sidebar Component**:
   ```tsx
   // components/app-layout/app-sidebar/index.tsx
   import { SidebarItem } from "./sidebar-item";
   import { SidebarSection } from "./sidebar-section";

   export function AppSidebar() {
     return (
       <aside className="w-64 bg-card border-r hidden md:block">
         <div className="p-4">
           <SidebarSection title="Main">
             <SidebarItem href="/dashboard" icon="dashboard">Dashboard</SidebarItem>
             <SidebarItem href="/jobs" icon="work">Jobs</SidebarItem>
             <SidebarItem href="/candidates" icon="person">Candidates</SidebarItem>
           </SidebarSection>
           
           <SidebarSection title="Settings">
             <SidebarItem href="/profile" icon="settings">Profile</SidebarItem>
           </SidebarSection>
         </div>
       </aside>
     );
   }
   
   // Export subcomponents for flexibility
   export { SidebarItem, SidebarSection };
   ```

5. **Implement Sidebar Subcomponents**:
   ```tsx
   // components/app-layout/app-sidebar/sidebar-section.tsx
   interface SidebarSectionProps {
     title: string;
     children: React.ReactNode;
   }

   export function SidebarSection({ title, children }: SidebarSectionProps) {
     return (
       <div className="mb-6">
         <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
         <div className="space-y-1">
           {children}
         </div>
       </div>
     );
   }

   // components/app-layout/app-sidebar/sidebar-item.tsx
   interface SidebarItemProps {
     href: string;
     icon?: string;
     children: React.ReactNode;
   }

   export function SidebarItem({ href, icon, children }: SidebarItemProps) {
     return (
       <a 
         href={href} 
         className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
       >
         {icon && (
           <span className="w-4 h-4">
             {/* Icon would be rendered here based on the icon prop */}
           </span>
         )}
         <span>{children}</span>
       </a>
     );
   }
   ```

6. **Implement Content Container**:
   ```tsx
   // components/app-layout/content-container.tsx
   interface ContentContainerProps {
     children: React.ReactNode;
   }

   export function ContentContainer({ children }: ContentContainerProps) {
     return (
       <main className="flex-1 p-6 relative overflow-auto">
         <div className="relative z-10">{children}</div>
       </main>
     );
   }
   ```

7. **Implement Footer**:
   ```tsx
   // components/app-layout/app-footer/index.tsx
   export function AppFooter() {
     return (
       <footer className="border-t py-4 bg-background">
         <div className="container text-center text-sm text-muted-foreground">
           © {new Date().getFullYear()} Company Name. All rights reserved.
         </div>
       </footer>
     );
   }
   ```

## Responsive Behavior

The integrated layout will respond consistently across device sizes:

- **Mobile (< 768px)**
  - Stack all elements vertically
  - Hide sidebar
  - Show mobile menu in header for navigation
  - Full-width content

- **Tablet (768px - 1024px)**
  - Show sidebar
  - Show desktop navigation in header
  - Adjusted content width

- **Desktop (> 1024px)**
  - Full layout with sidebar
  - Extended navigation options in both header and sidebar
  - Optimized content width and spacing

## Implementation Plan

1. Create the base AppLayout component structure
2. Implement AppHeader and its subcomponents
3. Develop ContentContainer component
4. Create AppSidebar with its subcomponents
5. Implement AppFooter component
6. Test integration and responsive behavior
7. Apply to dashboard and other authenticated pages

## Styling Guidelines

- Use Tailwind's utility classes exclusively - no custom CSS
- Follow a consistent color scheme and spacing patterns
- Ensure responsive behavior across different screen sizes
- Support both light and dark mode via the theme system

## Conclusion

This integrated approach provides a complete layout system with all components contained within a single module structure. By implementing the header as part of the layout module, we ensure consistency and tight integration between all layout elements while maintaining the benefits of modularity.

The structure follows the project's modular architecture principles while creating a cohesive user experience. Each component can evolve independently within the layout module, but they're designed to work together seamlessly as a complete system.