import { useEffect, useState } from 'react';
import {
  fetchBatches,
  createBatch,
  appendEvent,
  fetchQrCode,
  type Batch,
  type TraceEvent,
} from './api';

export default function App() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('Farmer');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [qrCode, setQrCode] = useState<{ qrDataUrl: string; verifyUrl: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // New Batch Form State
  const [newBatch, setNewBatch] = useState({
    id: '',
    productName: '',
    variety: '',
    farmName: '',
    origin: '',
    harvestDate: new Date().toISOString().split('T')[0],
    quantityKg: 100,
  });

  // Event Form State
  const [eventData, setEventData] = useState({
    eventType: 'TEMPERATURE_CHECK',
    actorOrganization: '',
    note: '',
    nextStatus: '',
  });

  const loadBatches = async () => {
    try {
      setLoading(true);
      const data = await fetchBatches();
      setBatches(data);
      if (selectedBatch) {
        const updated = data.find((b) => b.id === selectedBatch.id);
        if (updated) setSelectedBatch(updated);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createBatch(newBatch, selectedRole);
      setNewBatch({
        id: '',
        productName: '',
        variety: '',
        farmName: '',
        origin: '',
        harvestDate: new Date().toISOString().split('T')[0],
        quantityKg: 100,
      });
      await loadBatches();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAppendEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    setError('');
    try {
      await appendEvent(selectedBatch.id, eventData);
      setEventData({ eventType: 'TEMPERATURE_CHECK', actorOrganization: '', note: '', nextStatus: '' });
      await loadBatches();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLoadQr = async (batchId: string) => {
    try {
      const qr = await fetchQrCode(batchId);
      setQrCode(qr);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '2px solid #eee', paddingBottom: '1rem' }}>
        <h2>🌾 Agri-Traceability Dashboard</h2>
        <div>
          <label style={{ marginRight: '0.5rem', fontWeight: 'bold' }}>Simulate Role:</label>
          <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} style={{ padding: '0.4rem 0.8rem' }}>
            <option value="Farmer">Farmer</option>
            <option value="Logistics">Logistics</option>
            <option value="Retailer">Retailer</option>
            <option value="Regulator">Regulator</option>
            <option value="Consumer">Consumer</option>
          </select>
        </div>
      </header>

      {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Left Column: Actions */}
        <div>
          {selectedRole === 'Farmer' && (
            <div style={{ background: '#f9f9f9', padding: '1.2rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #ddd' }}>
              <h3>Register New Crop Batch</h3>
              <form onSubmit={handleCreateBatch} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <input placeholder="Batch ID (e.g. MANGO-2026-0002)" value={newBatch.id} onChange={(e) => setNewBatch({ ...newBatch, id: e.target.value })} required />
                <input placeholder="Product Name (e.g. Mango)" value={newBatch.productName} onChange={(e) => setNewBatch({ ...newBatch, productName: e.target.value })} required />
                <input placeholder="Variety (e.g. Alphonso)" value={newBatch.variety} onChange={(e) => setNewBatch({ ...newBatch, variety: e.target.value })} required />
                <input placeholder="Farm Name" value={newBatch.farmName} onChange={(e) => setNewBatch({ ...newBatch, farmName: e.target.value })} required />
                <input placeholder="Origin Location" value={newBatch.origin} onChange={(e) => setNewBatch({ ...newBatch, origin: e.target.value })} required />
                <input type="date" value={newBatch.harvestDate} onChange={(e) => setNewBatch({ ...newBatch, harvestDate: e.target.value })} required />
                <input type="number" placeholder="Quantity (kg)" value={newBatch.quantityKg} onChange={(e) => setNewBatch({ ...newBatch, quantityKg: Number(e.target.value) })} required />
                <button type="submit" style={{ padding: '0.6rem', cursor: 'pointer', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: '4px' }}>Register Batch</button>
              </form>
            </div>
          )}

          {selectedBatch && (
            <div style={{ background: '#f9f9f9', padding: '1.2rem', borderRadius: '8px', border: '1px solid #ddd' }}>
              <h3>Append Event to {selectedBatch.id}</h3>
              <form onSubmit={handleAppendEvent} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <input placeholder="Event Type (e.g. HANDOFF_ACCEPTED)" value={eventData.eventType} onChange={(e) => setEventData({ ...eventData, eventType: e.target.value })} required />
                <input placeholder="Actor / Organization" value={eventData.actorOrganization} onChange={(e) => setEventData({ ...eventData, actorOrganization: e.target.value })} required />
                <input placeholder="Notes / Telemetry" value={eventData.note} onChange={(e) => setEventData({ ...eventData, note: e.target.value })} />
                <select value={eventData.nextStatus} onChange={(e) => setEventData({ ...eventData, nextStatus: e.target.value })}>
                  <option value="">Keep Status Unchanged ({selectedBatch.status})</option>
                  <option value="AWAITING_PICKUP">AWAITING_PICKUP</option>
                  <option value="IN_TRANSIT">IN_TRANSIT</option>
                  <option value="AT_RETAIL">AT_RETAIL</option>
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="RECALLED">RECALLED</option>
                </select>
                <button type="submit" style={{ padding: '0.6rem', cursor: 'pointer', background: '#1565c0', color: '#fff', border: 'none', borderRadius: '4px' }}>Append Trace Event</button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Batches & Timeline */}
        <div>
          <h3>Registered Batches</h3>
          {loading && <p>Loading batches...</p>}
          {batches.length === 0 && !loading && <p>No batches created yet.</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {batches.map((batch) => (
              <div
                key={batch.id}
                onClick={() => { setSelectedBatch(batch); handleLoadQr(batch.id); }}
                style={{
                  border: selectedBatch?.id === batch.id ? '2px solid #1565c0' : '1px solid #ccc',
                  borderRadius: '6px',
                  padding: '1rem',
                  cursor: 'pointer',
                  background: selectedBatch?.id === batch.id ? '#e3f2fd' : '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{batch.productName} ({batch.variety})</strong>
                  <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#333', color: '#fff', fontSize: '0.8rem' }}>{batch.status}</span>
                </div>
                <p style={{ margin: '0.4rem 0', fontSize: '0.9rem', color: '#555' }}>
                  ID: {batch.id} | Farm: {batch.farmName} | Owner: {batch.ownerOrganization}
                </p>

                {selectedBatch?.id === batch.id && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid #ccc', paddingTop: '0.5rem' }}>
                    <h4>Audit Trail Timeline ({batch.events.length} Events)</h4>
                    <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
                      {batch.events.map((evt: TraceEvent) => (
                        <li key={evt.id} style={{ marginBottom: '0.4rem' }}>
                          <strong>{evt.type}</strong> by <em>{evt.actorOrganization}</em> <br />
                          <small>{new Date(evt.dateTime).toLocaleString()}</small> - {evt.note}
                          <br />
                          <code style={{ fontSize: '0.75rem', color: '#777' }}>Tx: {evt.transactionId}</code>
                        </li>
                      ))}
                    </ul>

                    {qrCode && (
                      <div style={{ marginTop: '1rem', textAlign: 'center', background: '#fff', padding: '0.5rem', borderRadius: '4px' }}>
                        <img src={qrCode.qrDataUrl} alt="Batch QR Code" width="120" />
                        <p style={{ fontSize: '0.75rem', margin: 0 }}>Scan to Verify: {qrCode.verifyUrl}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}