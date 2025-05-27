"use client";

import { useState } from "react";
import Image from "next/image";
import thirdwebIcon from "@public/logo2.svg";
import IssuerNavbar from "../components/IssuerNavbar";

export default function AddIssuerPage() {
  const [issuerAddress, setIssuerAddress] = useState("");
  const [issuerInfo, setIssuerInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // TODO: Implement the actual issuer addition logic here
      console.log("Adding issuer:", { issuerAddress, issuerInfo });
      
      // Reset form
      setIssuerAddress("");
      setIssuerInfo("");
      
      // Show success message
      alert("Issuer added successfully!");
    } catch (error) {
      console.error("Error adding issuer:", error);
      alert("Failed to add issuer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <IssuerNavbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container max-w-screen-lg mx-auto px-4 py-16">
          <div className="backdrop-blur-sm bg-white/5 rounded-3xl p-8 shadow-2xl border border-white/10">
            <Header />
            
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mt-12 space-y-6">
              <div className="space-y-2">
                <label htmlFor="issuerAddress" className="block text-sm font-medium text-slate-300">
                  Issuer Address
                </label>
                <input
                  type="text"
                  id="issuerAddress"
                  value={issuerAddress}
                  onChange={(e) => setIssuerAddress(e.target.value)}
                  placeholder="Enter Ethereum address"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="issuerInfo" className="block text-sm font-medium text-slate-300">
                  Issuer Information
                </label>
                <textarea
                  id="issuerInfo"
                  value={issuerInfo}
                  onChange={(e) => setIssuerInfo(e.target.value)}
                  placeholder="Enter issuer details and verification information"
                  rows={4}
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
                {isLoading ? 'Adding Issuer...' : 'Add Issuer'}
              </button>
            </form>
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
        Add New Issuer
      </h1>
      <p className="text-slate-300 text-center max-w-2xl">
        Add a new authorized issuer to the network. This issuer will be able to verify and issue digital passports.
      </p>
    </header>
  );
} 