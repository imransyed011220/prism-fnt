// components/tutorials/TutorialsPage.jsx
// YouTube tutorials section — curated by subject and topic
// Uses YouTube Data API v3 (10,000 free units/day = 100 searches)
// Falls back to curated links if API unavailable

import { useState, useEffect } from "react";
import { useUserContext } from "../../contexts/UserContext";
import axios from "axios";

const BASE = "http://localhost:8000/api";

const CURATED_CHANNELS = {
  Physics: [
    { name: "Physics Wallah", channelId: "UCKGvAJzSvqiJLOqx1u1yh5A" },
    { name: "Vedantu JEE", channelId: "UCB1DMdFRTPm2tSG6Fygxs6g" },
  ],
  Chemistry: [
    { name: "Chemistry by VKP", channelId: "UCiNFBFCZrdGTMBDm2W3qHaQ" },
  ],
  Maths: [
    { name: "Vedantu Math", channelId: "UCMSDgL0eKO6hhLBKo7WH_kQ" },
  ]
};

function TutorialsPage() {
  const { currentUser } = useUserContext();
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("Physics");
  const [language, setLanguage] = useState("Hindi");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const subjects = currentUser?.examTarget === "NEET"
    ? ["Physics", "Chemistry", "Biology"]
    : ["Physics", "Chemistry", "Maths"];

  async function searchVideos() {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const res = await axios.get(`${BASE}/tutorials/search`, {
        params: {
          topic,
          subject,
          language,
          examTarget: currentUser?.examTarget || "JEE"
        }
      });
      setVideos(res.data.payload || []);
    } catch (err) {
      setError("Failed to fetch videos. Showing curated suggestions.");
      // show fallback curated videos
      setVideos(getFallbackVideos());
    } finally {
      setLoading(false);
    }
  }

  function getFallbackVideos() {
    // curated high quality videos as fallback
    return [
      {
        id: "curated_1",
        title: `${topic} — Complete Lecture`,
        channel: "Physics Wallah",
        thumbnail: "https://img.youtube.com/vi/placeholder/hqdefault.jpg",
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + " " + subject + " JEE NEET " + language)}`,
        duration: "~45 min",
        views: "Popular",
        isCurated: true
      }
    ];
  }

  function getDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
                 : `${m}:${String(s).padStart(2,"0")}`;
  }

  function formatViews(count) {
    if (count >= 1000000) return `${(count/1000000).toFixed(1)}M views`;
    if (count >= 1000) return `${(count/1000).toFixed(0)}K views`;
    return `${count} views`;
  }

  function getYouTubeVideoId(video) {
    const candidate = String(video?.id || "").trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(candidate)) return candidate;

    const rawUrl = String(video?.url || "").trim();
    if (!rawUrl) return null;
    try {
      const url = new URL(rawUrl);
      if (url.hostname === "youtu.be") {
        const id = url.pathname.slice(1).split("/")[0];
        return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
      }
      if (url.hostname.endsWith("youtube.com")) {
        const id = url.searchParams.get("v") || url.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)?.[1];
        return /^[A-Za-z0-9_-]{11}$/.test(id || "") ? id : null;
      }
    } catch {
      return null;
    }
    return null;
  }

  return (
    <div className="container py-4" style={{ maxWidth: "960px" }}>
      <div className="mb-4">
        <h3 className="fw-bold">🎬 Video Tutorials</h3>
        <p className="text-secondary">
          Find the best YouTube lectures for any topic — filtered by subject, language, and quality.
        </p>
      </div>

      {/* search form */}
      <div className="card shadow p-4 mb-4">
        <div className="row g-3">
          <div className="col-md-5">
            <label className="form-label fw-semibold">Topic / Concept</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Thermodynamics, Integration, Cell Division..."
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === "Enter" && searchVideos()}
            />
          </div>

          <div className="col-md-2">
            <label className="form-label fw-semibold">Subject</label>
            <select className="form-select" value={subject} onChange={e => setSubject(e.target.value)}>
              {subjects.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label fw-semibold">Language</label>
            <select className="form-select" value={language} onChange={e => setLanguage(e.target.value)}>
              <option>Hindi</option>
              <option>English</option>
              <option>Hinglish</option>
              <option>Telugu</option>
            </select>
          </div>

          <div className="col-md-3 d-flex align-items-end">
            <button
              className="btn btn-dark w-100"
              onClick={searchVideos}
              disabled={loading || !topic.trim()}
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2"/>Searching...</>
              ) : "🔍 Find Videos"}
            </button>
          </div>
        </div>
      </div>

      {/* results */}
      {error && <div className="alert alert-warning">{error}</div>}

      {searched && !loading && videos.length === 0 && (
        <div className="text-center py-5">
          <div style={{ fontSize: "3rem" }}>📺</div>
          <p className="text-secondary mt-2">No videos found. Try a different topic.</p>
        </div>
      )}

      {selectedVideo ? (
        <section className="tutorial-player-shell">
          <button className="btn btn-outline-secondary tutorial-back-button mb-3" onClick={() => setSelectedVideo(null)}>
            ← Back to tutorial results
          </button>

          <div className="tutorial-player-card">
            <div className="tutorial-player-frame">
              {getYouTubeVideoId(selectedVideo) ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${getYouTubeVideoId(selectedVideo)}?rel=0&modestbranding=1&playsinline=1`}
                  title={selectedVideo.title || "PRISM tutorial video"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="tutorial-player-unavailable">
                  <div className="tutorial-player-unavailable-icon">▶</div>
                  <h5>Video preview unavailable</h5>
                  <p className="text-secondary mb-0">This result is a search fallback and does not contain a specific video ID to embed.</p>
                </div>
              )}
            </div>

            <div className="tutorial-player-details">
              <div className="d-flex flex-wrap gap-2 mb-2">
                <span className="badge text-bg-primary">{subject}</span>
                <span className="badge text-bg-light border text-secondary">{topic}</span>
                <span className="badge text-bg-light border text-secondary">{language}</span>
              </div>
              <h4 className="fw-bold mb-2">{selectedVideo.title}</h4>
              <div className="text-secondary small d-flex flex-wrap gap-3">
                <span>{selectedVideo.channel}</span>
                {selectedVideo.duration && <span>{selectedVideo.duration}</span>}
                {selectedVideo.views && <span>{selectedVideo.views}</span>}
              </div>
            </div>
          </div>
        </section>
      ) : <div className="row g-4">
        {videos.map((video, i) => (
          <div key={i} className="col-md-6 col-lg-4">
            <button
              type="button"
              onClick={() => setSelectedVideo(video)}
              className="text-decoration-none"
              style={{ border: 0, padding: 0, background: "transparent", width: "100%", textAlign: "left" }}
            >
              <div
                className="card h-100 shadow"
                style={{
                  borderRadius: "14px",
                  overflow: "hidden",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "pointer"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                {/* thumbnail */}
                <div style={{ position: "relative" }}>
                  <img
                    src={video.thumbnail || `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                    alt={video.title}
                    style={{ width: "100%", height: "160px", objectFit: "cover" }}
                    onError={e => { e.target.src = "https://via.placeholder.com/320x180?text=Video"; }}
                  />
                  {video.duration && (
                    <span
                      className="position-absolute bottom-0 end-0 m-2 badge bg-dark"
                      style={{ fontSize: "0.7rem" }}
                    >
                      {video.duration}
                    </span>
                  )}
                  {/* play button overlay */}
                  <div
                    className="position-absolute top-50 start-50 translate-middle"
                    style={{
                      background: "rgba(255,0,0,0.9)",
                      borderRadius: "50%",
                      width: "44px", height: "44px",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                  >
                    <span style={{ color: "white", fontSize: "1.2rem", marginLeft: "3px" }}>▶</span>
                  </div>
                </div>

                <div className="card-body p-3">
                  <p className="fw-semibold mb-1" style={{
                    fontSize: "0.9rem",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    color: "#212529"
                  }}>
                    {video.title}
                  </p>
                  <small className="text-secondary d-block">{video.channel}</small>
                  {video.views && (
                    <small className="text-secondary">{video.views}</small>
                  )}
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>}

      {/* quick search links */}
      {!searched && (
        <div className="mt-4">
          <h6 className="fw-bold text-secondary mb-3">Quick Searches:</h6>
          <div className="d-flex gap-2 flex-wrap">
            {[
              "Newton's Laws", "Integration", "Thermodynamics",
              "Chemical Bonding", "Cell Division", "Rotational Motion"
            ].map(t => (
              <button
                key={t}
                className="btn btn-sm btn-outline-secondary"
                onClick={() => { setTopic(t); }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TutorialsPage;
