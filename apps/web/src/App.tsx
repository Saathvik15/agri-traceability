import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  fetchAllBatches,
  fetchBatchDetails,
  createBatch,
  addEvent,
  type Batch,
  type SupplyChainEvent,
} from "./services/api";

// ---- Earthy palette: soil, canopy, tag-paper, harvest clay ----
const palette = {
  soilTop: "#16241C",       // deep canopy green (background gradient top)
  soilBottom: "#1B140D",    // dark tilled-soil brown (background gradient bottom)
  headerBorder: "#33422F",
  paper: "#F3EBD8",         // sun-bleached tag paper
  paperText: "#2A2216",
  paperMuted: "#6B5A3E",
  panel: "#20301F",         // forest panel
  panelBorder: "#3C5138",
  panelBorderLit: "#5B7A4F",
  inputPaper: "#EAE0C6",
  inputPanel: "#17241A",
  cream: "#EFE6D2",
  textMuted: "#94A98B",
  sage: "#6F8D5B",           // primary — moss/sage
  sageBright: "#A9C48C",
  sageDeep: "#3E5A34",
  clay: "#BD7A45",           // terracotta — secondary
  clayDeep: "#8B5327",
  clayBright: "#E0A468",
  gold: "#CDA35C",           // harvest gold — tertiary accent
  errorBg: "#331D14",
  errorBorder: "#8B4A2C",
  errorText: "#E3A47E",
  successBg: "#1E2E1D",
  successBorder: "#5B7A4F",
  successText: "#B7CE9E",
};

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=Work+Sans:wght@400;500;600;700&display=swap');

    * { box-sizing: border-box; }

    @keyframes riseIn {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes softIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes swaySprig {
      0%, 100% { transform: rotate(-2.5deg); }
      50%      { transform: rotate(2.5deg); }
    }
    @keyframes growVine {
      from { transform: scaleY(0); }
      to   { transform: scaleY(1); }
    }
    @keyframes budPop {
      0%   { transform: scale(0); opacity: 0; }
      60%  { transform: scale(1.25); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes tagSwing {
      0%, 100% { transform: rotate(-1.4deg); }
      50%      { transform: rotate(1.4deg); }
    }
    @keyframes shimmerSeal {
      0%   { background-position: -120px 0; }
      100% { background-position: 220px 0; }
    }
    @keyframes stampDown {
      0%   { transform: scale(1) rotate(0deg); }
      40%  { transform: scale(0.93) rotate(-1deg); }
      100% { transform: scale(1) rotate(0deg); }
    }
    @keyframes pillGlide {
      from { opacity: 0.4; }
      to   { opacity: 1; }
    }
    @keyframes floatSpore {
      0%   { transform: translateY(0) translateX(0); opacity: 0; }
      10%  { opacity: 0.5; }
      90%  { opacity: 0.35; }
      100% { transform: translateY(-90px) translateX(6px); opacity: 0; }
    }

    .at-root { position: relative; isolation: isolate; }
    .at-backdrop-photo {
      position: fixed; inset: 0; z-index: -2; pointer-events: none;
      background-image: url('https://images.unsplash.com/photo-1757338409748-35a566416113?fm=jpg&q=70&w=2400&auto=format&fit=crop');
      background-size: cover; background-position: center; filter: saturate(0.85);
    }
    .at-backdrop-scrim {
      position: fixed; inset: 0; z-index: -1; pointer-events: none;
      background:
        linear-gradient(160deg, rgba(22,36,28,0.94) 0%, rgba(22,36,28,0.88) 40%, rgba(27,20,13,0.94) 100%);
    }
    .at-grain {
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      opacity: 0.05; mix-blend-mode: overlay;
    }
    .at-canopy-glow {
      position: fixed; top: -20%; left: 50%; width: 1100px; height: 700px;
      transform: translateX(-50%); pointer-events: none; z-index: 0;
      background: radial-gradient(ellipse at center, rgba(111,141,91,0.16) 0%, rgba(111,141,91,0) 70%);
    }

    .at-in       { animation: riseIn 0.6s cubic-bezier(0.16,1,0.3,1) both; }
    .at-in-1     { animation-delay: 0.06s; }
    .at-in-2     { animation-delay: 0.14s; }
    .at-in-3     { animation-delay: 0.22s; }
    .at-fade     { animation: softIn 0.5s ease both; }

    .at-sprig { transform-origin: bottom center; animation: swaySprig 6s ease-in-out infinite; display: inline-block; }

    .at-btn {
      position: relative; overflow: hidden;
      transition: transform 0.16s ease, box-shadow 0.22s ease, filter 0.16s ease;
    }
    .at-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(0,0,0,0.4); filter: brightness(1.08); }
    .at-btn:active:not(:disabled) { animation: stampDown 0.32s ease; }
    .at-btn:disabled { opacity: 0.7; cursor: default; }

    .at-input {
      transition: border-color 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;
    }
    .at-input:focus { outline: none; border-color: #A9C48C !important; box-shadow: 0 0 0 3px rgba(169,196,140,0.22); }

    .at-tab-track {
      position: relative; display: inline-flex; background: #17241A;
      border: 1px solid #3C5138; border-radius: 999px; padding: 4px; gap: 2px;
    }
    .at-tab-pill {
      position: absolute; top: 4px; bottom: 4px; border-radius: 999px;
      background: linear-gradient(135deg, #6F8D5B, #4E6B3F);
      box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      transition: transform 0.32s cubic-bezier(0.16,1,0.3,1), width 0.32s cubic-bezier(0.16,1,0.3,1);
      animation: pillGlide 0.32s ease both;
    }
    .at-tab-btn {
      position: relative; z-index: 1; border: none; background: transparent; cursor: pointer;
      padding: 0.5rem 1rem; font-family: 'Work Sans', sans-serif; font-weight: 600; font-size: 0.86rem;
      color: #94A98B; transition: color 0.22s ease; white-space: nowrap;
    }
    .at-tab-btn.active { color: #F3EBD8; }

    .at-tag-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      animation: riseIn 0.45s cubic-bezier(0.16,1,0.3,1) both;
      position: relative;
    }
    .at-tag-card:hover { transform: translateY(-3px) rotate(-0.3deg); box-shadow: 0 14px 30px rgba(0,0,0,0.38); }
    .at-tag-card::before {
      content: ""; position: absolute; left: -7px; top: 50%; transform: translateY(-50%);
      width: 14px; height: 14px; border-radius: 50%;
      background: #14201A; border: 1px solid inherit;
    }

    .at-seal {
      width: 34px; height: 34px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Fraunces', serif; font-weight: 700; font-size: 0.95rem;
      flex-shrink: 0; animation: budPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
      border: 1.5px dashed currentColor;
    }

    .at-tag-hang {
      animation: tagSwing 5s ease-in-out infinite;
      transform-origin: top center;
    }

    .at-vine {
      position: absolute; left: 5px; top: 6px; bottom: 6px; width: 2px;
      background: linear-gradient(180deg, #E0A468, #6F8D5B);
      transform-origin: top; animation: growVine 0.7s cubic-bezier(0.16,1,0.3,1) both;
      border-radius: 2px;
    }
    .at-node {
      position: absolute; left: 0; width: 12px; height: 12px; border-radius: 50%;
      background: #E0A468; border: 2px solid #16241C;
      animation: budPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
    }

    .at-banner { animation: riseIn 0.4s cubic-bezier(0.16,1,0.3,1) both; }

    .at-select {
      appearance: none; -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23A9C48C'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 0.9rem center;
      padding-right: 2.2rem !important;
    }

    ::selection { background: #6F8D5B; color: #16241C; }
  `}</style>
);

const GrainOverlay = () => (
  <svg className="at-grain" xmlns="http://www.w3.org/2000/svg">
    <filter id="at-noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#at-noise)" />
  </svg>
);

const SprigIcon = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" className="at-sprig">
    <path d="M15 27V9" stroke="#A9C48C" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M15 14C11 14 8 11 8 6c5 0 8 3 8 8 4-5 2-9 2-9 4 3 3 8 -1 11" stroke="#E0A468" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="15" cy="9" r="1.6" fill="#CDA35C" />
  </svg>
);

const LEAF_ROLES = ["Farmer", "Distributor", "Retailer", "Consumer"] as const;
type Role = (typeof LEAF_ROLES)[number];

const ROLE_LABELS: Record<Role, string> = {
  Farmer: "Farmer",
  Distributor: "Distributor",
  Retailer: "Retailer",
  Consumer: "Consumer",
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
  const [role, setRole] = useState<Role>("Farmer");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const tabButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number }>({ left: 4, width: 0 });

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

  useEffect(() => {
    const idx = LEAF_ROLES.indexOf(role);
    const btn = tabButtonRefs.current[idx];
    if (btn) {
      setPillStyle({ left: btn.offsetLeft, width: btn.offsetWidth });
    }
  }, [role]);

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

      setSuccessMsg(`Batch "${batchId}" registered on-chain.`);
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

      setSuccessMsg(`Event logged for ${selectedBatchId}.`);
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
    <div
      className="at-root"
      style={{
        color: palette.cream,
        minHeight: "100vh",
        fontFamily: "'Work Sans', sans-serif",
        padding: "2rem",
      }}
    >
      <GlobalStyle />
      <div className="at-backdrop-photo" />
      <div className="at-backdrop-scrim" />
      <GrainOverlay />
      <div className="at-canopy-glow" />

      <header
        className="at-in"
        style={{
          position: "relative", zIndex: 1,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: `1px solid ${palette.headerBorder}`, paddingBottom: "1.25rem",
          maxWidth: "1120px", margin: "0 auto 2.25rem auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <SprigIcon />
          <h1 style={{ margin: 0, color: palette.cream, fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "1.5rem", letterSpacing: "0.005em" }}>
            Agri-Traceability Ledger
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.82rem", color: palette.textMuted }}>Viewing as</span>
          <div className="at-tab-track">
            <div className="at-tab-pill" style={{ left: pillStyle.left, width: pillStyle.width }} />
            {LEAF_ROLES.map((r, i) => (
              <button
                key={r}
                type="button"
                ref={(el) => (tabButtonRefs.current[i] = el)}
                className={`at-tab-btn ${role === r ? "active" : ""}`}
                onClick={() => setRole(r)}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "1120px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        {error && (
          <div
            className="at-banner"
            style={{
              backgroundColor: palette.errorBg, color: palette.errorText, padding: "0.85rem 1.1rem",
              borderRadius: "10px", marginBottom: "1.5rem", border: `1px solid ${palette.errorBorder}`,
              display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.92rem",
            }}
          >
            <span>⚠</span>{error}
          </div>
        )}
        {successMsg && (
          <div
            className="at-banner"
            style={{
              backgroundColor: palette.successBg, color: palette.successText, padding: "0.85rem 1.1rem",
              borderRadius: "10px", marginBottom: "1.5rem", border: `1px solid ${palette.successBorder}`,
              display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.92rem",
            }}
          >
            <span>✓</span>{successMsg}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: role === "Consumer" ? "1fr" : "0.95fr 1.15fr", gap: "1.75rem" }}>

          {/* Action Column */}
          {role !== "Consumer" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {role === "Farmer" && (
                <div
                  className="at-in at-in-1"
                  style={{
                    backgroundColor: palette.paper, color: palette.paperText, padding: "1.85rem",
                    borderRadius: "6px 22px 6px 22px", boxShadow: "0 12px 28px rgba(0,0,0,0.32)",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  <h3 style={{ marginTop: 0, marginBottom: "1.1rem", color: palette.paperText, fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "1.15rem" }}>
                    Register a new batch
                  </h3>
                  <form onSubmit={handleRegisterBatch} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <input className="at-input" type="text" placeholder="Batch ID (e.g. MANGO-2026-0002)" value={batchId} onChange={(e) => setBatchId(e.target.value)} style={inputStyle} />
                    <input className="at-input" type="text" placeholder="Product name (e.g. Mango)" value={productName} onChange={(e) => setProductName(e.target.value)} style={inputStyle} />
                    <input className="at-input" type="text" placeholder="Variety (e.g. Alphonso)" value={variety} onChange={(e) => setVariety(e.target.value)} style={inputStyle} />
                    <input className="at-input" type="text" placeholder="Farm name" value={farmName} onChange={(e) => setFarmName(e.target.value)} style={inputStyle} />
                    <input className="at-input" type="text" placeholder="Origin location" value={originLocation} onChange={(e) => setOriginLocation(e.target.value)} style={inputStyle} />
                    <button
                      type="submit" disabled={submitting} className="at-btn"
                      style={{ backgroundColor: palette.sage, color: "#fff", padding: "0.85rem", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "0.95rem", marginTop: "0.35rem" }}
                    >
                      {submitting ? "Writing to the ledger…" : "Register batch"}
                    </button>
                  </form>
                </div>
              )}

              <div
                className="at-in at-in-2"
                style={{ backgroundColor: palette.panel, border: `1px solid ${palette.panelBorder}`, padding: "1.85rem", borderRadius: "22px 6px 22px 6px" }}
              >
                <h3 style={{ marginTop: 0, marginBottom: "1.1rem", color: palette.sageBright, fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "1.15rem" }}>
                  {selectedBatchId ? `Log an event for ${selectedBatchId}` : "Log a supply chain event"}
                </h3>
                {selectedBatchId ? (
                  <form onSubmit={handleAddEvent} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <input className="at-input" type="text" placeholder="Location (e.g. Mumbai Port, Store #14)" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} style={darkInputStyle} />

                    <div>
                      <label style={{ fontSize: "0.8rem", color: palette.textMuted, display: "block", marginBottom: "0.3rem" }}>
                        Status available to {ROLE_LABELS[role]}
                      </label>
                      <select className="at-input at-select" value={eventStatus} onChange={(e) => setEventStatus(e.target.value)} style={darkInputStyle}>
                        {getAvailableStatuses().map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <input className="at-input" type="text" placeholder="Notes or sensor data" value={eventNotes} onChange={(e) => setEventNotes(e.target.value)} style={darkInputStyle} />
                    <button
                      type="submit" disabled={submitting} className="at-btn"
                      style={{ backgroundColor: palette.clay, color: "#fff", padding: "0.85rem", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "0.95rem", marginTop: "0.35rem" }}
                    >
                      {submitting ? "Sealing event…" : `Log ${ROLE_LABELS[role]} event`}
                    </button>
                  </form>
                ) : (
                  <p style={{ color: palette.textMuted, fontSize: "0.92rem", lineHeight: 1.6 }}>
                    Select a batch from the list to log an update for this role.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Verification & Display Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {role === "Consumer" && (
              <div
                className="at-in"
                style={{
                  background: `linear-gradient(135deg, ${palette.sage}, ${palette.sageDeep})`,
                  color: "#fff", padding: "1.2rem 1.4rem", borderRadius: "12px",
                  display: "flex", alignItems: "center", gap: "0.9rem",
                }}
              >
                <span style={{ fontSize: "1.4rem" }}>🔍</span>
                <div>
                  <h4 style={{ margin: "0 0 0.25rem 0", fontFamily: "'Fraunces', serif", fontSize: "1.05rem" }}>Trace what you're eating</h4>
                  <p style={{ margin: 0, fontSize: "0.88rem", opacity: 0.92 }}>
                    Scan the tag on your product, or pick a batch below to see its full journey from field to shelf.
                  </p>
                </div>
              </div>
            )}

            {/* Batch List */}
            <div className="at-in at-in-1">
              <h3 style={{ marginTop: 0, marginBottom: "0.9rem", color: palette.cream, fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "1.15rem" }}>
                Registered batches
              </h3>
              {loading ? (
                <p style={{ color: palette.textMuted }}>Reading the ledger…</p>
              ) : batches.length === 0 ? (
                <p style={{ color: palette.textMuted }}>No batches registered yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                  {batches.map((b, i) => {
                    const isActive = selectedBatchId === b.batchId;
                    return (
                      <div
                        key={b.batchId}
                        onClick={() => handleSelectBatch(b.batchId)}
                        className="at-tag-card"
                        style={{
                          backgroundColor: isActive ? "#2C4426" : palette.panel,
                          borderLeft: `3px solid ${isActive ? palette.gold : "transparent"}`,
                          border: `1px solid ${isActive ? palette.panelBorderLit : palette.panelBorder}`,
                          padding: "1rem 1.1rem", borderRadius: "6px 16px 6px 16px", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: "0.9rem",
                          animationDelay: `${i * 0.05}s`,
                          color: isActive ? palette.gold : "inherit",
                        }}
                      >
                        <div className="at-seal" style={{ color: isActive ? palette.gold : palette.sageBright }}>
                          {b.cropName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <h4 style={{ margin: "0 0 0.2rem 0", color: isActive ? palette.gold : palette.sageBright, fontFamily: "'Fraunces', serif", fontSize: "1rem" }}>
                            {b.batchId}
                          </h4>
                          <p style={{ margin: 0, fontSize: "0.88rem", color: palette.cream, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {b.cropName} — {b.farmOrigin}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Batch: Event Timeline & QR Code */}
            {selectedBatchId && (
              <div key={selectedBatchId} className="at-fade" style={{ backgroundColor: palette.panel, padding: "1.5rem", borderRadius: "16px 6px 16px 6px", border: `1px solid ${palette.panelBorder}` }}>

                {/* QR Code Verification Card — shipping tag styling */}
                <div
                  className="at-tag-hang"
                  style={{
                    backgroundColor: palette.paper, color: palette.paperText, padding: "1.15rem",
                    borderRadius: "8px", display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.5rem",
                    backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.05) 8px, rgba(0,0,0,0.05) 9px)",
                    backgroundSize: "100% 2px", backgroundRepeat: "no-repeat", backgroundPosition: "0 0",
                    boxShadow: "0 10px 24px rgba(0,0,0,0.3)",
                  }}
                >
                  <QRCodeSVG value={currentVerificationUrl} size={104} level="M" fgColor={palette.clayDeep} />
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ margin: "0 0 0.3rem 0", color: palette.paperText, fontFamily: "'Fraunces', serif", fontSize: "1.02rem" }}>
                      Consumer tag
                    </h4>
                    <p style={{ margin: "0 0 0.55rem 0", fontSize: "0.82rem", color: palette.paperMuted, lineHeight: 1.5 }}>
                      Scan to open the full origin story and event history on any phone.
                    </p>
                    <code style={{ fontSize: "0.72rem", backgroundColor: palette.inputPaper, padding: "0.25rem 0.45rem", borderRadius: "4px", color: palette.clayDeep, wordBreak: "break-all", display: "inline-block" }}>
                      {currentVerificationUrl}
                    </code>
                  </div>
                </div>

                {/* Timeline */}
                <h4 style={{ marginTop: 0, marginBottom: "1rem", paddingBottom: "0.6rem", borderBottom: `1px solid ${palette.panelBorder}`, color: palette.cream, fontFamily: "'Fraunces', serif", fontSize: "1.05rem" }}>
                  Journey of {selectedBatchId}
                </h4>
                {selectedEvents.length === 0 ? (
                  <p style={{ color: palette.textMuted, fontSize: "0.9rem" }}>No events logged for this batch yet.</p>
                ) : (
                  <div style={{ position: "relative", paddingLeft: "1.9rem" }}>
                    <div className="at-vine" />
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.35rem" }}>
                      {selectedEvents.map((evt, idx) => (
                        <div key={idx} style={{ position: "relative" }}>
                          <div className="at-node" style={{ left: "-1.9rem", top: "0.2rem", animationDelay: `${0.15 + idx * 0.12}s` }} />
                          <p style={{ margin: 0, fontWeight: 700, color: palette.sageBright, fontSize: "0.92rem" }}>{evt.status}</p>
                          <p style={{ margin: "0.25rem 0", fontSize: "0.86rem", color: palette.cream }}>📍 {evt.location}</p>
                          <p style={{ margin: 0, fontSize: "0.82rem", color: palette.textMuted }}>{evt.notes}</p>
                          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.72rem", color: palette.gold }}>
                            {evt.actor ? `${evt.actor.substring(0, 6)}…${evt.actor.substring(evt.actor.length - 4)}` : "Verified contract"}
                          </p>
                        </div>
                      ))}
                    </div>
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

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.75rem 0.85rem", borderRadius: "8px", border: "1px solid #C9B896",
  backgroundColor: "#EAE0C6", color: "#2A2216", boxSizing: "border-box", fontFamily: "'Work Sans', sans-serif", fontSize: "0.92rem",
};
const darkInputStyle: React.CSSProperties = {
  width: "100%", padding: "0.75rem 0.85rem", borderRadius: "8px", border: "1px solid #3C5138",
  backgroundColor: "#17241A", color: "#EFE6D2", boxSizing: "border-box", fontFamily: "'Work Sans', sans-serif", fontSize: "0.92rem",
};

export default App;
