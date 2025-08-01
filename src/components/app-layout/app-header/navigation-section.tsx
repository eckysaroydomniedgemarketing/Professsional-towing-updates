import Link from "next/link";

export function NavigationSection() {
  return (
    <nav className="hidden md:flex space-x-4">
      <Link href="/dashboard" className="hover:text-primary-foreground/80 transition-colors">
        Dashboard
      </Link>
      <Link href="/jobs" className="hover:text-primary-foreground/80 transition-colors">
        Jobs
      </Link>
      <Link href="/fleet" className="hover:text-primary-foreground/80 transition-colors">
        Fleet
      </Link>
      <Link href="/customers" className="hover:text-primary-foreground/80 transition-colors">
        Customers
      </Link>
    </nav>
  );
}