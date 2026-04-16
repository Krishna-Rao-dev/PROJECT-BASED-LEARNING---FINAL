// const CardCard = ({ car }) => {
//     const cars = {
//         "nexon" : "https://sketchfab.com/3d-models/tata-nexon-2016-9596da3c9e794fa38e268a7dfcfca559/embed?autostart=1&camera=0&preload=1",
//         "tiago": "https://sketchfab.com/3d-models/tata-tiago-2021-67de69f0cd934a649887af4b162c9fb2/embed?autostart=1&camera=0&preload=1",
//         "altroz": "https://sketchfab.com/3d-models/tata-altroz-2020-2cf48db681d04cd7867e57d2f1db8bbc/embed?autostart=1&camera=0&preload=1",
//         "harrier": "https://sketchfab.com/3d-models/3-d-model-of-tata-harrier-car-5955db3b145540b3baf4eddaf586ccef/embed?autostart=1&camera=0&preload=1",
//         "punch": "https://sketchfab.com/3d-models/tata-punch-c077007494774beaa6e74fac447aa035/embed?autostart=1&camera=0&preload=1",
//         "safari": "https://sketchfab.com/3d-models/2021-tata-safari-3051714dba91468f9d3f4f15305c2541/embed?autostart=1&camera=0&preload=1",
//     }




// }

import { useState, useEffect } from "react";
import img from '../assets/img.png';
const CAR_MODELS = {
  "nexon":   "https://sketchfab.com/3d-models/tata-nexon-2016-9596da3c9e794fa38e268a7dfcfca559/embed?autostart=1&camera=0&preload=1",
  "tiago":   "https://sketchfab.com/3d-models/tata-tiago-2021-67de69f0cd934a649887af4b162c9fb2/embed?autostart=1&camera=0&preload=1",
  "altroz":  "https://sketchfab.com/3d-models/tata-altroz-2020-2cf48db681d04cd7867e57d2f1db8bbc/embed?autostart=1&camera=0&preload=1",
  "harrier": "https://sketchfab.com/3d-models/3-d-model-of-tata-harrier-car-5955db3b145540b3baf4eddaf586ccef/embed?autostart=1&camera=0&preload=1",
  "punch":   "https://sketchfab.com/3d-models/tata-punch-c077007494774beaa6e74fac447aa035/embed?autostart=1&camera=0&preload=1",
  "safari":  "https://sketchfab.com/3d-models/2021-tata-safari-3051714dba91468f9d3f4f15305c2541/embed?autostart=1&camera=0&preload=1",
};

// normalize "Tata Nexon" → "tata nexon"
function resolveUrl(model) {
  const key = model?.toLowerCase().trim();
  return (
    CAR_MODELS[key] ||
    CAR_MODELS[`tata ${key}`] ||
    null
  );
}


// ── 3D Viewer Modal ───────────────────────────────────────────────────────────
const ViewerModal = ({ model, url, onClose }) => {
  // close on Escape
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>

        {/* header */}
        <div className="modal-header">
          <div className="modal-title-block">
            <span className="modal-eyebrow">3D MODEL</span>
            <h2 className="modal-title">{model}</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2L16 16M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* iframe */}
        <div className="modal-viewer">
          <div className="viewer-loader">
            <div className="loader-ring" />
            <span>Loading 3D model…</span>
          </div>
          <iframe
            title={`${model} 3D`}
            src={url}
            allow="autoplay; fullscreen; xr-spatial-tracking"
            allowFullScreen
            frameBorder="0"
          />
        </div>

        {/* footer */}
        <div className="modal-footer">
          <span>Drag to rotate · Scroll to zoom · Right-click to pan</span>
          <a href={url.replace("/embed?autostart=1&camera=0&preload=1", "")}
             target="_blank" rel="noopener noreferrer" className="modal-sketchfab-link">
            View on Sketchfab ↗
          </a>
        </div>
      </div>
    </div>
  );
};

