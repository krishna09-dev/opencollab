import { Box, Typography } from "@mui/material";
import type { ResourceItem } from "../types";
import ResourceCard from "./ResourceCard";

type Props = {
  items: ResourceItem[];
  emptyText: string;
  columns?: { xs: number; md: number };
};

export function ResourceGrid({ items, emptyText, columns = { xs: 1, md: 3 } }: Props) {
  if (!items.length) {
    return (
      <Box sx={{ py: 6 }}>
        <Typography sx={{ color: "#9ca3af", fontWeight: 700 }}>{emptyText}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: `repeat(${columns.xs}, minmax(0, 1fr))`,
          md: `repeat(${columns.md}, minmax(0, 1fr))`
        }
      }}
    >
      {items.map((item) => (
        <ResourceCard key={item.id} item={item} />
      ))}
    </Box>
  );
}