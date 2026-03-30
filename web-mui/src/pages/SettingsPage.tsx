import { Alert, CircularProgress, Grid, Paper, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useLanguage } from "../app/providers/LanguageProvider";
import {
  getCurrentUserSettings,
  recalculateUserProfile,
  saveUserProfile,
  type UserProfile
} from "../features/settings/api/settingsApi";
import { getAiAgentSettings, setAiAgentSettings, type AiAgentSettings } from "../shared/config/aiAgent";
import { getAppPreferences, setAppPreferences, type AppPreferences } from "../shared/config/appPreferences";
import { getOpenAiApiKey, setOpenAiApiKey } from "../shared/config/openai";
import { PageTitle } from "../shared/ui/PageTitle";
import { DashboardTopbar } from "../widgets/dashboard/DashboardTopbar";
import { AiAgentSettingsCard } from "../widgets/settings/AiAgentSettingsCard";
import { AppPreferencesCard } from "../widgets/settings/AppPreferencesCard";
import { OpenAiApiKeyCard } from "../widgets/settings/OpenAiApiKeyCard";
import { ProfilePreviewCard } from "../widgets/settings/ProfilePreviewCard";
import { SettingsSectionCard } from "../widgets/settings/SettingsSectionCard";
import { SettingsSectionNav, type SettingsSectionId } from "../widgets/settings/SettingsSectionNav";
import { UserProfileForm } from "../widgets/settings/UserProfileForm";

type LayoutContext = {
  openSidebar: () => void;
  collapsed: boolean;
  registerPageLoading: (value: boolean) => void;
  clearPageLoading: () => void;
};

export function SettingsPage() {
  const { t } = useLanguage();
  const { openSidebar, registerPageLoading, clearPageLoading } = useOutletContext<LayoutContext>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [openAiApiKey, setOpenAiApiKeyState] = useState("");
  const [agentSettings, setAgentSettingsState] = useState<AiAgentSettings>(getAiAgentSettings());
  const [appPreferences, setAppPreferencesState] = useState<AppPreferences>(getAppPreferences());
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "error" | "success" | "info"; message: string } | null>(null);

  function mergeProfileFormulas(nextProfile: UserProfile, fallbackProfile: UserProfile | null): UserProfile {
    if (nextProfile.availableTargetFormulas.length > 0) {
      return nextProfile;
    }

    return {
      ...nextProfile,
      targetFormula: nextProfile.targetFormula || fallbackProfile?.targetFormula || "",
      availableTargetFormulas: fallbackProfile?.availableTargetFormulas ?? []
    };
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setStatus(null);
        const current = await getCurrentUserSettings();
        if (!cancelled) {
          setProfile(mergeProfileFormulas(current.profile, null));
          setOpenAiApiKeyState(getOpenAiApiKey());
          setAgentSettingsState(getAiAgentSettings());
          setAppPreferencesState(getAppPreferences());
        }
      } catch (error) {
        console.error("Failed to load settings", error);
        if (!cancelled) {
          setStatus({ type: "error", message: t("settings.status.loadError") });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    registerPageLoading(isLoading);
    return () => {
      clearPageLoading();
    };
  }, [clearPageLoading, isLoading, registerPageLoading]);

  async function handleSave() {
    if (!profile) {
      return;
    }
    try {
      setIsSubmitting(true);
      const saved = await saveUserProfile(profile);
      setProfile((current) => mergeProfileFormulas(saved, current));
      setStatus({ type: "success", message: t("settings.status.saved") });
    } catch (error) {
      console.error("Failed to save profile", error);
      setStatus({ type: "error", message: t("settings.status.saveError") });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRecalculate() {
    try {
      setIsSubmitting(true);
      const recalculated = await recalculateUserProfile();
      setProfile((current) => mergeProfileFormulas(recalculated, current));
      setStatus({ type: "success", message: t("settings.status.recalculated") });
    } catch (error) {
      console.error("Failed to recalculate profile", error);
      setStatus({ type: "error", message: t("settings.status.recalculateError") });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSaveOpenAiApiKey(value: string) {
    setOpenAiApiKey(value);
    setOpenAiApiKeyState(value.trim());
    setStatus({ type: "success", message: t("settings.openai.saved") });
  }

  function handleSaveAgentSettings(value: AiAgentSettings) {
    setAiAgentSettings(value);
    setAgentSettingsState(value);
    setStatus({ type: "success", message: t("settings.agent.saved") });
  }

  function handleSavePreferences(value: AppPreferences) {
    setAppPreferences(value);
    setAppPreferencesState(value);
    setStatus({ type: "success", message: t("settings.preferences.saved") });
  }

  if (isLoading) {
    return (
      <Paper sx={{ p: 8, borderRadius: 1.25, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      <DashboardTopbar onOpenSidebar={openSidebar} title={t("settings.title")} subtitle={t("settings.subtitle")} />
      <PageTitle title={t("settings.title")} />

      {status ? <Alert severity={status.type}>{status.message}</Alert> : null}

      {profile ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, xl: 3 }}>
            <SettingsSectionNav value={activeSection} onChange={setActiveSection} />
          </Grid>
          <Grid size={{ xs: 12, xl: 9 }}>
            <Stack spacing={3}>
              {activeSection === "profile" ? (
                <SettingsSectionCard
                  title={t("settings.sections.profile.title")}
                  subtitle={t("settings.sections.profile.subtitle")}
                >
                  <UserProfileForm
                    value={profile}
                    isSubmitting={isSubmitting}
                    status={null}
                    onChange={setProfile}
                    onSave={handleSave}
                    onRecalculate={handleRecalculate}
                  />
                </SettingsSectionCard>
              ) : null}

              {activeSection === "targets" ? (
                <SettingsSectionCard
                  title={t("settings.sections.targets.title")}
                  subtitle={t("settings.sections.targets.subtitle")}
                >
                  <ProfilePreviewCard profile={profile} />
                </SettingsSectionCard>
              ) : null}

              {activeSection === "general" ? (
                <SettingsSectionCard
                  title={t("settings.sections.general.title")}
                  subtitle={t("settings.sections.general.subtitle")}
                >
                  <AppPreferencesCard
                    value={appPreferences}
                    isSubmitting={isSubmitting}
                    onSave={handleSavePreferences}
                  />
                </SettingsSectionCard>
              ) : null}

              {activeSection === "openai" ? (
                <SettingsSectionCard
                  title={t("settings.sections.openai.title")}
                  subtitle={t("settings.sections.openai.subtitle")}
                >
                  <Stack spacing={4}>
                    <OpenAiApiKeyCard value={openAiApiKey} isSubmitting={isSubmitting} onSave={handleSaveOpenAiApiKey} />
                    <AiAgentSettingsCard value={agentSettings} isSubmitting={isSubmitting} onSave={handleSaveAgentSettings} />
                  </Stack>
                </SettingsSectionCard>
              ) : null}
            </Stack>
          </Grid>
        </Grid>
      ) : null}
    </Stack>
  );
}
