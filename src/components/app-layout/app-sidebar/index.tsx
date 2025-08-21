"use client";

import { SidebarItem } from "./sidebar-item";
import { SidebarSection } from "./sidebar-section";
import { 
  LayoutDashboard, 
  Settings,
  FileText,
  Eye
} from "lucide-react";

export function AppSidebar() {
  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 hidden md:block">
      <div className="p-4 h-full overflow-y-auto">
        <SidebarSection title="Main">
          <SidebarItem href="/dashboard" icon={LayoutDashboard}>
            Dashboard
          </SidebarItem>
          <SidebarItem href="/case-processing" icon={FileText}>
            Case Processing
          </SidebarItem>
          <SidebarItem href="/agent-updates-visibility" icon={Eye}>
            Agent Updates
          </SidebarItem>
        </SidebarSection>
        
        <SidebarSection title="Settings">
          <SidebarItem href="/settings" icon={Settings}>
            Settings
          </SidebarItem>
        </SidebarSection>
      </div>
    </aside>
  );
}

export { SidebarItem, SidebarSection };