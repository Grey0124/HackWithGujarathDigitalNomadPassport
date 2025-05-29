// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Anchor {
    // --- Roles & Governance ---
    address public owner;
    mapping(address => bool) public authorizedIssuers;
    mapping(address => bool) public suspendedIssuers;
    mapping(address => bool) public authorizedVerifiers;

    // --- Issuer Metadata & Audit Logs ---
    mapping(address => string) public issuerInfo;
    struct IssuanceLog {
        bytes32 hash;
        address issuer;
        address user;
        string pType;
        uint256 timestamp;
    }
    IssuanceLog[] public logs;

    // --- User State ---
    mapping(address => bytes32) public userHash;
    mapping(address => bool) public hasIssued;

    // --- Credential State ---
    mapping(bytes32 => bool) public anchoredHashes;
    mapping(bytes32 => bool) public revokedHashes;
    mapping(bytes32 => string) public hashTypes;

    // --- KYC Applications ---
    struct Application {
        address user;
        bytes32[] docHashes;
        uint256 timestamp;
        bool processed;
    }

    Application[] public applications;
    mapping(address => uint256) public applicationIndex;

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
    event ApplicationSubmitted(address indexed user, bytes32[] docHashes, uint256 indexed applicationId, uint256 timestamp);
    event ApplicationProcessed(uint256 indexed appId, bytes32 passportHash, address indexed issuer);

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

    // --- Issuer / Verifier Management ---
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

    function addVerifier(address verifier) external onlyOwner {
        authorizedVerifiers[verifier] = true;
        emit VerifierAdded(verifier);
    }

    function removeVerifier(address verifier) external onlyOwner {
        authorizedVerifiers[verifier] = false;
        emit VerifierRemoved(verifier);
    }

    function setIssuerInfo(string calldata info) external onlyIssuer {
        issuerInfo[msg.sender] = info;
        emit IssuerInfoSet(msg.sender, info);
    }

    // --- User KYC Submission ---
    function applyForPassport(bytes32[] calldata docHashes) external {
        require(docHashes.length > 0, "No documents provided");
        require(applicationIndex[msg.sender] == 0, "Already applied");

        applications.push(Application({
            user: msg.sender,
            docHashes: docHashes,
            timestamp: block.timestamp,
            processed: false
        }));

        uint256 appId = applications.length - 1;
        applicationIndex[msg.sender] = appId + 1; // 0 means not applied
        emit ApplicationSubmitted(msg.sender, docHashes, appId, block.timestamp);
    }

    function getApplicationsCount() external view returns (uint256) {
        return applications.length;
    }

    function getApplication(uint256 appId) external view returns (
        address user,
        bytes32[] memory docHashes,
        uint256 timestamp,
        bool processed
    ) {
        Application storage app = applications[appId];
        return (app.user, app.docHashes, app.timestamp, app.processed);
    }

    // --- Issuer Passport Approval ---
    function processApplication(
        uint256 appId,
        bytes32 passportHash,
        string calldata pType
    ) external onlyIssuer {
        Application storage app = applications[appId];
        require(!app.processed, "Already processed");

        app.processed = true;
        anchoredHashes[passportHash] = true;
        hasIssued[app.user] = true;
        userHash[app.user] = passportHash;
        hashTypes[passportHash] = pType;

        logs.push(IssuanceLog(passportHash, msg.sender, app.user, pType, block.timestamp));
        emit HashAnchored(passportHash, msg.sender, app.user, pType, block.timestamp);
        emit ApplicationProcessed(appId, passportHash, msg.sender);
    }

    // --- Revocation ---
    function revokeHash(bytes32 hash) external onlyIssuer {
        require(anchoredHashes[hash], "Not anchored");
        revokedHashes[hash] = true;
        emit HashRevoked(hash, msg.sender, block.timestamp);
    }

    // --- Rotation ---
    function rotateHash(bytes32 oldHash, bytes32 newHash) external {
        require(userHash[msg.sender] == oldHash, "Old hash mismatch");
        require(anchoredHashes[oldHash], "Old not anchored");

        anchoredHashes[oldHash] = false;
        anchoredHashes[newHash] = true;
        userHash[msg.sender] = newHash;

        logs.push(IssuanceLog(newHash, msg.sender, msg.sender, hashTypes[oldHash], block.timestamp));
        emit HashRotated(msg.sender, oldHash, newHash, block.timestamp);
    }

    // --- Verification ---
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

        for (uint i = 0; i < logs.length; i++) {
            if (logs[i].hash == hash) {
                issuer_ = logs[i].issuer;
                issuedAt_ = logs[i].timestamp;
                break;
            }
        }
    }

    // --- Getters ---
    function hasRevoked(bytes32 hash) external view returns (bool) {
        return revokedHashes[hash];
    }

    function getLogsCount() external view returns (uint) {
        return logs.length;
    }
}
