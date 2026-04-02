import { Avatar, Box, Stack, Typography } from "@mui/material";
import type { UserProfile } from "../types";

interface ProfileHeaderProps {
  profile: UserProfile;
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
      })
    : "Unknown";

  return (
    <Box
      sx={{
        borderRadius: 3,
        border: "1px solid #27272a",
        bgcolor: "rgba(10,10,14,0.62)",
        p: { xs: 3, md: 4 },
        mb: 3
      }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ xs: "center", sm: "flex-start" }}>
        <Avatar
          src={profile.avatarUrl}
          alt={profile.login}
          sx={{
            width: 96,
            height: 96,
            border: "3px solid #27272a"
          }}
        />

        <Stack spacing={1} sx={{ textAlign: { xs: "center", sm: "left" } }}>
          <Typography
            sx={{
              fontSize: 28,
              fontWeight: 800,
              color: "#fff"
            }}
          >
            @{profile.login}
          </Typography>

          {profile.email && (
            <Typography
              sx={{
                fontSize: 15,
                color: "#a1a1aa"
              }}
            >
              {profile.email}
            </Typography>
          )}

          <Typography
            sx={{
              fontSize: 13,
              color: "rgba(161,161,170,0.7)",
              mt: 0.5
            }}
          >
            Member since {memberSince}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
