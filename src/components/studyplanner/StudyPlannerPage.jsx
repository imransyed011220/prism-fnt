// components/studyplanner/StudyPlannerPage.jsx
// full study planner — setup form, timetable view,
// checklist with progress, charts

import { useState, useEffect } from "react";
import { useUserContext } from "../../contexts/UserContext";
import axios from "axios";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const BASE = "http://localhost:8000/api";
const SUBJECTS = {
  JEE: ["Physics", "Chemistry", "Maths"],
  NEET: ["Physics", "Chemistry", "Biology"]
};
const COLORS = ["#212529", "#495057", "#6c757d", "#adb5bd"];

function StudyPlannerPage() {
  const { currentUser } = useUserContext();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // form state
  const [examDate, setExamDate] = useState("");
  const [weakSubjects, setWeakSubjects] = useState([]);
  const [dailyHours, setDailyHours] = useState(6);
  const [currentLevel, setCurrentLevel] = useState("intermediate");

  // Add new state fields
  const [strongSubjects, setStrongSubjects] = useState([]);
  const [completedChapters, setCompletedChapters] = useState("");
  const [targetScore, setTargetScore] = useState("");
  const [studySessionLength, setStudySessionLength] = useState(2);
  const [hasCoaching, setHasCoaching] = useState(false);
  const [priorityTopics, setPriorityTopics] = useState("");

  const subjects = SUBJECTS[currentUser?.examTarget] || SUBJECTS.JEE;

  useEffect(() => {
    loadExistingPlan();
  }, []);

  async function loadExistingPlan() {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE}/study-planner/${currentUser.userId}`);
      if (res.data.payload) setPlan(res.data.payload);
    } catch (err) {
      console.error("Failed to load plan:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!examDate) { alert("Please select exam date."); return; }
    setGenerating(true);
    try {
      const res = await axios.post(`${BASE}/study-planner/generate`, {
        userId: currentUser.userId,
        examTarget: currentUser.examTarget,
        examDate,
        weakSubjects: weakSubjects.length ? weakSubjects : subjects,
        strongSubjects,
        dailyHours,
        currentLevel,
        completedChapters: completedChapters.split(",").map(s => s.trim()).filter(Boolean),
        priorityTopics: priorityTopics.split(",").map(s => s.trim()).filter(Boolean),
        targetScore,
        studySessionLength,
        hasCoaching,
        revisionDaysBuffer: 7
      });
      if (res.data.payload) {
        setPlan(res.data.payload);
        setActiveTab("overview");
      }
    } catch {
      alert("Failed to generate plan. Try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function toggleTask(taskId, current) {
    try {
      await axios.post(`${BASE}/study-planner/${currentUser.userId}/task/${taskId}`,
        { completed: !current }
      );
      setPlan(prev => ({
        ...prev,
        taskProgress: { ...prev.taskProgress, [taskId]: !current }
      }));
    } catch (err) {
      console.error("Task update failed:", err);
    }
  }

  // calculate progress
  const totalTasks = plan?.dailyChecklist?.length || 0;
  const completedTasks = Object.values(plan?.taskProgress || {}).filter(Boolean).length;
  const progressPct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // chart data
  const phaseData = plan?.phases?.map(p => ({
    name: p.phase, days: parseInt(p.days?.split("-")?.[1] || 7) - parseInt(p.days?.split("-")?.[0] || 1) + 1
  })) || [];

  const priorityData = ["high", "medium", "low"].map(w => ({
    name: w.charAt(0).toUpperCase() + w.slice(1),
    chapters: plan?.priorityChapters?.filter(c => c.weightage === w).length || 0
  }));

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" /><p className="mt-2">Loading your plan...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ maxWidth: "1000px" }}>
      <h3 className="fw-bold mb-4">📅 Study Planner</h3>

      {/* setup form — shown always or when no plan */}
      {!plan && (
        <div className="card shadow p-4 mb-4">
          <h5 className="fw-bold mb-3">Create Your Study Plan</h5>
          <div className="row g-3">

            <div className="col-md-6">
              <label className="form-label fw-semibold">Exam Date</label>
              <input
                type="date"
                className="form-control"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Daily Study Hours: {dailyHours}h</label>
              <input
                type="range" className="form-range"
                min={2} max={12} value={dailyHours}
                onChange={e => setDailyHours(Number(e.target.value))}
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Weak Subjects (select all that apply)</label>
              <div className="d-flex gap-2 flex-wrap">
                {subjects.map(s => (
                  <button
                    key={s}
                    className={`btn btn-sm ${weakSubjects.includes(s) ? "btn-dark" : "btn-outline-secondary"}`}
                    onClick={() => setWeakSubjects(prev =>
                      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Strong Subjects (optional)</label>
              <div className="d-flex gap-2 flex-wrap">
                {subjects.map(s => (
                  <button
                    key={s}
                    className={`btn btn-sm ${strongSubjects.includes(s) ? "btn-success" : "btn-outline-secondary"}`}
                    onClick={() => setStrongSubjects(prev =>
                      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Target Score / Rank</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. AIR < 5000, 95+ percentile"
                value={targetScore}
                onChange={e => setTargetScore(e.target.value)}
                style={{ borderRadius: "12px" }}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">
                Session Length: {studySessionLength} hrs
              </label>
              <input
                type="range" className="form-range"
                min={1} max={4} value={studySessionLength}
                onChange={e => setStudySessionLength(Number(e.target.value))}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Chapters Already Completed</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Mechanics, Thermodynamics, Organic..."
                value={completedChapters}
                onChange={e => setCompletedChapters(e.target.value)}
                style={{ borderRadius: "12px" }}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Priority Topics (extra focus)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Electrochemistry, Coordination Compounds"
                value={priorityTopics}
                onChange={e => setPriorityTopics(e.target.value)}
                style={{ borderRadius: "12px" }}
              />
            </div>

            <div className="col-md-6 d-flex align-items-center">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={hasCoaching}
                  onChange={e => setHasCoaching(e.target.checked)}
                />
                <label className="form-check-label fw-semibold">
                  I attend coaching classes
                  <small className="text-secondary d-block">Plan will focus on home study only</small>
                </label>
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Current Level</label>
              <select
                className="form-select"
                value={currentLevel}
                onChange={e => setCurrentLevel(e.target.value)}
              >
                <option value="beginner">Beginner (Just started)</option>
                <option value="intermediate">Intermediate (Some preparation done)</option>
                <option value="advanced">Advanced (Mostly prepared)</option>
              </select>
            </div>

            <div className="col-12">
              <button
                className="btn btn-dark w-100 py-3 fw-bold"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <><span className="spinner-border spinner-border-sm me-2" />Generating your personalized plan...</>
                ) : "⚡ Generate Study Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {plan && (
        <>
          {/* plan header */}
          <div className="card shadow p-3 mb-4 d-flex flex-row align-items-center justify-content-between">
            <div>
              <h5 className="fw-bold mb-0">{plan.title}</h5>
              <small className="text-secondary">
                {plan.daysRemaining} days remaining · {plan.dailyHours}h/day
              </small>
            </div>
            <button
              className="btn btn-sm btn-outline-dark"
              onClick={() => { setPlan(null); }}
            >
              Regenerate
            </button>
          </div>

          {/* tabs */}
          <ul className="nav nav-tabs mb-4">
            {["overview", "timetable", "checklist", "analysis"].map(tab => (
              <li key={tab} className="nav-item">
                <button
                  className={`nav-link ${activeTab === tab ? "active fw-bold" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "overview" ? "📋 Overview" :
                    tab === "timetable" ? "🗓 Timetable" :
                      tab === "checklist" ? "✅ Checklist" : "📊 Analysis"}
                </button>
              </li>
            ))}
          </ul>

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="row g-4">
              {/* phases */}
              <div className="col-12">
                <div className="card shadow p-3">
                  <h6 className="fw-bold mb-3">Study Phases</h6>
                  {plan.phases?.map((phase, i) => (
                    <div key={i} className="d-flex gap-3 mb-3 p-3 rounded"
                      style={{ background: "#f8f9fa" }}>
                      <div className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                        style={{ width: "40px", height: "40px" }}>
                        {i + 1}
                      </div>
                      <div>
                        <div className="fw-semibold">{phase.phase} <span className="text-secondary small">({phase.days})</span></div>
                        <div className="text-secondary small">{phase.focus}</div>
                        <div className="d-flex gap-1 mt-1 flex-wrap">
                          {phase.subjects?.map(s => (
                            <span key={s} className="badge bg-dark">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* milestones */}
              <div className="col-12">
                <div className="card shadow p-3">
                  <h6 className="fw-bold mb-3">🎯 Milestones</h6>
                  {plan.milestones?.map((m, i) => (
                    <div key={i} className="d-flex align-items-center gap-3 mb-2">
                      <span className="badge bg-dark">Day {m.day}</span>
                      <span className="text-secondary">{m.target}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TIMETABLE TAB */}
          {activeTab === "timetable" && (
            <div className="card shadow">
              <div className="card-body p-0">
                <table className="table table-bordered mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>Day</th>
                      <th>Time</th>
                      <th>Subject</th>
                      <th>Topic</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(plan.weeklySchedule || {}).map(([day, slots]) =>
                      slots?.map((slot, i) => (
                        <tr key={`${day}-${i}`}>
                          {i === 0 && (
                            <td rowSpan={slots.length} className="fw-bold align-middle text-center">
                              {day}
                            </td>
                          )}
                          <td><small>{slot.time}</small></td>
                          <td><span className="badge bg-dark">{slot.subject}</span></td>
                          <td className="small">{slot.topic}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CHECKLIST TAB */}
          {activeTab === "checklist" && (
            <div>
              {/* progress */}
              <div className="card shadow p-3 mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className="fw-semibold">Daily Progress</span>
                  <span className="fw-bold">{progressPct}%</span>
                </div>
                <div className="progress" style={{ height: "12px" }}>
                  <div
                    className="progress-bar bg-dark"
                    style={{ width: `${progressPct}%`, transition: "width 0.5s" }}
                  />
                </div>
                <small className="text-secondary mt-1">
                  {completedTasks} of {totalTasks} tasks completed today
                </small>
              </div>

              {/* checklist items */}
              <div className="card shadow">
                {plan.dailyChecklist?.map((task, i) => {
                  const taskId = `task_${i}`;
                  const done = plan.taskProgress?.[taskId] || false;
                  return (
                    <div
                      key={i}
                      className={`d-flex align-items-center gap-3 p-3 border-bottom ${done ? "bg-success bg-opacity-10" : ""}`}
                      style={{ cursor: "pointer" }}
                      onClick={() => toggleTask(taskId, done)}
                    >
                      <div style={{
                        width: "24px", height: "24px", borderRadius: "50%",
                        border: "2px solid #212529", flexShrink: 0,
                        background: done ? "#212529" : "white",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        {done && <span style={{ color: "white", fontSize: "12px" }}>✓</span>}
                      </div>
                      <span className={done ? "text-decoration-line-through text-secondary" : ""}>
                        {task}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ANALYSIS TAB */}
          {activeTab === "analysis" && (
            <div className="row g-4">
              <div className="col-md-6">
                <div className="card shadow p-3">
                  <h6 className="fw-bold mb-3">Phase Distribution</h6>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={phaseData} dataKey="days" nameKey="name"
                        innerRadius={50} outerRadius={80}>
                        {phaseData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card shadow p-3">
                  <h6 className="fw-bold mb-3">Chapter Priority</h6>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={priorityData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="chapters" fill="#212529" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* priority chapters list */}
              <div className="col-12">
                <div className="card shadow">
                  <div className="card-body p-0">
                    <h6 className="fw-bold p-3 border-bottom mb-0">Priority Chapters</h6>
                    {plan.priorityChapters?.map((ch, i) => (
                      <div key={i} className="d-flex align-items-center justify-content-between p-3 border-bottom">
                        <div>
                          <span className="fw-semibold">{ch.chapter}</span>
                          <small className="text-secondary ms-2">{ch.subject}</small>
                        </div>
                        <div className="d-flex gap-2 align-items-center">
                          <span className={`badge ${ch.weightage === "high" ? "bg-danger" :
                              ch.weightage === "medium" ? "bg-warning text-dark" : "bg-secondary"
                            }`}>{ch.weightage}</span>
                          <small className="text-secondary">{ch.days} days</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default StudyPlannerPage;
