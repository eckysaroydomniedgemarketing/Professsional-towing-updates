"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        className="md:hidden p-2" 
        aria-label="Menu"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <nav className="fixed top-0 left-0 h-full w-64 bg-background shadow-lg">
            <div className="p-4">
              <button 
                onClick={() => setIsOpen(false)}
                className="mb-4 p-2"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
              
              <div className="space-y-2">
                <Link 
                  href="/dashboard" 
                  className="block px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/jobs" 
                  className="block px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  Jobs
                </Link>
                <Link 
                  href="/fleet" 
                  className="block px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  Fleet
                </Link>
                <Link 
                  href="/customers" 
                  className="block px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  Customers
                </Link>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}