"use client";

import Image from "next/image";
import Link from "next/link";
import thirdwebIcon from "@public/logo2.svg";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container max-w-screen-lg mx-auto px-4 py-16">
        <div className="backdrop-blur-sm bg-white/5 rounded-3xl p-8 shadow-2xl border border-white/10">
          <Header />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <LoginCard
              title="User Portal"
              description="Access and manage your digital passport credentials"
              href="/user"
              icon="👤"
            />
            <LoginCard
              title="Verifier Portal"
              description="Verify and validate digital passport credentials"
              href="/verifier"
              icon="🔍"
            />
            <LoginCard
              title="Issuer Portal"
              description="Manage and issue digital passports with secure verification"
              href="/issuer"
              icon="📜"
            />
          </div>

          <AboutSection />
        </div>
      </div>
    </main>
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
        Digital Nomad Passport
      </h1>

      <p className="text-slate-300 text-lg text-center max-w-2xl">
        Your gateway to the future of digital identity and verification
      </p>
    </header>
  );
}

function LoginCard({ title, description, href, icon }: { title: string; description: string; href: string; icon: string }) {
  return (
    <Link
      href={href}
      className="group p-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-blue-400 transition-colors">
        {title}
      </h3>
      <p className="text-slate-400">{description}</p>
    </Link>
  );
}

function AboutSection() {
  return (
    <section className="mt-16 pt-16 border-t border-white/10">
      <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent">
        About DiniP
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">What is DiniP?</h3>
          <p className="text-slate-300">
            DiniP (Digital Nomad Passport) is a revolutionary platform that leverages blockchain technology
            to provide secure, verifiable digital identities for digital nomads and remote workers.
          </p>
        </div>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Key Features</h3>
          <ul className="text-slate-300 space-y-2">
            <li>• Secure digital identity verification</li>
            <li>• Blockchain-based credential management</li>
            <li>• Decentralized verification system</li>
            <li>• User-friendly interface for all stakeholders</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
