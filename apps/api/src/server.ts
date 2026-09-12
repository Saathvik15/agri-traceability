import express, { Request, Response } from 'express';
import cors from 'cors';
import QRCode from 'qrcode';
import { batches, createTraceEvent, Batch, Role } from './store';

const app = express();
app.use(cors());
app.use(express.json());

function getDemoRole(req: Request): Role {
  const roleHeader = req.headers['x-demo-role'] as string;
  return (roleHeader as Role) || 'Consumer';
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Agri Trace API is running' });
});

app.get('/api/batches', (_req: Request, res: Response) => {
  res.json(batches);
});

app.get('/api/batches/:id', (req: Request, res: Response) => {
  const batch = batches.find((b) => b.id === req.params.id);
  if (!batch) {
    return res.status(404).json({ error: 'Batch not found.' });
  }
  res.json(batch);
});

app.post('/api/batches', (req: Request, res: Response) => {
  const role = getDemoRole(req);

  if (role !== 'Farmer') {
    return res.status(403).json({ error: 'Forbidden: Only Farmers can register new crop batches.' });
  }

  const { id, productName, variety, farmName, origin, harvestDate, quantityKg } = req.body;

  if (!id || !productName || !variety || !farmName || !origin || !harvestDate || !quantityKg) {
    return res.status(400).json({ error: 'Missing required batch fields.' });
  }

  const existing = batches.find((b) => b.id === id);
  if (existing) {
    return res.status(400).json({ error: 'Batch ID already exists.' });
  }

  const verificationId = `VERIFY-${id}`;
  const initialEvent = createTraceEvent(id, 'BATCH_CREATED', farmName, 'Crop batch registered by farmer');

  const newBatch: Batch = {
    id,
    productName,
    variety,
    farmName,
    origin,
    harvestDate,
    quantityKg,
    ownerOrganization: farmName,
    status: 'CREATED',
    verificationId,
    events: [initialEvent],
  };

  batches.push(newBatch);
  res.status(201).json(newBatch);
});

app.post('/api/batches/:id/events', (req: Request, res: Response) => {
  const batch = batches.find((b) => b.id === req.params.id);
  if (!batch) {
    return res.status(404).json({ error: 'Batch not found.' });
  }

  const { eventType, actorOrganization, note, nextStatus } = req.body;

  if (!eventType || !actorOrganization) {
    return res.status(400).json({ error: 'Missing eventType or actorOrganization.' });
  }

  const newEvent = createTraceEvent(batch.id, eventType, actorOrganization, note || '');
  batch.events.push(newEvent);

  if (nextStatus) {
    batch.status = nextStatus;
  }
  if (actorOrganization) {
    batch.ownerOrganization = actorOrganization;
  }

  res.status(201).json({ batch, event: newEvent });
});

app.get('/api/batches/:id/qr', async (req: Request, res: Response) => {
  const batch = batches.find((b) => b.id === req.params.id);
  if (!batch) {
    return res.status(404).json({ error: 'Batch not found.' });
  }

  try {
    // Replace '192.168.1.15' with your actual local IP address
    const verifyUrl = `http://172.20.188.137:5173/verify/${batch.id}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl);
    res.json({ qrDataUrl, verifyUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code.' });
  }
});

app.listen(3000, '0.0.0.0', () => {
  console.log('API running at http://0.0.0.0:3000');
});