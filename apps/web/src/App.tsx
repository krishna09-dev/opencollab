// apps/web/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import OnboardingPage from "./pages/OnboardingPage";
import HomePage from "./pages/HomePage";   // ⬅️ import this

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

        {/* Fallback: send unknown routes to login for now */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;