// apps/web/src/features/prTracking/components/PrTrackingFilters.tsx
import { Box, FormControl, InputBase, InputLabel, MenuItem, Paper, Select, Stack, Button } from "@mui/material";
import MSym from "../../resources/components/MSym";
import type { PrStatusFilter } from "../types";

const darkMenuProps = {
  PaperProps: {
    sx: {
      mt: 1,
      borderRadius: 2,
      bgcolor: "#0f1016",
      color: "#e5e7eb",
      border: "1px solid rgba(255,255,255,0.10)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
      "& .MuiMenuItem-root": {
        fontSize: 13,
        fontWeight: 800,
        py: 1.1,
        "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
        "&.Mui-selected": { bgcolor: "rgba(25,230,107,0.14)", color: "#19e66b" },
        "&.Mui-selected:hover": { bgcolor: "rgba(25,230,107,0.18)" }
      }
    }
  }
} as const;

export type PrFiltersValue = {
  q: string;
  status: PrStatusFilter;
  repo: string;
};

export default function PrTrackingFilters({
  value,
  repoOptions,
  onChange,
  onReset
}: {
  value: PrFiltersValue;
  repoOptions: string[];
  onChange: (next: PrFiltersValue) => void;
  onReset: () => void;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,0.10)",
        bgcolor: "rgba(255,255,255,0.04)",
        p: 2
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "flex-end" }}>
        {/* Search */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ color: "#9ca3af", fontSize: 12, fontWeight: 900, mb: 0.75 }}>Search</Box>
          <Paper
            elevation={0}
            sx={{
              height: 44,
              borderRadius: 2.5,
              border: "1px solid rgba(255,255,255,0.10)",
              bgcolor: "rgba(255,255,255,0.04)",
              px: 1.25,
              display: "flex",
              alignItems: "center",
              gap: 1
            }}
          >
            <MSym name="search" sx={{ fontSize: 20, color: "#6b7280" }} />
            <InputBase
              value={value.q}
              onChange={(e) => onChange({ ...value, q: e.target.value })}
              placeholder="Search by issue title, repo..."
              sx={{ color: "#cbd5e1", flex: 1, fontSize: 13, fontWeight: 700 }}
            />
            <Box
              component="kbd"
              sx={{
                border: "1px solid #374151",
                borderRadius: 1,
                px: 1,
                fontSize: 12,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                color: "#6b7280"
              }}
            >
              ⌘K
            </Box>
          </Paper>
        </Box>

        {/* Status */}
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel sx={{ color: "#9ca3af" }}>Status</InputLabel>
          <Select
            value={value.status}
            label="Status"
            MenuProps={darkMenuProps}
            onChange={(e) => onChange({ ...value, status: e.target.value as PrStatusFilter })}
            sx={{
              height: 44,
              borderRadius: 2.5,
              bgcolor: "rgba(255,255,255,0.04)",
              color: "#e5e7eb",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.10)" }
            }}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="ACCEPTED">ACCEPTED</MenuItem>
            <MenuItem value="PR_OPEN">PR_OPEN</MenuItem>
            <MenuItem value="MERGED">MERGED</MenuItem>
            <MenuItem value="CLOSED">CLOSED</MenuItem>
          </Select>
        </FormControl>

        {/* Repo */}
        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel sx={{ color: "#9ca3af" }}>Repo</InputLabel>
          <Select
            value={value.repo}
            label="Repo"
            MenuProps={darkMenuProps}
            onChange={(e) => onChange({ ...value, repo: e.target.value as string })}
            sx={{
              height: 44,
              borderRadius: 2.5,
              bgcolor: "rgba(255,255,255,0.04)",
              color: "#e5e7eb",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.10)" }
            }}
          >
            <MenuItem value="All">All</MenuItem>
            {repoOptions.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Reset */}
        <Button
          onClick={onReset}
          sx={{
            height: 44,
            borderRadius: 999,
            px: 2.5,
            textTransform: "none",
            fontWeight: 900,
            bgcolor: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "#e5e7eb",
            "&:hover": { bgcolor: "rgba(255,255,255,0.10)" }
          }}
        >
          Reset
        </Button>
      </Stack>
    </Paper>
  );
}