import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  GlobalStyles,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Alert
} from "@mui/material";
import MSym from "../../resources/components/MSym";
import { api } from "../../../lib/api";

type ManagerRole = "admin" | "moderator";

export default function AdminSignupPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<ManagerRole>("admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/auth/admin/register", {
        username: username.trim(),
        password,
        role
      });
      localStorage.setItem("oc_admin_token", res.data.token);
      localStorage.setItem("oc_admin_user", JSON.stringify(res.data.admin));

      if (res.data.admin?.role === "moderator") {
        navigate("/moderator/analytics");
      } else {
        navigate("/admin/analytics");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#050509",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '"Spline Sans", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif'
      }}
    >
      <GlobalStyles styles={{ body: { backgroundColor: "#050509" } }} />

      {/* Background blob */}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          "&:before": {
            content: '""',
            position: "absolute",
            inset: "-20%",
            background: `
              radial-gradient(600px 600px at 50% 60%, rgba(251,146,60,0.12), transparent 60%),
              radial-gradient(400px 300px at 30% 30%, rgba(255,255,255,0.04), transparent 60%)
            `,
            filter: "blur(20px)"
          }
        }}
      />

      <Box
        component="form"
        onSubmit={handleSignup}
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 420,
          mx: 2,
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.08)",
          bgcolor: "rgba(11,15,23,0.8)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          p: { xs: 3, sm: 4 }
        }}
      >
        {/* Logo */}
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center" sx={{ mb: 4 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "14px",
              bgcolor: "rgba(251,146,60,0.2)",
              display: "grid",
              placeItems: "center"
            }}
          >
            <MSym name="admin_panel_settings" sx={{ color: "#fb923c", fontSize: 22 }} />
          </Box>
          <Typography sx={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
            Admin Panel
          </Typography>
        </Stack>

        <Typography sx={{ textAlign: "center", color: "#a1a1aa", fontSize: 14, mb: 3 }}>
          Create your admin or moderator account
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              bgcolor: "rgba(239,68,68,0.1)",
              color: "#f87171",
              border: "1px solid rgba(239,68,68,0.2)",
              "& .MuiAlert-icon": { color: "#f87171" }
            }}
          >
            {error}
          </Alert>
        )}

        <Stack spacing={2.5}>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#a1a1aa", mb: 0.75 }}>
              Account Role
            </Typography>
            <FormControl fullWidth>
              <InputLabel sx={{ color: "#a1a1aa" }}>Role</InputLabel>
              <Select
                value={role}
                label="Role"
                onChange={(e) => setRole(e.target.value as ManagerRole)}
                sx={{
                  bgcolor: "#0a0e16",
                  color: "#fff",
                  borderRadius: "10px",
                  "& fieldset": { borderColor: "#27272a" },
                  "&:hover fieldset": { borderColor: "#3f3f46" },
                  "&.Mui-focused fieldset": { borderColor: "#fb923c" }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: "#0b0f17",
                      color: "#fff",
                      border: "1px solid #27272a"
                    }
                  }
                }}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="moderator">Moderator</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#a1a1aa", mb: 0.75 }}>
              Username
            </Typography>
            <TextField
              fullWidth
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#0a0e16",
                  color: "#fff",
                  borderRadius: "10px",
                  "& fieldset": { borderColor: "#27272a" },
                  "&:hover fieldset": { borderColor: "#3f3f46" },
                  "&.Mui-focused fieldset": { borderColor: "#fb923c" }
                }
              }}
            />
          </Box>

          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#a1a1aa", mb: 0.75 }}>
              Password
            </Typography>
            <TextField
              fullWidth
              type="password"
              placeholder="Create a password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#0a0e16",
                  color: "#fff",
                  borderRadius: "10px",
                  "& fieldset": { borderColor: "#27272a" },
                  "&:hover fieldset": { borderColor: "#3f3f46" },
                  "&.Mui-focused fieldset": { borderColor: "#fb923c" }
                }
              }}
            />
          </Box>

          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#a1a1aa", mb: 0.75 }}>
              Confirm Password
            </Typography>
            <TextField
              fullWidth
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#0a0e16",
                  color: "#fff",
                  borderRadius: "10px",
                  "& fieldset": { borderColor: "#27272a" },
                  "&:hover fieldset": { borderColor: "#3f3f46" },
                  "&.Mui-focused fieldset": { borderColor: "#fb923c" }
                }
              }}
            />
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading || !username.trim() || !password || !confirmPassword}
            sx={{
              bgcolor: "#fb923c",
              color: "#fff",
              borderRadius: "10px",
              py: 1.3,
              fontWeight: 600,
              textTransform: "none",
              fontSize: 15,
              "&:hover": { bgcolor: "#f97316" },
              "&:disabled": { bgcolor: "rgba(251,146,60,0.3)", color: "rgba(255,255,255,0.5)" }
            }}
          >
            {loading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Create Account"}
          </Button>
        </Stack>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography sx={{ color: "#71717a", fontSize: 13 }}>
            Already have an account?{" "}
            <Typography
              component={RouterLink}
              to="/admin/login"
              sx={{
                color: "#fb923c",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: 13,
                "&:hover": { textDecoration: "underline" }
              }}
            >
              Sign in
            </Typography>
          </Typography>
        </Box>

        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography
            component={RouterLink}
            to="/login"
            sx={{
              color: "#71717a",
              textDecoration: "none",
              fontSize: 12,
              "&:hover": { color: "#a1a1aa" }
            }}
          >
            Back to main app
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
