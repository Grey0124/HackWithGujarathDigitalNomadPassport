"use client";

import Image from "next/image";
import { ConnectButton } from "thirdweb/react";
import thirdwebIcon from "@public/logo2.svg";
import { client } from "./client";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container max-w-screen-lg mx-auto px-4 py-16">
        <div className="backdrop-blur-sm bg-white/5 rounded-3xl p-8 shadow-2xl border border-white/10">
          <Header />

          <div className="flex justify-center mb-16">
            <ConnectButton
              client={client}
              appMetadata={{
                name: "Example App",
                url: "https://example.com",
              }}
            />
          </div>

          <ThirdwebResources />
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

function ThirdwebResources() {
  return (
    <div className="grid gap-6 lg:grid-cols-3 justify-center">
      <ArticleCard
        title="Documentation"
        href="https://portal.thirdweb.com/typescript/v5"
        description="Comprehensive guides and API references"
      />

      <ArticleCard
        title="Components"
        href="https://portal.thirdweb.com/typescript/v5/react"
        description="Explore our React components and hooks"
      />

      <ArticleCard
        title="Dashboard"
        href="https://thirdweb.com/dashboard"
        description="Manage your digital identity and credentials"
      />
    </div>
  );
}

function ArticleCard(props: {
  title: string;
  href: string;
  description: string;
}) {
  return (
    <a
      href={props.href + "?utm_source=next-template"}
      target="_blank"
      className="group flex flex-col bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]"
    >
      <article>
        <h2 className="text-xl font-semibold mb-3 text-blue-400 group-hover:text-blue-300 transition-colors">
          {props.title}
        </h2>
        <p className="text-slate-300">{props.description}</p>
      </article>
    </a>
  );
}
