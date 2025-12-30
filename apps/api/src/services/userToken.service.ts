
//If  User model uses a different field name for GitHub token, tell me that name and I’ll adjust this file.

import { User } from "../models/User";

export async function getGithubTokenForUser(userId: string): Promise<string | null> {
  // IMPORTANT:
  // OAuth flow should store githubAccessToken in User model.
  // Example field names: githubAccessToken, githubToken, accessToken, etc.
  const user = await User.findById(userId).select("githubAccessToken githubToken").lean();

  const token = (user as any)?.githubAccessToken || (user as any)?.githubToken;
  return typeof token === "string" && token.length > 0 ? token : null;
}