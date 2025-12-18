import React from "react";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";

type BoundaryError = Error | null;

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; title?: string },
  { error: BoundaryError }
> {
  state: { error: BoundaryError } = { error: null };

  static getDerivedStateFromError(err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
  }

  private handleReload = () => window.location.reload();

  private handleTryAgain = () => this.setState({ error: null });

  render() {
    const { title = "Something went wrong" } = this.props;
    if (this.state.error) {
      return (
        <Box
          sx={{
            minHeight: "100vh",
            bgcolor: "#0b0b10",
            color: "#e5e7eb",
            position: "relative"
          }}
        >
          {/* background blobs */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: `
                radial-gradient(900px 700px at 95% 2%, rgba(34,197,94,0.18), rgba(34,197,94,0) 60%),
                radial-gradient(900px 700px at 15% 10%, rgba(255,255,255,0.05), rgba(255,255,255,0) 60%)
              `
            }}
          />

          <Box sx={{ position: "relative", zIndex: 1, p: { xs: 2, md: 4 } }}>
            <Paper
              elevation={0}
              sx={{
                maxWidth: 900,
                mx: "auto",
                borderRadius: "24px",
                bgcolor: "#101110",
                border: "1px solid rgba(255,255,255,0.08)",
                p: { xs: 2.5, md: 3.5 }
              }}
            >
              <Stack spacing={2}>
                <Typography sx={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>
                  {title}
                </Typography>

                <Alert
                  severity="error"
                  variant="outlined"
                  sx={{
                    borderRadius: "16px",
                    borderColor: "rgba(239,68,68,0.35)",
                    bgcolor: "rgba(239,68,68,0.08)",
                    color: "#fecaca",
                    "& .MuiAlert-icon": { color: "#f87171" }
                  }}
                >
                  {this.state.error.message}
                </Alert>

                <Stack direction="row" spacing={1.25} justifyContent="flex-end">
                  <Button
                    onClick={this.handleTryAgain}
                    sx={{
                      borderRadius: 999,
                      textTransform: "none",
                      fontWeight: 900,
                      bgcolor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "#e5e7eb",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.10)" }
                    }}
                  >
                    Try again
                  </Button>

                  <Button
                    variant="contained"
                    onClick={this.handleReload}
                    sx={{
                      borderRadius: 999,
                      textTransform: "none",
                      fontWeight: 900,
                      bgcolor: "#19e66b",
                      color: "#000",
                      "&:hover": { bgcolor: "#22c55e" }
                    }}
                  >
                    Reload
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}