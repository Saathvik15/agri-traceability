import { randomUUID } from 'crypto';

export type Role = 'Farmer' | 'Logistics' | 'Retailer' | 'Regulator' | 'Consumer';

export type BatchStatus =
  | 'CREATED'
  | 'AWAITING_PICKUP'
  | 'IN_TRANSIT'
  | 'AT_RETAIL'
  | 'AVAILABLE'
  | 'WITHDRAWN'
  | 'RECALLED';

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
  status: BatchStatus;
  verificationId: string;
  events: TraceEvent[];
}

export const batches: Batch[] = [];

export function createTraceEvent(
  batchId: string,
  type: string,
  actorOrganization: string,
  note: string
): TraceEvent {
  return {
    id: randomUUID(),
    batchId,
    type,
    dateTime: new Date().toISOString(),
    actorOrganization,
    note,
    transactionId: `MOCK-TX-${randomUUID().substring(0, 8)}`,
  };
}