import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";

export type SettingsSectionId = "profile" | "general" | "openai";

export const settingsSections: Array<{
  id: SettingsSectionId;
  icon: typeof PersonRoundedIcon;
  labelKey: string;
  descriptionKey: string;
}> = [
  {
    id: "general",
    icon: TuneRoundedIcon,
    labelKey: "settings.sections.general.title",
    descriptionKey: "settings.sections.general.subtitle"
  },
  {
    id: "profile",
    icon: PersonRoundedIcon,
    labelKey: "settings.sections.profile.title",
    descriptionKey: "settings.sections.profile.subtitle"
  },
  {
    id: "openai",
    icon: SmartToyRoundedIcon,
    labelKey: "settings.sections.openai.title",
    descriptionKey: "settings.sections.openai.subtitle"
  }
];

export function isSettingsSectionId(value: string | null): value is SettingsSectionId {
  return settingsSections.some((item) => item.id === value);
}
