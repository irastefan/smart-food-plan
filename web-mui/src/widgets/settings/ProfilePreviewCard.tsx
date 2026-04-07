import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import EggAltRoundedIcon from "@mui/icons-material/EggAltRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import OpacityRoundedIcon from "@mui/icons-material/OpacityRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import { Avatar, Paper, Stack, Typography } from "@mui/material";
import type { UserProfile } from "../../features/settings/api/settingsApi";
import { useLanguage } from "../../app/providers/LanguageProvider";

type ProfilePreviewCardProps = {
  profile: UserProfile;
};

export function ProfilePreviewCard({ profile }: ProfilePreviewCardProps) {
  const { t } = useLanguage();
  const selectedFormula = profile.availableTargetFormulas.find((option) => option.value === profile.targetFormula);

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1.25} alignItems="center">
        <AutoGraphRoundedIcon color="primary" />
        <div>
          <Typography variant="h6" fontWeight={800}>{t("settings.profile.preview.title")}</Typography>
          <Typography color="text.secondary">{t("settings.profile.preview.subtitle")}</Typography>
        </div>
      </Stack>

      <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 1.25, bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={2.25}>
          <Stack spacing={0.4}>
            <Typography variant="caption" color="text.secondary">
              {t("settings.profile.preview.formula")}
            </Typography>
            <Typography fontWeight={800}>{selectedFormula?.label ?? "—"}</Typography>
            {selectedFormula?.description ? (
              <Typography variant="body2" color="text.secondary">
                {selectedFormula.description}
              </Typography>
            ) : null}
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} flexWrap="wrap" useFlexGap>
            <MetricPill
              icon={<LocalFireDepartmentRoundedIcon fontSize="small" />}
              label={t("settings.profile.preview.targetCalories")}
              value={profile.targetCalories ? `${Math.round(profile.targetCalories)} kcal` : "—"}
            />
            <MetricPill
              icon={<EggAltRoundedIcon fontSize="small" />}
              label={t("settings.profile.preview.protein")}
              value={profile.targetProteinG ? `${Math.round(profile.targetProteinG)} g` : "—"}
            />
            <MetricPill
              icon={<OpacityRoundedIcon fontSize="small" />}
              label={t("settings.profile.preview.fat")}
              value={profile.targetFatG ? `${Math.round(profile.targetFatG)} g` : "—"}
            />
            <MetricPill
              icon={<RestaurantRoundedIcon fontSize="small" />}
              label={t("settings.profile.preview.carbs")}
              value={profile.targetCarbsG ? `${Math.round(profile.targetCarbsG)} g` : "—"}
            />
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}

function MetricPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{
        minWidth: { xs: "100%", sm: 210 },
        px: 1.35,
        py: 1.15,
        borderRadius: 1.25,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider"
      }}
    >
      <Avatar sx={{ width: 30, height: 30, bgcolor: "action.hover", color: "primary.main" }}>
        {icon}
      </Avatar>
      <Stack spacing={0.15}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography fontWeight={800}>{value}</Typography>
      </Stack>
    </Stack>
  );
}
