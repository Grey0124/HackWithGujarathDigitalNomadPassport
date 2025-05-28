"use client";

import { useState, useEffect, useCallback } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import IssuerNavbar from "../components/IssuerNavbar";
import AnchorABI from "@/contracts/Anchor.json";
import { client } from "@/app/client";

interface Application {
  user: string;
  docCids: string[];
  timestamp: number;
  processed: boolean;
}

interface Document {
  cid: string;
  url: string;
  type: string;
  error?: string;
}

// Use Alchemy's public RPC URL for Sepolia
const RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/dnbqygHxhAg5Vbvt3LRA8xYeQ5T80LDW";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NEW_ANCHOR_CONTRACT_FINAL as string;
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL as string;

// Helper function to convert byte array to CID
const bytesToCID = (bytes: number[] | number[][]): string => {
  try {
    if (!bytes || bytes.length === 0) {
      throw new Error('Empty bytes array');
    }

    // Convert to Uint8Array first
    let uint8Array: Uint8Array;
    if (Array.isArray(bytes[0])) {
      // Handle nested array
      const flatArray = (bytes as number[][]).reduce((acc, curr) => {
        if (!Array.isArray(curr)) {
          throw new Error('Invalid nested array structure');
        }
        return acc.concat(curr);
      }, [] as number[]);
      uint8Array = new Uint8Array(flatArray);
    } else {
      // Handle single array
      if (!Array.isArray(bytes)) {
        throw new Error('Invalid bytes format');
      }
      uint8Array = new Uint8Array(bytes as number[]);
    }

    // Convert to hex string first
    const hex = ethers.utils.hexlify(uint8Array);
    if (!hex || hex === '0x') {
      throw new Error('Invalid hex conversion result');
    }

    // Convert hex to CID format (Qm...)
    // Remove '0x' prefix and ensure it's a valid CID
    const hash = hex.slice(2);
    return `Qm${hash}`;
  } catch (error: any) {
    console.error('Error converting bytes to CID:', error);
    throw new Error(`Failed to convert bytes to CID: ${error?.message || 'Unknown error'}`);
  }
};

// Helper function to fetch document from Pinata
const fetchFromPinata = async (hash: string) => {
  try {
    if (!hash || hash === '0x') {
      throw new Error('Invalid hash provided');
    }

    // First try to pin the content
    const pinResponse = await fetch('https://api.pinata.cloud/pinning/pinByHash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`
      },
      body: JSON.stringify({
        hashToPin: hash,
        pinataOptions: {
          cidVersion: 0
        }
      })
    });

    if (!pinResponse.ok) {
      const errorData = await pinResponse.json();
      throw new Error(`Failed to pin document: ${errorData.error || pinResponse.statusText}`);
    }

    // Try to fetch the content
    const response = await fetch(`https://${PINATA_GATEWAY}/ipfs/${hash}`, {
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching from Pinata:', error);
    throw error;
  }
};

export default function IssuePassportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [showDocuments, setShowDocuments] = useState(false);
  const account = useActiveAccount();
  const { mutateAsync: sendTransaction } = useSendTransaction();

  const getContract = () => {
    // Create a provider with proper network configuration
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL, {
      name: 'sepolia',
      chainId: 11155111,
      _defaultProvider: (providers) => new providers.JsonRpcProvider(RPC_URL)
    });

    return new ethers.Contract(CONTRACT_ADDRESS, AnchorABI.abi, provider);
  };

  const fetchApplications = useCallback(async () => {
    try {
      const contract = getContract();
      const count = await contract.getApplicationsCount();
      const apps: Application[] = [];

      for (let i = 0; i < count; i++) {
        const app = await contract.getApplication(i);
        apps.push({
          user: app.user,
          docCids: app.docCids,
          timestamp: app.timestamp.toNumber(),
          processed: app.processed
        });
      }

      setApplications(apps);
    } catch (err: any) {
      console.error("Fetch applications error:", err);
      setError("Failed to fetch applications: " + err.message);
    }
  }, [getContract]);

  const checkAuthorization = useCallback(async () => {
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
  }, [account?.address, getContract, router, fetchApplications]);

  useEffect(() => {
    if (account) {
      checkAuthorization();
    }
  }, [account, checkAuthorization]);

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

  const viewDocuments = (docCids: string[]) => {
    try {
      const documents: Document[] = docCids.map(cid => ({
        cid,
        url: `https://${PINATA_GATEWAY}/ipfs/${cid}`,
        type: 'Document'
      }));

      setSelectedDocuments(documents);
      setShowDocuments(true);
    } catch (err: any) {
      console.error("Error viewing documents:", err);
      setError("Failed to load documents: " + err.message);
    }
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
                          <p className="text-slate-300 mt-2">
                            <span className="text-blue-400">Document CIDs:</span>{" "}
                            <span className="font-mono text-white text-sm">
                              {app.docCids.map((cid, i) => (
                                <span key={i} className="block mt-1">{cid}</span>
                              ))}
                            </span>
                          </p>
                        </div>
                        {!app.processed && (
                          <div className="flex space-x-3">
                            <button
                              onClick={() => viewDocuments(app.docCids)}
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

        {/* Document Viewer Modal */}
        {showDocuments && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Document Viewer</h2>
                <button
                  onClick={() => setShowDocuments(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                {selectedDocuments.map((doc, index) => (
                  <div key={index} className="bg-white/5 rounded-xl p-4">
                    <p className="text-slate-300 mb-2">
                      <span className="text-blue-400">Document Type:</span> {doc.type}
                    </p>
                    <p className="text-slate-300 mb-2">
                      <span className="text-blue-400">Document CID:</span>{" "}
                      <span className="font-mono text-sm break-all">{doc.cid}</span>
                    </p>
                    {doc.error && (
                      <p className="text-red-400 text-sm mb-2">{doc.error}</p>
                    )}
                    {!doc.error && (
                      <div className="mt-4 flex space-x-4">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          View Document →
                        </a>
                        <a
                          href={`https://ipfs.io/ipfs/${doc.cid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          View on IPFS →
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
} 