"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { ethers } from "ethers";
import IssuerNavbar from "../components/IssuerNavbar";
import AnchorABI from "@/contracts/Anchor.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NEW_ANCHOR_CONTRACT_FINAL as string;

interface Credential {
  id: string;
  type: string;
  status: string;
  issuedAt: number;
  holder: string;
}

export default function ManageCredentialsPage() {
  const account = useActiveAccount();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [issuerInfo, setIssuerInfo] = useState("");
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isAuthorizedIssuer, setIsAuthorizedIssuer] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);

  useEffect(() => {
    if (account) {
      setError(null);
      setSuccess(null);
      setIsLoading(true);
      checkIssuerStatus();
    } else {
      setError("Please connect your wallet");
      setIsLoading(false);
    }
  }, [account]);

  const checkIssuerStatus = async () => {
    try {
      setError(null);
      setSuccess(null);
      
      if (!account?.address) {
        setError("No wallet connected");
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, AnchorABI.abi, provider);
      
      // Check if user is an authorized issuer
      const isAuthorized = await contract.authorizedIssuers(account.address);
      const suspended = await contract.suspendedIssuers(account.address);
      
      setIsAuthorizedIssuer(isAuthorized);
      setIsSuspended(suspended);

      if (isAuthorized && !suspended) {
        await fetchCredentials();
        await fetchIssuerInfo();
      } else {
        setError(suspended ? "Your issuer account has been suspended" : "You are not an authorized issuer");
      }
    } catch (err: any) {
      console.error("Error checking issuer status:", err);
      setError("Failed to verify issuer status: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIssuerInfo = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, AnchorABI.abi, provider);
      const info = await contract.issuerInfo(account?.address);
      setIssuerInfo(info || "");
    } catch (err: any) {
      console.error("Error fetching issuer info:", err);
    }
  };

  const handleUpdateIssuerInfo = async () => {
    try {
      if (!account) {
        throw new Error("Please connect your wallet first");
      }

      if (!isAuthorizedIssuer) {
        throw new Error("You are not an authorized issuer");
      }

      if (isSuspended) {
        throw new Error("Your issuer account has been suspended");
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, AnchorABI.abi, provider.getSigner());
      
      const tx = await contract.setIssuerInfo(issuerInfo);
      await tx.wait();
      
      setIsEditingInfo(false);
      setSuccess("Issuer information updated successfully!");
    } catch (err: any) {
      console.error("Error updating issuer info:", err);
      setError("Failed to update issuer info: " + err.message);
    }
  };

  const fetchCredentials = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      if (!account?.address) {
        throw new Error("No wallet connected");
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, AnchorABI.abi, provider);

      // Recheck authorization status before fetching
      const isAuthorized = await contract.authorizedIssuers(account.address);
      const suspended = await contract.suspendedIssuers(account.address);

      if (!isAuthorized) {
        throw new Error("You are not an authorized issuer");
      }

      if (suspended) {
        throw new Error("Your issuer account has been suspended");
      }

      // Get all credentials issued by this issuer using HashAnchored event
      const filter = contract.filters.HashAnchored(null, account.address, null);
      const events = await contract.queryFilter(filter);

      const credentialsList = await Promise.all(
        events.map(async (event) => {
          if (!event.args) return null;
          const hash = event.args.hash;
          const isRevoked = await contract.hasRevoked(hash);
          
          return {
            id: hash,
            type: event.args.pType,
            status: isRevoked ? "Revoked" : "Active",
            issuedAt: event.args.timestamp.toNumber(),
            holder: event.args.user,
          };
        })
      );

      setCredentials(credentialsList.filter((cred): cred is Credential => cred !== null));
    } catch (err: any) {
      console.error("Error fetching credentials:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeCredential = async (credentialId: string) => {
    try {
      if (!account) {
        throw new Error("Please connect your wallet first");
      }

      if (!isAuthorizedIssuer) {
        throw new Error("You are not an authorized issuer");
      }

      if (isSuspended) {
        throw new Error("Your issuer account has been suspended");
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, AnchorABI.abi, provider.getSigner());
      
      const tx = await contract.revokeHash(credentialId);
      await tx.wait();
      
      // Refresh credentials list
      await fetchCredentials();
      
      setSuccess("Credential revoked successfully!");
    } catch (err: any) {
      console.error("Error revoking credential:", err);
      setError("Failed to revoke credential: " + err.message);
    }
  };

  return (
    <>
      <IssuerNavbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container max-w-screen-lg mx-auto px-4 py-16">
          <div className="backdrop-blur-sm bg-white/5 rounded-3xl p-8 shadow-2xl border border-white/10">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent">
              Manage Credentials
            </h1>

            {!account ? (
              <div className="text-center text-slate-300">
                Please connect your wallet to continue
              </div>
            ) : !isAuthorizedIssuer ? (
              <div className="text-center text-red-400">
                You are not an authorized issuer
              </div>
            ) : isSuspended ? (
              <div className="text-center text-red-400">
                Your issuer account has been suspended
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="mb-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
                    {success}
                  </div>
                )}

                {/* Issuer Information Section */}
                <div className="mb-8 p-4 rounded-lg bg-white/5 border border-white/10">
                  <h2 className="text-xl font-semibold text-white mb-4">Issuer Information</h2>
                  {isEditingInfo ? (
                    <div className="space-y-4">
                      <textarea
                        value={issuerInfo}
                        onChange={(e) => setIssuerInfo(e.target.value)}
                        placeholder="Enter your issuer information"
                        rows={4}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="flex space-x-4">
                        <button
                          onClick={handleUpdateIssuerInfo}
                          className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setIsEditingInfo(false)}
                          className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-slate-300 mb-4">{issuerInfo || "No information provided"}</p>
                      <button
                        onClick={() => setIsEditingInfo(true)}
                        className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                      >
                        Edit Information
                      </button>
                    </div>
                  )}
                </div>

                {/* Credentials Section */}
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Issued Credentials</h2>
                  {isLoading ? (
                    <div className="text-center text-slate-300">Loading credentials...</div>
                  ) : credentials.length === 0 ? (
                    <div className="text-center text-slate-300">No credentials found</div>
                  ) : (
                    <div className="space-y-4">
                      {credentials.map((credential) => (
                        <div
                          key={credential.id}
                          className="p-4 rounded-lg bg-white/5 border border-white/10"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-medium text-white">
                                {credential.type}
                              </h3>
                              <p className="text-slate-400 text-sm">
                                Holder: {credential.holder}
                              </p>
                              <p className="text-slate-400 text-sm">
                                Issued: {new Date(credential.issuedAt * 1000).toLocaleString()}
                              </p>
                              <p className={`text-sm ${
                                credential.status === "Active" ? "text-green-400" : "text-red-400"
                              }`}>
                                Status: {credential.status}
                              </p>
                            </div>
                            {credential.status === "Active" && (
                              <button
                                onClick={() => handleRevokeCredential(credential.id)}
                                className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
} 