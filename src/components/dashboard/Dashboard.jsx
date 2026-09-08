import { useUserContext } from "../../contexts/UserContext";
import { useNavigate, useLocation } from "react-router-dom";

const NAV_GROUPS = [
  {
    label: "AI",
    items: [{ icon: "spark", title: "Ask Prism", path: "chat", badge: null }],
  },
  {
    label: "LEARN",
    items: [
      { icon: "quiz", title: "Quiz", path: "quiz", badge: null },
      { icon: "plan", title: "Study Planner", path: "planner", badge: null },
      { icon: "book", title: "NCERT Line by Line", path: "ncert", badge: "New" },
      { icon: "sun", title: "Concept of Day", path: "concept", badge: "Daily" },
    ],
  },
  {
    label: "PRACTICE",
    items: [
      { icon: "mock", title: "NTA Mock Tests", path: "mock-tests", badge: null },
      { icon: "battle", title: "Battle Rooms", path: "battle", badge: "Live" },
    ],
  },
  {
    label: "COMMUNITY",
    items: [
      { icon: "chat", title: "Study Chat", path: "studychat", badge: null },
      { icon: "rank", title: "Leaderboard", path: "leaderboard", badge: null },
    ],
  },
  {
    label: "EXPLORE",
    items: [
      { icon: "video", title: "Video Tutorials", path: "tutorials", badge: null },
      { icon: "map", title: "Coaching Centers", path: "coaching", badge: null },
      {
        icon: "user",
        title: "Personalization",
        path: "personalization",
        badge: null,
      },
    ],
  },
];

const QUICK_ACCESS = [
  {
    title: "Study Chat",
    subtitle: "Chat with friends",
    path: "studychat",
    icon: "chat",
  },
  {
    title: "Take a Quiz",
    subtitle: "Practice MCQs",
    path: "quiz",
    icon: "quiz",
  },
  {
    title: "Battle Room",
    subtitle: "Live competition",
    path: "battle",
    icon: "battle",
  },
];

const ICON_PATHS = {
  menu: "M4 6h16M4 12h16M4 18h16",
  spark: "M12 3l1.8 5.1L19 10l-5.2 1.9L12 17l-1.8-5.1L5 10l5.2-1.9L12 3z",
  quiz: "M9 9h6M9 13h6M9 17h3M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
  plan: "M8 2v4M16 2v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
  book: "M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H7a3 3 0 0 0-3 3V5.5zM4 5.5V22",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  mock: "M4 4h16v16H4zM8 8h8M8 12h8M8 16h5",
  battle: "M14.5 4.5l5 5-10 10H4.5v-5l10-10zM13 6l5 5",
  chat: "M21 12a8 8 0 0 1-8 8H7l-4 3v-6.5A8 8 0 1 1 21 12z",
  rank: "M8 21V10h4v11M4 21v-6h4M12 21V7h4v14M16 21V3h4v18",
  video: "M4 6h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4zM17 10l4-2v8l-4-2",
  map: "M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3zM9 3v15M15 6v15",
  user: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
  chevron: "M9 18l6-6-6-6",
};

