import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import OnboardingPage from "./pages/OnboardingPage";
import HomePage from "./pages/HomePage";
import IssueDetailPage from "./pages/IssueDetailPage";
import ResourcesPage from "./features/resources/pages/ResourcesPage"; // ✅ ADD THIS
import PrTrackingPage from "./features/prTracking/pages/PrTrackingPage";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing / login */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* GitHub OAuth callback */}
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Onboarding */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Home feed */}
        <Route path="/feed" element={<HomePage />} />

        {/* Issue Detail */}
        <Route path="/issues/:id" element={<IssueDetailPage />} />

        {/* ✅ Resources */}
        <Route path="/resources" element={<ResourcesPage />} />

        <Route path="/pr-tracking" element={<PrTrackingPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;