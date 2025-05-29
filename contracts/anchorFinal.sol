// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Anchor {
    // --- Roles & Governance ---
    address public owner;
    mapping(address => bool) public authorizedIssuers;
    mapping(address => bool) public suspendedIssuers;
    mapping(address => bool) public authorizedVerifiers;

    // --- Issuer Metadata & Audit Logs ---
    mapping(address => string) public issuerInfo;  // human-readable info
    struct IssuanceLog {
        bytes32 hash;
        address issuer;
        address user;
        string pType;
        uint256 timestamp;
    }
    IssuanceLog[] public logs;

    // --- User State ---
    mapping(address => bytes32) public userHash;  // current VC hash per user
    mapping(address => bool)    public hasIssued; // to prevent duplicates

    // --- Credential State ---
    mapping(bytes32 => bool)    public anchoredHashes;
    mapping(bytes32 => bool)    public revokedHashes;
    mapping(bytes32 => string)  public hashTypes;  // passport type

    // --- Events ---
    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);
    event IssuerSuspended(address indexed issuer);
    event IssuerResumed(address indexed issuer);
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);
    event IssuerInfoSet(address indexed issuer, string info);
    event HashAnchored(bytes32 indexed hash, address indexed issuer, address indexed user, string pType, uint256 timestamp);
    event HashRevoked(bytes32 indexed hash, address indexed revoker, uint256 timestamp);
    event HashRotated(address indexed user, bytes32 indexed oldHash, bytes32 indexed newHash, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    modifier onlyIssuer() {
        require(authorizedIssuers[msg.sender], "Not an authorized issuer");
        require(!suspendedIssuers[msg.sender], "Issuer suspended");
        _;
    }
    modifier onlyVerifier() {
        require(authorizedVerifiers[msg.sender], "Not an authorized verifier");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }

    // --- Owner Management of Issuers / Verifiers ---
    function addIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = true;
        emit IssuerAdded(issuer);
    }
    function removeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = false;
        emit IssuerRemoved(issuer);
    }
    function suspendIssuer(address issuer) external onlyOwner {
        suspendedIssuers[issuer] = true;
        emit IssuerSuspended(issuer);
    }
    function resumeIssuer(address issuer) external onlyOwner {
        suspendedIssuers[issuer] = false;
        emit IssuerResumed(issuer);
    }
    function setIssuerInfo(string calldata info) external onlyIssuer {
        issuerInfo[msg.sender] = info;
        emit IssuerInfoSet(msg.sender, info);
    }
    function addVerifier(address v) external onlyOwner {
        authorizedVerifiers[v] = true;
        emit VerifierAdded(v);
    }
    function removeVerifier(address v) external onlyOwner {
        authorizedVerifiers[v] = false;
        emit VerifierRemoved(v);
    }

    // --- Issuance & Anchoring ---
    function storeHashWithType(bytes32 hash, address user, string calldata pType) external onlyIssuer {
        require(!hasIssued[user], "Already issued");
        anchoredHashes[hash] = true;
        hasIssued[user] = true;
        userHash[user] = hash;
        hashTypes[hash] = pType;
        logs.push(IssuanceLog(hash, msg.sender, user, pType, block.timestamp));
        emit HashAnchored(hash, msg.sender, user, pType, block.timestamp);
    }

    // --- Revocation ---
    function revokeHash(bytes32 hash) external onlyIssuer {
        require(anchoredHashes[hash], "Not anchored");
        revokedHashes[hash] = true;
        emit HashRevoked(hash, msg.sender, block.timestamp);
    }

    // --- Rotation (User-initiated update) ---
    function rotateHash(bytes32 oldHash, bytes32 newHash) external {
        require(userHash[msg.sender] == oldHash, "Old hash mismatch");
        require(anchoredHashes[oldHash], "Old not anchored");
        // Do not enforce duplicate-per-user here; rotation swaps
        anchoredHashes[oldHash] = false;
        anchoredHashes[newHash] = true;
        userHash[msg.sender] = newHash;
        logs.push(IssuanceLog(newHash, msg.sender /* treated as issuer for rotation? */, msg.sender, hashTypes[oldHash], block.timestamp));
        emit HashRotated(msg.sender, oldHash, newHash, block.timestamp);
    }

    // --- Unified Verification for Verifiers ---
    function verifyPassport(bytes32 hash) external view onlyVerifier returns (
        bool isAnchored_,
        bool isRevoked_,
        address issuer_,
        string memory pType_,
        uint256 issuedAt_
    ) {
        isAnchored_ = anchoredHashes[hash];
        isRevoked_  = revokedHashes[hash];
        pType_      = hashTypes[hash];
        // find issuer and timestamp from logs (could optimize via mapping)
        for(uint i = 0; i < logs.length; i++) {
            if (logs[i].hash == hash) {
                issuer_    = logs[i].issuer;
                issuedAt_  = logs[i].timestamp;
                break;
            }
        }
    }

    // --- Simple getters ---
    function hasRevoked(bytes32 hash) external view returns (bool) {
        return revokedHashes[hash];
    }
    function getLogsCount() external view returns (uint) {
        return logs.length;
    }
}
