const HOST = typeof window !== "undefined" ? window.location.hostname : "localhost";
const API_BASE_URL = `http://${HOST}:3000/api`;

export interface Batch {
  batchId: string;
  cropName: string;
  farmOrigin: string;
  harvestTimestamp: number;
  farmer: string;
  price: number; // farm-gate price, in rupees
  quantityKg: number; // harvested quantity, in kg
}

export interface SupplyChainEvent {
  timestamp: number;
  location: string;
  status: string;
  actor: string;
  notes: string;
  price: number; // price recorded at this stage, in rupees (0 if not set)
}

export interface BatchDetailsResponse {
  batch: Batch;
  events: SupplyChainEvent[];
}

export const fetchAllBatches = async (): Promise<Batch[]> => {
  const res = await fetch(`${API_BASE_URL}/batches`);
  if (!res.ok) throw new Error("Failed to fetch batches");
  return res.json();
};

export const fetchBatchDetails = async (batchId: string): Promise<BatchDetailsResponse> => {
  const res = await fetch(`${API_BASE_URL}/batches/${batchId}`);
  if (!res.ok) throw new Error("Batch not found on-chain");
  return res.json();
};

export const createBatch = async (data: { batchId: string; cropName: string; farmOrigin: string; price: number; quantityKg: number }) => {
  const res = await fetch(`${API_BASE_URL}/batches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create batch");
  return res.json();
};

export const addEvent = async (data: { batchId: string; location: string; status: string; notes: string; price: number }) => {
  const res = await fetch(`${API_BASE_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add event");
  return res.json();
};
