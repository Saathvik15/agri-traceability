import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

// Contract ABI matching AgriTraceability.sol
const CONTRACT_ABI = [
  "function createBatch(string _batchId, string _cropName, string _farmOrigin) external",
  "function addEvent(string _batchId, string _location, string _status, string _notes) external",
  "function getBatch(string _batchId) external view returns (tuple(string batchId, string cropName, string farmOrigin, uint256 harvestTimestamp, address farmer, bool exists))",
  "function getBatchEvents(string _batchId) external view returns (tuple(uint256 timestamp, string location, string status, address actor, string notes)[])",
  "function getAllBatchIds() external view returns (string[])"
];

// Initialize Provider, Signer, and Contract
export const provider = new ethers.JsonRpcProvider(RPC_URL);
export const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
export const agriContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);