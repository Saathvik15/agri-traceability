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

// ---- Earthy palette ----
const palette = {
  bg: "#2A2115",          // deep soil brown (page background)
  bgHeaderBorder: "#4A3826",
  card: "#F6EFDE",        // warm cream paper (light cards)
  cardText: "#2E2415",    // dark roasted-coffee text on cream
  darkCard: "#33281B",    // lighter soil brown (dark cards/panels)
  darkCardBorder: "#5C4A34",
  inputBgOnCream: "#EFE4C9",
  inputBgOnDark: "#241C12",
  inputBorder: "#6B5842",
  textCream: "#EEE3CC",   // primary light text on dark bg
  textMuted: "#B8A888",   // muted tan/secondary text
  green: "#4B6B3A",       // leaf green (primary accent / buttons)
  greenBright: "#7FAE5A", // highlight green (selected state)
  greenSoft: "#8BAE6F",
  rust: "#A9552E",        // terracotta accent (timeline / secondary actions)
  rustSoft: "#C97B4A",
  errorBg: "#3A1F16",
  errorText: "#E2A184",
  successBg: "#28331C",
  successText: "#9FC97D",
};

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
    <div style={{ backgroundColor: palette.bg, color: palette.textCream, minHeight: "100vh", fontFamily: "'Georgia', 'Source Serif 4', serif", padding: "2rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `2px solid ${palette.bgHeaderBorder}`, paddingBottom: "1rem", maxWidth: "1100px", margin: "0 auto 2rem auto" }}>
        <h2 style={{ margin: 0, color: palette.textCream, letterSpacing: "0.02em" }}>🌾 Agri-Traceability Dashboard</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.9rem", fontFamily: "sans-serif", color: palette.textMuted }}>Active Role:</label>
          <select value={role} onChange={(e: any) => setRole(e.target.value)} style={{ padding: "0.4rem 0.8rem", borderRadius: "4px", backgroundColor: palette.darkCard, color: palette.greenBright, fontWeight: "bold", border: `1px solid ${palette.darkCardBorder}`, cursor: "pointer", fontFamily: "sans-serif" }}>
            <option value="Farmer">Farmer</option>
            <option value="Distributor">Distributor / Logistics</option>
            <option value="Retailer">Retailer</option>
            <option value="Consumer">Consumer</option>
          </select>
        </div>
      </header>

      <div style={{ maxWidth: "1100px", margin: "0 auto", fontFamily: "sans-serif" }}>
        {error && <div style={{ backgroundColor: palette.errorBg, color: palette.errorText, padding: "0.75rem", borderRadius: "6px", marginBottom: "1.5rem", border: `1px solid ${palette.rust}` }}>{error}</div>}
        {successMsg && <div style={{ backgroundColor: palette.successBg, color: palette.successText, padding: "0.75rem", borderRadius: "6px", marginBottom: "1.5rem", border: `1px solid ${palette.green}` }}>{successMsg}</div>}

        <div style={{ display: "grid", gridTemplateColumns: role === "Consumer" ? "1fr" : "1fr 1fr", gap: "2rem" }}>

          {/* Action Column */}
          {role !== "Consumer" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {role === "Farmer" && (
                <div style={{ backgroundColor: palette.card, color: palette.cardText, padding: "1.5rem", borderRadius: "10px", boxShadow: "0 4px 14px rgba(0,0,0,0.25)" }}>
                  <h3 style={{ marginTop: 0, color: palette.cardText, fontFamily: "'Georgia', serif" }}>Register Batch (Farmer)</h3>
                  <form onSubmit={handleRegisterBatch} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <input type="text" placeholder="Batch ID (e.g. MANGO-2026-0002)" value={batchId} onChange={(e) => setBatchId(e.target.value)} style={inputStyle} />
                    <input type="text" placeholder="Product Name (e.g. Mango)" value={productName} onChange={(e) => setProductName(e.target.value)} style={inputStyle} />
                    <input type="text" placeholder="Variety (e.g. Alphonso)" value={variety} onChange={(e) => setVariety(e.target.value)} style={inputStyle} />
                    <input type="text" placeholder="Farm Name" value={farmName} onChange={(e) => setFarmName(e.target.value)} style={inputStyle} />
                    <input type="text" placeholder="Origin Location" value={originLocation} onChange={(e) => setOriginLocation(e.target.value)} style={inputStyle} />
                    <button type="submit" disabled={submitting} style={{ backgroundColor: palette.green, color: "#fff", padding: "0.8rem", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem", letterSpacing: "0.01em" }}>
                      {submitting ? "Mining Block..." : "Register Batch On-Chain"}
                    </button>
                  </form>
                </div>
              )}

              <div style={{ backgroundColor: palette.darkCard, border: `1px solid ${palette.darkCardBorder}`, padding: "1.5rem", borderRadius: "10px" }}>
                <h3 style={{ marginTop: 0, color: palette.greenBright }}>
                  {selectedBatchId ? `Log Event: ${selectedBatchId}` : "Select a Batch to Log Event"}
                </h3>
                {selectedBatchId ? (
                  <form onSubmit={handleAddEvent} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <input type="text" placeholder="Location (e.g. Mumbai Port, Store #14)" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} style={darkInputStyle} />

                    <div>
                      <label style={{ fontSize: "0.8rem", color: palette.textMuted, display: "block", marginBottom: "0.25rem" }}>Allowed Status ({role}):</label>
                      <select value={eventStatus} onChange={(e) => setEventStatus(e.target.value)} style={darkInputStyle}>
                        {getAvailableStatuses().map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <input type="text" placeholder="Notes / Sensor Data" value={eventNotes} onChange={(e) => setEventNotes(e.target.value)} style={darkInputStyle} />
                    <button type="submit" disabled={submitting} style={{ backgroundColor: palette.rust, color: "#fff", padding: "0.8rem", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem" }}>
                      {submitting ? "Mining Event..." : `Log ${role} Event`}
                    </button>
                  </form>
                ) : (
                  <p style={{ color: palette.textMuted, fontSize: "0.9rem" }}>Select any batch from the list on the right to log an update for this role.</p>
                )}
              </div>
            </div>
          )}

          {/* Verification & Display Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {role === "Consumer" && (
              <div style={{ backgroundColor: palette.green, color: "#fff", padding: "1rem", borderRadius: "8px" }}>
                <h4 style={{ margin: "0 0 0.5rem 0" }}>🔍 Consumer Verification View</h4>
                <p style={{ margin: 0, fontSize: "0.9rem" }}>
                  Scan product QR code or select a batch to inspect its immutable provenance timeline.
                </p>
              </div>
            )}

            {/* Batch List */}
            <div>
              <h3 style={{ marginTop: 0, color: palette.textCream }}>Registered Batches</h3>
              {loading ? (
                <p style={{ color: palette.textMuted }}>Loading smart contract state...</p>
              ) : batches.length === 0 ? (
                <p style={{ color: palette.textMuted }}>No batches created yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {batches.map((b) => (
                    <div
                      key={b.batchId}
                      onClick={() => handleSelectBatch(b.batchId)}
                      style={{
                        backgroundColor: selectedBatchId === b.batchId ? "#3B2F1F" : palette.darkCard,
                        border: selectedBatchId === b.batchId ? `2px solid ${palette.greenBright}` : `1px solid ${palette.darkCardBorder}`,
                        padding: "1rem",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "border-color 0.2s",
                      }}
                    >
                      <h4 style={{ margin: "0 0 0.25rem 0", color: palette.greenBright }}>{b.batchId}</h4>
                      <p style={{ margin: 0, fontSize: "0.9rem", color: palette.textCream }}>{b.cropName} — {b.farmOrigin}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Batch: Event Timeline & QR Code */}
            {selectedBatchId && (
              <div style={{ backgroundColor: palette.darkCard, padding: "1.25rem", borderRadius: "8px", border: `1px solid ${palette.darkCardBorder}` }}>

                {/* QR Code Verification Card */}
                <div style={{ backgroundColor: palette.card, color: palette.cardText, padding: "1rem", borderRadius: "8px", display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.25rem" }}>
                  <QRCodeSVG value={currentVerificationUrl} size={110} level="M" />
                  <div>
                    <h4 style={{ margin: "0 0 0.25rem 0", color: palette.cardText }}>Consumer QR Tag</h4>
                    <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.8rem", color: "#6B5842" }}>
                      Scan code to verify origin and complete block history on mobile.
                    </p>
                    <code style={{ fontSize: "0.75rem", backgroundColor: palette.inputBgOnCream, padding: "0.2rem 0.4rem", borderRadius: "4px", color: palette.rust, wordBreak: "break-all" }}>
                      {currentVerificationUrl}
                    </code>
                  </div>
                </div>

                {/* Timeline */}
                <h4 style={{ marginTop: 0, borderBottom: `1px solid ${palette.darkCardBorder}`, paddingBottom: "0.5rem", color: palette.textCream }}>
                  On-Chain Timeline: {selectedBatchId}
                </h4>
                {selectedEvents.length === 0 ? (
                  <p style={{ color: palette.textMuted, fontSize: "0.9rem" }}>No supply chain events logged yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {selectedEvents.map((evt, idx) => (
                      <div key={idx} style={{ borderLeft: `2px solid ${palette.rustSoft}`, paddingLeft: "0.75rem" }}>
                        <p style={{ margin: 0, fontWeight: "bold", color: palette.greenSoft, fontSize: "0.9rem" }}>{evt.status}</p>
                        <p style={{ margin: "0.2rem 0", fontSize: "0.85rem", color: palette.textCream }}>📍 {evt.location}</p>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: palette.textMuted }}>📝 {evt.notes}</p>
                        <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.7rem", color: "#8A7355" }}>
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

const inputStyle: React.CSSProperties = { width: "100%", padding: "0.65rem", borderRadius: "5px", border: "1px solid #C9B896", backgroundColor: "#EFE4C9", color: "#2E2415", boxSizing: "border-box", fontFamily: "sans-serif" };
const darkInputStyle: React.CSSProperties = { width: "100%", padding: "0.65rem", borderRadius: "5px", border: "1px solid #6B5842", backgroundColor: "#241C12", color: "#EEE3CC", boxSizing: "border-box", fontFamily: "sans-serif" };

export default App;
