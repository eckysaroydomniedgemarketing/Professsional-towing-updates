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