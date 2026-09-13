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

// ---- Background photography ----
// Homepage: golden wheat field at harvest. Dashboard: colorful produce in wooden crates.
// Both free-to-use Unsplash photos, different scenes but the same warm harvest mood.
const HOME_BG_URL =
  "https://images.unsplash.com/photo-1635176490410-5116fc497d45?q=80&w=2400&auto=format&fit=crop";
const DASHBOARD_BG_URL =
  "https://images.unsplash.com/photo-1676020932354-a7657b020246?q=80&w=2400&auto=format&fit=crop";

// ---- Earthy palette: soil, canopy, bark, clay, and a few accent minerals ----
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
  clay: "#BD7A45",           // secondary — terracotta
  clayDeep: "#8B5327",
  clayBright: "#E0A468",
  gold: "#CDA35C",           // harvest gold accent
  // brown family
  bark: "#4A3524",           // deep bark brown
  barkLight: "#6B4A31",      // warm walnut
  sienna: "#A65D34",         // sienna/rust brown
  siennaDeep: "#6E3B1F",
  tan: "#D9B98A",            // pale tan highlight
  espresso: "#2A1E14",       // near-black coffee brown, for depth
  // a couple of minerals outside the green/brown range, kept muted to stay in-family
  teal: "#33584C",           // deep teal-green (slate of the forest)
  tealBright: "#7FA396",
  ochre: "#C9A227",          // warm mustard/ochre
  plum: "#5B3A52",           // dusty plum — extra color accent for richness
  plumBright: "#9C7593",
  errorBg: "#331D14",
  errorBorder: "#8B4A2C",
  errorText: "#E3A47E",
  successBg: "#1E2E1D",
  successBorder: "#5B7A4F",
  successText: "#B7CE9E",
};

