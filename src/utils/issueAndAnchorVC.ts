import { JsonRpcProvider, Wallet, Contract, isAddress, keccak256, toUtf8Bytes } from 'ethers';
import { EthrDID } from 'ethr-did';
import { createVerifiableCredentialJwt, Issuer } from 'did-jwt-vc';
import pinataSDK from '@pinata/sdk';

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;
const ANCHOR_CONTRACT = process.env.ANCHOR_CONTRACT;
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const PINATA_GATEWAY_URL = process.env.PINATA_GATEWAY_URL;

// Initialize Pinata client
const pinata = new pinataSDK(PINATA_API_KEY, PINATA_SECRET_API_KEY);

/**
 * Issues and anchors a Verifiable Credential for a user.
 * @param {string} userWalletAddress - The Ethereum address of the credential holder
 */
export async function issueAndAnchorVC(userWalletAddress: string) {
  if (!isAddress(userWalletAddress)) {
    throw new Error("Invalid Ethereum address provided");
  }

  // --- Connect to Sepolia
  const provider = new JsonRpcProvider(RPC_URL);
  const wallet = new Wallet(PRIVATE_KEY!, provider);
  const address = await wallet.getAddress();

  // --- Setup issuer DID
  const issuerDid = new EthrDID({
    identifier: address,
    privateKey: PRIVATE_KEY,
    chainNameOrId: 'sepolia',
  });

  // Create an Issuer object that matches did-jwt-vc's requirements
  const issuer: Issuer = {
    did: issuerDid.did,
    signer: async (data: string | Uint8Array) => {
      const message = typeof data === 'string' ? data : new TextDecoder().decode(data);
      const signature = await wallet.signMessage(message);
      return signature;
    },
    alg: 'ES256K'
  };

  // --- Step 1: Create Passport Credential
  const userDID = `did:ethr:sepolia:${userWalletAddress}`;
  const credentialPayload = {
    sub: userDID,
    nbf: Math.floor(Date.now() / 1000),
    vc: {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiableCredential", "DigitalNomadPassport"],
      credentialSubject: {
        name: "Alice Nomad",
        nationality: "Canadian",
        residence: "Portugal",
        visa: "Remote Work Visa",
        validUntil: "2026-01-01"
      }
    }
  };

  // --- Step 2: Sign VC as JWT
  const vcJwt = await createVerifiableCredentialJwt(credentialPayload, issuer);
  console.log("✅ JWT VC:", vcJwt);

  // --- Step 3: Upload VC to IPFS via Pinata
  const pinataOptions = {
    pinataMetadata: {
      name: "DigitalNomadPassportVC",
      keyvalues: {
        type: "verifiable-credential" ,
        holder: userWalletAddress 
      } as any
    },
    pinataOptions: {
      cidVersion: 1 as 0 | 1
    }
  };

  try {
    const result = await pinata.pinJSONToIPFS({ vc: vcJwt }, pinataOptions);
    const ipfsCid = result.IpfsHash;
    const ipfsUrl = `https://${PINATA_GATEWAY_URL}/ipfs/${ipfsCid}`;
    console.log("📤 VC uploaded to IPFS via Pinata:", ipfsUrl);

    // --- Step 4: Hash the VC
    const hash = keccak256(toUtf8Bytes(vcJwt));
    console.log("🧾 Hash of VC:", hash);

    // --- Step 5: Call Anchor.sol to store the hash
    const abi = [
      "function storeHash(bytes32 hash) public",
      "function isAnchored(bytes32 hash) public view returns (bool)"
    ];
    const contract = new Contract(ANCHOR_CONTRACT!, abi, wallet);

    const tx = await contract.storeHash(hash);
    await tx.wait();
    console.log("✅ VC anchored on-chain at tx:", tx.hash);

    return { 
      vcJwt, 
      hash, 
      txHash: tx.hash,
      ipfsCid,
      ipfsUrl
    };
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw new Error("Failed to upload VC to IPFS");
  }
} 