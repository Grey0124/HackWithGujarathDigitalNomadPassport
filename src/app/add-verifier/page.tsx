"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { ethers } from "ethers";
import thirdwebIcon from "@public/logo2.svg";
import IssuerNavbar from "../components/IssuerNavbar";
import AnchorABI from "@/contracts/Anchor.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NEW_ANCHOR_CONTRACT_FINAL as string;

interface Verifier {
  address: string;
}

export default function AddVerifierPage() {
  const [verifierAddress, setVerifierAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verifiers, setVerifiers] = useState<Verifier[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  const account = useActiveAccount();
  const { mutateAsync: sendTransaction } = useSendTransaction();

  useEffect(() => {
    if (account) {
      fetchVerifiers();
      checkIfOwner();
    }
  }, [account]);

  const checkIfOwner = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, AnchorABI.abi, provider);
      const owner = await contract.owner();
      setIsOwner(owner.toLowerCase() === account?.address.toLowerCase());
    } catch (err) {
      console.error("Error checking owner:", err);
      setIsOwner(false);
    }
  };

  const fetchVerifiers = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, AnchorABI.abi, provider);
      
      // Get all events for VerifierAdded
      const filter = contract.filters.VerifierAdded();
      const events = await contract.queryFilter(filter);
      
      const verifiersList: Verifier[] = [];
      const seenAddresses = new Set<string>(); // Track seen addresses
      
      for (const event of events) {
        if (!event.args) continue;
        const address = event.args.verifier;
        
        // Skip if we've already seen this address
        if (seenAddresses.has(address)) continue;
        seenAddresses.add(address);
        
        // Only add if still authorized
        const isAuthorized = await contract.authorizedVerifiers(address);
        if (!isAuthorized) continue;
        
        verifiersList.push({
          address
        });
      }
      
      setVerifiers(verifiersList);
    } catch (err: any) {
      console.error("Error fetching verifiers:", err);
      setError("Failed to fetch verifiers: " + err.message);
    }
  };

  const handleAddVerifier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    
    try {
      if (!account) {
        throw new Error("Please connect your wallet first");
      }

      if (!isOwner) {
        throw new Error("Only contract owner can add verifiers");
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, AnchorABI.abi, provider.getSigner());
      
      // Check if verifier already exists
      const isAuthorized = await contract.authorizedVerifiers(verifierAddress);
      if (isAuthorized) {
        throw new Error("Verifier already exists");
      }
      
      // Add verifier
      const tx = await contract.addVerifier(verifierAddress);
      await tx.wait();
      
      // Reset form
      setVerifierAddress("");
      
      // Refresh verifiers list
      await fetchVerifiers();
      
      setSuccess("Verifier added successfully!");
    } catch (err: any) {
      console.error("Error adding verifier:", err);
      setError("Failed to add verifier: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveVerifier = async (address: string) => {
    try {
      if (!account) {
        throw new Error("Please connect your wallet first");
      }

      if (!isOwner) {
        throw new Error("Only contract owner can remove verifiers");
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, AnchorABI.abi, provider.getSigner());
      
      const tx = await contract.removeVerifier(address);
      await tx.wait();
      
      // Refresh verifiers list
      await fetchVerifiers();
      
      setSuccess("Verifier removed successfully!");
    } catch (err: any) {
      console.error("Error removing verifier:", err);
      setError("Failed to remove verifier: " + err.message);
    }
  };

  return (
    <>
      <IssuerNavbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container max-w-screen-lg mx-auto px-4 py-16">
          <div className="backdrop-blur-sm bg-white/5 rounded-3xl p-8 shadow-2xl border border-white/10">
            <Header />
            
            {error && (
              <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
                {success}
              </div>
            )}
            
            {isOwner && (
              <form onSubmit={handleAddVerifier} className="max-w-2xl mx-auto mt-12 space-y-6">
                <div className="space-y-2">
                  <label htmlFor="verifierAddress" className="block text-sm font-medium text-slate-300">
                    Verifier Address
                  </label>
                  <input
                    type="text"
                    id="verifierAddress"
                    value={verifierAddress}
                    onChange={(e) => setVerifierAddress(e.target.value)}
                    placeholder="Enter Ethereum address"
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`
                    w-full px-6 py-3 rounded-lg font-medium text-white
                    ${isLoading 
                      ? 'bg-blue-500/50 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600'
                    }
                    transition-colors duration-200
                  `}
                >
                  {isLoading ? 'Adding Verifier...' : 'Add Verifier'}
                </button>
              </form>
            )}

            <div className="mt-16">
              <h2 className="text-2xl font-bold text-white mb-6">Authorized Verifiers</h2>
              <div className="grid gap-4">
                {verifiers.map((verifier) => (
                  <div 
                    key={verifier.address}
                    className="p-4 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-slate-300 font-medium">{verifier.address}</p>
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => handleRemoveVerifier(verifier.address)}
                          className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {verifiers.length === 0 && (
                  <p className="text-slate-400 text-center py-8">
                    No authorized verifiers found
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function Header() {
  return (
    <header className="flex flex-col items-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
        <Image
          src={thirdwebIcon}
          alt=""
          className="size-[100px] md:size-[120px] relative z-10"
          style={{
            filter: "drop-shadow(0px 0px 24px rgba(59, 130, 246, 0.5))",
          }}
        />
      </div>

      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 text-center bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent">
        Manage Verifiers
      </h1>
      <p className="text-slate-300 text-center max-w-2xl">
        Add or remove authorized verifiers from the network. Only the contract owner can manage verifiers.
      </p>
    </header>
  );
} 