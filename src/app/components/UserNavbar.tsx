"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function UserNavbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-900/50 border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link 
            href="/user" 
            className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            User Portal
          </Link>
          
          <div className="flex items-center space-x-1">
            <NavLink href="/my-passport" pathname={pathname}>
              My Passport
            </NavLink>
            <NavLink href="/verification-history" pathname={pathname}>
              Verification History
            </NavLink>
            <NavLink href="/user-settings" pathname={pathname}>
              Settings
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, pathname, children }: { href: string; pathname: string; children: React.ReactNode }) {
  const isActive = pathname === href;
  
  return (
    <Link
      href={href}
      className={`
        px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${isActive 
          ? 'bg-white/10 text-blue-400' 
          : 'text-slate-300 hover:text-white hover:bg-white/5'
        }
      `}
    >
      {children}
    </Link>
  );
} 