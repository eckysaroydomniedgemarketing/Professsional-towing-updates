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
      className="sticky top-0 z-40 w-full border-b bg-sky-600 text-white shadow-sm"
      aria-label="Main navigation"
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <MobileMenu />
          <LogoSection />
        </div>
        
        <NavigationSection />
        
        <div className="flex items-center gap-2">
          <UserSection />
        </div>
      </div>
    </header>
  );
}