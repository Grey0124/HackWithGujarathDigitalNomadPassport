"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useActiveAccount } from "thirdweb/react";
import { ethers } from "ethers";
import AnchorABI from "@/contracts/Anchor.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NEW_ANCHOR_CONTRACT_FINAL as string;

export default function IssuerNavbar() {
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
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, AnchorABI.abi, provider);
      
      // Check if user is an authorized issuer
      const isAuthorized = await contract.authorizedIssuers(account?.address);
      const isSuspended = await contract.suspendedIssuers(account?.address);
      setIsAuthorizedIssuer(isAuthorized && !isSuspended);

      // Check if user is the contract owner
      const owner = await contract.owner();
      setIsOwner(owner.toLowerCase() === account?.address.toLowerCase());
    } catch (err) {
      console.error("Error checking issuer status:", err);
      setIsAuthorizedIssuer(false);
      setIsOwner(false);
    }
  };

  return (
    <nav className="bg-slate-900/50 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
      <div className="container max-w-screen-lg mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-white font-medium hover:text-blue-400 transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
            >
              Home
            </Link>
            {isAuthorizedIssuer && (
              <>
                <Link 
                  href="/manage-credentials" 
                  className="text-white font-medium hover:text-blue-400 transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  Manage Credentials
                </Link>
                <Link 
                  href="/issue-passport" 
                  className="text-white font-medium hover:text-blue-400 transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  Issue Passport
                </Link>
              </>
            )}
            {isOwner && (
              <Link 
                href="/add-issuer" 
                className="text-white font-medium hover:text-blue-400 transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
              >
                Manage Issuers
              </Link>
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