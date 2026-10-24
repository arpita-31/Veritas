import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("InstitutionalTrustRegistry", function () {
  let registry;
  let owner, instAdminA, instAdminB, issuerA, issuerB, unauthorizedUser, holder;

  const instAId = "vcet-mumbai";
  const instAHash = ethers.keccak256(ethers.toUtf8Bytes(instAId));

  const instBId = "partner-univ";
  const instBHash = ethers.keccak256(ethers.toUtf8Bytes(instBId));

  const sampleCredId = "urn:uuid:11111111-2222-3333-4444-555555555555";
  const sampleCredIdHash = ethers.keccak256(ethers.toUtf8Bytes(sampleCredId));
  const sampleRecordHash = ethers.keccak256(ethers.toUtf8Bytes('{"canonical":"data"}'));

  beforeEach(async function () {
    [owner, instAdminA, instAdminB, issuerA, issuerB, unauthorizedUser, holder] = await ethers.getSigners();

    const RegistryFactory = await ethers.getContractFactory("InstitutionalTrustRegistry");
    registry = await RegistryFactory.deploy();
    await registry.waitForDeployment();
  });

  describe("1. Institution Registration & Governance", function () {
    it("Test 1: Authorized governance registers a valid institution", async function () {
      const tx = await registry.connect(owner).registerInstitution(instAHash, instAdminA.address, "VCET Mumbai");
      const receipt = await tx.wait();

      const inst = await registry.institutions(instAHash);
      expect(inst.exists).to.be.true;
      expect(inst.admin).to.equal(instAdminA.address);
      expect(inst.isActive).to.be.true;
      expect(inst.name).to.equal("VCET Mumbai");

      // Verify event was emitted
      await expect(tx)
        .to.emit(registry, "InstitutionRegistered")
        .withArgs(instAHash, instAdminA.address, "VCET Mumbai", (await ethers.provider.getBlock(receipt.blockNumber)).timestamp);
    });

    it("Test 2: Unauthorized governance registration is rejected", async function () {
      await expect(
        registry.connect(unauthorizedUser).registerInstitution(instAHash, instAdminA.address, "VCET Mumbai")
      ).to.be.revertedWithCustomError(registry, "UnauthorizedGovernance");
    });

    it("Rejects duplicate institution registration", async function () {
      await registry.connect(owner).registerInstitution(instAHash, instAdminA.address, "VCET Mumbai");
      await expect(
        registry.connect(owner).registerInstitution(instAHash, instAdminA.address, "VCET Mumbai Duplicate")
      ).to.be.revertedWithCustomError(registry, "InstitutionAlreadyExists");
    });
  });

  describe("2. Issuer Authorization Management", function () {
    beforeEach(async function () {
      await registry.connect(owner).registerInstitution(instAHash, instAdminA.address, "VCET Mumbai");
      await registry.connect(owner).registerInstitution(instBHash, instAdminB.address, "Partner University");
    });

    it("Test 3: An institution administrator authorizes an issuer", async function () {
      const tx = await registry.connect(instAdminA).authorizeIssuer(instAHash, issuerA.address);
      await tx.wait();

      expect(await registry.isIssuerAuthorized(instAHash, issuerA.address)).to.be.true;
      expect(await registry.isIssuerValid(instAHash, issuerA.address)).to.be.true;

      await expect(tx)
        .to.emit(registry, "IssuerAuthorized");
    });

    it("Test 4: An unrelated account cannot authorize an issuer for another institution", async function () {
      // Admin B tries to authorize for Institution A
      await expect(
        registry.connect(instAdminB).authorizeIssuer(instAHash, issuerB.address)
      ).to.be.revertedWithCustomError(registry, "UnauthorizedAdmin");

      // Random user tries to authorize for Institution A
      await expect(
        registry.connect(unauthorizedUser).authorizeIssuer(instAHash, unauthorizedUser.address)
      ).to.be.revertedWithCustomError(registry, "UnauthorizedAdmin");
    });

    it("Test 12: Issuer suspension removes current issuance authorization", async function () {
      await registry.connect(instAdminA).authorizeIssuer(instAHash, issuerA.address);
      expect(await registry.isIssuerValid(instAHash, issuerA.address)).to.be.true;

      const tx = await registry.connect(instAdminA).suspendIssuer(instAHash, issuerA.address);
      await tx.wait();

      expect(await registry.isIssuerAuthorized(instAHash, issuerA.address)).to.be.false;
      expect(await registry.isIssuerValid(instAHash, issuerA.address)).to.be.false;

      await expect(tx)
        .to.emit(registry, "IssuerSuspended");
    });
  });

  describe("3. Credential Issuance", function () {
    beforeEach(async function () {
      await registry.connect(owner).registerInstitution(instAHash, instAdminA.address, "VCET Mumbai");
      await registry.connect(instAdminA).authorizeIssuer(instAHash, issuerA.address);
    });

    it("Test 5: An authorized issuer successfully registers a valid credential issuance reference", async function () {
      const tx = await registry.connect(issuerA).issueCredential(instAHash, sampleCredIdHash, sampleRecordHash);
      const receipt = await tx.wait();

      const cred = await registry.getCredentialRecord(sampleCredIdHash);
      expect(cred.exists).to.be.true;
      expect(cred.institutionIdHash).to.equal(instAHash);
      expect(cred.recordHash).to.equal(sampleRecordHash);
      expect(cred.issuer).to.equal(issuerA.address);
      expect(cred.isRevoked).to.be.false;

      // Quick verification view
      const [exists, hashMatches, isRevoked, issuer, issuedAt] = await registry.verifyCredentialStatus(sampleCredIdHash, sampleRecordHash);
      expect(exists).to.be.true;
      expect(hashMatches).to.be.true;
      expect(isRevoked).to.be.false;
      expect(issuer).to.equal(issuerA.address);

      await expect(tx)
        .to.emit(registry, "CredentialIssued")
        .withArgs(instAHash, sampleCredIdHash, sampleRecordHash, issuerA.address, (await ethers.provider.getBlock(receipt.blockNumber)).timestamp);
    });

    it("Test 6: An unauthorized wallet cannot register an issuance reference", async function () {
      await expect(
        registry.connect(unauthorizedUser).issueCredential(instAHash, sampleCredIdHash, sampleRecordHash)
      ).to.be.revertedWithCustomError(registry, "UnauthorizedIssuer");
    });

    it("Test 7: A credential cannot be registered twice under the same ID", async function () {
      await registry.connect(issuerA).issueCredential(instAHash, sampleCredIdHash, sampleRecordHash);

      const modifiedRecordHash = ethers.keccak256(ethers.toUtf8Bytes('{"canonical":"tampered"}'));
      await expect(
        registry.connect(issuerA).issueCredential(instAHash, sampleCredIdHash, modifiedRecordHash)
      ).to.be.revertedWithCustomError(registry, "CredentialAlreadyExists");
    });
  });

  describe("4. Credential Revocation", function () {
    const reasonCode = ethers.keccak256(ethers.toUtf8Bytes("DEGREE_REVOKED_ACADEMIC_MISCONDUCT"));

    beforeEach(async function () {
      await registry.connect(owner).registerInstitution(instAHash, instAdminA.address, "VCET Mumbai");
      await registry.connect(owner).registerInstitution(instBHash, instAdminB.address, "Partner University");
      await registry.connect(instAdminA).authorizeIssuer(instAHash, issuerA.address);
      await registry.connect(instAdminB).authorizeIssuer(instBHash, issuerB.address);

      await registry.connect(issuerA).issueCredential(instAHash, sampleCredIdHash, sampleRecordHash);
    });

    it("Test 8: A credential from an unrelated institution cannot be revoked by another institution's administrator", async function () {
      await expect(
        registry.connect(instAdminB).revokeCredential(sampleCredIdHash, reasonCode)
      ).to.be.revertedWithCustomError(registry, "UnauthorizedRevoker");

      await expect(
        registry.connect(issuerB).revokeCredential(sampleCredIdHash, reasonCode)
      ).to.be.revertedWithCustomError(registry, "UnauthorizedRevoker");
    });

    it("Test 9: An authorized actor revokes a valid credential", async function () {
      const tx = await registry.connect(issuerA).revokeCredential(sampleCredIdHash, reasonCode);
      const receipt = await tx.wait();

      const cred = await registry.getCredentialRecord(sampleCredIdHash);
      expect(cred.isRevoked).to.be.true;
      expect(cred.revokedBy).to.equal(issuerA.address);
      expect(cred.reasonCode).to.equal(reasonCode);

      // verify quick check
      const [exists, hashMatches, isRevoked] = await registry.verifyCredentialStatus(sampleCredIdHash, sampleRecordHash);
      expect(exists).to.be.true;
      expect(hashMatches).to.be.true;
      expect(isRevoked).to.be.true;

      await expect(tx)
        .to.emit(registry, "CredentialRevoked")
        .withArgs(instAHash, sampleCredIdHash, issuerA.address, reasonCode, (await ethers.provider.getBlock(receipt.blockNumber)).timestamp);
    });

    it("Test 10: An unknown credential cannot be revoked", async function () {
      const unknownCredHash = ethers.keccak256(ethers.toUtf8Bytes("urn:uuid:unknown"));
      await expect(
        registry.connect(issuerA).revokeCredential(unknownCredHash, reasonCode)
      ).to.be.revertedWithCustomError(registry, "CredentialDoesNotExist");
    });

    it("Test 11: Duplicate or invalid revocation operations fail safely", async function () {
      await registry.connect(instAdminA).revokeCredential(sampleCredIdHash, reasonCode);

      // Second revocation attempt must revert
      await expect(
        registry.connect(instAdminA).revokeCredential(sampleCredIdHash, reasonCode)
      ).to.be.revertedWithCustomError(registry, "CredentialAlreadyRevoked");
    });

    it("Test 13: Event fields contain no names, marks, or full credential payloads", async function () {
      // Check event definition on contract interface
      const eventFragment = registry.interface.getEvent("CredentialIssued");
      expect(eventFragment).to.not.be.null;

      const paramNames = eventFragment.inputs.map(i => i.name);
      expect(paramNames).to.deep.equal(["institutionIdHash", "credentialIdHash", "recordHash", "issuer", "timestamp"]);

      // Verify no student personal data in event parameters
      expect(paramNames).to.not.include("studentName");
      expect(paramNames).to.not.include("marks");
      expect(paramNames).to.not.include("grade");
      expect(paramNames).to.not.include("credentialPayload");
    });
  });
});
