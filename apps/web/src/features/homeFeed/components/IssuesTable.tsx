import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { IssueRow } from "../types";

type TableRowWithSno = IssueRow & { sno: number };

type Props = {
  tableRows: TableRowWithSno[];
  issuesLoading: boolean;
  issuesError: string | null;
};

export default function IssuesTable({ tableRows, issuesLoading, issuesError }: Props) {
  const navigate = useNavigate();

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      <Typography sx={{ fontWeight: 800, mb: 1.5 }}>
        Issues in DB
      </Typography>

      {issuesError && (
        <Typography sx={{ color: "#fca5a5", mb: 1 }}>
          {issuesError}
        </Typography>
      )}

      <TableContainer
        component={Paper}
        sx={{
          bgcolor: "#0b0b12",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 3
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: "#9ca3af", fontWeight: 800 }}>S.No</TableCell>
              <TableCell sx={{ color: "#9ca3af", fontWeight: 800 }}>Issue ID</TableCell>
              <TableCell sx={{ color: "#9ca3af", fontWeight: 800 }}>Issue Title</TableCell>
              <TableCell sx={{ color: "#9ca3af", fontWeight: 800 }}>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {issuesLoading && tableRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} sx={{ color: "#9ca3af" }}>
                  Loading issues...
                </TableCell>
              </TableRow>
            ) : tableRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} sx={{ color: "#9ca3af" }}>
                  No issues found in DB.
                </TableCell>
              </TableRow>
            ) : (
              tableRows.map((row) => (
                <TableRow key={row._id} hover>
                  <TableCell sx={{ color: "#e5e7eb" }}>{row.sno}</TableCell>

                  <TableCell sx={{ color: "#e5e7eb", fontFamily: "monospace" }}>
                    {row.repoOwner}/{row.repoName}#{row.githubNumber}
                  </TableCell>

                  <TableCell sx={{ color: "#e5e7eb" }}>
                    {row.title}
                  </TableCell>

                  <TableCell>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => navigate(`/issues/${row._id}`)}
                      sx={{
                        borderRadius: 999,
                        textTransform: "none",
                        fontWeight: 900,
                        bgcolor: "#19e66b",
                        color: "#000",
                        "&:hover": { bgcolor: "#22c55e" }
                      }}
                    >
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
