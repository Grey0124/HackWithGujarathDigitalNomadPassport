# 🏛️ Digital Passport – Blockchain-Powered Identity for the Future

## 🔥 Redefining Identity and Verification with Ethereum

**Digital Passport** is a decentralized identity and credential management system built on **Ethereum** that enables users to manage, verify, and present their digital identity securely. It empowers global digital nomads, institutions, and authorities to operate transparently, eliminating reliance on centralized entities.


🔗 **[🔍 Explore Deployed Contract]https://thirdweb.com/sepolia/0xF2D180EbCa084136C85E6Fd2E9c34448cf16e370)**
🗋 **Smart Contracts:** * `dinip/contracts/AnchorFinal3.sol`

🏛️ Stakeholders
Role	Description
👤 User	Applies for a digital passport by submitting KYC documents.
🏢 Issuer	Authorized entity (e.g., government agency, DAO) that verifies KYC and issues passports.
🔍 Verifier	Validates the authenticity and status of digital passports.
👑 Owner	Deployer of the contract with administrative privileges (e.g., to manage issuers/verifiers).



---

## 🚀 Key Features

✅ **Digital Passport Issuance**
Users can apply for a blockchain-anchored digital identity with verifiable document credentials.

✅ **Role-Based Access Control**
Supports multiple roles: **Users**, **Issuers**, **Verifiers**, and a **Contract Owner** with governance authority.

✅ **KYC and Document Verification**
Applicants submit KYC documents, which are reviewed by Issuers who verify and anchor the identity.

✅ **Audit Logs & Transparency**
Every application, issuance, revocation, and verification is logged immutably.

✅ **Credential Revocation and Rotation**
Hash-based passport records can be revoked or rotated to ensure continued trust and security.

---

## 💡 How It Works

### ① Application Submission (User)

* Users connect their wallet and submit a KYC form.
* Upload required documents to IPFS (via Pinata).
* A hashed record of documents is sent to the contract.

### ② Issuer Review and Approval

* Issuers review document hashes.
* Upon approval, a passport hash is generated and anchored on-chain.

### ③ Verifier Validation

* Verifiers can validate a passport using its hash.
* The contract returns anchor status, issuer info, and whether the passport is revoked.

### ④ Passport Rotation & Revocation

* Users may rotate their hash (e.g., for privacy or compromise).
* Issuers may revoke a passport if necessary.

---

## 🏠 Web App Walkthrough

### 🔐 Login & Role Detection

* Connect your wallet via MetaMask.
* App dynamically routes you to the correct portal based on your role (User, Issuer, Verifier).

### 👤 User Dashboard

* Submit KYC and documents.
* View application status.
* Download blockchain-verified passport PDF along with QR code which contains passport hash.

### 🏛️ Issuer Portal

* View pending KYC applications.
* Verify submitted documents.
* Approve or reject applications.

### 🔍 Verifier Panel

* Enter a passport hash.
* Can obtain passport hash by scanning user qr code
* Instantly validate anchor status, revocation, issuer, and issuance timestamp.

---

## 🚪 Roles & Permissions

| Role         | Permissions                                           |
| ------------ | ----------------------------------------------------- |
| **User**     | Submit application, rotate passport hash              |
| **Issuer**   | Approve/reject applications, issue & revoke passports |
| **Verifier** | Query and verify passports                            |
| **Owner**    | Add/remove/suspend issuers and verifiers              |

---

## 💮 Tech Stack

* **Blockchain:** Ethereum Sepolia Testnet (Solidity, Ethers.js)
* **Frontend:** Next.js + TailwindCSS + TypeScript
* **Contracts:** Thirdweb + Hardhat + AnchorFinal3.sol
* **Storage:** IPFS (via Pinata)
* **Wallets:** MetaMask, WalletConnect

---

## 📅 Use Cases

* Cross-border identity management
* Digital nomad credentials
* University/Employment credentials
* Public certificate & licensing

---

## ✨ Join the Digital Identity Revolution

Digital Passport empowers individuals and organizations to take control of identity with transparency, security, and trust.

🚀 Try the app and experience decentralized identity today!


NEXT_PUBLIC_TEMPLATE_CLIENT_ID=350d5db03a6b261b3f993f36e893d31a
NEXT_PUBLIC_TEMPLATE_CLIENT_SECRET=HiCO8yyxW2U9C5H_n5aDG1Kdg22fmCeqCP5owk268rvM53sL3cIaBNRnZJdvCOJqRdrD0D7lhXnLKUHWd88Vog


