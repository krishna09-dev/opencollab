import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import MSym from "../../resources/components/MSym";

export default function SuggestedResourcesCard() {
  const navigate = useNavigate();

  return (
    <Button
      fullWidth
      onClick={() => navigate("/resources")}
      startIcon={<MSym name="library_books" sx={{ fontSize: 20 }} />}
      sx={{
        height: 48,
        borderRadius: "12px",
        justifyContent: "flex-start",
        px: 3,
        gap: 1,
        mb: 2.5,
        bgcolor: "#11111a",
        border: "1px solid #2c312a",
        color: "#fff",
        fontWeight: 700,
        fontSize: 16,
        textTransform: "none",
        "& .MuiButton-startIcon": { ml: 0 },
        "&:hover": {
          bgcolor: "rgba(255,255,255,0.08)",
          color: "#fff"
        }
      }}
    >
      Suggested Resources
    </Button>
  );
}
