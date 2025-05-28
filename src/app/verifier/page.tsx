"use client";

import Image from "next/image";
import { ConnectButton } from "thirdweb/react";
import thirdwebIcon from "@public/logo2.svg";
import { client } from "../client";
import VerifierNavbar from "../components/VerifierNavbar";

export default function VerifierPage() {
  return (
    <>
      <VerifierNavbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container max-w-screen-lg mx-auto px-4 py-16">
          <div className="backdrop-blur-sm bg-white/5 rounded-3xl p-8 shadow-2xl border border-white/10">
            <Header />

            <div className="flex justify-center mb-16">
              <ConnectButton client={client} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function Header() {
  return (
    <header className="flex flex-col items-center mb-16">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
        <Image
          src={thirdwebIcon}
          alt=""
          className="size-[150px] md:size-[180px] relative z-10"
          style={{
            filter: "drop-shadow(0px 0px 24px rgba(59, 130, 246, 0.5))",
          }}
        />
      </div>

      <h1 className="text-3xl md:text-6xl font-bold tracking-tight mb-6 text-center bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent">
        Verifier Portal
      </h1>

      <p className="text-slate-300 text-lg text-center max-w-2xl">
        Verify and validate digital passport credentials
      </p>
    </header>
  );
} 