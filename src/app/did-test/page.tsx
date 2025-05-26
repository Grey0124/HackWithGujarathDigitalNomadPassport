"use client";

import { useEffect, useState } from "react";
import { EthrDID } from "ethr-did";
import { Web3Provider } from "@ethersproject/providers";

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
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container max-w-screen-lg mx-auto px-4 py-16">
        <div className="backdrop-blur-sm bg-white/5 rounded-3xl p-8 shadow-2xl border border-white/10">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent">
            DID Information
          </h1>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-slate-300">Connecting to wallet...</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 text-red-300 p-4 rounded-xl">
              Error: {error}
            </div>
          ) : didInfo ? (
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-blue-400 text-sm font-medium mb-1">Wallet Address</h2>
                    <p className="font-mono text-white break-all">{didInfo.address}</p>
                  </div>
                  
                  <div>
                    <h2 className="text-blue-400 text-sm font-medium mb-1">Chain ID</h2>
                    <p className="font-mono text-white">{didInfo.network.chainId}</p>
                  </div>
                  
                  <div>
                    <h2 className="text-blue-400 text-sm font-medium mb-1">DID</h2>
                    <p className="font-mono text-white break-all">{didInfo.ethrDid.did}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
                <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent">
                  DID Document
                </h2>
                <pre className="bg-slate-900/50 p-4 rounded-xl overflow-x-auto border border-white/10 text-slate-300 font-mono text-sm">
                  {JSON.stringify(didInfo.ethrDid.document, null, 2)}
                </pre>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
} 