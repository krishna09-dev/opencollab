import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./features/auth/pages/LoginPage";
import AuthCallbackPage from "./features/auth/pages/AuthCallbackPage";
import OnboardingPage from "./features/onboarding/pages/OnboardingPage";
import HomePage from "./features/homeFeed/pages/HomePage";
import IssueDetailPage from "./features/issueDetail/pages/IssueDetailPage";
import ResourcesPage from "./features/resources/pages/ResourcesPage";
import GoodFirstIssuesPage from "./features/goodFirstIssues/pages/GoodFirstIssuesPage";
import PrTrackingPage from "./features/prTracking/pages/PrTrackingPage";
import PrTrackingDetailPage from "./features/prTracking/pages/PrTrackingDetailPage";
import SavedIssuesPage from "./features/savedIssues/pages/SavedIssuesPage";


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

        {/* Good First Issues */}
        <Route path="/good-first-issues" element={<GoodFirstIssuesPage />} />

        {/* Issue Detail */}
        <Route path="/issues/:id" element={<IssueDetailPage />} />

        {/* ✅ Resources */}
        <Route path="/resources" element={<ResourcesPage />} />

        <Route path="/pr-tracking" element={<PrTrackingPage />} />
        <Route path="/pr-tracking/:id" element={<PrTrackingDetailPage />} />

        {/* Saved Issues */}
        <Route path="/saved" element={<SavedIssuesPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;