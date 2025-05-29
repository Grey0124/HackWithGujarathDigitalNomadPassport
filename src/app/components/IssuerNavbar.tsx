"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";
import { ethers } from "ethers";
import AnchorABI from "@/contracts/Anchor.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NEW_ANCHOR_CONTRACT_FINAL as string;

export default function IssuerNavbar() {
  const pathname = usePathname();
  const account = useActiveAccount();
  const [isAuthorizedIssuer, setIsAuthorizedIssuer] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (account) {
      checkIssuerStatus();
    }
  }, [account]);

  const checkIssuerStatus = async () => {
    try {
      if (!account?.address) return;

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, AnchorABI.abi, provider);
      
      // Check if user is an authorized issuer
      const isAuthorized = await contract.authorizedIssuers(account.address);
      const isSuspended = await contract.suspendedIssuers(account.address);
      const owner = await contract.owner();
      
      setIsAuthorizedIssuer(isAuthorized && !isSuspended);
      setIsOwner(owner.toLowerCase() === account.address.toLowerCase());
    } catch (err) {
      console.error("Error checking issuer status:", err);
      setIsAuthorizedIssuer(false);
      setIsOwner(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-900/50 border-b border-white/10">
      <div className="container max-w-screen-lg mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link 
            href="/issuer" 
            className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            Issuer Portal
          </Link>
          
          <div className="flex items-center space-x-1">
            <NavLink href="/" pathname={pathname}>
              Home
            </NavLink>
            {isAuthorizedIssuer && (
              <>
                <NavLink href="/manage-credentials" pathname={pathname}>
                  Manage Credentials
                </NavLink>
                <NavLink href="/issue-passport" pathname={pathname}>
                  Issue Passport
                </NavLink>
              </>
            )}
            {isOwner && (
              <>
                <NavLink href="/add-issuer" pathname={pathname}>
                  Manage Issuers
                </NavLink>
                <NavLink href="/add-verifier" pathname={pathname}>
                  Manage Verifiers
                </NavLink>
              </>
            )}
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