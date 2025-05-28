"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { utils } from "ethers";
import UserNavbar from "../components/UserNavbar";
import thirdwebIcon from "@public/logo2.svg";
import AnchorABI from "@/contracts/Anchor.json";
import { client } from "@/app/client";
import { ethers } from "ethers";

interface Document {
  file: File;
  type: string;
  cid?: string;
  ipfsUrl?: string;
}

export default function MyPassportPage() {
  const router = useRouter();
  const account = useActiveAccount();
  const { mutateAsync: sendTransaction } = useSendTransaction();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    ethDid: "",
    name: "",
    age: "",
    nationality: "",
    adhaarNumber: "",
  });
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocuments(prev => [...prev, { file, type }]);
    }
  };

  const uploadToPinata = async (file: File): Promise<{ cid: string; ipfsUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`
      },
      body: formData
    });

    const data = await response.json();
    return {
      cid: data.IpfsHash,
      ipfsUrl: `https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}/ipfs/${data.IpfsHash}`
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!account) {
        throw new Error("Please connect your wallet first");
      }

      // Upload documents to Pinata
      const uploadPromises = documents.map(doc => uploadToPinata(doc.file));
      const uploadResults = await Promise.all(uploadPromises);

      // Get CIDs from upload results
      const docCids = uploadResults.map(result => result.cid);

      // Create contract interface
      const contractInterface = new ethers.utils.Interface(AnchorABI.abi);

      // Call smart contract
      const tx = await sendTransaction({
        to: process.env.NEXT_PUBLIC_NEW_ANCHOR_CONTRACT_FINAL as string,
        data: contractInterface.encodeFunctionData("applyForPassport", [docCids]) as `0x${string}`,
        client,
        chain: {
          id: 11155111, // Sepolia chain ID
          rpc: "https://eth-sepolia.g.alchemy.com/v2/dnbqygHxhAg5Vbvt3LRA8xYeQ5T80LDW"
        }
      });

      // Show success message
      alert("Passport application submitted successfully!");
      router.push("/my-passport");
    } catch (error) {
      console.error("Error submitting application:", error);
      setError("Failed to submit application. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <UserNavbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container max-w-screen-lg mx-auto px-4 py-16">
          <div className="backdrop-blur-sm bg-white/5 rounded-3xl p-8 shadow-2xl border border-white/10">
            <Header />
            
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mt-12 space-y-6">
              <div className="space-y-2">
                <label htmlFor="ethDid" className="block text-sm font-medium text-slate-300">
                  Ethereum DID
                </label>
                <input
                  type="text"
                  id="ethDid"
                  name="ethDid"
                  value={formData.ethDid}
                  onChange={handleInputChange}
                  placeholder="Enter your Ethereum DID"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-slate-300">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="age" className="block text-sm font-medium text-slate-300">
                  Age
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="Enter your age"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="nationality" className="block text-sm font-medium text-slate-300">
                  Nationality
                </label>
                <input
                  type="text"
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  placeholder="Enter your nationality"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="adhaarNumber" className="block text-sm font-medium text-slate-300">
                  Aadhaar Number
                </label>
                <input
                  type="text"
                  id="adhaarNumber"
                  name="adhaarNumber"
                  value={formData.adhaarNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your Aadhaar number"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Required Documents</h3>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Aadhaar Card
                  </label>
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, "aadhaar")}
                    className="w-full text-slate-300"
                    required
                  />
                </div>

                {parseInt(formData.age) >= 18 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">
                      PAN Card
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, "pan")}
                      className="w-full text-slate-300"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Driving License (Optional)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, "driving")}
                    className="w-full text-slate-300"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

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
                {isLoading ? 'Submitting Application...' : 'Apply for Passport'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}

function Header() {
  return (
    <header className="flex flex-col items-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
        <Image
          src={thirdwebIcon}
          alt=""
          className="size-[100px] md:size-[120px] relative z-10"
          style={{
            filter: "drop-shadow(0px 0px 24px rgba(59, 130, 246, 0.5))",
          }}
        />
      </div>

      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 text-center bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent">
        Apply for Digital Passport
      </h1>
      <p className="text-slate-300 text-center max-w-2xl">
        Complete the KYC form below to apply for your digital passport. Please ensure all information is accurate and documents are clear.
      </p>
    </header>
  );
} 