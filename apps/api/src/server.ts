import express, { Request, Response } from "express";
import cors from "cors";
import { agriContract } from "./blockchain";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// Fetch all registered produce batches from smart contract
// Fetch all registered produce batches from smart contract
app.get("/api/batches", async (req: Request, res: Response) => {
  try {
    const batchIds: string[] = await agriContract.getAllBatchIds();

    const batches = await Promise.all(
      batchIds.map(async (id: string) => {
        const b = await agriContract.getBatch(id);
        return {
          batchId: b.batchId,
          cropName: b.cropName,
          farmOrigin: b.farmOrigin,
          harvestTimestamp: Number(b.harvestTimestamp),
          farmer: b.farmer,
        };
      })
    );

    res.status(200).json(batches);
  } catch (error: any) {
    console.warn("No batches found or contract query failed:", error.message);
    // Return empty array with HTTP 200 to keep UI clean before first batch registration
    res.status(200).json([]);
  }
});

// Read single batch origin details and event history
app.get("/api/batches/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const batch = await agriContract.getBatch(id);
    const eventsRaw = await agriContract.getBatchEvents(id);

    const events = eventsRaw.map((e: any) => ({
      timestamp: Number(e.timestamp),
      location: e.location,
      status: e.status,
      actor: e.actor,
      notes: e.notes,
    }));

    res.json({
      batch: {
        batchId: batch.batchId,
        cropName: batch.cropName,
        farmOrigin: batch.farmOrigin,
        harvestTimestamp: Number(batch.harvestTimestamp),
        farmer: batch.farmer,
      },
      events,
    });
  } catch (error: any) {
    res.status(404).json({ error: "Batch not found on-chain" });
  }
});

// Register a new produce batch on-chain
app.post("/api/batches", async (req: Request, res: Response) => {
  try {
    const { batchId, cropName, farmOrigin } = req.body;

    const tx = await agriContract.createBatch(batchId, cropName, farmOrigin);
    const receipt = await tx.wait();

    res.status(201).json({
      message: "Batch created successfully on-chain",
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.reason || error.message });
  }
});

// Add a supply-chain status update event on-chain
app.post("/api/events", async (req: Request, res: Response) => {
  try {
    const { batchId, location, status, notes } = req.body;

    const tx = await agriContract.addEvent(batchId, location, status, notes);
    const receipt = await tx.wait();

    res.status(200).json({
      message: "Supply chain event recorded on-chain",
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.reason || error.message });
  }
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Blockchain API running on http://0.0.0.0:${PORT}`);
});