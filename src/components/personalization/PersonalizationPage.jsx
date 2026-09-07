// components/personalization/PersonalizationPage.jsx
// Full personalization dashboard
// Shows learning profile, weak/strong topics, quiz performance summary,
// difficulty adaptation, and how Prism personalizes responses

import { useState, useEffect } from "react";
import { useUserContext } from "../../contexts/UserContext";
import axios from "axios";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, Legend
} from "recharts";

const BASE = "http://localhost:8000/api";

function PersonalizationPage() {
  const { currentUser } = useUserContext();
  const [profile, setProfile] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [profileRes, quizRes] = await Promise.all([
        axios.get(`${BASE}/personalization/${currentUser.userId}`),
        axios.get(`${BASE}/quiz/history/${currentUser.userId}`)
      ]);
      setProfile(profileRes.data.payload);
      setQuizHistory(quizRes.data.payload || []);
    } catch (err) {
      console.error("Failed to load personalization:", err);
    } finally {
      setLoading(false);
    }
  }

  // build radar chart data from topics discussed
  const radarData = profile?.topicsDiscussed?.slice(0, 6).map(topic => ({
    topic: topic.length > 12 ? topic.substring(0, 12) + "..." : topic,
    frequency: Math.floor(Math.random() * 5) + 1   // placeholder
  })) || [];

  // quiz performance trend
  const quizTrend = quizHistory.slice(-7).map((q, i) => ({
    quiz: `Quiz ${i + 1}`,
    score: q.scorePercent || 0,
    correct: q.correct || 0,
    wrong: q.wrong || 0
  }));

  const difficultyColor = {
    easy: "#28a745",
    medium: "#ffc107",
    hard: "#dc3545"
  };

  const difficultyLabel = {
    easy: "Beginner — Step-by-step explanations",
    medium: "Intermediate — Standard explanations",
    hard: "Advanced — Complex derivations"
  };

  if (loading) {
    return (
      <div className="text-center mt-5 pt-5">
        <div className="spinner-border text-dark mb-3" style={{ width: "3rem", height: "3rem" }} />
        <p className="text-secondary">Loading your learning profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-5" style={{ maxWidth: "700px" }}>
        <div className="text-center">
          <div style={{ fontSize: "4rem" }}>🧠</div>
          <h3 className="fw-bold mt-3">No profile yet</h3>
          <p className="text-secondary">
            Start chatting with Prism to build your personalization profile.
            The more you use it, the smarter it gets about your learning style.
          </p>
          <div className="card p-4 mt-4 text-start">
            <h6 className="fw-bold mb-3">How personalization works:</h6>
            <div className="d-flex gap-2 mb-2">
              <span>💬</span>
              <span className="text-secondary">Every chat message is analyzed for topic and difficulty signals</span>
            </div>
            <div className="d-flex gap-2 mb-2">
              <span>📝</span>
              <span className="text-secondary">Quiz results update your weak and strong topic profile</span>
            </div>
            <div className="d-flex gap-2 mb-2">
              <span>🎯</span>
              <span className="text-secondary">Prism adapts explanation depth based on your level</span>
            </div>
            <div className="d-flex gap-2">
              <span>📈</span>
              <span className="text-secondary">Study planner is generated based on your weak areas</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ maxWidth: "1000px" }}>

      {/* header */}
      <div className="mb-4">
        <h3 className="fw-bold">🧠 Your Learning Profile</h3>
        <p className="text-secondary">
          Prism builds this automatically from your chats and quizzes.
          Last updated: {profile.lastActive ? new Date(profile.lastActive).toLocaleDateString() : "N/A"}
        </p>
      </div>

      {/* summary cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-6">
          <div className="card shadow text-center p-3">
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#212529" }}>
              {profile.totalQueries || 0}
            </div>
            <small className="text-secondary">Total Questions Asked</small>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card shadow text-center p-3">
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#212529" }}>
              {quizHistory.length}
            </div>
            <small className="text-secondary">Quizzes Attempted</small>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card shadow text-center p-3">
            <div style={{ fontSize: "2rem", fontWeight: 800,
              color: difficultyColor[profile.difficultyLevel] || "#212529" }}>
              {profile.difficultyLevel?.charAt(0).toUpperCase() + profile.difficultyLevel?.slice(1) || "Medium"}
            </div>
            <small className="text-secondary">Difficulty Level</small>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card shadow text-center p-3">
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#212529" }}>
              {profile.topicsDiscussed?.length || 0}
            </div>
            <small className="text-secondary">Topics Explored</small>
          </div>
        </div>
      </div>

      {/* difficulty adaptation */}
      <div className="card shadow mb-4 p-4">
        <h6 className="fw-bold mb-2">🎯 How Prism Explains to You</h6>
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
            style={{
              width: "60px", height: "60px", flexShrink: 0,
              background: difficultyColor[profile.difficultyLevel] || "#6c757d",
              fontSize: "1.5rem"
            }}
          >
            {profile.difficultyLevel === "easy" ? "😊" :
             profile.difficultyLevel === "hard" ? "🔥" : "🎯"}
          </div>
          <div>
            <div className="fw-semibold">
              {difficultyLabel[profile.difficultyLevel] || "Standard explanations"}
            </div>
            <small className="text-secondary">
              {profile.needsBasics
                ? "Prism gives step-by-step breakdowns for you."
                : "Prism gives concise, focused answers."}
            </small>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* weak topics */}
        <div className="col-md-6">
          <div className="card shadow h-100 p-4">
            <h6 className="fw-bold mb-3">⚠️ Areas to Focus On</h6>
            {profile.weakTopics?.length > 0 ? (
              <div className="d-flex flex-wrap gap-2">
                {profile.weakTopics.map((topic, i) => (
                  <span key={i} className="badge bg-danger bg-opacity-75 p-2">
                    {topic}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-secondary small">
                No weak areas detected yet. Keep using Prism!
              </p>
            )}
          </div>
        </div>

        {/* strong topics */}
        <div className="col-md-6">
          <div className="card shadow h-100 p-4">
            <h6 className="fw-bold mb-3">✅ Your Strong Areas</h6>
            {profile.strongTopics?.length > 0 ? (
              <div className="d-flex flex-wrap gap-2">
                {profile.strongTopics.map((topic, i) => (
                  <span key={i} className="badge bg-success bg-opacity-75 p-2">
                    {topic}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-secondary small">
                Strong areas appear as you use Prism more.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* topics radar */}
      {radarData.length > 2 && (
        <div className="card shadow mb-4 p-4">
          <h6 className="fw-bold mb-3">📡 Topics Explored</h6>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="topic" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis />
              <Radar dataKey="frequency" stroke="#212529" fill="#212529" fillOpacity={0.3} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* quiz performance trend */}
      {quizTrend.length > 0 && (
        <div className="card shadow mb-4 p-4">
          <h6 className="fw-bold mb-3">📈 Quiz Performance Trend</h6>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={quizTrend}>
              <XAxis dataKey="quiz" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" name="Score %" fill="#212529" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* all topics list */}
      {profile.topicsDiscussed?.length > 0 && (
        <div className="card shadow p-4">
          <h6 className="fw-bold mb-3">📚 All Topics You've Studied</h6>
          <div className="d-flex flex-wrap gap-2">
            {profile.topicsDiscussed.map((topic, i) => (
              <span key={i} className="badge bg-secondary p-2">{topic}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PersonalizationPage;
