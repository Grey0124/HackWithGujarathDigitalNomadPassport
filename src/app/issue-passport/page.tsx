"use client";

import { useState, useEffect } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import IssuerNavbar from "../components/IssuerNavbar";
import AnchorABI from "@/contracts/Anchor.json";
import { client } from "@/app/client";

interface Application {
  user: string;
  docHashes: string[];
  timestamp: number;
  processed: boolean;
}

// Use Alchemy's public RPC URL for Sepolia
const RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/dnbqygHxhAg5Vbvt3LRA8xYeQ5T80LDW";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NEW_ANCHOR_CONTRACT_FINAL as string;

export default function IssuePassportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const account = useActiveAccount();
  const { mutateAsync: sendTransaction } = useSendTransaction();

  useEffect(() => {
    if (account) {
      checkAuthorization();
    }
  }, [account]);

  const getContract = () => {
    // Create a provider with proper network configuration
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL, {
      name: 'sepolia',
      chainId: 11155111,
      _defaultProvider: (providers) => new providers.JsonRpcProvider(RPC_URL)
    });

    return new ethers.Contract(CONTRACT_ADDRESS, AnchorABI.abi, provider);
  };

  const checkAuthorization = async () => {
    try {
      if (!account?.address) return;

      const contract = getContract();

      // Check if the address is an authorized issuer and not suspended
      const [isIssuer, isSuspended] = await Promise.all([
        contract.authorizedIssuers(account.address),
        contract.suspendedIssuers(account.address)
      ]);

      if (!isIssuer || isSuspended) {
        setError("You are not authorized to access the issuer portal");
        router.push("/");
        return;
      }

      setIsAuthorized(true);
      fetchApplications();
    } catch (err: any) {
      console.error("Authorization check error:", err);
      setError("Failed to check authorization: " + err.message);
    }
  };

  const fetchApplications = async () => {
    try {
      const contract = getContract();
      const count = await contract.getApplicationsCount();
      const apps: Application[] = [];

      for (let i = 0; i < count; i++) {
        const app = await contract.getApplication(i);
        apps.push({
          user: app.user,
          docHashes: app.docHashes,
          timestamp: app.timestamp.toNumber(),
          processed: app.processed
        });
      }

      setApplications(apps);
    } catch (err: any) {
      console.error("Fetch applications error:", err);
      setError("Failed to fetch applications: " + err.message);
    }
  };

  const handleApprove = async (appId: number) => {
    if (!account) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const contractInterface = new ethers.utils.Interface(AnchorABI.abi);
      
      // Generate a random passport hash
      const passportHash = ethers.utils.keccak256(ethers.utils.randomBytes(32));
      
      const tx = await sendTransaction({
        to: CONTRACT_ADDRESS,
        data: contractInterface.encodeFunctionData("processApplication", [
          appId,
          passportHash,
          "DIGITAL_NOMAD"
        ]) as `0x${string}`,
        client,
        chain: {
          id: 11155111,
          rpc: RPC_URL
        }
      });

      await fetchApplications();
    } catch (err: any) {
      console.error("Approve error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (appId: number) => {
    // TODO: Implement rejection logic
    console.log("Rejecting application:", appId);
  };

  const viewDocuments = (docHashes: string[]) => {
    // TODO: Implement document viewing logic
    console.log("Viewing documents:", docHashes);
  };

  return (
    <>
      <IssuerNavbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container max-w-screen-lg mx-auto px-4 py-16">
          <div className="backdrop-blur-sm bg-white/5 rounded-3xl p-8 shadow-2xl border border-white/10">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent">
              Passport Applications
            </h1>
      
            {!account ? (
              <div className="text-center py-12">
                <p className="text-xl text-slate-300">Please connect your wallet to continue</p>
              </div>
            ) : !isAuthorized ? (
              <div className="text-center py-12">
                <p className="text-xl text-slate-300">Checking authorization...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {error && (
                  <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 text-red-300 p-4 rounded-xl">
                    Error: {error}
                  </div>
                )}

                <div className="space-y-4">
                  {applications.map((app, index) => (
                    <div key={index} className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-slate-300">
                            <span className="text-blue-400">Applicant:</span>{" "}
                            <span className="font-mono text-white">{app.user}</span>
                          </p>
                          <p className="text-slate-300 mt-2">
                            <span className="text-blue-400">Submitted:</span>{" "}
                            <span className="text-white">
                              {new Date(app.timestamp * 1000).toLocaleString()}
                            </span>
                          </p>
                          <p className="text-slate-300 mt-2">
                            <span className="text-blue-400">Status:</span>{" "}
                            <span className={`${app.processed ? 'text-green-400' : 'text-yellow-400'}`}>
                              {app.processed ? 'Processed' : 'Pending'}
                            </span>
                          </p>
                        </div>
                        {!app.processed && (
                          <div className="flex space-x-3">
                            <button
                              onClick={() => viewDocuments(app.docHashes)}
                              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                            >
                              View Documents
                            </button>
                            <button
                              onClick={() => handleApprove(index)}
                              disabled={loading}
                              className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(index)}
                              disabled={loading}
                              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {applications.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-xl text-slate-300">No applications found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
} 