const ROLE_ACCENT: Record<string, { base: string; deep: string }> = {
  Farmer: { base: palette.sage, deep: palette.sageDeep },
  Distributor: { base: palette.sienna, deep: palette.siennaDeep },
  Retailer: { base: palette.ochre, deep: palette.clayDeep },
  Consumer: { base: palette.teal, deep: "#1E322B" },
};

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Manrope:wght@400;500;600;700&display=swap');

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
    @keyframes stampDown {
      0%   { transform: scale(1) rotate(0deg); }
      40%  { transform: scale(0.93) rotate(-1deg); }
      100% { transform: scale(1) rotate(0deg); }
    }
    @keyframes pillGlide {
      from { opacity: 0.4; }
      to   { opacity: 1; }
    }
    @keyframes pingRing {
      0%   { transform: scale(0.92); opacity: 0.55; }
      75%  { transform: scale(1.32); opacity: 0; }
      100% { transform: scale(1.34); opacity: 0; }
    }
    @keyframes tagRise {
      from { opacity: 0; transform: translateY(10px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .at-root { position: relative; isolation: isolate; }
    .at-backdrop-photo {
      position: fixed; inset: 0; z-index: -3; pointer-events: none;
      background-size: cover; background-position: center;
      filter: saturate(0.9) brightness(0.9) contrast(1.05);
      transition: background-image 0.4s ease;
    }
    .at-backdrop-scrim {
      position: fixed; inset: 0; z-index: -2; pointer-events: none;
      background:
        radial-gradient(ellipse 900px 640px at 10% -8%, rgba(91,58,82,0.28) 0%, rgba(91,58,82,0) 60%),
        radial-gradient(ellipse 800px 620px at 108% 14%, rgba(51,88,76,0.32) 0%, rgba(51,88,76,0) 62%),
        radial-gradient(ellipse 900px 700px at 92% 108%, rgba(166,93,52,0.28) 0%, rgba(166,93,52,0) 62%),
        radial-gradient(ellipse 800px 620px at 2% 102%, rgba(42,30,20,0.42) 0%, rgba(42,30,20,0) 65%),
        radial-gradient(ellipse 700px 500px at 50% 50%, rgba(201,162,39,0.08) 0%, rgba(201,162,39,0) 70%),
        linear-gradient(160deg, rgba(22,36,28,0.92) 0%, rgba(22,36,28,0.86) 38%, rgba(27,20,13,0.93) 100%);
    }
    .at-grain {
      position: fixed; inset: 0; pointer-events: none; z-index: -1;
      opacity: 0.05; mix-blend-mode: overlay;
    }
    .at-canopy-glow {
      position: fixed; top: -20%; left: 50%; width: 1100px; height: 700px;
      transform: translateX(-50%); pointer-events: none; z-index: 0;
      background: radial-gradient(ellipse at center, rgba(111,141,91,0.14) 0%, rgba(111,141,91,0) 70%);
    }
    .at-ember-glow {
      position: fixed; bottom: -18%; right: -8%; width: 900px; height: 620px;
      pointer-events: none; z-index: 0;
      background: radial-gradient(ellipse at center, rgba(107,74,49,0.18) 0%, rgba(107,74,49,0) 68%);
    }

    /* riseIn / fade elements: will-change + a minimum non-zero delay prevents a
       known browser quirk where CSS animations on freshly-mounted nodes inside
       a grid can get stuck at their 0% frame (invisible) on first paint. */
    .at-in       { animation: riseIn 0.6s cubic-bezier(0.16,1,0.3,1) both; animation-delay: 0.02s; will-change: opacity, transform; }
    .at-in-1     { animation-delay: 0.08s; }
    .at-in-2     { animation-delay: 0.16s; }
    .at-in-3     { animation-delay: 0.24s; }
    .at-fade     { animation: softIn 0.5s ease both; animation-delay: 0.02s; will-change: opacity; }

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
      box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      transition: transform 0.32s cubic-bezier(0.16,1,0.3,1), width 0.32s cubic-bezier(0.16,1,0.3,1), background 0.32s ease;
      animation: pillGlide 0.32s ease both;
    }
    .at-tab-btn {
      position: relative; z-index: 1; border: none; background: transparent; cursor: pointer;
      padding: 0.5rem 1rem; font-family: 'Manrope', sans-serif; font-weight: 600; font-size: 0.86rem;
      color: #94A98B; transition: color 0.22s ease; white-space: nowrap;
    }
    .at-tab-btn.active { color: #F3EBD8; }

    .at-tag-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      animation: riseIn 0.45s cubic-bezier(0.16,1,0.3,1) both;
      animation-delay: 0.02s;
      will-change: opacity, transform;
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
      font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 1.05rem;
      flex-shrink: 0; animation: budPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
      border: 1.5px dashed currentColor;
    }

    .at-vine {
      position: absolute; left: 5px; top: 6px; bottom: 6px; width: 2px;
      background: linear-gradient(180deg, #C9A227, #A65D34, #6F8D5B);
      transform-origin: top; animation: growVine 0.7s cubic-bezier(0.16,1,0.3,1) both;
      border-radius: 2px;
    }
    .at-node {
      position: absolute; left: 0; width: 12px; height: 12px; border-radius: 50%;
      background: #C9A227; border: 2px solid #16241C;
      animation: budPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
    }

    .at-banner { animation: riseIn 0.4s cubic-bezier(0.16,1,0.3,1) both; animation-delay: 0.02s; will-change: opacity, transform; }

    .at-tag-static {
      animation: tagRise 0.5s cubic-bezier(0.16,1,0.3,1) both;
      animation-delay: 0.02s;
      will-change: opacity, transform;
    }
    .at-qr-wrap { position: relative; display: inline-flex; border-radius: 14px; }
    .at-qr-ring {
      position: absolute; inset: -9px; border-radius: 16px;
      border: 1.5px solid rgba(166,93,52,0.55);
      animation: pingRing 2.8s cubic-bezier(0.4,0,0.2,1) infinite;
      pointer-events: none;
    }
    .at-qr-ring.at-ring-delay { animation-delay: 1.4s; }

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
    <path d="M15 27V12" stroke="#A9C48C" strokeWidth="1.8" strokeLinecap="round" />
    <path
      d="M15 15.5C10.2 15.5 6.3 11.6 6.3 5.5C11.1 5.5 15 9.4 15 15.5"
      stroke="#6F8D5B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    />
    <path
      d="M15 15.5C19.8 15.5 23.7 11.6 23.7 5.5C18.9 5.5 15 9.4 15 15.5"
      stroke="#E0A468" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    />
    <circle cx="15" cy="10.5" r="1.7" fill="#CDA35C" />
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

const LeafOrnament = () => (
  <svg width="34" height="34" viewBox="0 0 34 34" fill="none" style={{ margin: "0 auto" }}>
    <path
      d="M17 30V12C13 12 8 9 8 3c6 0 9 3.5 9 9.5C17 5 20.5 3 26 3c0 6-5 9-9 9v18"
      stroke={palette.gold} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

const HomeView: React.FC<{ onEnter: () => void }> = ({ onEnter }) => (
  <div style={{ position: "relative", zIndex: 1, maxWidth: "780px", margin: "0 auto", padding: "5rem 1.5rem 4rem", textAlign: "center" }}>
    <div className="at-in" style={{ transform: "scale(1.7)", marginBottom: "1.6rem" }}>
      <SprigIcon />
    </div>

    <h1 className="at-in at-in-1" style={{ margin: "0 0 0.6rem 0", color: palette.cream, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: "3rem", letterSpacing: "0.005em" }}>
      Harvest Trail
    </h1>
    <p className="at-in at-in-1" style={{ margin: "0 auto 3rem auto", maxWidth: "440px", color: palette.textMuted, fontSize: "1rem", lineHeight: 1.6, fontFamily: "'Manrope', sans-serif" }}>
      A shared ledger for tracing food from field to shelf — logged by the people who grow, move, and sell it.
    </p>

    <div className="at-in at-in-2" style={{ marginBottom: "3rem" }}>
      <LeafOrnament />
      <p style={{
        margin: "1.1rem auto 0 auto", maxWidth: "600px", color: palette.cream,
        fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 600,
        fontSize: "1.75rem", lineHeight: 1.5,
      }}>
        Every crate has a route, and every route has a story — from the hands that grew it to the ones who bring it home.
      </p>
    </div>

    <button
      type="button" onClick={onEnter} className="at-btn at-in at-in-3"
      style={{
        backgroundColor: palette.sage, color: "#fff", padding: "0.9rem 2.1rem", border: "none",
        borderRadius: "999px", fontWeight: 600, cursor: "pointer", fontSize: "0.98rem",
        fontFamily: "'Manrope', sans-serif", marginBottom: "3.5rem",
      }}
    >
      Enter the ledger
    </button>

    <div className="at-fade" style={{ position: "relative", animationDelay: "0.4s", maxWidth: "560px", margin: "0 auto" }}>
      <div style={{
        position: "absolute", top: "19px", left: "11%", right: "11%", height: "2px",
        background: `linear-gradient(90deg, ${palette.sage}, ${palette.sienna}, ${palette.ochre}, ${palette.teal})`,
        opacity: 0.6,
      }} />
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between" }}>
        {LEAF_ROLES.map((r) => (
          <div key={r} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.55rem" }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%", backgroundColor: palette.panel,
              border: `2px solid ${ROLE_ACCENT[r].base}`, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, color: ROLE_ACCENT[r].base, fontSize: "1.05rem",
            }}>
              {r.charAt(0)}
            </div>
            <span style={{ fontSize: "0.78rem", color: palette.textMuted, fontFamily: "'Manrope', sans-serif" }}>{ROLE_LABELS[r]}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const App: React.FC = () => {
  const [view, setView] = useState<"home" | "dashboard">("home");

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
      setView("dashboard");
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
        fontFamily: "'Manrope', sans-serif",
        padding: "2rem",
      }}
    >
      <GlobalStyle />
      <div className="at-backdrop-photo" style={{ backgroundImage: `url(${view === "home" ? HOME_BG_URL : DASHBOARD_BG_URL})` }} />
      <div className="at-backdrop-scrim" />
      <GrainOverlay />
      <div className="at-canopy-glow" />
      <div className="at-ember-glow" />

      {view === "home" ? (
        <HomeView onEnter={() => setView("dashboard")} />
      ) : (
        <>
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
          <h1 style={{ margin: 0, color: palette.cream, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: "1.7rem", letterSpacing: "0.005em" }}>
            Harvest Trail
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.82rem", color: palette.textMuted }}>Viewing as</span>
          <div className="at-tab-track">
            <div
              className="at-tab-pill"
              style={{ left: pillStyle.left, width: pillStyle.width, background: `linear-gradient(135deg, ${ROLE_ACCENT[role].base}, ${ROLE_ACCENT[role].deep})` }}
            />
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
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", position: "relative", zIndex: 1 }}>
              {role === "Farmer" && (
                <div
                  className="at-in at-in-1"
                  style={{
                    backgroundColor: palette.paper, color: palette.paperText, padding: "1.85rem",
                    borderRadius: "6px 22px 6px 22px", boxShadow: "0 12px 28px rgba(0,0,0,0.32)",
                    border: "1px solid rgba(0,0,0,0.06)", position: "relative",
                  }}
                >
                  <h3 style={{ marginTop: 0, marginBottom: "1.1rem", color: palette.paperText, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: "1.35rem" }}>
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
                style={{ backgroundColor: palette.panel, border: `1px solid ${palette.panelBorder}`, borderLeft: `3px solid ${ROLE_ACCENT[role].base}`, padding: "1.85rem", borderRadius: "22px 6px 22px 6px" }}
              >
                <h3 style={{ marginTop: 0, marginBottom: "1.1rem", color: ROLE_ACCENT[role].base, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: "1.35rem" }}>
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
                      style={{ backgroundColor: ROLE_ACCENT[role].base, color: "#fff", padding: "0.85rem", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "0.95rem", marginTop: "0.35rem" }}
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
                  background: `linear-gradient(135deg, ${palette.teal}, #1E322B)`,
                  color: "#fff", padding: "1.2rem 1.4rem", borderRadius: "12px",
                  display: "flex", alignItems: "center", gap: "0.9rem",
                  border: `1px solid ${palette.tealBright}55`,
                }}
              >
                <span style={{ fontSize: "1.4rem" }}>🔍</span>
                <div>
                  <h4 style={{ margin: "0 0 0.25rem 0", fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: "1.15rem" }}>Trace what you're eating</h4>
                  <p style={{ margin: 0, fontSize: "0.88rem", opacity: 0.92 }}>
                    Scan the tag on your product, or pick a batch below to see its full journey from field to shelf.
                  </p>
                </div>
              </div>
            )}

            {/* Batch List */}
            <div className="at-in at-in-1">
              <h3 style={{ marginTop: 0, marginBottom: "0.9rem", color: palette.cream, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: "1.35rem" }}>
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
                          animationDelay: `${0.02 + i * 0.05}s`,
                          color: isActive ? palette.gold : "inherit",
                        }}
                      >
                        <div className="at-seal" style={{ color: isActive ? palette.gold : palette.sageBright }}>
                          {b.cropName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <h4 style={{ margin: "0 0 0.2rem 0", color: isActive ? palette.gold : palette.sageBright, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: "1.1rem" }}>
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
              <div key={selectedBatchId} className="at-fade" style={{ backgroundColor: palette.panel, padding: "1.5rem", borderRadius: "16px 6px 16px 6px", border: `1px solid ${palette.panelBorder}`, borderTop: `3px solid ${palette.sienna}` }}>

                {/* QR Code Verification Card — a static tag, stacked and centered */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.75rem" }}>
                  <div
                    className="at-tag-static"
                    style={{
                      backgroundColor: palette.paper, color: palette.paperText, padding: "1.3rem 1.4rem",
                      borderRadius: "10px", display: "flex", flexDirection: "column", alignItems: "center",
                      textAlign: "center", gap: "0.9rem",
                      width: "fit-content", maxWidth: "300px",
                      boxShadow: "0 12px 26px rgba(42,30,20,0.4)",
                      border: `1px solid ${palette.tan}`,
                    }}
                  >
                    <h4 style={{ margin: 0, color: palette.paperText, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: "1.1rem" }}>
                      Consumer tag
                    </h4>
                    <div className="at-qr-wrap">
                      <span className="at-qr-ring" />
                      <span className="at-qr-ring at-ring-delay" />
                      <QRCodeSVG value={currentVerificationUrl} size={112} level="M" fgColor={palette.siennaDeep} style={{ flexShrink: 0, position: "relative" }} />
                    </div>
                    <div style={{ width: "70%", borderTop: `1px dashed ${palette.paperMuted}66` }} />
                    <div>
                      <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.78rem", color: palette.paperMuted, lineHeight: 1.5 }}>
                        Scan to open the origin story and full history.
                      </p>
                      <code style={{ fontSize: "0.68rem", backgroundColor: palette.inputPaper, padding: "0.22rem 0.4rem", borderRadius: "4px", color: palette.siennaDeep, wordBreak: "break-all", display: "inline-block" }}>
                        {currentVerificationUrl}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <h4 style={{ marginTop: 0, marginBottom: "1rem", paddingBottom: "0.6rem", borderBottom: `1px solid ${palette.panelBorder}`, color: palette.cream, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: "1.2rem" }}>
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
        </>
      )}
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.75rem 0.85rem", borderRadius: "8px", border: "1px solid #C9B896",
  backgroundColor: "#EAE0C6", color: "#2A2216", boxSizing: "border-box", fontFamily: "'Manrope', sans-serif", fontSize: "0.92rem",
};
const darkInputStyle: React.CSSProperties = {
  width: "100%", padding: "0.75rem 0.85rem", borderRadius: "8px", border: "1px solid #3C5138",
  backgroundColor: "#17241A", color: "#EFE6D2", boxSizing: "border-box", fontFamily: "'Manrope', sans-serif", fontSize: "0.92rem",
};

export default App;
