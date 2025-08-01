"use client";

import { SidebarItem } from "./sidebar-item";
import { SidebarSection } from "./sidebar-section";
import { 
  LayoutDashboard, 
  Briefcase, 
  Truck, 
  Users,
  Settings,
  FileText,
  BarChart
} from "lucide-react";

export function AppSidebar() {
  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 hidden md:block">
      <div className="p-4 h-full overflow-y-auto">
        <SidebarSection title="Main">
          <SidebarItem href="/dashboard" icon={LayoutDashboard}>
            Dashboard
          </SidebarItem>
          <SidebarItem href="/jobs" icon={Briefcase}>
            Jobs
          </SidebarItem>
          <SidebarItem href="/fleet" icon={Truck}>
            Fleet
          </SidebarItem>
          <SidebarItem href="/customers" icon={Users}>
            Customers
          </SidebarItem>
        </SidebarSection>
        
        <SidebarSection title="Reports">
          <SidebarItem href="/reports/revenue" icon={BarChart}>
            Revenue
          </SidebarItem>
          <SidebarItem href="/reports/invoices" icon={FileText}>
            Invoices
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