function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { currentUser } = useUserContext();
  const navigate = useNavigate();
  const location = useLocation();

  const base = `/dashboard/${currentUser?.email}`;

  function isActive(path) {
    return location.pathname.includes(`/${path}`);
  }

  function goTo(path) {
    navigate(`${base}/${path}`);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        .prism-shell {
          --shell-dark: #111827;
          --shell-dark-soft: #172033;
          display: flex;
          min-height: calc(100vh - 60px);
          background: #f7f8fb;
          font-family: 'DM Sans', system-ui, sans-serif;
          overflow: hidden;
        }

        .prism-sidebar {
          width: 68px;
          flex: 0 0 68px;
          background: var(--shell-dark);
          color: #ffffff;
          display: flex;
          flex-direction: column;
          min-height: calc(100vh - 60px);
          overflow: hidden;
          transition: width 0.22s ease, flex-basis 0.22s ease;
          border-right: 1px solid rgba(255,255,255,0.08);
        }

        .prism-sidebar.expanded {
          width: 260px;
          flex-basis: 260px;
        }

        .sidebar-top {
          height: 64px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .sidebar-toggle {
          width: 40px;
          height: 40px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: #f8fafc;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex: 0 0 auto;
          transition: background 0.15s ease, border-color 0.15s ease;
        }

        .sidebar-toggle:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.18);
        }

        .sidebar-brand {
          min-width: 0;
          opacity: 0;
          transform: translateX(-6px);
          transition: opacity 0.16s ease, transform 0.16s ease;
          overflow: hidden;
          white-space: nowrap;
        }

        .prism-sidebar.expanded .sidebar-brand {
          opacity: 1;
          transform: translateX(0);
        }

        .brand-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1rem;
          font-weight: 700;
        }

        .ai-badge {
          font-size: 0.62rem;
          color: #a5b4fc;
          background: rgba(99,102,241,0.18);
          padding: 2px 6px;
          border-radius: 999px;
        }

        .sidebar-scroll {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 10px 10px 14px;
          scrollbar-width: none;
        }

        .sidebar-scroll::-webkit-scrollbar { display: none; }

        .sidebar-group {
          margin-top: 12px;
        }

        .sidebar-group-label {
          height: 18px;
          padding: 0 8px;
          margin-bottom: 4px;
          color: rgba(255,255,255,0.36);
          font-size: 0.64rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .prism-sidebar.expanded .sidebar-group-label { opacity: 1; }

        .sidebar-item {
          width: 100%;
          min-height: 44px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.72);
          border-radius: 12px;
          padding: 0 12px;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .sidebar-item:hover {
          background: rgba(255,255,255,0.08);
          color: #ffffff;
        }

        .sidebar-item.active {
          background: rgba(99,102,241,0.22);
          color: #e0e7ff;
        }

        .si-icon {
          width: 20px;
          height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 20px;
        }

        .si-label,
        .si-badge {
          opacity: 0;
          white-space: nowrap;
          transition: opacity 0.12s ease;
        }

        .si-label {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 0.86rem;
          font-weight: 500;
        }

        .prism-sidebar.expanded .si-label,
        .prism-sidebar.expanded .si-badge {
          opacity: 1;
        }

        .si-badge {
          font-size: 0.62rem;
          font-weight: 700;
          padding: 3px 7px;
          border-radius: 999px;
          color: #a5b4fc;
          background: rgba(99,102,241,0.18);
        }

        .si-badge.live {
          color: #fecaca;
          background: rgba(239,68,68,0.18);
        }

        .si-badge.new {
          color: #bbf7d0;
          background: rgba(34,197,94,0.18);
        }

        .sidebar-user {
          padding: 12px 14px 16px;
          border-top: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 70px;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #38bdf8;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.82rem;
          font-weight: 700;
          flex: 0 0 auto;
        }

        .sidebar-user-copy {
          min-width: 0;
          opacity: 0;
          transition: opacity 0.12s ease;
          overflow: hidden;
        }

        .prism-sidebar.expanded .sidebar-user-copy { opacity: 1; }

        .sidebar-user-name {
          color: rgba(255,255,255,0.82);
          font-size: 0.82rem;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sidebar-user-meta {
          color: rgba(255,255,255,0.42);
          font-size: 0.72rem;
          margin-top: 2px;
        }

        .prism-main {
          flex: 1;
          min-width: 0;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }

        .prism-main::-webkit-scrollbar { width: 6px; }
        .prism-main::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }

        .dash-hero {
          min-height: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px 28px 36px;
          text-align: center;
        }

        .hero-logo-mark {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 22px;
          color: #ffffff;
          box-shadow: 0 12px 28px rgba(99,102,241,0.24);
        }

        .dash-greeting {
          margin: 0;
          font-size: 1.9rem;
          font-weight: 700;
          color: #111827;
          letter-spacing: 0;
          line-height: 1.2;
        }

        .dash-sub {
          margin: 10px 0 0;
          font-size: 0.95rem;
          color: #64748b;
          font-weight: 400;
        }

        .dash-sub strong {
          color: #334155;
          font-weight: 700;
        }

        .hero-cta {
          margin-top: 26px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 22px;
          background: #111827;
          color: #ffffff;
          border-radius: 12px;
          border: 1px solid #111827;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 700;
          font-family: inherit;
          transition: transform 0.16s ease, background 0.16s ease, box-shadow 0.16s ease;
          box-shadow: 0 10px 24px rgba(15,23,42,0.18);
        }

        .hero-cta:hover {
          background: #1f2937;
          transform: translateY(-1px);
          box-shadow: 0 14px 30px rgba(15,23,42,0.22);
        }

        .cta-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.1);
        }

        .quick-section {
          padding: 0 28px 48px;
        }

        .quick-label {
          font-size: 0.72rem;
          font-weight: 800;
          color: #94a3b8;
          letter-spacing: 0.08em;
          text-align: center;
          margin-bottom: 14px;
        }

        .quick-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          max-width: 560px;
          margin: 0 auto;
        }

        .quick-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          background: #ffffff;
          cursor: pointer;
          transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
          text-align: left;
          min-width: 0;
        }

        .quick-card:hover {
          border-color: #cbd5e1;
          transform: translateY(-2px);
          box-shadow: 0 10px 22px rgba(15,23,42,0.08);
        }

        .qc-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #111827;
          background: #eef2ff;
          margin-bottom: 10px;
        }

        .qc-title {
          font-size: 0.86rem;
          font-weight: 800;
          color: #111827;
          margin-bottom: 3px;
        }

        .qc-sub {
          font-size: 0.75rem;
          color: #64748b;
        }

        @media (max-width: 768px) {
          .prism-shell {
            min-height: calc(100vh - 60px);
          }

          .prism-sidebar {
            width: 60px;
            flex-basis: 60px;
          }

          .prism-sidebar.expanded {
            width: 232px;
            flex-basis: 232px;
          }

          .sidebar-top,
          .sidebar-user {
            padding-left: 10px;
            padding-right: 10px;
          }

          .sidebar-scroll {
            padding-left: 8px;
            padding-right: 8px;
          }

          .sidebar-toggle {
            width: 40px;
            height: 40px;
          }

          .dash-hero {
            min-height: 360px;
            padding: 44px 18px 28px;
          }

          .dash-greeting {
            font-size: 1.45rem;
          }

          .quick-section {
            padding: 0 16px 36px;
          }

          .quick-grid {
            grid-template-columns: 1fr;
            max-width: 360px;
          }
        }
      `}</style>

      <div className="prism-shell">
        <aside className="prism-sidebar expanded">
          <div className="sidebar-top">
            <div className="sidebar-brand">
              <div className="brand-name">
                Prism <span className="ai-badge">AI</span>
              </div>
            </div>
          </div>

          <div className="sidebar-scroll">
            {NAV_GROUPS.map((group) => (
              <div className="sidebar-group" key={group.label}>
                <div className="sidebar-group-label">{group.label}</div>
                {group.items.map((item) => (
                  <button
                    key={item.path}
                    className={`sidebar-item ${isActive(item.path) ? "active" : ""}`}
                    onClick={() => goTo(item.path)}
                    title={item.title}
                  >
                    <span className="si-icon">
                      <Icon name={item.icon} size={20} />
                    </span>
                    <span className="si-label">{item.title}</span>
                    {item.badge && (
                      <span
                        className={`si-badge ${item.badge === "Live" ? "live" : item.badge === "New" ? "new" : ""}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {currentUser && (
            <div className="sidebar-user">
              <div className="user-avatar">
                {(currentUser.firstName || currentUser.email || "U")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
              <div className="sidebar-user-copy">
                <div className="sidebar-user-name">
                  {currentUser.firstName || currentUser.email?.split("@")[0]}
                </div>
                <div className="sidebar-user-meta">
                  {currentUser.examTarget || "JEE"}
                </div>
              </div>
            </div>
          )}
        </aside>

        <main className="prism-main">
          <section className="dash-hero">
            <div className="hero-logo-mark">
              <Icon name="spark" size={32} />
            </div>

            <h1 className="dash-greeting">
              {getGreeting()}, {currentUser?.firstName || "there"}
            </h1>
            <p className="dash-sub">
              Preparing for <strong>{currentUser?.examTarget || "JEE"}</strong>.
              What would you like to work on today?
            </p>

            <button className="hero-cta" onClick={() => goTo("chat")}>
              <span className="cta-icon">
                <Icon name="spark" size={18} />
              </span>
              Ask Prism
            </button>
          </section>

          <section className="quick-section">
            <div className="quick-label">QUICK ACCESS</div>
            <div className="quick-grid">
              {QUICK_ACCESS.map((item) => (
                <button
                  key={item.path}
                  className="quick-card"
                  onClick={() => goTo(item.path)}
                >
                  <span className="qc-icon">
                    <Icon name={item.icon} size={19} />
                  </span>
                  <div className="qc-title">{item.title}</div>
                  <div className="qc-sub">{item.subtitle}</div>
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

export default Dashboard;
