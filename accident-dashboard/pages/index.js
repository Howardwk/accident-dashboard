import { useState, useEffect, useCallback } from "react";
import Head from "next/head";

export default function Dashboard() {
  const [accidents, setAccidents] = useState([]);
  const [selected, setSelected]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchAccidents = useCallback(async () => {
    try {
      const res  = await fetch("/api/accidents");
      const data = await res.json();
      setAccidents(data);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + auto-refresh every 30 s
  useEffect(() => {
    fetchAccidents();
    const interval = setInterval(fetchAccidents, 30000);
    return () => clearInterval(interval);
  }, [fetchAccidents]);

  const mapsUrl = (lat, lon) =>
    lat && lon ? `https://maps.google.com/?q=${lat},${lon}` : null;

  return (
    <>
      <Head>
        <title>Accident Detection Dashboard</title>
        <meta name="description" content="Real-time road accident detection monitoring system powered by AI and Raspberry Pi." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="app">
        {/* ── Header ── */}
        <header className="header">
          <div className="header-inner">
            <div className="logo">
              <span className="logo-icon">🚨</span>
              <div>
                <h1>AccidentWatch</h1>
                <p>AI-Powered Road Safety System</p>
              </div>
            </div>
            <div className="header-right">
              <div className="live-badge">
                <span className="pulse" />
                LIVE
              </div>
              <button className="refresh-btn" onClick={fetchAccidents}>
                ↻ Refresh
              </button>
            </div>
          </div>
        </header>

        {/* ── Stats Bar ── */}
        <div className="stats-bar">
          <div className="stat-card">
            <span className="stat-number">{accidents.length}</span>
            <span className="stat-label">Total Detected</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {accidents.filter(a => {
                const t = new Date(a.created_at);
                return Date.now() - t < 86400000;
              }).length}
            </span>
            <span className="stat-label">Last 24 Hours</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {accidents.length > 0
                ? new Date(accidents[0].created_at).toLocaleTimeString()
                : "—"}
            </span>
            <span className="stat-label">Latest Event</span>
          </div>
          <div className="stat-card">
            <span className="stat-number update-time">{lastUpdate || "—"}</span>
            <span className="stat-label">Last Refreshed</span>
          </div>
        </div>

        {/* ── Main Content ── */}
        <main className="main">
          {loading ? (
            <div className="loading">
              <div className="spinner" />
              <p>Loading accident records…</p>
            </div>
          ) : accidents.length === 0 ? (
            <div className="empty">
              <span>✅</span>
              <h2>No Accidents Recorded</h2>
              <p>The system is running and monitoring the road.</p>
            </div>
          ) : (
            <div className="grid">
              {accidents.map((acc) => (
                <div
                  key={acc.id}
                  className="card"
                  onClick={() => setSelected(acc)}
                >
                  <div className="card-image">
                    {acc.image_url ? (
                      <img src={acc.image_url} alt="Accident" />
                    ) : (
                      <div className="no-image">📷 No image</div>
                    )}
                    <div className="card-badge">🚨 Accident</div>
                  </div>
                  <div className="card-body">
                    <div className="card-time">
                      📅 {new Date(acc.created_at).toLocaleString()}
                    </div>
                    {acc.lat && acc.lon ? (
                      <a
                        href={mapsUrl(acc.lat, acc.lon)}
                        target="_blank"
                        rel="noreferrer"
                        className="map-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        📍 View on Google Maps
                      </a>
                    ) : (
                      <span className="no-gps">📍 GPS unavailable</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* ── Lightbox ── */}
        {selected && (
          <div className="lightbox" onClick={() => setSelected(null)}>
            <div className="lightbox-box" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setSelected(null)}>✕</button>
              {selected.image_url && (
                <img src={selected.image_url} alt="Accident full" className="lightbox-img" />
              )}
              <div className="lightbox-info">
                <h2>🚨 Accident Detected</h2>
                <p>📅 {new Date(selected.created_at).toLocaleString()}</p>
                {selected.lat && selected.lon ? (
                  <>
                    <p>📍 {selected.lat.toFixed(6)}, {selected.lon.toFixed(6)}</p>
                    <a
                      href={mapsUrl(selected.lat, selected.lon)}
                      target="_blank"
                      rel="noreferrer"
                      className="map-btn"
                    >
                      Open in Google Maps →
                    </a>
                  </>
                ) : (
                  <p>📍 GPS coordinates unavailable</p>
                )}
                {selected.image_url && (
                  <a href={selected.image_url} download className="download-btn">
                    ⬇ Download Image
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Inter', sans-serif;
          background: #0a0a0f;
          color: #e2e8f0;
          min-height: 100vh;
        }
        a { text-decoration: none; }

        /* Header */
        .header {
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(12px);
          position: sticky; top: 0; z-index: 100;
        }
        .header-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 1rem 2rem;
          display: flex; align-items: center; justify-content: space-between;
        }
        .logo { display: flex; align-items: center; gap: 0.75rem; }
        .logo-icon { font-size: 2rem; }
        .logo h1 { font-size: 1.4rem; font-weight: 700; color: #fff; }
        .logo p  { font-size: 0.75rem; color: #64748b; }
        .header-right { display: flex; align-items: center; gap: 1rem; }
        .live-badge {
          display: flex; align-items: center; gap: 0.4rem;
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.3);
          color: #ef4444; font-size: 0.75rem; font-weight: 700;
          padding: 0.3rem 0.75rem; border-radius: 9999px;
        }
        .pulse {
          width: 8px; height: 8px; border-radius: 50%;
          background: #ef4444;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.3); }
        }
        .refresh-btn {
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.3);
          color: #818cf8; padding: 0.4rem 1rem;
          border-radius: 8px; cursor: pointer; font-size: 0.85rem;
          transition: all 0.2s;
        }
        .refresh-btn:hover { background: rgba(99,102,241,0.3); color: #fff; }

        /* Stats */
        .stats-bar {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 1px; background: rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .stat-card {
          background: #0a0a0f;
          padding: 1.25rem 2rem;
          display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
        }
        .stat-number {
          font-size: 1.6rem; font-weight: 700;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .update-time { font-size: 1rem !important; }
        .stat-label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }

        /* Main */
        .main { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .loading, .empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          min-height: 40vh; gap: 1rem; color: #64748b;
        }
        .empty span { font-size: 3rem; }
        .empty h2 { color: #94a3b8; }
        .spinner {
          width: 40px; height: 40px;
          border: 3px solid rgba(99,102,241,0.2);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Grid */
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.25rem;
        }
        .card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; overflow: hidden;
          cursor: pointer; transition: all 0.25s;
        }
        .card:hover {
          transform: translateY(-4px);
          border-color: rgba(99,102,241,0.4);
          box-shadow: 0 8px 32px rgba(99,102,241,0.15);
        }
        .card-image { position: relative; aspect-ratio: 16/9; background: #111; }
        .card-image img { width: 100%; height: 100%; object-fit: cover; }
        .no-image {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          color: #475569; font-size: 0.9rem;
        }
        .card-badge {
          position: absolute; top: 0.6rem; left: 0.6rem;
          background: rgba(239,68,68,0.85);
          color: #fff; font-size: 0.7rem; font-weight: 600;
          padding: 0.2rem 0.6rem; border-radius: 6px;
          backdrop-filter: blur(4px);
        }
        .card-body { padding: 0.9rem 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .card-time { font-size: 0.8rem; color: #94a3b8; }
        .map-link {
          font-size: 0.8rem; color: #6366f1; font-weight: 500;
          transition: color 0.2s;
        }
        .map-link:hover { color: #818cf8; }
        .no-gps { font-size: 0.8rem; color: #475569; }

        /* Lightbox */
        .lightbox {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
        }
        .lightbox-box {
          background: #13131a;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px; overflow: hidden;
          max-width: 720px; width: 100%;
          position: relative;
        }
        .close-btn {
          position: absolute; top: 1rem; right: 1rem; z-index: 10;
          background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.15);
          color: #fff; width: 32px; height: 32px;
          border-radius: 50%; cursor: pointer; font-size: 0.9rem;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
        }
        .close-btn:hover { background: rgba(239,68,68,0.6); }
        .lightbox-img { width: 100%; max-height: 420px; object-fit: cover; display: block; }
        .lightbox-info {
          padding: 1.5rem;
          display: flex; flex-direction: column; gap: 0.6rem;
        }
        .lightbox-info h2 { font-size: 1.1rem; color: #ef4444; }
        .lightbox-info p  { font-size: 0.9rem; color: #94a3b8; }
        .map-btn, .download-btn {
          display: inline-block; margin-top: 0.5rem;
          padding: 0.6rem 1.2rem; border-radius: 10px;
          font-size: 0.85rem; font-weight: 600;
          transition: all 0.2s; width: fit-content;
        }
        .map-btn {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
        }
        .map-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .download-btn {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          color: #cbd5e1;
        }
        .download-btn:hover { background: rgba(255,255,255,0.12); }

        @media (max-width: 768px) {
          .stats-bar { grid-template-columns: repeat(2,1fr); }
          .header-inner { padding: 1rem; }
          .main { padding: 1rem; }
        }
      `}</style>
    </>
  );
}
