"use client";

import Image from "next/image";
import thirdwebIcon from "@public/logo2.svg";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container max-w-screen-lg mx-auto px-4 py-16">
        <div className="backdrop-blur-sm bg-white/5 rounded-3xl p-8 shadow-2xl border border-white/10">
          <Header />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Our Mission</h2>
              <p className="text-slate-300">
                DiniP aims to revolutionize digital identity management for digital nomads and remote workers
                by providing a secure, decentralized platform for identity verification and credential management.
              </p>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Technology Stack</h2>
              <ul className="text-slate-300 space-y-2">
                <li>• Next.js for the frontend</li>
                <li>• Solidity smart contracts for identity management</li>
                <li>• IPFS for decentralized storage</li>
                <li>• Web3 integration for blockchain interactions</li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-16 border-t border-white/10">
            <h2 className="text-2xl font-bold text-white mb-8">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StepCard
                number="1"
                title="Create Identity"
                description="Users create their digital identity with secure credentials"
              />
              <StepCard
                number="2"
                title="Get Verified"
                description="Authorized issuers verify and validate user credentials"
              />
              <StepCard
                number="3"
                title="Use Passport"
                description="Use your verified digital passport for various services"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
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
        About DiniP
      </h1>
    </header>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl bg-white/5 border border-white/10">
      <div className="text-2xl font-bold text-blue-400 mb-4">Step {number}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-300">{description}</p>
    </div>
  );
} 