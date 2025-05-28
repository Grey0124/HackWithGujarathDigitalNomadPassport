"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { ethers } from "ethers";
import UserNavbar from "../components/UserNavbar";
import AnchorABI from "@/contracts/Anchor.json";

// Use Alchemy's public RPC URL for Sepolia
const RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/dnbqygHxhAg5Vbvt3LRA8xYeQ5T80LDW";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NEW_ANCHOR_CONTRACT_FINAL as string;

interface VerificationResult {
  isAnchored: boolean;
  isRevoked: boolean;
  issuer: string;
  pType: string;
  issuedAt: number;
}

export default function VerifyPassportPage() {
  const account = useActiveAccount();
  const [passportHash, setPassportHash] = useState("");
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorizedVerifier, setIsAuthorizedVerifier] = useState<boolean | null>(null);

  const getContract = (withSigner = false) => {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL, {
      name: 'sepolia',
      chainId: 11155111,
      _defaultProvider: (providers) => new providers.JsonRpcProvider(RPC_URL)
    });

    if (withSigner && account) {
      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
      return new ethers.Contract(CONTRACT_ADDRESS, AnchorABI.abi, signer);
    }

    return new ethers.Contract(CONTRACT_ADDRESS, AnchorABI.abi, provider);
  };

  const checkVerifierStatus = async () => {
    if (!account) {
      setIsAuthorizedVerifier(false);
      return;
    }

    try {
      const contract = getContract();
      const isAuthorized = await contract.authorizedVerifiers(account.address);
      setIsAuthorizedVerifier(isAuthorized);
    } catch (err) {
      console.error("Error checking verifier status:", err);
      setIsAuthorizedVerifier(false);
    }
  };

  useEffect(() => {
    checkVerifierStatus();
  }, [account]);

  const verifyPassport = async () => {
    if (!account) {
      setError("Please connect your wallet first");
      return;
    }

    if (!isAuthorizedVerifier) {
      setError("You are not an authorized verifier");
      return;
    }

    if (!passportHash) {
      setError("Please enter a passport hash");
      return;
    }

    setLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      const contract = getContract(true);
      const result = await contract.verifyPassport(passportHash);

      setVerificationResult({
        isAnchored: result.isAnchored_,
        isRevoked: result.isRevoked_,
        issuer: result.issuer_,
        pType: result.pType_,
        issuedAt: result.issuedAt_.toNumber()
      });
    } catch (err: any) {
      console.error("Verification error:", err);
      setError("Failed to verify passport: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <UserNavbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container max-w-screen-lg mx-auto px-4 py-16">
          <div className="backdrop-blur-sm bg-white/5 rounded-3xl p-8 shadow-2xl border border-white/10">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent">
              Verify Passport
            </h1>

            {!account ? (
              <div className="text-center text-slate-300">
                Please connect your wallet to continue
              </div>
            ) : isAuthorizedVerifier === false ? (
              <div className="text-center text-red-400">
                You are not an authorized verifier
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="space-y-2">
                  <label htmlFor="passportHash" className="block text-sm font-medium text-slate-300">
                    Passport Hash
                  </label>
                  <input
                    type="text"
                    id="passportHash"
                    value={passportHash}
                    onChange={(e) => setPassportHash(e.target.value)}
                    placeholder="Enter passport hash to verify"
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 text-red-300 p-4 rounded-xl">
                    {error}
                  </div>
                )}

                <button
                  onClick={verifyPassport}
                  disabled={loading}
                  className={`
                    w-full px-6 py-3 rounded-lg font-medium text-white
                    ${loading 
                      ? 'bg-blue-500/50 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600'
                    }
                    transition-colors duration-200
                  `}
                >
                  {loading ? 'Verifying...' : 'Verify Passport'}
                </button>

                {verificationResult && (
                  <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 space-y-4">
                    <h2 className="text-xl font-semibold text-white mb-4">Verification Result</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400">Status</p>
                        <p className={`text-lg font-medium ${verificationResult.isAnchored && !verificationResult.isRevoked ? 'text-green-400' : 'text-red-400'}`}>
                          {verificationResult.isAnchored && !verificationResult.isRevoked ? 'Valid' : 'Invalid'}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-400">Type</p>
                        <p className="text-lg font-medium text-white">{verificationResult.pType}</p>
                      </div>

                      <div className="md:col-span-2">
                        <p className="text-slate-400">Issuer</p>
                        <p className="text-lg font-medium text-white font-mono break-all">
                          {verificationResult.issuer}
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <p className="text-slate-400">Issued At</p>
                        <p className="text-lg font-medium text-white">
                          {new Date(verificationResult.issuedAt * 1000).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {verificationResult.isRevoked && (
                      <div className="mt-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                        <p className="text-red-400 font-medium">This passport has been revoked</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
} 