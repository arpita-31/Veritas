// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title InstitutionalTrustRegistry
 * @dev VERITAS - Verifiable Institutional Records and Trust Infrastructure
 *      Manages institution identities, authorized issuers, issuance references,
 *      and credential revocation states on-chain without storing any personal data.
 */
contract InstitutionalTrustRegistry {
    // --- Custom Errors for Gas Efficiency and Clear Reverts ---
    error UnauthorizedGovernance();
    error UnauthorizedAdmin();
    error UnauthorizedIssuer();
    error UnauthorizedRevoker();
    error InstitutionAlreadyExists();
    error InstitutionDoesNotExist();
    error InstitutionNotActive();
    error CredentialAlreadyExists();
    error CredentialDoesNotExist();
    error CredentialAlreadyRevoked();
    error InvalidAddress();
    error InvalidIdentifier();

    // --- Structs ---
    struct Institution {
        address admin;
        bool isActive;
        uint256 registeredAt;
        string name;
        bool exists;
    }

    struct CredentialRecord {
        bytes32 institutionIdHash;
        bytes32 recordHash;
        address issuer;
        uint256 issuedAt;
        bool exists;
        bool isRevoked;
        uint256 revokedAt;
        address revokedBy;
        bytes32 reasonCode;
    }

    // --- State Variables ---
    address public governance;

    // institutionIdHash => Institution
    mapping(bytes32 => Institution) public institutions;

    // institutionIdHash => (issuerAddress => isAuthorized)
    mapping(bytes32 => mapping(address => bool)) public isIssuerAuthorized;
    mapping(bytes32 => mapping(address => uint256)) public issuerAuthorizedAt;
    mapping(bytes32 => mapping(address => uint256)) public issuerSuspendedAt;

    // credentialIdHash => CredentialRecord
    mapping(bytes32 => CredentialRecord) public credentials;

    // Counters for auditing/dashboard
    uint256 public totalInstitutions;
    uint256 public totalCredentialsIssued;
    uint256 public totalCredentialsRevoked;

    // --- Events (Strictly No Sensitive / Personal Data) ---
    event GovernanceTransferred(address indexed previousGov, address indexed newGov, uint256 timestamp);
    event InstitutionRegistered(bytes32 indexed institutionIdHash, address indexed admin, string name, uint256 timestamp);
    event InstitutionStatusChanged(bytes32 indexed institutionIdHash, bool isActive, uint256 timestamp);
    event IssuerAuthorized(bytes32 indexed institutionIdHash, address indexed issuer, address indexed authorizedBy, uint256 timestamp);
    event IssuerSuspended(bytes32 indexed institutionIdHash, address indexed issuer, address indexed suspendedBy, uint256 timestamp);
    event CredentialIssued(bytes32 indexed institutionIdHash, bytes32 indexed credentialIdHash, bytes32 recordHash, address indexed issuer, uint256 timestamp);
    event CredentialRevoked(bytes32 indexed institutionIdHash, bytes32 indexed credentialIdHash, address indexed revokedBy, bytes32 reasonCode, uint256 timestamp);

    // --- Modifiers ---
    modifier onlyGovernance() {
        if (msg.sender != governance) revert UnauthorizedGovernance();
        _;
    }

    modifier onlyInstitutionAdmin(bytes32 institutionIdHash) {
        Institution storage inst = institutions[institutionIdHash];
        if (!inst.exists) revert InstitutionDoesNotExist();
        if (msg.sender != inst.admin && msg.sender != governance) revert UnauthorizedAdmin();
        _;
    }

    constructor() {
        governance = msg.sender;
    }

    // --- Governance Functions ---
    function transferGovernance(address newGovernance) external onlyGovernance {
        if (newGovernance == address(0)) revert InvalidAddress();
        address old = governance;
        governance = newGovernance;
        emit GovernanceTransferred(old, newGovernance, block.timestamp);
    }

    /**
     * @notice Register a new institutional trust anchor.
     * @param institutionIdHash Keccak256 hash of normalized institution identifier.
     * @param admin Administrator wallet address for this institution.
     * @param name Display/registered name for auditing.
     */
    function registerInstitution(
        bytes32 institutionIdHash,
        address admin,
        string calldata name
    ) external onlyGovernance {
        if (institutionIdHash == bytes32(0)) revert InvalidIdentifier();
        if (admin == address(0)) revert InvalidAddress();
        if (institutions[institutionIdHash].exists) revert InstitutionAlreadyExists();

        institutions[institutionIdHash] = Institution({
            admin: admin,
            isActive: true,
            registeredAt: block.timestamp,
            name: name,
            exists: true
        });

        totalInstitutions++;
        emit InstitutionRegistered(institutionIdHash, admin, name, block.timestamp);
    }

    /**
     * @notice Set institution status (active/inactive).
     */
    function setInstitutionStatus(bytes32 institutionIdHash, bool isActive) external onlyGovernance {
        if (!institutions[institutionIdHash].exists) revert InstitutionDoesNotExist();
        institutions[institutionIdHash].isActive = isActive;
        emit InstitutionStatusChanged(institutionIdHash, isActive, block.timestamp);
    }

    // --- Issuer Authorization Functions ---
    /**
     * @notice Authorize an issuer address to issue credentials on behalf of the institution.
     * @dev Only callable by the institution administrator or registry governance.
     */
    function authorizeIssuer(bytes32 institutionIdHash, address issuer) external onlyInstitutionAdmin(institutionIdHash) {
        if (issuer == address(0)) revert InvalidAddress();
        Institution storage inst = institutions[institutionIdHash];
        if (!inst.isActive) revert InstitutionNotActive();

        isIssuerAuthorized[institutionIdHash][issuer] = true;
        issuerAuthorizedAt[institutionIdHash][issuer] = block.timestamp;

        emit IssuerAuthorized(institutionIdHash, issuer, msg.sender, block.timestamp);
    }

    /**
     * @notice Suspend/Revoke an issuer's authorization.
     */
    function suspendIssuer(bytes32 institutionIdHash, address issuer) external onlyInstitutionAdmin(institutionIdHash) {
        if (!isIssuerAuthorized[institutionIdHash][issuer]) revert UnauthorizedIssuer();

        isIssuerAuthorized[institutionIdHash][issuer] = false;
        issuerSuspendedAt[institutionIdHash][issuer] = block.timestamp;

        emit IssuerSuspended(institutionIdHash, issuer, msg.sender, block.timestamp);
    }

    function isIssuerValid(bytes32 institutionIdHash, address issuer) external view returns (bool) {
        return institutions[institutionIdHash].isActive && isIssuerAuthorized[institutionIdHash][issuer];
    }

    // --- Issuance Registry Functions ---
    /**
     * @notice Commit a credential issuance reference to the blockchain.
     * @param institutionIdHash Keccak256 hash of normalized institution identifier.
     * @param credentialIdHash Keccak256 hash of credential ID.
     * @param recordHash Keccak256 hash of canonical credential JSON payload.
     */
    function issueCredential(
        bytes32 institutionIdHash,
        bytes32 credentialIdHash,
        bytes32 recordHash
    ) external {
        if (credentialIdHash == bytes32(0) || recordHash == bytes32(0)) revert InvalidIdentifier();
        Institution storage inst = institutions[institutionIdHash];
        if (!inst.exists) revert InstitutionDoesNotExist();
        if (!inst.isActive) revert InstitutionNotActive();
        if (!isIssuerAuthorized[institutionIdHash][msg.sender]) revert UnauthorizedIssuer();
        if (credentials[credentialIdHash].exists) revert CredentialAlreadyExists();

        credentials[credentialIdHash] = CredentialRecord({
            institutionIdHash: institutionIdHash,
            recordHash: recordHash,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            exists: true,
            isRevoked: false,
            revokedAt: 0,
            revokedBy: address(0),
            reasonCode: bytes32(0)
        });

        totalCredentialsIssued++;
        emit CredentialIssued(institutionIdHash, credentialIdHash, recordHash, msg.sender, block.timestamp);
    }

    // --- Revocation Registry Functions ---
    /**
     * @notice Revoke an issued credential.
     * @dev Only callable by the authorized institution admin or an authorized issuer for that institution.
     */
    function revokeCredential(
        bytes32 credentialIdHash,
        bytes32 reasonCode
    ) external {
        CredentialRecord storage cred = credentials[credentialIdHash];
        if (!cred.exists) revert CredentialDoesNotExist();
        if (cred.isRevoked) revert CredentialAlreadyRevoked();

        bytes32 instHash = cred.institutionIdHash;
        Institution storage inst = institutions[instHash];

        // Must be institution admin or authorized issuer for this institution
        bool isAuthorized = (msg.sender == inst.admin) ||
                           (isIssuerAuthorized[instHash][msg.sender] && inst.isActive) ||
                           (msg.sender == governance);

        if (!isAuthorized) revert UnauthorizedRevoker();

        cred.isRevoked = true;
        cred.revokedAt = block.timestamp;
        cred.revokedBy = msg.sender;
        cred.reasonCode = reasonCode;

        totalCredentialsRevoked++;
        emit CredentialRevoked(instHash, credentialIdHash, msg.sender, reasonCode, block.timestamp);
    }

    // --- Query Functions ---
    /**
     * @notice Look up full on-chain status of a credential.
     */
    function getCredentialRecord(bytes32 credentialIdHash)
        external
        view
        returns (
            bytes32 institutionIdHash,
            bytes32 recordHash,
            address issuer,
            uint256 issuedAt,
            bool exists,
            bool isRevoked,
            uint256 revokedAt,
            address revokedBy,
            bytes32 reasonCode
        )
    {
        CredentialRecord storage cred = credentials[credentialIdHash];
        return (
            cred.institutionIdHash,
            cred.recordHash,
            cred.issuer,
            cred.issuedAt,
            cred.exists,
            cred.isRevoked,
            cred.revokedAt,
            cred.revokedBy,
            cred.reasonCode
        );
    }

    /**
     * @notice Fast verification view for a verifier check.
     */
    function verifyCredentialStatus(bytes32 credentialIdHash, bytes32 expectedRecordHash)
        external
        view
        returns (
            bool exists,
            bool hashMatches,
            bool isRevoked,
            address issuer,
            uint256 issuedAt
        )
    {
        CredentialRecord storage cred = credentials[credentialIdHash];
        if (!cred.exists) {
            return (false, false, false, address(0), 0);
        }
        return (
            true,
            cred.recordHash == expectedRecordHash,
            cred.isRevoked,
            cred.issuer,
            cred.issuedAt
        );
    }

    /**
     * @notice Get institution details.
     */
    function getInstitution(bytes32 institutionIdHash)
        external
        view
        returns (
            address admin,
            bool isActive,
            uint256 registeredAt,
            string memory name,
            bool exists
        )
    {
        Institution storage inst = institutions[institutionIdHash];
        return (
            inst.admin,
            inst.isActive,
            inst.registeredAt,
            inst.name,
            inst.exists
        );
    }
}
