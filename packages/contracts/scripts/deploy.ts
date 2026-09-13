import hre from "hardhat";

async function main() {
  console.log("Connecting to local network...");

  // Obtain ethers instance from the Hardhat 3 network connection
  const connection = await hre.network.connect();
  const { ethers } = connection;

  console.log("Deploying AgriTraceability contract...");
  const AgriTraceability = await ethers.getContractFactory("AgriTraceability");
  const contract = await AgriTraceability.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("==================================================");
  console.log(`AgriTraceability contract deployed to: ${address}`);
  console.log("==================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});