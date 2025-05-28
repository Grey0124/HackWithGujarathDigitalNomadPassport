"use client";

import { useEffect, useState } from "react";
import { EthrDID } from "ethr-did";
import { Web3Provider } from "@ethersproject/providers";
import { ConnectButton } from "thirdweb/react";
import UserNavbar from "../components/UserNavbar";
import { client } from "@/app/client";

export default function DIDTestPage() {
  const [didInfo, setDidInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initEthrDID() {
      try {
        setLoading(true);
        setError(null);
        const provider = new Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        const network = await provider.getNetwork();

        const ethrDid = new EthrDID({
          identifier: address,
          txSigner: signer as any,
          chainNameOrId: network.chainId,
        });

        setDidInfo({ ethrDid, address, network });
      } catch (err: any) {
        setError(err.message || "Failed to initialize DID");
      } finally {
        setLoading(false);
      }
    }

    initEthrDID();
  }, []);

  return (
    <>
      <UserNavbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container max-w-screen-lg mx-auto px-4 py-16">
          <div className="backdrop-blur-sm bg-white/5 rounded-3xl p-8 shadow-2xl border border-white/10">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent">
              DID Test Page
            </h1>

            <div className="flex justify-center mb-16">
              <ConnectButton client={client} />
            </div>

            {loading ? (
              <div className="text-center text-slate-300">Loading...</div>
            ) : error ? (
              <div className="text-center text-red-500">{error}</div>
            ) : didInfo ? (
              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-lg">
                  <p className="text-slate-300">
                    <span className="text-blue-400">Address:</span> {didInfo.address}
                  </p>
                  <p className="text-slate-300">
                    <span className="text-blue-400">Network:</span> {didInfo.network.name} (Chain ID: {didInfo.network.chainId})
                  </p>
                  <p className="text-slate-300">
                    <span className="text-blue-400">DID:</span> {didInfo.ethrDid.did}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
} 