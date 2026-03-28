import { api, authHeaders } from "../../../lib/api";

export async function savePreferences(data: {
  preferredLanguages: string[];
  experienceLevel: string;
  areasOfInterest: string[];
}) {
  await api.put("/api/me/preferences", data, { headers: authHeaders() });
}
