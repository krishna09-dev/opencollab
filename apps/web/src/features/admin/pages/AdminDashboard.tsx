import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const hasToken =
      Boolean(localStorage.getItem("oc_admin_token")) ||
      Boolean(localStorage.getItem("oc_token"));

    if (!hasToken) {
      navigate("/admin/login", { replace: true });
    } else {
      navigate("/admin/analytics", { replace: true });
    }
  }, [navigate]);

  return null;
}
