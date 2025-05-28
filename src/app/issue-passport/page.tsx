"use client";

import { useState } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";

export default function IssuePassportPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const account = useActiveAccount();
  const { mutateAsync: sendTransaction } = useSendTransaction();

  const handleIssue = async () => {
    if (!account) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/issue-vc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address: account.address }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to issue passport");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container max-w-screen-lg mx-auto px-4 py-16">
        <div className="backdrop-blur-sm bg-white/5 rounded-3xl p-8 shadow-2xl border border-white/10">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent">
            Issue Digital Nomad Passport
          </h1>
      
          {!account ? (
            <div className="text-center py-12">
              <p className="text-xl text-slate-300">Please connect your wallet to continue</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
                <p className="text-slate-300">
                  Connected Address: <span className="text-blue-400 font-mono">{account.address}</span>
                </p>
              </div>
              
              <button
                onClick={handleIssue}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transform transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {loading ? "Issuing..." : "Issue Passport"}
              </button>

              {error && (
                <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 text-red-300 p-4 rounded-xl mt-4">
                  Error: {error}
                </div>
              )}

              {result && (
                <div className="mt-6 space-y-4 bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
                  <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent">
                    Passport Issued Successfully!
                  </h2>
                  <div className="space-y-3">
                    <p className="text-slate-300">
                      <span className="text-blue-400">Transaction Hash:</span>{" "}
                      <span className="font-mono text-white">{result.txHash}</span>
                    </p>
                    <p className="text-slate-300">
                      <span className="text-blue-400">VC Hash:</span>{" "}
                      <span className="font-mono text-white">{result.hash}</span>
                    </p>
                  </div>
                  <div className="mt-6">
                    <h3 className="font-semibold text-blue-400 mb-3">JWT VC:</h3>
                    <pre className="bg-slate-900/50 p-4 rounded-xl overflow-x-auto border border-white/10 text-slate-300 font-mono text-sm">
                      {result.vcJwt}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 