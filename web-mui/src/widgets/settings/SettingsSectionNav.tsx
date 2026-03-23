import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import TrackChangesRoundedIcon from "@mui/icons-material/TrackChangesRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import { ButtonBase, Paper, Stack, Typography } from "@mui/material";
import { useLanguage } from "../../app/providers/LanguageProvider";

export type SettingsSectionId = "profile" | "targets" | "general" | "openai";

type SettingsSectionNavProps = {
  value: SettingsSectionId;
  onChange: (value: SettingsSectionId) => void;
};

const items: Array<{ id: SettingsSectionId; icon: typeof PersonRoundedIcon; labelKey: string; descriptionKey: string }> = [
  {
    id: "profile",
    icon: PersonRoundedIcon,
    labelKey: "settings.sections.profile.title",
    descriptionKey: "settings.sections.profile.subtitle"
  },
  {
    id: "targets",
    icon: TrackChangesRoundedIcon,
    labelKey: "settings.sections.targets.title",
    descriptionKey: "settings.sections.targets.subtitle"
  },
  {
    id: "general",
    icon: TuneRoundedIcon,
    labelKey: "settings.sections.general.title",
    descriptionKey: "settings.sections.general.subtitle"
  },
  {
    id: "openai",
    icon: KeyRoundedIcon,
    labelKey: "settings.sections.openai.title",
    descriptionKey: "settings.sections.openai.subtitle"
  }
];

export function SettingsSectionNav({ value, onChange }: SettingsSectionNavProps) {
  const { t } = useLanguage();

  return (
    <Paper sx={{ p: 1.25, borderRadius: 1.25, border: "1px solid", borderColor: "divider" }}>
      <Stack spacing={1}>
        {items.map((item) => {
          const Icon = item.icon;
          const selected = item.id === value;

          return (
            <ButtonBase
              key={item.id}
              onClick={() => onChange(item.id)}
              sx={{
                width: "100%",
                textAlign: "left",
                borderRadius: 1.25,
                p: 1.5,
                justifyContent: "flex-start",
                border: "1px solid",
                borderColor: selected ? "primary.main" : "divider",
                backgroundColor: selected ? "action.selected" : "transparent"
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Icon color={selected ? "primary" : "inherit"} fontSize="small" />
                <Stack spacing={0.25}>
                  <Typography fontWeight={800}>{t(item.labelKey as never)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t(item.descriptionKey as never)}
                  </Typography>
                </Stack>
              </Stack>
            </ButtonBase>
          );
        })}
      </Stack>
    </Paper>
  );
}