// ── CarCard ───────────────────────────────────────────────────────────────────
const CarCard = ({ model = "nexon" }) => {
  const [open, setOpen] = useState(false);
  const url = resolveUrl(model);

  return (
    <>
      <div className={`car-card ${open ? "active" : ""}`} onClick={() => url && setOpen(true)}>

        {/* left content */}
        <div className="card-content">
          <p className="card-eyebrow">TATA MOTORS</p>
          <h3 className="card-name">{model}</h3>
          <button className="card-cta" disabled={!url}>
            <span>{url ? "View 3D Model" : "Model unavailable"}</span>
            {url && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7H12M8 3L12 7L8 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>

        {/* right car icon */}
        <div className="card-visual">
            <img src={img} width={180} alt="" />
        </div>

        {/* corner accent */}
        <div className="card-corner-accent" />
      </div>

      {open && url && (
        <ViewerModal model={model} url={url} onClose={() => setOpen(false)} />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');

        :root {
          --card-bg: #0e0e12;
          --card-border: rgba(255,255,255,0.08);
          --card-hover-border: rgba(255,255,255,0.18);
          --accent: #c8a96e;
          --accent-dim: rgba(200,169,110,0.15);
          --text-primary: #f0ece4;
          --text-muted: rgba(240,236,228,0.45);
          --modal-bg: #0a0a0d;
          --modal-border: rgba(255,255,255,0.06);
        }

        /* ── Card ─────────────────────────────────────────── */
        .car-card {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 450px;
          min-height: 140px;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          padding: 24px 20px 24px 28px;
          cursor: pointer;
          overflow: hidden;
          transition: border-color 0.3s ease, transform 0.25s ease, box-shadow 0.3s ease;
          font-family: 'DM Sans', sans-serif;
        }

        .car-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(200,169,110,0.04) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.3s ease;
          border-radius: 16px;
        }

        .car-card:hover,
        .car-card.active {
          border-color: var(--card-hover-border);
          transform: translateY(-2px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,169,110,0.1);
        }

        .car-card:hover::before,
        .car-card.active::before {
          opacity: 1;
        }

        /* corner gold accent line */
        .card-corner-accent {
          position: absolute;
          top: 0; left: 0;
          width: 48px; height: 2px;
          background: linear-gradient(90deg, var(--accent), transparent);
          border-radius: 0 0 2px 0;
        }

        /* ── Card content ─────────────────────────────────── */
        .card-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
          z-index: 1;
        }

        .card-eyebrow {
          font-size: 15px;
          font-weight: 500;
          text-align: left;
          letter-spacing: 0.18em;
          color: var(--accent);
          margin: 0;
          text-transform: uppercase;
        }

        .card-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2.5rem;
          letter-spacing: 0.04em;
          color: var(--text-primary);
          margin: 0;
          line-height: 1;
        }

        .card-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          padding: 7px 14px;
          background: transparent;
          border: 1px solid rgba(200,169,110,0.3);
          border-radius: 6px;
          color: var(--accent);
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          letter-spacing: 0.06em;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          width: fit-content;
        }

        .car-card:hover .card-cta {
          background: var(--accent-dim);
          border-color: var(--accent);
        }

        .card-cta:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        /* ── Car visual ───────────────────────────────────── */
        .card-visual {
          position: relative;
          width: 180px;
          height: 100px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-icon-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, rgba(200,169,110,0.08) 0%, transparent 70%);
          border-radius: 50%;
        }

        .car-icon {
          width: 120px;
          height: auto;
          filter: drop-shadow(0 8px 24px rgba(0,0,0,0.6));
          transition: transform 0.4s ease, filter 0.4s ease;
        }

        .car-card:hover .car-icon {
          transform: scale(1.06) translateY(-3px) rotate(-2deg);
          filter: drop-shadow(0 14px 32px rgba(0,0,0,0.7)) drop-shadow(0 0 20px rgba(200,169,110,0.15));
        }

        /* ── Modal backdrop ───────────────────────────────── */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: backdropIn 0.2s ease;
        }

        @keyframes backdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── Modal container ──────────────────────────────── */
        .modal-container {
          position: relative;
          width: min(860px, 92vw);
          background: var(--modal-bg);
          border: 1px solid var(--modal-border);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(200,169,110,0.08);
          animation: modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1);
          font-family: 'DM Sans', sans-serif;
        }

        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* top gold line */
        .modal-container::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          z-index: 2;
        }

        /* ── Modal header ─────────────────────────────────── */
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 18px;
          border-bottom: 1px solid var(--modal-border);
        }

        .modal-title-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .modal-eyebrow {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.2em;
          color: var(--accent);
          text-transform: uppercase;
        }

        .modal-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.6rem;
          letter-spacing: 0.05em;
          color: var(--text-primary);
          margin: 0;
        }

        .modal-close {
          width: 36px; height: 36px;
          border-radius: 8px;
          border: 1px solid var(--modal-border);
          background: rgba(255,255,255,0.03);
          color: var(--text-muted);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
        }

        .modal-close:hover {
          background: rgba(255,255,255,0.07);
          color: var(--text-primary);
          border-color: rgba(255,255,255,0.15);
        }

        /* ── Modal viewer ─────────────────────────────────── */
        .modal-viewer {
          position: relative;
          width: 100%;
          aspect-ratio: 16/9;
          background: #050507;
        }

        .viewer-loader {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: var(--text-muted);
          font-size: 12px;
          letter-spacing: 0.06em;
          z-index: 0;
        }

        .loader-ring {
          width: 32px; height: 32px;
          border: 2px solid rgba(200,169,110,0.15);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .modal-viewer iframe {
          position: relative;
          z-index: 1;
          width: 100%; height: 100%;
          border: none;
          display: block;
        }

        /* ── Modal footer ─────────────────────────────────── */
        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          border-top: 1px solid var(--modal-border);
          font-size: 11px;
          color: var(--text-muted);
          letter-spacing: 0.04em;
        }

        .modal-sketchfab-link {
          color: var(--accent);
          text-decoration: none;
          font-weight: 500;
          transition: opacity 0.2s;
        }

        .modal-sketchfab-link:hover { opacity: 0.7; }
      `}</style>
    </>
  );
};

export default CarCard;
