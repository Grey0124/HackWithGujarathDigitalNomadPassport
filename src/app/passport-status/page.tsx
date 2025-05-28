"use client";

import { useState, useEffect, useCallback } from "react";
import { useActiveAccount } from "thirdweb/react";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import UserNavbar from "../components/UserNavbar";
import AnchorABI from "@/contracts/Anchor.json";
import { jsPDF } from "jspdf";
import domtoimage from 'dom-to-image';

interface PassportInfo {
  hash: string;
  type: string;
  issuedAt: number;
  issuer: string;
  isRevoked: boolean;
}

export default function PassportStatusPage() {
  const router = useRouter();
  const account = useActiveAccount();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passportInfo, setPassportInfo] = useState<PassportInfo | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<{
    submitted: boolean;
    processed: boolean;
  }>({ submitted: false, processed: false });

  const RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/dnbqygHxhAg5Vbvt3LRA8xYeQ5T80LDW";
  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NEW_ANCHOR_CONTRACT_FINAL as string;

  const getContract = useCallback(() => {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL, {
      name: 'sepolia',
      chainId: 11155111,
      _defaultProvider: (providers) => new providers.JsonRpcProvider(RPC_URL)
    });

    return new ethers.Contract(CONTRACT_ADDRESS, AnchorABI.abi, provider);
  }, [RPC_URL, CONTRACT_ADDRESS]);

  const checkPassportStatus = useCallback(async () => {
    try {
      if (!account?.address) return;

      const contract = getContract();
      
      // Check application status first
      const appIndex = await contract.applicationIndex(account.address);
      const hasApplied = appIndex > 0;
      
      if (hasApplied) {
        const app = await contract.getApplication(appIndex - 1);
        setApplicationStatus({
          submitted: true,
          processed: app.processed
        });
      } else {
        setApplicationStatus({
          submitted: false,
          processed: false
        });
      }

      const userHash = await contract.userHash(account.address);
      
      if (userHash === ethers.constants.HashZero) {
        setPassportInfo(null);
        return;
      }

      const [isAnchored, isRevoked, hashType] = await Promise.all([
        contract.anchoredHashes(userHash),
        contract.revokedHashes(userHash),
        contract.hashTypes(userHash)
      ]);

      // Find the issuance log for this hash
      const logsCount = await contract.getLogsCount();
      let issuanceLog = null;
      
      for (let i = 0; i < logsCount; i++) {
        const log = await contract.logs(i);
        if (log.hash === userHash) {
          issuanceLog = log;
          break;
        }
      }

      if (!issuanceLog) {
        throw new Error("Passport issuance log not found");
      }

      setPassportInfo({
        hash: userHash,
        type: hashType,
        issuedAt: issuanceLog.timestamp.toNumber(),
        issuer: issuanceLog.issuer,
        isRevoked: isRevoked
      });
    } catch (err: any) {
      console.error("Error checking passport status:", err);
      setError("Failed to check passport status: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [account?.address, getContract]);

  useEffect(() => {
    if (account) {
      checkPassportStatus();
    }
  }, [account, checkPassportStatus]);

  const downloadPassportCard = async () => {
    try {
      if (!passportInfo) {
        throw new Error('No passport information available');
      }

      // Create a hidden canvas element
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Set background
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw passport card content
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);

      // Draw logo
      const logo = new Image();
      logo.src = '/logo2.svg';
      await new Promise((resolve) => {
        logo.onload = resolve;
      });
      ctx.drawImage(logo, 40, 40, 60, 60);

      // Draw header
      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px Arial';
      ctx.fillText('DIGITAL PASSPORT', 120, 80);

      // Draw status badge
      ctx.fillStyle = passportInfo.isRevoked ? '#ef4444' : '#22c55e';
      ctx.beginPath();
      ctx.arc(canvas.width - 60, 60, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(passportInfo.isRevoked ? 'R' : 'A', canvas.width - 60, 65);

      // Draw passport info
      ctx.textAlign = 'left';
      ctx.font = '16px Arial';
      
      // Left column
      const leftColumn = 40;
      const rightColumn = canvas.width / 2 + 20;
      let y = 140;

      // Passport Type
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText('Type:', leftColumn, y);
      ctx.fillStyle = 'white';
      ctx.fillText(passportInfo.type, leftColumn + 80, y);
      y += 40;

      // Issued At
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText('Issued:', leftColumn, y);
      ctx.fillStyle = 'white';
      ctx.fillText(new Date(passportInfo.issuedAt * 1000).toLocaleDateString(), leftColumn + 80, y);
      y += 40;

      // Issuer
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText('Issuer:', leftColumn, y);
      ctx.fillStyle = 'white';
      ctx.fillText(passportInfo.issuer.slice(0, 8) + '...' + passportInfo.issuer.slice(-6), leftColumn + 80, y);

      // Right column
      y = 140;

      // Passport Hash
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText('Hash:', rightColumn, y);
      ctx.fillStyle = 'white';
      ctx.fillText(passportInfo.hash.slice(0, 8) + '...' + passportInfo.hash.slice(-6), rightColumn + 80, y);
      y += 40;

      // Status
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText('Status:', rightColumn, y);
      ctx.fillStyle = passportInfo.isRevoked ? '#ef4444' : '#22c55e';
      ctx.fillText(passportInfo.isRevoked ? 'Revoked' : 'Active', rightColumn + 80, y);

      // Draw verification section at bottom
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(40, canvas.height - 100, canvas.width - 80, 60);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '14px Arial';
      ctx.fillText('Verification', 60, canvas.height - 70);
      ctx.fillText('Scan to verify authenticity', 60, canvas.height - 50);

      // Convert canvas to image
      const imgData = canvas.toDataURL('image/png');

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);

      // Download PDF
      pdf.save('digital-passport.pdf');
    } catch (error) {
      console.error('Error generating passport card:', error);
      alert('Failed to generate passport card. Please try again.');
    }
  };

  return (
    <>
      <UserNavbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container max-w-screen-lg mx-auto px-4 py-16">
          <div className="backdrop-blur-sm bg-white/5 rounded-3xl p-8 shadow-2xl border border-white/10">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent">
              Passport Status
            </h1>

            {!account ? (
              <div className="text-center py-12">
                <p className="text-xl text-slate-300">Please connect your wallet to continue</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <p className="text-xl text-slate-300">Loading passport status...</p>
              </div>
            ) : error ? (
              <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 text-red-300 p-4 rounded-xl">
                Error: {error}
              </div>
            ) : !applicationStatus.submitted ? (
              <div className="text-center py-12">
                <p className="text-xl text-slate-300">You have not applied for a passport yet</p>
                <button
                  onClick={() => router.push('/my-passport')}
                  className="mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Apply Now
                </button>
              </div>
            ) : !applicationStatus.processed ? (
              <div className="text-center py-12">
                <p className="text-xl text-slate-300">Your passport application is being processed</p>
                <p className="text-slate-400 mt-2">Please check back later</p>
              </div>
            ) : passportInfo ? (
              <div className="space-y-6">
                <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-slate-300">
                        <span className="text-blue-400">Passport Hash:</span>{" "}
                        <span className="font-mono text-white">{passportInfo.hash}</span>
                      </p>
                      <p className="text-slate-300 mt-4">
                        <span className="text-blue-400">Type:</span>{" "}
                        <span className="text-white">{passportInfo.type}</span>
                      </p>
                      <p className="text-slate-300 mt-4">
                        <span className="text-blue-400">Issued At:</span>{" "}
                        <span className="text-white">
                          {new Date(passportInfo.issuedAt * 1000).toLocaleString()}
                        </span>
                      </p>
                      <p className="text-slate-300 mt-4">
                        <span className="text-blue-400">Issuer:</span>{" "}
                        <span className="font-mono text-white">{passportInfo.issuer}</span>
                      </p>
                      <p className="text-slate-300 mt-4">
                        <span className="text-blue-400">Status:</span>{" "}
                        <span className={`${passportInfo.isRevoked ? 'text-red-400' : 'text-green-400'}`}>
                          {passportInfo.isRevoked ? 'Revoked' : 'Active'}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center justify-center">
                      <button
                        onClick={downloadPassportCard}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      >
                        Download Passport Card
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-xl text-slate-300">No passport found</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
} 