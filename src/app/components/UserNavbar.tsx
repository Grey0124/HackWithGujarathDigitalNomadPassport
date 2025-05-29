"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";

export default function UserNavbar() {
  const pathname = usePathname();
  const account = useActiveAccount();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-900/50 border-b border-white/10">
      <div className="container max-w-screen-lg mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link 
            href="/user" 
            className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            User Portal
          </Link>
          
          <div className="flex items-center space-x-1">
            <NavLink href="/user" pathname={pathname}>
              Home
            </NavLink>
            <NavLink href="/my-passport" pathname={pathname}>
              My Passport
            </NavLink>
            <NavLink href="/passport-status" pathname={pathname}>
              Passport Status
            </NavLink>
            <NavLink href="/did-test" pathname={pathname}>
              Get-DID
            </NavLink>
            <NavLink href="/user-settings" pathname={pathname}>
              Settings
            </NavLink>
          </div>

          <div className="flex items-center">
            {account ? (
              <div className="flex items-center space-x-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-slate-300 text-sm">
                  {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                <span className="text-slate-300 text-sm">Not Connected</span>
              </div>
            )}
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