import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const { ethers } = hre;
  const [governance, vcetAdmin, vcetIssuer, partnerAdmin, partnerIssuer, verifier, unauthorized] = await ethers.getSigners();

  console.log("----------------------------------------------------");
  console.log("Deploying VERITAS InstitutionalTrustRegistry...");
  console.log("Governance account:", governance.address);

  const Registry = await ethers.getContractFactory("InstitutionalTrustRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log("InstitutionalTrustRegistry deployed to:", contractAddress);

  // Define synthetic institutions
  const vcetId = "vcet-mumbai";
  const vcetHash = ethers.keccak256(ethers.toUtf8Bytes(vcetId));
  const partnerId = "partner-univ";
  const partnerHash = ethers.keccak256(ethers.toUtf8Bytes(partnerId));

  console.log("Registering VCET Mumbai...");
  let tx = await registry.connect(governance).registerInstitution(vcetHash, vcetAdmin.address, "Vidyavardhini's College of Engineering and Technology");
  await tx.wait();

  console.log("Authorizing VCET Issuer:", vcetIssuer.address);
  tx = await registry.connect(vcetAdmin).authorizeIssuer(vcetHash, vcetIssuer.address);
  await tx.wait();

  console.log("Registering Partner University...");
  tx = await registry.connect(governance).registerInstitution(partnerHash, partnerAdmin.address, "Partner Global University");
  await tx.wait();

  console.log("Authorizing Partner Issuer:", partnerIssuer.address);
  tx = await registry.connect(partnerAdmin).authorizeIssuer(partnerHash, partnerIssuer.address);
  await tx.wait();

  // Load artifact ABI
  const artifactPath = path.join(__dirname, "../artifacts/contracts/InstitutionalTrustRegistry.sol/InstitutionalTrustRegistry.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const deploymentData = {
    address: contractAddress,
    network: hre.network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    governance: governance.address,
    institutions: [
      {
        id: vcetId,
        idHash: vcetHash,
        name: "Vidyavardhini's College of Engineering and Technology",
        adminAddress: vcetAdmin.address,
        issuerAddress: vcetIssuer.address,
      },
      {
        id: partnerId,
        idHash: partnerHash,
        name: "Partner Global University",
        adminAddress: partnerAdmin.address,
        issuerAddress: partnerIssuer.address,
      }
    ],
    demoAccounts: {
      governance: governance.address,
      vcetAdmin: vcetAdmin.address,
      vcetIssuer: vcetIssuer.address,
      partnerAdmin: partnerAdmin.address,
      partnerIssuer: partnerIssuer.address,
      verifier: verifier.address,
      unauthorized: unauthorized.address
    },
    abi: artifact.abi
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const backendTargetDir = path.join(__dirname, "../../backend/app");
  if (!fs.existsSync(backendTargetDir)) {
    fs.mkdirSync(backendTargetDir, { recursive: true });
  }

  fs.writeFileSync(path.join(deploymentsDir, "localhost.json"), JSON.stringify(deploymentData, null, 2));
  fs.writeFileSync(path.join(backendTargetDir, "contract_info.json"), JSON.stringify(deploymentData, null, 2));

  console.log("Deployment info successfully saved to deployments/localhost.json and backend/app/contract_info.json");
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
