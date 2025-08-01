"use client";

import { useState } from "react";
import { User, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";

export function UserSection() {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut } = useClerk();

  return (
    <div className="relative">
      <button 
        className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/30 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
      >
        <User size={16} />
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-popover rounded-md shadow-lg border z-40">
            <div className="py-1">
              <Link 
                href="/profile" 
                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => setIsOpen(false)}
              >
                <Settings size={16} />
                Profile Settings
              </Link>
              <button
                onClick={() => {
                  signOut();
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground w-full text-left"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}