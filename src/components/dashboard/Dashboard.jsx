import { useUserContext } from "../../contexts/UserContext";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const { currentUser } = useUserContext();
  const navigate = useNavigate();
  const base = `/dashboard/${currentUser?.email}`;

  const cards = [
    {
      icon: "💬", title: "Ask Prism", badge: "AI Powered",
      desc: "Ask anything — NCERT concepts, formulas, PYQ solutions, doubt clearing.",
      path: `${base}/chat`, color: "#212529"
    },
    {
      icon: "📝", title: "Quiz", badge: "Practice",
      desc: "Generate topic-wise MCQ and numerical quizzes with detailed analysis.",
      path: `${base}/quiz`, color: "#0d6efd"
    },
    {
      icon: "📅", title: "Study Planner", badge: "Smart",
      desc: "Get a personalized day-by-day timetable based on your exam date and weak areas.",
      path: `${base}/planner`, color: "#28a745"
    },
    {
      icon: "🧠", title: "Personalization", badge: "Insights",
      desc: "See your learning profile — weak areas, topics mastered, quiz trends.",
      path: `${base}/personalization`, color: "#6f42c1"
    },
    {
      icon: "🏛️", title: "NTA Mock Tests", badge: "Official",
      desc: "Direct links to certified NTA mock tests for JEE Mains, Advanced, and NEET.",
      path: `${base}/mock-tests`, color: "#dc3545"
    },
    {
      icon: "🎬", title: "Video Tutorials", badge: "YouTube",
      desc: "Find the best lectures for any topic — filtered by language and quality.",
      path: `${base}/tutorials`, color: "#ff0000"
    },
    {
      icon: "📍", title: "Coaching Centers", badge: "Nearby",
      desc: "Find JEE/NEET coaching centers near you using OpenStreetMap.",
      path: `${base}/coaching`, color: "#e67e22"
    },
    {
      icon: "⚡", title: "Concept of the Day", badge: "Daily",
      desc: "One beautifully explained high-value topic every day. Don't miss it.",
      path: `${base}/concept`, color: "#8e44ad"
    },
    {
      icon: "🏆", title: "Global Leaderboard", badge: "Rankings",
      desc: "See where you stand. Earn points through quizzes and consistency.",
      path: `${base}/leaderboard`, color: "#f39c12"
    },
    {
      icon: "💬", title: "Study Chat", badge: "Real-time",
      desc: "Chat with study partners, form groups, share notes. Zero distractions.",
      path: `${base}/studychat`, color: "#7c3aed"
    },
  ];

  return (
    <div className="container py-4">
      {/* welcome */}
      <div className="mb-4">
        <h2 className="fw-bold">Welcome back, {currentUser?.firstName} 👋</h2>
        <p className="text-secondary">
          Preparing for <strong>{currentUser?.examTarget}</strong> — let's get started.
        </p>
      </div>

      {/* cards grid */}
      <div className="row g-4">
        {cards.map((card) => (
          <div key={card.path} className="col-md-6 col-lg-4">
            <div
              className="card shadow h-100 p-4"
              style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
              onClick={() => navigate(card.path)}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <div className="d-flex justify-content-between align-items-start mb-3">
                <span style={{ fontSize: "2.5rem" }}>{card.icon}</span>
                <span className="badge" style={{ background: card.color }}>
                  {card.badge}
                </span>
              </div>
              <h5 className="fw-bold">{card.title}</h5>
              <p className="text-secondary flex-grow-1" style={{ fontSize: "0.9rem" }}>
                {card.desc}
              </p>
              <button
                className="btn btn-dark w-100 mt-2"
                style={{ background: card.color, border: "none" }}
              >
                Open {card.title} →
              </button>
              
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
