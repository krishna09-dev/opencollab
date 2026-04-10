import {
  Box,
  Button,
  InputBase,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import type { ResourceFilterState, ResourceCategory, ResourceDifficulty, ResourceType } from "../types";

function MSym({ name, sx }: { name: string; sx?: any }) {
  return (
    <Box
      component="span"
      className="material-symbols-outlined"
      sx={{
        fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24',
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...sx
      }}
    >
      {name}
    </Box>
  );
}

const categories: (ResourceCategory | "All")[] = [
  "All",
  "Git Basics",
  "Pull Requests",
  "Programming Docs",
  "CLI Mastery",
  "Bug Fixing"
];

const difficulties: (ResourceDifficulty | "All")[] = ["All", "beginner", "intermediate", "advanced"];
const types: (ResourceType | "All")[] = ["All", "docs", "article", "video", "guide", "cheatsheet"];

export function ResourceFilters({
  value,
  onChange,
  onReset,
  onSeed
}: {
  value: ResourceFilterState;
  onChange: (v: ResourceFilterState) => void;
  onReset: () => void;
  onSeed: () => void;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        mt: 3,
        borderRadius: "22px",
        bgcolor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        p: 2
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems="center">
        {/* search */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            width: "100%",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.08)",
            bgcolor: "#11111a",
            px: 1.5,
            py: 0.75,
            display: "flex",
            alignItems: "center",
            gap: 1
          }}
        >
          <MSym name="search" sx={{ fontSize: 18, color: "#6b7280" }} />
          <InputBase
            value={value.q}
            onChange={(e) => onChange({ ...value, q: e.target.value })}
            placeholder="Search resources (e.g., git rebase)"
            sx={{ color: "#cbd5e1", flex: 1, fontSize: 14 }}
          />
        </Paper>

        {/* category */}
        <Box
          component="select"
          value={value.category}
          onChange={(e) => onChange({ ...value, category: e.target.value as any })}
          style={{
            height: 40,
            borderRadius: 999,
            padding: "0 14px",
            background: "#11111a",
            color: "#e5e7eb",
            border: "1px solid rgba(255,255,255,0.08)",
            outline: "none",
            width: 160
          }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Box>

        {/* difficulty */}
        <Box
          component="select"
          value={value.difficulty}
          onChange={(e) => onChange({ ...value, difficulty: e.target.value as any })}
          style={{
            height: 40,
            borderRadius: 999,
            padding: "0 14px",
            background: "#11111a",
            color: "#e5e7eb",
            border: "1px solid rgba(255,255,255,0.08)",
            outline: "none",
            width: 160
          }}
        >
          {difficulties.map((d) => (
            <option key={d} value={d}>
              {d === "All" ? "Difficulty" : d}
            </option>
          ))}
        </Box>

        {/* language */}
        <Box
          component="select"
          value={value.language}
          onChange={(e) => onChange({ ...value, language: e.target.value as any })}
          style={{
            height: 40,
            borderRadius: 999,
            padding: "0 14px",
            background: "#11111a",
            color: "#e5e7eb",
            border: "1px solid rgba(255,255,255,0.08)",
            outline: "none",
            width: 160
          }}
        >
          {["All", "JavaScript", "TypeScript", "Python", "Go", "Java"].map((l) => (
            <option key={l} value={l}>
              {l === "All" ? "Language" : l}
            </option>
          ))}
        </Box>

        {/* type */}
        <Box
          component="select"
          value={value.type}
          onChange={(e) => onChange({ ...value, type: e.target.value as any })}
          style={{
            height: 40,
            borderRadius: 999,
            padding: "0 14px",
            background: "#11111a",
            color: "#e5e7eb",
            border: "1px solid rgba(255,255,255,0.08)",
            outline: "none",
            width: 160
          }}
        >
          {types.map((t) => (
            <option key={t} value={t}>
              {t === "All" ? "Type" : t}
            </option>
          ))}
        </Box>

        <Button
          onClick={onReset}
          startIcon={<MSym name="restart_alt" sx={{ fontSize: 18 }} />}
          sx={{
            height: 40,
            borderRadius: 999,
            textTransform: "none",
            fontWeight: 900,
            color: "#e5e7eb",
            border: "1px solid rgba(255,255,255,0.12)"
          }}
        >
          Reset
        </Button>

        <Button
          onClick={onSeed}
          startIcon={<MSym name="auto_awesome" sx={{ fontSize: 18 }} />}
          sx={{
            height: 40,
            px: 2.25,
            minWidth: 140,
            borderRadius: 999,
            textTransform: "none",
            fontWeight: 900,
            color: "#001b0a",
            bgcolor: "#19e66b",
            "&:hover": { bgcolor: "#22c55e" }
          }}
        >
          Seed sample
        </Button>
      </Stack>

      <Typography sx={{ mt: 1.5, fontSize: 12, color: "#6b7280" }}>
        Tip: “guide/cheatsheet” are UI-only types (backend maps tool/repo → guide).
      </Typography>
    </Paper>
  );
}