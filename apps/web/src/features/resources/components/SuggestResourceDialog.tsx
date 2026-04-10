import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import type { ResourceCategory, ResourceDifficulty, ResourceType } from "../types";
import MSym from "./MSym";

/* ================= TYPES ================= */

export type SuggestResourcePayload = {
  title: string;
  url: string;
  description: string;
  category: ResourceCategory;
  difficulty: ResourceDifficulty;
  type: ResourceType;
  language: string | null;
  tags: string[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: SuggestResourcePayload) => void;
};

/* ================= CONSTANTS ================= */

const CATEGORIES: ResourceCategory[] = [
  "Git Basics",
  "Pull Requests",
  "Programming Docs",
  "CLI Mastery",
  "Bug Fixing"
];

const DIFFICULTIES: ResourceDifficulty[] = ["beginner", "intermediate", "advanced"];
const TYPES: ResourceType[] = ["docs", "video", "guide", "cheatsheet", "article"];

/* ================= DARK DROPDOWN THEME ================= */

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
        fontSize: 14,
        fontWeight: 700,
        py: 1.25,
        "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
        "&.Mui-selected": {
          bgcolor: "rgba(25,230,107,0.14)",
          color: "#19e66b"
        },
        "&.Mui-selected:hover": {
          bgcolor: "rgba(25,230,107,0.18)"
        }
      }
    }
  }
} as const;

/* ================= HELPERS ================= */

function isValidUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/* ================= COMPONENT ================= */

export default function SuggestResourceDialog({ open, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ResourceCategory>("Programming Docs");
  const [difficulty, setDifficulty] = useState<ResourceDifficulty>("beginner");
  const [type, setType] = useState<ResourceType>("article");
  const [language, setLanguage] = useState("");
  const [tagsText, setTagsText] = useState("");

  const canSubmit = useMemo(
    () => title.trim().length >= 3 && isValidUrl(url) && description.trim().length >= 10,
    [title, url, description]
  );

  const handleSubmit = () => {
    onSubmit({
      title: title.trim(),
      url: url.trim(),
      description: description.trim(),
      category,
      difficulty,
      type,
      language: language.trim() || null,
      tags: tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    });

    // reset
    setTitle("");
    setUrl("");
    setDescription("");
    setCategory("Programming Docs");
    setDifficulty("beginner");
    setType("article");
    setLanguage("");
    setTagsText("");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 4,
          bgcolor: "#0f1016",
          border: "1px solid rgba(255,255,255,0.10)"
        }
      }}
    >
      {/* ===== HEADER ===== */}
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: "rgba(25,230,107,0.12)",
              border: "1px solid rgba(25,230,107,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <MSym name="add" sx={{ color: "#19e66b", fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 16, color: "#fff" }}>
              Suggest a Resource
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>
              Share something helpful for contributors
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

      {/* ===== CONTENT ===== */}
      <DialogContent sx={{ pt: 2.5 }}>
        <Stack spacing={2.25}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="How to Write a Good Commit Message"
            fullWidth
            InputLabelProps={{ sx: { color: "#9ca3af" } }}
            sx={{
              "& .MuiOutlinedInput-root": { bgcolor: "rgba(255,255,255,0.04)" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.10)" },
              "& input": { color: "#e5e7eb" }
            }}
          />

          <TextField
            label="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            fullWidth
            error={url.length > 0 && !isValidUrl(url)}
            helperText={url.length > 0 && !isValidUrl(url) ? "Invalid URL" : " "}
            InputLabelProps={{ sx: { color: "#9ca3af" } }}
            FormHelperTextProps={{ sx: { color: "rgba(255,255,255,0.45)" } }}
            sx={{
              "& .MuiOutlinedInput-root": { bgcolor: "rgba(255,255,255,0.04)" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.10)" },
              "& input": { color: "#e5e7eb" }
            }}
          />

          <TextField
            label="Why is it useful?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does it teach? Who should use it?"
            multiline
            minRows={3}
            fullWidth
            InputLabelProps={{ sx: { color: "#9ca3af" } }}
            sx={{
              "& .MuiOutlinedInput-root": { bgcolor: "rgba(255,255,255,0.04)" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.10)" },
              "& textarea": { color: "#e5e7eb" }
            }}
          />

          {/* ===== SELECTS ===== */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: "#9ca3af" }}>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                MenuProps={darkMenuProps}
                onChange={(e) => setCategory(e.target.value as ResourceCategory)}
                sx={{ bgcolor: "rgba(255,255,255,0.04)", color: "#e5e7eb" }}
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel sx={{ color: "#9ca3af" }}>Difficulty</InputLabel>
              <Select
                value={difficulty}
                label="Difficulty"
                MenuProps={darkMenuProps}
                onChange={(e) => setDifficulty(e.target.value as ResourceDifficulty)}
                sx={{ bgcolor: "rgba(255,255,255,0.04)", color: "#e5e7eb" }}
              >
                {DIFFICULTIES.map((d) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: "#9ca3af" }}>Type</InputLabel>
              <Select
                value={type}
                label="Type"
                MenuProps={darkMenuProps}
                onChange={(e) => setType(e.target.value as ResourceType)}
                sx={{ bgcolor: "rgba(255,255,255,0.04)", color: "#e5e7eb" }}
              >
                {TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Language (optional)"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="TypeScript"
              fullWidth
              InputLabelProps={{ sx: { color: "#9ca3af" } }}
              sx={{
                "& .MuiOutlinedInput-root": { bgcolor: "rgba(255,255,255,0.04)" },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.10)" },
                "& input": { color: "#e5e7eb" }
              }}
            />
          </Stack>

          <TextField
            label="Tags (comma separated)"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="git, github, workflow"
            fullWidth
            InputLabelProps={{ sx: { color: "#9ca3af" } }}
            sx={{
              "& .MuiOutlinedInput-root": { bgcolor: "rgba(255,255,255,0.04)" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.10)" },
              "& input": { color: "#e5e7eb" }
            }}
          />

          {/* ===== ACTIONS ===== */}
          <Stack direction="row" justifyContent="flex-end" spacing={1.25}>
            <Button
              onClick={onClose}
              sx={{
                height: 40,
                borderRadius: 999,
                px: 2.5,
                fontWeight: 800,
                bgcolor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "#e5e7eb"
              }}
            >
              Cancel
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              startIcon={<MSym name="send" sx={{ fontSize: 18 }} />}
              sx={{
                height: 40,
                borderRadius: 999,
                px: 3,
                fontWeight: 900,
                bgcolor: "#19e66b",
                color: "#001b0a",
                "&.Mui-disabled": {
                  bgcolor: "rgba(255,255,255,0.10)",
                  color: "#6b7280"
                }
              }}
            >
              Submit
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}