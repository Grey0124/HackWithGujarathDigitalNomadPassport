"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import AnchorABI from "@/contracts/Anchor.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NEW_ANCHOR_CONTRACT_FINAL as string;

export default function VerifierNavbar() {
  const pathname = usePathname();
  const account = useActiveAccount();
  const [isAuthorizedVerifier, setIsAuthorizedVerifier] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (account) {
      checkVerifierStatus();
    }
  }, [account]);

  const checkVerifierStatus = async () => {
    try {
      if (!account?.address) return;

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, AnchorABI.abi, provider);
      
      // Check if user is an authorized verifier
      const isAuthorized = await contract.authorizedVerifiers(account.address);
      const owner = await contract.owner();
      
      setIsAuthorizedVerifier(isAuthorized);
      setIsOwner(owner.toLowerCase() === account.address.toLowerCase());
    } catch (err) {
      console.error("Error checking verifier status:", err);
      setIsAuthorizedVerifier(false);
      setIsOwner(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-900/50 border-b border-white/10">
      <div className="container max-w-screen-lg mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link 
            href="/verifier" 
            className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            Verifier Portal
          </Link>
          
          <div className="flex items-center space-x-1">
            <NavLink href="/verifier" pathname={pathname}>
              Home
            </NavLink>
            {isAuthorizedVerifier && (
              <>
                <NavLink href="/verify-passport" pathname={pathname}>
                  Verify Passport
                </NavLink>
              </>
            )}
          </div>

          <div className="flex items-center">
            {account ? (
              <div className="flex items-center space-x-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                <div className={`w-2 h-2 rounded-full ${isAuthorizedVerifier ? 'bg-green-400' : 'bg-red-400'}`}></div>
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