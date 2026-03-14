import { Stack, Typography } from "@mui/material";
import type { UserProfile } from "../../features/settings/api/settingsApi";
import { useLanguage } from "../../app/providers/LanguageProvider";

type ProfilePreviewCardProps = {
  profile: UserProfile;
};

export function ProfilePreviewCard({ profile }: ProfilePreviewCardProps) {
  const { t } = useLanguage();

  const items = [
    { label: t("settings.profile.preview.targetCalories"), value: profile.targetCalories ? `${Math.round(profile.targetCalories)} kcal` : "—" },
    { label: t("settings.profile.preview.protein"), value: profile.targetProteinG ? `${Math.round(profile.targetProteinG)} g` : "—" },
    { label: t("settings.profile.preview.fat"), value: profile.targetFatG ? `${Math.round(profile.targetFatG)} g` : "—" },
    { label: t("settings.profile.preview.carbs"), value: profile.targetCarbsG ? `${Math.round(profile.targetCarbsG)} g` : "—" }
  ];

  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight={800}>{t("settings.profile.preview.title")}</Typography>
      {items.map((item) => (
        <Stack key={item.label} direction="row" justifyContent="space-between" spacing={2}>
          <Typography color="text.secondary">{item.label}</Typography>
          <Typography fontWeight={700} textAlign="right">{item.value}</Typography>
        </Stack>
      ))}
    </Stack>
  );
}
