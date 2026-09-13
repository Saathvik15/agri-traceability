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

// ---- Earthy palette (forest green / sage / terracotta) ----
const palette = {
  bg: "#182620",           // deep forest green-black
  bgHeaderBorder: "#2F4A3D",
  card: "#F5F1E4",         // warm cream
  cardText: "#2E2A1F",
  darkCard: "#20342A",     // forest green panel
  darkCardBorder: "#3E5C4C",
  inputBgOnCream: "#EDE6D2",
  inputBgOnDark: "#182620",
  inputBorder: "#4F6339",
  textCream: "#EDE8D9",
  textMuted: "#9CB39F",
  green: "#4F6339",        // olive/sage — primary buttons
  greenBright: "#A4B69A",  // soft sage highlight
  greenSoft: "#8FAE7A",
  rust: "#C18D52",         // warm terracotta/gold — secondary accent
  rustSoft: "#D4A373",
  errorBg: "#3A1F16",
  errorText: "#E2A184",
  successBg: "#1F3324",
  successText: "#A4B69A",
};

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600;700&display=swap');

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    .at-fade-in { animation: fadeInUp 0.55s cubic-bezier(0.16,1,0.3,1) both; }
    .at-fade-in-1 { animation-delay: 0.05s; }
    .at-fade-in-2 { animation-delay: 0.12s; }
    .at-fade-in-3 { animation-delay: 0.2s; }

    .at-btn { transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.15s ease; }
    .at-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 18px rgba(0,0,0,0.35); filter: brightness(1.06); }
    .at-btn:active:not(:disabled) { transform: translateY(0px); }

    .at-batch-card { transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.2s ease; animation: fadeInUp 0.4s ease both; }
    .at-batch-card:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(0,0,0,0.3); }

    .at-input { transition: border-color 0.15s ease, box-shadow 0.15s ease; }
    .at-input:focus { outline: none; border-color: #A4B69A !important; box-shadow: 0 0 0 3px rgba(164,182,154,0.25); }

    .at-timeline-item { animation: fadeIn 0.5s ease both; }
  `}</style>
);

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
    <div style={{ backgroundColor: palette.bg, color: palette.textCream, minHeight: "100vh", fontFamily: "'Work Sans', sans-serif", padding: "2rem" }}>
      <GlobalStyle />
      <header className="at-fade-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `2px solid ${palette.bgHeaderBorder}`, paddingBottom: "1rem", maxWidth: "1100px", margin: "0 auto 2rem auto" }}>
        <h2 style={{ margin: 0, color: palette.textCream, fontFamily: "'Fraunces', serif", fontWeight: 600, letterSpacing: "0.01em" }}>🌾 Agri-Traceability Dashboard</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.9rem", color: palette.textMuted }}>Active Role:</label>
          <select value={role} onChange={(e: any) => setRole(e.target.value)} className="at-input" style={{ padding: "0.4rem 0.8rem", borderRadius: "6px", backgroundColor: palette.darkCard, color: palette.greenBright, fontWeight: 600, border: `1px solid ${palette.darkCardBorder}`, cursor: "pointer" }}>
            <option value="Farmer">Farmer</option>
            <option value="Distributor">Distributor / Logistics</option>
            <option value="Retailer">Retailer</option>
            <option value="Consumer">Consumer</option>
          </select>
        </div>
      </header>

      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {error && <div className="at-fade-in" style={{ backgroundColor: palette.errorBg, color: palette.errorText, padding: "0.75rem", borderRadius: "8px", marginBottom: "1.5rem", border: `1px solid ${palette.rust}` }}>{error}</div>}
        {successMsg && <div className="at-fade-in" style={{ backgroundColor: palette.successBg, color: palette.successText, padding: "0.75rem", borderRadius: "8px", marginBottom: "1.5rem", border: `1px solid ${palette.green}` }}>{successMsg}</div>}

        <div style={{ display: "grid", gridTemplateColumns: role === "Consumer" ? "1fr" : "1fr 1fr", gap: "2rem" }}>

          {/* Action Column */}
          {role !== "Consumer" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {role === "Farmer" && (
                <div className="at-fade-in at-fade-in-1" style={{ backgroundColor: palette.card, color: palette.cardText, padding: "1.75rem", borderRadius: "12px", boxShadow: "0 6px 20px rgba(0,0,0,0.28)" }}>
                  <h3 style={{ marginTop: 0, color: palette.cardText, fontFamily: "'Fraunces', serif", fontWeight: 600 }}>Register Batch (Farmer)</h3>
                  <form onSubmit={handleRegisterBatch} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <input className="at-input" type="text" placeholder="Batch ID (e.g. MANGO-2026-0002)" value={batchId} onChange={(e) => setBatchId(e.target.value)} style={inputStyle} />
                    <input className="at-input" type="text" placeholder="Product Name (e.g. Mango)" value={productName} onChange={(e) => setProductName(e.target.value)} style={inputStyle} />
                    <input className="at-input" type="text" placeholder="Variety (e.g. Alphonso)" value={variety} onChange={(e) => setVariety(e.target.value)} style={inputStyle} />
                    <input className="at-input" type="text" placeholder="Farm Name" value={farmName} onChange={(e) => setFarmName(e.target.value)} style={inputStyle} />
                    <input className="at-input" type="text" placeholder="Origin Location" value={originLocation} onChange={(e) => setOriginLocation(e.target.value)} style={inputStyle} />
                    <button type="submit" disabled={submitting} className="at-btn" style={{ backgroundColor: palette.green, color: "#fff", padding: "0.85rem", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "0.95rem" }}>
                      {submitting ? "Mining Block..." : "Register Batch On-Chain"}
                    </button>
                  </form>
                </div>
              )}

              <div className="at-fade-in at-fade-in-2" style={{ backgroundColor: palette.darkCard, border: `1px solid ${palette.darkCardBorder}`, padding: "1.75rem", borderRadius: "12px" }}>
                <h3 style={{ marginTop: 0, color: palette.greenBright, fontFamily: "'Fraunces', serif", fontWeight: 600 }}>
                  {selectedBatchId ? `Log Event: ${selectedBatchId}` : "Select a Batch to Log Event"}
                </h3>
                {selectedBatchId ? (
                  <form onSubmit={handleAddEvent} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <input className="at-input" type="text" placeholder="Location (e.g. Mumbai Port, Store #14)" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} style={darkInputStyle} />

                    <div>
                      <label style={{ fontSize: "0.8rem", color: palette.textMuted, display: "block", marginBottom: "0.25rem" }}>Allowed Status ({role}):</label>
                      <select className="at-input" value={eventStatus} onChange={(e) => setEventStatus(e.target.value)} style={darkInputStyle}>
                        {getAvailableStatuses().map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <input className="at-input" type="text" placeholder="Notes / Sensor Data" value={eventNotes} onChange={(e) => setEventNotes(e.target.value)} style={darkInputStyle} />
                    <button type="submit" disabled={submitting} className="at-btn" style={{ backgroundColor: palette.rust, color: "#fff", padding: "0.85rem", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "0.95rem" }}>
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
              <div className="at-fade-in" style={{ backgroundColor: palette.green, color: "#fff", padding: "1.1rem", borderRadius: "10px" }}>
                <h4 style={{ margin: "0 0 0.5rem 0", fontFamily: "'Fraunces', serif" }}>🔍 Consumer Verification View</h4>
                <p style={{ margin: 0, fontSize: "0.9rem" }}>
                  Scan product QR code or select a batch to inspect its immutable provenance timeline.
                </p>
              </div>
            )}

            {/* Batch List */}
            <div className="at-fade-in at-fade-in-1">
              <h3 style={{ marginTop: 0, color: palette.textCream, fontFamily: "'Fraunces', serif", fontWeight: 600 }}>Registered Batches</h3>
              {loading ? (
                <p style={{ color: palette.textMuted }}>Loading smart contract state...</p>
              ) : batches.length === 0 ? (
                <p style={{ color: palette.textMuted }}>No batches created yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {batches.map((b, i) => (
                    <div
                      key={b.batchId}
                      onClick={() => handleSelectBatch(b.batchId)}
                      className="at-batch-card"
                      style={{
                        backgroundColor: selectedBatchId === b.batchId ? "#2A4436" : palette.darkCard,
                        border: selectedBatchId === b.batchId ? `2px solid ${palette.greenBright}` : `1px solid ${palette.darkCardBorder}`,
                        padding: "1rem",
                        borderRadius: "10px",
                        cursor: "pointer",
                        animationDelay: `${i * 0.05}s`,
                      }}
                    >
                      <h4 style={{ margin: "0 0 0.25rem 0", color: palette.greenBright, fontFamily: "'Fraunces', serif" }}>{b.batchId}</h4>
                      <p style={{ margin: 0, fontSize: "0.9rem", color: palette.textCream }}>{b.cropName} — {b.farmOrigin}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Batch: Event Timeline & QR Code */}
            {selectedBatchId && (
              <div className="at-fade-in at-fade-in-2" style={{ backgroundColor: palette.darkCard, padding: "1.4rem", borderRadius: "10px", border: `1px solid ${palette.darkCardBorder}` }}>

                {/* QR Code Verification Card */}
                <div style={{ backgroundColor: palette.card, color: palette.cardText, padding: "1.1rem", borderRadius: "10px", display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.4rem" }}>
                  <QRCodeSVG value={currentVerificationUrl} size={110} level="M" />
                  <div>
                    <h4 style={{ margin: "0 0 0.25rem 0", color: palette.cardText, fontFamily: "'Fraunces', serif" }}>Consumer QR Tag</h4>
                    <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.8rem", color: "#6B5842" }}>
                      Scan code to verify origin and complete block history on mobile.
                    </p>
                    <code style={{ fontSize: "0.75rem", backgroundColor: palette.inputBgOnCream, padding: "0.2rem 0.4rem", borderRadius: "4px", color: palette.rust, wordBreak: "break-all" }}>
                      {currentVerificationUrl}
                    </code>
                  </div>
                </div>

                {/* Timeline */}
                <h4 style={{ marginTop: 0, borderBottom: `1px solid ${palette.darkCardBorder}`, paddingBottom: "0.5rem", color: palette.textCream, fontFamily: "'Fraunces', serif" }}>
                  On-Chain Timeline: {selectedBatchId}
                </h4>
                {selectedEvents.length === 0 ? (
                  <p style={{ color: palette.textMuted, fontSize: "0.9rem" }}>No supply chain events logged yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {selectedEvents.map((evt, idx) => (
                      <div key={idx} className="at-timeline-item" style={{ borderLeft: `2px solid ${palette.rustSoft}`, paddingLeft: "0.75rem", animationDelay: `${idx * 0.06}s` }}>
                        <p style={{ margin: 0, fontWeight: 700, color: palette.greenSoft, fontSize: "0.9rem" }}>{evt.status}</p>
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

const inputStyle: React.CSSProperties = { width: "100%", padding: "0.7rem", borderRadius: "6px", border: "1px solid #C9B896", backgroundColor: "#EDE6D2", color: "#2E2A1F", boxSizing: "border-box", fontFamily: "'Work Sans', sans-serif" };
const darkInputStyle: React.CSSProperties = { width: "100%", padding: "0.7rem", borderRadius: "6px", border: "1px solid #4F6339", backgroundColor: "#182620", color: "#EDE8D9", boxSizing: "border-box", fontFamily: "'Work Sans', sans-serif" };

export default App;
