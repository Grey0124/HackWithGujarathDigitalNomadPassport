"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { ethers } from "ethers";
import VerifierNavbar from "../components/VerifierNavbar";
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorizedVerifier, setIsAuthorizedVerifier] = useState(false);

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

  useEffect(() => {
    if (account) {
      checkVerifierStatus();
    }
  }, [account]);

  const checkVerifierStatus = async () => {
    try {
      if (!account?.address) {
        setError("No wallet connected");
        return;
      }

      const contract = getContract();
      
      // Check if user is an authorized verifier
      const isAuthorized = await contract.authorizedVerifiers(account.address);
      console.log("Is authorized verifier:", isAuthorized, "Address:", account.address);
      
      setIsAuthorizedVerifier(isAuthorized);

      if (!isAuthorized) {
        setError("You are not an authorized verifier");
      }
    } catch (err: any) {
      console.error("Error checking verifier status:", err);
      setError("Failed to verify status: " + err.message);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      if (!account) {
        throw new Error("Please connect your wallet first");
      }

      if (!isAuthorizedVerifier) {
        throw new Error("You are not an authorized verifier");
      }

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
      console.error("Error verifying passport:", err);
      setError("Failed to verify passport: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <VerifierNavbar />
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
            ) : !isAuthorizedVerifier ? (
              <div className="text-center text-red-400">
                You are not an authorized verifier
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    {error}
                  </div>
                )}

                <form onSubmit={handleVerify} className="max-w-2xl mx-auto space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="passportHash" className="block text-sm font-medium text-slate-300">
                      Passport Hash
                    </label>
                    <input
                      type="text"
                      id="passportHash"
                      value={passportHash}
                      onChange={(e) => setPassportHash(e.target.value)}
                      placeholder="Enter passport hash"
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
                    {isLoading ? 'Verifying...' : 'Verify Passport'}
                  </button>
                </form>

                {verificationResult && (
                  <div className="mt-8 p-6 rounded-lg bg-white/5 border border-white/10">
                    <h2 className="text-xl font-semibold text-white mb-4">Verification Result</h2>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <span className="text-slate-300 w-32">Status:</span>
                        <span className={`font-medium ${
                          verificationResult.isAnchored && !verificationResult.isRevoked
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}>
                          {verificationResult.isAnchored && !verificationResult.isRevoked
                            ? 'Valid'
                            : verificationResult.isRevoked
                            ? 'Revoked'
                            : 'Invalid'}
                        </span>
                      </div>
                      {verificationResult.isAnchored && (
                        <>
                          <div className="flex items-center">
                            <span className="text-slate-300 w-32">Type:</span>
                            <span className="text-white">{verificationResult.pType}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-slate-300 w-32">Issuer:</span>
                            <span className="text-white">{verificationResult.issuer}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-slate-300 w-32">Issued At:</span>
                            <span className="text-white">{new Date(verificationResult.issuedAt * 1000).toLocaleString()}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
} 