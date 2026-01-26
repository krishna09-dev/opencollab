import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { savePreferences } from "../api/onboardingApi";

export function useOnboarding() {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["JavaScript", "React"]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(["Frontend / UI", "Backend / APIs"]);
  const [experienceLevel, setExperienceLevel] = useState("beginner");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const toggleLanguage = (label: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const toggleArea = (label: string) => {
    setSelectedAreas((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await savePreferences({
        preferredLanguages: selectedLanguages,
        experienceLevel,
        areasOfInterest: selectedAreas
      });
      navigate("/feed", { replace: true });
    } catch (err) {
      console.error(err);
      alert("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return {
    selectedLanguages,
    selectedAreas,
    experienceLevel,
    saving,
    setExperienceLevel,
    toggleLanguage,
    toggleArea,
    handleSubmit
  };
}
