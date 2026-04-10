import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./features/landing/pages/LandingPage";
import LoginPage from "./features/auth/pages/LoginPage";
import AuthCallbackPage from "./features/auth/pages/AuthCallbackPage";
import PrivacyPolicyPage from "./features/legal/pages/PrivacyPolicyPage";
import TermsAndConditionsPage from "./features/legal/pages/TermsAndConditionsPage";
import OnboardingPage from "./features/onboarding/pages/OnboardingPage";
import HomePage from "./features/homeFeed/pages/HomePage";
import IssueDetailPage from "./features/issueDetail/pages/IssueDetailPage";
import ResourcesPage from "./features/resources/pages/ResourcesPage";
import GoodFirstIssuesPage from "./features/goodFirstIssues/pages/GoodFirstIssuesPage";
import PrTrackingPage from "./features/prTracking/pages/PrTrackingPage";
import PrTrackingDetailPage from "./features/prTracking/pages/PrTrackingDetailPage";
import SavedIssuesPage from "./features/savedIssues/pages/SavedIssuesPage";
import ProfilePage from "./features/profile/pages/ProfilePage";
import ClaimedIssuesPage from "./features/profile/pages/ClaimedIssuesPage";

// Admin
import AdminLoginPage from "./features/admin/pages/AdminLoginPage";
import AdminDashboard from "./features/admin/pages/AdminDashboard";
import RepoManagementPage from "./features/admin/pages/RepoManagementPage";
import IssueModerationPage from "./features/admin/pages/IssueModerationPage";
import ClaimsMonitoringPage from "./features/admin/pages/ClaimsMonitoringPage";
import PrVerificationPage from "./features/admin/pages/PrVerificationPage";
import AnalyticsDashboardPage from "./features/admin/pages/AnalyticsDashboardPage";
import RepoRequestsPage from "./features/admin/pages/RepoRequestsPage";
import ResourceRequestsPage from "./features/admin/pages/ResourceRequestsPage";
import ApprovedResourcesPage from "./features/admin/pages/ApprovedResourcesPage";
import ModeratorDashboard from "./features/admin/pages/ModeratorDashboard";
import ModerationLoginPage from "./features/admin/pages/ModerationLoginPage";
import ModerationAuthCallbackPage from "./features/admin/pages/ModerationAuthCallbackPage";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing / login */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsAndConditionsPage />} />
        <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
        <Route path="/terms-and-conditions" element={<Navigate to="/terms" replace />} />

        {/* GitHub OAuth callback */}
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Moderator GitHub OAuth */}
        <Route path="/moderation" element={<ModerationLoginPage />} />
        <Route path="/moderation/callback" element={<ModerationAuthCallbackPage />} />

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

        {/* Profile */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/claimed-issues" element={<ClaimedIssuesPage />} />

        {/* Admin Auth */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/signup" element={<Navigate to="/admin/login" replace />} />

        {/* Admin Panel */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/analytics" element={<AnalyticsDashboardPage />} />
        <Route path="/admin/repos" element={<RepoManagementPage />} />
        <Route path="/admin/repo-requests" element={<RepoRequestsPage />} />
        <Route path="/admin/resource-requests" element={<ResourceRequestsPage />} />
        <Route path="/admin/approved-resources" element={<ApprovedResourcesPage />} />
        <Route path="/admin/issues" element={<IssueModerationPage />} />
        <Route path="/admin/claims" element={<ClaimsMonitoringPage />} />
        <Route path="/admin/prs" element={<Navigate to="/admin/analytics" replace />} />

        {/* Moderator Panel */}
        <Route path="/moderator" element={<ModeratorDashboard />} />
        <Route path="/moderator/analytics" element={<AnalyticsDashboardPage />} />
        <Route path="/moderator/repo-requests" element={<RepoRequestsPage />} />
        <Route path="/moderator/resource-requests" element={<ResourceRequestsPage />} />
        <Route path="/moderator/issues" element={<IssueModerationPage />} />
        <Route path="/moderator/claims" element={<ClaimsMonitoringPage />} />
        <Route path="/moderator/prs" element={<PrVerificationPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;