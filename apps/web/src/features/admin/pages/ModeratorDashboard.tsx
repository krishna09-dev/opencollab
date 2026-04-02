import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ModeratorDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const hasToken =
      Boolean(localStorage.getItem("oc_admin_token")) ||
      Boolean(localStorage.getItem("oc_token"));

    if (!hasToken) {
      navigate("/moderation", { replace: true });
      return;
    }

    navigate("/moderator/analytics", { replace: true });
  }, [navigate]);

  return null;
}
