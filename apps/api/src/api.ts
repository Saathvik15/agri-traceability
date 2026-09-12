export interface TraceEvent {
  id: string;
  batchId: string;
  type: string;
  dateTime: string;
  actorOrganization: string;
  note: string;
  transactionId: string;
}

export interface Batch {
  id: string;
  productName: string;
  variety: string;
  farmName: string;
  origin: string;
  harvestDate: string;
  quantityKg: number;
  ownerOrganization: string;
  status: string;
  verificationId: string;
  events: TraceEvent[];
}

const API_BASE_URL = 'http://localhost:3000/api';

export async function fetchBatches(): Promise<Batch[]> {
  const response = await fetch(`${API_BASE_URL}/batches`);
  if (!response.ok) throw new Error('Failed to fetch batches');
  return response.json();
}

export async function fetchBatchById(id: string): Promise<Batch> {
  const response = await fetch(`${API_BASE_URL}/batches/${id}`);
  if (!response.ok) throw new Error('Batch not found');
  return response.json();
}

export async function createBatch(
  data: { id: string; productName: string; variety: string; farmName: string; origin: string; harvestDate: string; quantityKg: number },
  role: string
): Promise<Batch> {
  const response = await fetch(`${API_BASE_URL}/batches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-demo-role': role,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to create batch');
  }
  return response.json();
}

export async function appendEvent(
  batchId: string,
  payload: { eventType: string; actorOrganization: string; note?: string; nextStatus?: string }
): Promise<{ batch: Batch; event: TraceEvent }> {
  const response = await fetch(`${API_BASE_URL}/batches/${batchId}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to append trace event');
  return response.json();
}

export async function fetchQrCode(batchId: string): Promise<{ qrDataUrl: string; verifyUrl: string }> {
  const response = await fetch(`${API_BASE_URL}/batches/${batchId}/qr`);
  if (!response.ok) throw new Error('Failed to load QR code');
  return response.json();
}