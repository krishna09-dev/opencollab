import { useState, useEffect, useCallback } from "react";
import type {
  UserProfile,
  UpdateProfileData,
  GitHubStats,
  ContributionData,
  ContributionSource,
  ProfileActivityItem
} from "../types";
import {
  fetchProfile,
  updateProfile,
  fetchGitHubStats,
  fetchContributions,
  fetchRecentActivities
} from "../api/profileApi";

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // GitHub stats state
  const [githubStats, setGithubStats] = useState<GitHubStats | null>(null);
  const [githubStatsLoading, setGithubStatsLoading] = useState(true);
  const [githubStatsError, setGithubStatsError] = useState<string | null>(null);

  // Contribution graph state
  const [contributionSource, setContributionSource] = useState<ContributionSource>("open-collab");
  const [contributions, setContributions] = useState<ContributionData | null>(null);
  const [contributionsLoading, setContributionsLoading] = useState(true);
  const [contributionsError, setContributionsError] = useState<string | null>(null);

  // Recent activities state
  const [activities, setActivities] = useState<ProfileActivityItem[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  // Load profile on mount
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await fetchProfile();
        if (!mounted) return;
        
        setProfile(data);
        setEmail(data.email || "");
        setSelectedLanguages(data.preferredLanguages || []);
        setExperienceLevel(data.experienceLevel || "beginner");
        setSelectedAreas(data.areasOfInterest || []);
      } catch (err) {
        if (mounted) {
          setError("Failed to load profile");
          console.error("Profile load error:", err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  // Load GitHub stats
  useEffect(() => {
    let mounted = true;

    async function loadGitHubStats() {
      try {
        const data = await fetchGitHubStats();
        if (mounted) setGithubStats(data);
      } catch (err) {
        if (mounted) {
          setGithubStatsError("Failed to load GitHub stats");
          console.error("GitHub stats error:", err);
        }
      } finally {
        if (mounted) setGithubStatsLoading(false);
      }
    }

    loadGitHubStats();
    return () => { mounted = false; };
  }, []);

  // Load contribution data
  useEffect(() => {
    let mounted = true;

    async function loadContributions() {
      if (mounted) {
        setContributionsLoading(true);
        setContributionsError(null);
      }

      try {
        const data = await fetchContributions(contributionSource);
        if (mounted) setContributions(data);
      } catch (err: any) {
        if (mounted) {
          const apiMessage = err?.response?.data?.message as string | undefined;
          setContributionsError(apiMessage || "Failed to load contributions");
          console.error("Contributions error:", err);
        }
      } finally {
        if (mounted) setContributionsLoading(false);
      }
    }

    loadContributions();
    return () => { mounted = false; };
  }, [contributionSource]);

  // Load recent activity timeline
  useEffect(() => {
    let mounted = true;

    async function loadActivities() {
      try {
        const data = await fetchRecentActivities(5);
        if (mounted) setActivities(data);
      } catch (err) {
        if (mounted) {
          setActivitiesError("Failed to load recent activity");
          console.error("Recent activity error:", err);
        }
      } finally {
        if (mounted) setActivitiesLoading(false);
      }
    }

    loadActivities();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleLanguage = useCallback((label: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  }, []);

  const toggleArea = useCallback((label: string) => {
    setSelectedAreas((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updateData: UpdateProfileData = {
        email: email || undefined,
        preferredLanguages: selectedLanguages,
        experienceLevel,
        areasOfInterest: selectedAreas
      };

      const updated = await updateProfile(updateData);
      setProfile(updated);
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Failed to save profile");
      console.error("Profile save error:", err);
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    loading,
    saving,
    error,
    success,
    email,
    setEmail,
    selectedLanguages,
    selectedAreas,
    experienceLevel,
    setExperienceLevel,
    toggleLanguage,
    toggleArea,
    handleSubmit,
    // GitHub data
    githubStats,
    githubStatsLoading,
    githubStatsError,
    contributionSource,
    setContributionSource,
    contributions,
    contributionsLoading,
    contributionsError,
    activities,
    activitiesLoading,
    activitiesError
  };
}
