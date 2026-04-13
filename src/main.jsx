import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.css";
import "./index.css";
import StudyChatPage from "./components/studychat/StudyChatPage";
import { StudyChatProvider } from "./contexts/StudyChatContext";

import RootLayout from "./components/RootLayout";
import Home from "./components/common/Home";
import Signin from "./components/common/Signin";
import Signup from "./components/common/Signup";
import Dashboard from "./components/dashboard/Dashboard";
import ChatPage from "./components/chat/ChatPage";
import QuizPage from "./components/quiz/QuizPage";
import StudyPlannerPage from "./components/studyplanner/StudyPlannerPage";
import PersonalizationPage from "./components/personalization/PersonalizationPage";
import ProfilePage from "./components/user/ProfilePage";
import MockTestsPage from "./components/mocktests/MockTestsPage";
import TutorialsPage from "./components/tutorials/TutorialsPage";
import { ChatProvider } from "./contexts/ChatContext";
import CoachingPage from "./components/coaching/CoachingPage";
import ConceptOfDayPage from "./components/concept/ConceptOfDayPage";
import LeaderboardPage from "./components/leaderboard/LeaderboardPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { path: "", element: <Home /> },
      { path: "signin", element: <Signin /> },
      { path: "signup", element: <Signup /> },
      { path: "profile", element: <ProfilePage /> },
      {
        path: "dashboard/:email",
        element: (
          <ChatProvider>
            <Dashboard />
          </ChatProvider>
        ),
      },
      // feature pages — all separate routes
      {
        path: "dashboard/:email/chat",
        element: <ChatProvider><ChatPage /></ChatProvider>
      },
      {
        path: "dashboard/:email/quiz",
        element: <QuizPage />
      },
      {
        path: "dashboard/:email/planner",
        element: <StudyPlannerPage />
      },
      {
        path: "dashboard/:email/personalization",
        element: <PersonalizationPage />
      },
      {
        path: "dashboard/:email/mock-tests",
        element: <MockTestsPage />
      },
      {
        path: "dashboard/:email/tutorials",
        element: <TutorialsPage />
      },
      {
        path: "dashboard/:email/coaching",
        element: <CoachingPage />
      },
      {
        path: "dashboard/:email/concept",
        element: <ConceptOfDayPage />
      },
      {
        path: "dashboard/:email/leaderboard",
        element: <LeaderboardPage />
      },
      {
        path: "dashboard/:email/studychat",
        element: (
          <StudyChatProvider>
            <StudyChatPage />
          </StudyChatProvider>
        )
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
