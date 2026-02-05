// apps/web/src/features/prTracking/components/PrMessagesPanel.tsx
import { Avatar, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import type { PrMessage } from "../types";
import MSym from "../../resources/components/MSym";

export default function PrMessagesPanel({
  loading,
  error,
  items,
  onAddLocalMessage
}: {
  loading: boolean;
  error: string | null;
  items: PrMessage[];
  onAddLocalMessage: (text: string) => void; // dummy UI for now
}) {
  const [text, setText] = useState("");

  const canSend = useMemo(() => text.trim().length >= 2, [text]);

  return (
    <Box sx={{ mt: 2 }}>
      {loading && <Typography sx={{ color: "#9ca3af", fontWeight: 700 }}>Loading messages…</Typography>}
      {error && <Typography sx={{ color: "#fecaca", fontWeight: 800 }}>{error}</Typography>}

      <Stack spacing={1.75} sx={{ mt: 1.25 }}>
        {items.map((m) =>
          m.kind === "system" ? (
            <Box
              key={m.id}
              sx={{
                p: 1.5,
                borderRadius: 2.5,
                border: "1px dashed rgba(255,255,255,0.14)",
                bgcolor: "rgba(17,17,26,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    height: 24,
                    px: 1.25,
                    borderRadius: 999,
                    border: "1px solid rgba(96,165,250,0.25)",
                    bgcolor: "rgba(96,165,250,0.10)",
                    color: "#bfdbfe",
                    fontSize: 12,
                    fontWeight: 950,
                    display: "inline-flex",
                    alignItems: "center"
                  }}
                >
                  SYSTEM
                </Box>
                <Typography sx={{ color: "#cbd5e1", fontWeight: 800 }}>
                  {m.text}
                </Typography>
              </Box>

              <Typography sx={{ color: "#6b7280", fontWeight: 800, fontSize: 12 }}>
                {m.createdAtLabel}
              </Typography>
            </Box>
          ) : (
            <Box
              key={m.id}
              sx={{
                p: 1.75,
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.10)",
                bgcolor: "rgba(255,255,255,0.04)",
                display: "grid",
                gridTemplateColumns: "42px 1fr",
                gap: 1.5
              }}
            >
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  background: m.author === "maintainer"
                    ? "linear-gradient(135deg, #f97316, #60a5fa)"
                    : "linear-gradient(135deg, #a855f7, #3b82f6)"
                }}
              >
                {m.author?.[0]?.toUpperCase()}
              </Avatar>

              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ fontWeight: 950, color: "#fff", fontSize: 13 }}>
                    {m.author}
                  </Typography>
                  <Typography sx={{ color: "#9ca3af", fontWeight: 750, fontSize: 12 }}>
                    • {m.createdAtLabel}
                  </Typography>
                </Stack>

                <Typography sx={{ mt: 1, color: "#e5e7eb", fontWeight: 650, fontSize: 14, lineHeight: 1.55 }}>
                  {m.text}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
                  <Button
                    size="small"
                    sx={{
                      height: 32,
                      borderRadius: 999,
                      px: 1.5,
                      textTransform: "none",
                      fontWeight: 900,
                      bgcolor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "#e5e7eb",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.10)" }
                    }}
                  >
                    Reply
                  </Button>
                  <Button
                    size="small"
                    sx={{
                      height: 32,
                      borderRadius: 999,
                      px: 1.5,
                      textTransform: "none",
                      fontWeight: 900,
                      bgcolor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "#e5e7eb",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.10)" }
                    }}
                  >
                    Copy link
                  </Button>
                </Stack>
              </Box>
            </Box>
          )
        )}

        {/* Composer (dummy local send for sprint 4) */}
        <Box
          sx={{
            p: 1.75,
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.10)",
            bgcolor: "rgba(255,255,255,0.04)"
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography sx={{ fontWeight: 950, color: "#fff", fontSize: 13 }}>
              Add a comment
            </Typography>
            <Typography sx={{ color: "#9ca3af", fontWeight: 750, fontSize: 12 }}>
              (dummy UI for now)
            </Typography>
          </Stack>

          <TextField
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a message..."
            multiline
            minRows={3}
            fullWidth
            sx={{
              mt: 1.25,
              "& .MuiOutlinedInput-root": { bgcolor: "rgba(255,255,255,0.04)" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.10)" },
              "& textarea": { color: "#e5e7eb", fontWeight: 650, fontSize: 13 }
            }}
          />

          <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 1.25 }}>
            <Button
              onClick={() => setText("")}
              sx={{
                height: 38,
                borderRadius: 999,
                px: 2.25,
                textTransform: "none",
                fontWeight: 900,
                bgcolor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "#e5e7eb",
                "&:hover": { bgcolor: "rgba(255,255,255,0.10)" }
              }}
            >
              Cancel
            </Button>

            <Button
              disabled={!canSend}
              onClick={() => {
                onAddLocalMessage(text.trim());
                setText("");
              }}
              startIcon={<MSym name="send" sx={{ fontSize: 18 }} />}
              sx={{
                height: 38,
                borderRadius: 999,
                px: 2.75,
                textTransform: "none",
                fontWeight: 950,
                bgcolor: "#19e66b",
                color: "#001b0a",
                "&:hover": { bgcolor: "#22c55e" },
                "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.10)", color: "#6b7280" }
              }}
            >
              Send
            </Button>
          </Stack>
        </Box>

        <Typography sx={{ color: "rgba(255,255,255,0.45)", fontWeight: 700, fontSize: 12 }}>
          Later: fetch GitHub PR comments + review threads using user token.
        </Typography>
      </Stack>
    </Box>
  );
}