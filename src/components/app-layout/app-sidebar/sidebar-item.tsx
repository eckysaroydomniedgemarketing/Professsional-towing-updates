"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  href: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

export function SidebarItem({ href, icon: Icon, children }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link 
      href={href} 
      className={cn(
        "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
        isActive 
          ? "bg-sky-100 text-sky-900 font-medium border-l-4 border-sky-600" 
          : "hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      {Icon && (
        <Icon size={18} className="shrink-0" />
      )}
      <span>{children}</span>
    </Link>
  );
}