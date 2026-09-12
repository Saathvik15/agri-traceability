import express, { Request, Response } from 'express';
import cors from 'cors';
import QRCode from 'qrcode';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { getDb } from './db';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
const PORT = process.env.PORT || 3000;

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Agri Trace API with SQLite running' });
});

app.get('/api/batches', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const batches = await db.all('SELECT * FROM batches');

    for (const batch of batches) {
      batch.events = await db.all(
        'SELECT * FROM trace_events WHERE batchId = ? ORDER BY dateTime ASC',
        [batch.id]
      );
    }
    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve batches.' });
  }
});

app.get('/api/batches/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const batch = await db.get('SELECT * FROM batches WHERE id = ?', [req.params.id]);

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found.' });
    }

    batch.events = await db.all(
      'SELECT * FROM trace_events WHERE batchId = ? ORDER BY dateTime ASC',
      [batch.id]
    );

    res.json(batch);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch batch.' });
  }
});

app.post('/api/batches', async (req: Request, res: Response) => {
  const role = (req.headers['x-demo-role'] as string) || 'Consumer';
  if (role !== 'Farmer') {
    return res.status(403).json({ error: 'Forbidden: Only Farmers can register new crop batches.' });
  }

  const { id, productName, variety, farmName, origin, harvestDate, quantityKg } = req.body;
  if (!id || !productName || !variety || !farmName || !origin || !harvestDate || !quantityKg) {
    return res.status(400).json({ error: 'Missing required batch fields.' });
  }

  try {
    const db = await getDb();
    const existing = await db.get('SELECT id FROM batches WHERE id = ?', [id]);
    if (existing) {
      return res.status(400).json({ error: 'Batch ID already exists.' });
    }

    const verificationId = `VERIFY-${id}`;
    const status = 'CREATED';

    await db.run(
      `INSERT INTO batches (id, productName, variety, farmName, origin, harvestDate, quantityKg, ownerOrganization, status, verificationId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, productName, variety, farmName, origin, harvestDate, quantityKg, farmName, status, verificationId]
    );

    const eventId = `EVT-${Date.now()}`;
    const txHash = `0x${crypto.randomBytes(16).toString('hex')}`;
    const isoDate = new Date().toISOString();

    await db.run(
      `INSERT INTO trace_events (id, batchId, type, dateTime, actorOrganization, note, transactionId)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [eventId, id, 'BATCH_CREATED', isoDate, farmName, 'Crop batch registered by farmer', txHash]
    );

    const createdBatch = await db.get('SELECT * FROM batches WHERE id = ?', [id]);
    createdBatch.events = await db.all('SELECT * FROM trace_events WHERE batchId = ? ORDER BY dateTime ASC', [id]);

    res.status(201).json(createdBatch);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save batch.' });
  }
});

app.post('/api/batches/:id/events', async (req: Request, res: Response) => {
  const { eventType, actorOrganization, note, nextStatus } = req.body;
  if (!eventType || !actorOrganization) {
    return res.status(400).json({ error: 'Missing eventType or actorOrganization.' });
  }

  try {
    const db = await getDb();
    const batch = await db.get('SELECT * FROM batches WHERE id = ?', [req.params.id]);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found.' });
    }

    const eventId = `EVT-${Date.now()}`;
    const txHash = `0x${crypto.randomBytes(16).toString('hex')}`;
    const isoDate = new Date().toISOString();

    await db.run(
      `INSERT INTO trace_events (id, batchId, type, dateTime, actorOrganization, note, transactionId)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [eventId, batch.id, eventType, isoDate, actorOrganization, note || '', txHash]
    );

    const updatedStatus = nextStatus || batch.status;
    const updatedOwner = actorOrganization || batch.ownerOrganization;

    await db.run(
      'UPDATE batches SET status = ?, ownerOrganization = ? WHERE id = ?',
      [updatedStatus, updatedOwner, batch.id]
    );

    const updatedBatch = await db.get('SELECT * FROM batches WHERE id = ?', [batch.id]);
    updatedBatch.events = await db.all('SELECT * FROM trace_events WHERE batchId = ? ORDER BY dateTime ASC', [batch.id]);

    res.status(201).json({ batch: updatedBatch });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record event.' });
  }
});

app.get('/api/batches/:id/qr', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const batch = await db.get('SELECT id FROM batches WHERE id = ?', [req.params.id]);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found.' });
    }

    const verifyUrl = `http://${LOCAL_IP}:5173/verify/${batch.id}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl);
    res.json({ qrDataUrl, verifyUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code.' });
  }
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`API running with SQLite at http://0.0.0.0:${PORT} (network accessible via ${LOCAL_IP})`);
});