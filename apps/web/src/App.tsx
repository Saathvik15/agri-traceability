import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  fetchAllBatches,
  fetchBatchDetails,
  createBatch,
  addEvent,
  type Batch,
  type SupplyChainEvent,
} from "./services/api";

export const App: React.FC = () => {
  // Batch Form State
  const [batchId, setBatchId] = useState("");
  const [productName, setProductName] = useState("");
  const [variety, setVariety] = useState("");
  const [farmName, setFarmName] = useState("");
  const [originLocation, setOriginLocation] = useState("");

  // Event Form State
  const [eventLocation, setEventLocation] = useState("");
  const [eventStatus, setEventStatus] = useState("In Transit");
  const [eventNotes, setEventNotes] = useState("");

  // UI State
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<SupplyChainEvent[]>([]);
  const [role, setRole] = useState<"Farmer" | "Distributor" | "Retailer" | "Consumer">("Farmer");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const getAvailableStatuses = () => {
    switch (role) {
      case "Farmer":
        return ["Harvested", "Packed at Origin", "Ready for Pickup"];
      case "Distributor":
        return ["Picked Up", "In Transit", "Stored in Cold Storage", "Arrived at Regional Hub"];
      case "Retailer":
        return ["Received at Store", "Quality Inspection Passed", "Stocked on Shelf"];
      default:
        return [];
    }
  };

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await fetchAllBatches();
      setBatches(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to fetch batches");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBatch = async (id: string) => {
    setSelectedBatchId(id);
    try {
      const details = await fetchBatchDetails(id);
      setSelectedEvents(details.events);
    } catch (err: any) {
      setError("Could not load event history for batch");
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    const statuses = getAvailableStatuses();
    if (statuses.length > 0) {
      setEventStatus(statuses[0]);
    }
  }, [role]);

  // Insert the URL auto-select hook here:
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qBatchId = params.get("batchId");
    if (qBatchId) {
      handleSelectBatch(qBatchId);
      setRole("Consumer");
    }
  }, []);

  const handleRegisterBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId || !productName || !farmName) return;

    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      await createBatch({
        batchId,
        cropName: variety ? `${productName} (${variety})` : productName,
        farmOrigin: originLocation ? `${farmName}, ${originLocation}` : farmName,
      });

      setSuccessMsg(`Batch "${batchId}" registered on-chain!`);
      setBatchId("");
      setProductName("");
      setVariety("");
      setFarmName("");
      setOriginLocation("");
      await loadBatches();
    } catch (err: any) {
      setError(err.message || "Failed to register batch");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId || !eventLocation || !eventNotes) return;

    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      await addEvent({
        batchId: selectedBatchId,
        location: eventLocation,
        status: eventStatus,
        notes: eventNotes,
      });

      setSuccessMsg(`Supply chain event logged for ${selectedBatchId}!`);
      setEventLocation("");
      setEventNotes("");
      await handleSelectBatch(selectedBatchId);
    } catch (err: any) {
      setError(err.message || "Failed to add event");
    } finally {
      setSubmitting(false);
    }
  };

  const currentVerificationUrl = selectedBatchId
    ? `${window.location.origin}/?batchId=${selectedBatchId}`
    : "";

  return (
    <div style={{ backgroundColor: "#121418", color: "#e2e8f0", minHeight: "100vh", fontFamily: "sans-serif", padding: "2rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #2d3748", paddingBottom: "1rem", maxWidth: "1100px", margin: "0 auto 2rem auto" }}>
        <h2 style={{ margin: 0 }}>🌾 Agri-Traceability Dashboard</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.9rem" }}>Active Role:</label>
          <select value={role} onChange={(e: any) => setRole(e.target.value)} style={{ padding: "0.4rem 0.8rem", borderRadius: "4px", backgroundColor: "#2d3748", color: "#68d391", fontWeight: "bold", border: "1px solid #4a5568", cursor: "pointer" }}>
            <option value="Farmer">Farmer</option>
            <option value="Distributor">Distributor / Logistics</option>
            <option value="Retailer">Retailer</option>
            <option value="Consumer">Consumer</option>
          </select>
        </div>
      </header>

      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {error && <div style={{ backgroundColor: "#fff5f5", color: "#e53e3e", padding: "0.75rem", borderRadius: "6px", marginBottom: "1.5rem" }}>{error}</div>}
        {successMsg && <div style={{ backgroundColor: "#f0fff4", color: "#38a169", padding: "0.75rem", borderRadius: "6px", marginBottom: "1.5rem" }}>{successMsg}</div>}

        <div style={{ display: "grid", gridTemplateColumns: role === "Consumer" ? "1fr" : "1fr 1fr", gap: "2rem" }}>
          
          {/* Action Column */}
          {role !== "Consumer" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {role === "Farmer" && (
                <div style={{ backgroundColor: "#ffffff", color: "#1a202c", padding: "1.5rem", borderRadius: "8px" }}>
                  <h3 style={{ marginTop: 0, color: "#2d3748" }}>Register Batch (Farmer)</h3>
                  <form onSubmit={handleRegisterBatch} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <input type="text" placeholder="Batch ID (e.g. MANGO-2026-0002)" value={batchId} onChange={(e) => setBatchId(e.target.value)} style={inputStyle} />
                    <input type="text" placeholder="Product Name (e.g. Mango)" value={productName} onChange={(e) => setProductName(e.target.value)} style={inputStyle} />
                    <input type="text" placeholder="Variety (e.g. Alphonso)" value={variety} onChange={(e) => setVariety(e.target.value)} style={inputStyle} />
                    <input type="text" placeholder="Farm Name" value={farmName} onChange={(e) => setFarmName(e.target.value)} style={inputStyle} />
                    <input type="text" placeholder="Origin Location" value={originLocation} onChange={(e) => setOriginLocation(e.target.value)} style={inputStyle} />
                    <button type="submit" disabled={submitting} style={{ backgroundColor: "#276749", color: "#fff", padding: "0.75rem", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}>
                      {submitting ? "Mining Block..." : "Register Batch On-Chain"}
                    </button>
                  </form>
                </div>
              )}

              <div style={{ backgroundColor: "#1a202c", border: "1px solid #4a5568", padding: "1.5rem", borderRadius: "8px" }}>
                <h3 style={{ marginTop: 0, color: "#68d391" }}>
                  {selectedBatchId ? `Log Event: ${selectedBatchId}` : "Select a Batch to Log Event"}
                </h3>
                {selectedBatchId ? (
                  <form onSubmit={handleAddEvent} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <input type="text" placeholder="Location (e.g. Mumbai Port, Store #14)" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} style={darkInputStyle} />
                    
                    <div>
                      <label style={{ fontSize: "0.8rem", color: "#a0aec0", display: "block", marginBottom: "0.25rem" }}>Allowed Status ({role}):</label>
                      <select value={eventStatus} onChange={(e) => setEventStatus(e.target.value)} style={darkInputStyle}>
                        {getAvailableStatuses().map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <input type="text" placeholder="Notes / Sensor Data" value={eventNotes} onChange={(e) => setEventNotes(e.target.value)} style={darkInputStyle} />
                    <button type="submit" disabled={submitting} style={{ backgroundColor: "#3182ce", color: "#fff", padding: "0.75rem", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}>
                      {submitting ? "Mining Event..." : `Log ${role} Event`}
                    </button>
                  </form>
                ) : (
                  <p style={{ color: "#a0aec0", fontSize: "0.9rem" }}>Select any batch from the list on the right to log an update for this role.</p>
                )}
              </div>
            </div>
          )}

          {/* Verification & Display Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {role === "Consumer" && (
              <div style={{ backgroundColor: "#2b6cb0", color: "#fff", padding: "1rem", borderRadius: "6px" }}>
                <h4 style={{ margin: "0 0 0.5rem 0" }}>🔍 Consumer Verification View</h4>
                <p style={{ margin: 0, fontSize: "0.9rem" }}>
                  Scan product QR code or select a batch to inspect its immutable provenance timeline.
                </p>
              </div>
            )}

            {/* Batch List */}
            <div>
              <h3 style={{ marginTop: 0 }}>Registered Batches</h3>
              {loading ? (
                <p style={{ color: "#a0aec0" }}>Loading smart contract state...</p>
              ) : batches.length === 0 ? (
                <p style={{ color: "#a0aec0" }}>No batches created yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {batches.map((b) => (
                    <div
                      key={b.batchId}
                      onClick={() => handleSelectBatch(b.batchId)}
                      style={{
                        backgroundColor: selectedBatchId === b.batchId ? "#2d3748" : "#1a202c",
                        border: selectedBatchId === b.batchId ? "2px solid #68d391" : "1px solid #2d3748",
                        padding: "1rem",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      <h4 style={{ margin: "0 0 0.25rem 0", color: "#68d391" }}>{b.batchId}</h4>
                      <p style={{ margin: 0, fontSize: "0.9rem" }}>{b.cropName} — {b.farmOrigin}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Batch: Event Timeline & QR Code */}
            {selectedBatchId && (
              <div style={{ backgroundColor: "#1a202c", padding: "1.25rem", borderRadius: "6px", border: "1px solid #2d3748" }}>
                
                {/* QR Code Verification Card */}
                <div style={{ backgroundColor: "#ffffff", color: "#1a202c", padding: "1rem", borderRadius: "6px", display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.25rem" }}>
                  <QRCodeSVG value={currentVerificationUrl} size={110} level="M" />
                  <div>
                    <h4 style={{ margin: "0 0 0.25rem 0", color: "#2d3748" }}>Consumer QR Tag</h4>
                    <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.8rem", color: "#718096" }}>
                      Scan code to verify origin and complete block history on mobile.
                    </p>
                    <code style={{ fontSize: "0.75rem", backgroundColor: "#edf2f7", padding: "0.2rem 0.4rem", borderRadius: "4px", color: "#2b6cb0", wordBreak: "break-all" }}>
                      {currentVerificationUrl}
                    </code>
                  </div>
                </div>

                {/* Timeline */}
                <h4 style={{ marginTop: 0, borderBottom: "1px solid #2d3748", paddingBottom: "0.5rem" }}>
                  On-Chain Timeline: {selectedBatchId}
                </h4>
                {selectedEvents.length === 0 ? (
                  <p style={{ color: "#a0aec0", fontSize: "0.9rem" }}>No supply chain events logged yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {selectedEvents.map((evt, idx) => (
                      <div key={idx} style={{ borderLeft: "2px solid #3182ce", paddingLeft: "0.75rem" }}>
                        <p style={{ margin: 0, fontWeight: "bold", color: "#63b3ed", fontSize: "0.9rem" }}>{evt.status}</p>
                        <p style={{ margin: "0.2rem 0", fontSize: "0.85rem" }}>📍 {evt.location}</p>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#a0aec0" }}>📝 {evt.notes}</p>
                        <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.7rem", color: "#718096" }}>
                          Actor: {evt.actor ? `${evt.actor.substring(0, 6)}...${evt.actor.substring(evt.actor.length - 4)}` : "Verified Contract"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = { width: "100%", padding: "0.6rem", borderRadius: "4px", border: "1px solid #cbd5e0", backgroundColor: "#2d3748", color: "#fff", boxSizing: "border-box" };
const darkInputStyle: React.CSSProperties = { width: "100%", padding: "0.6rem", borderRadius: "4px", border: "1px solid #4a5568", backgroundColor: "#1a202c", color: "#fff", boxSizing: "border-box" };

export default App;