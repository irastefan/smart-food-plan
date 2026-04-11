import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import { Chip, Paper, Stack, Typography } from "@mui/material";
import { useLanguage } from "../../app/providers/LanguageProvider";
import type { AiUsageState } from "../../features/ai/api/aiUsageApi";

type AiUsageSummaryProps = {
  usage: AiUsageState;
  compact?: boolean;
};

function getStatusKey(status: AiUsageState["subscriptionStatus"]) {
  switch (status) {
    case "TRIAL":
      return "aiUsage.status.trial";
    case "ACTIVE":
      return "aiUsage.status.active";
    case "EXPIRED":
      return "aiUsage.status.expired";
    case "FREE":
    default:
      return "aiUsage.status.free";
  }
}

export function AiUsageSummary({ usage, compact = false }: AiUsageSummaryProps) {
  const { t } = useLanguage();
  const statusLabel = t(getStatusKey(usage.subscriptionStatus));
  const planName = usage.currentPlan?.name || t("aiUsage.plan.free");
  const actionsLabel =
    usage.currentPlan?.monthlyAiActions == null
      ? t("aiUsage.actions.unlimited")
      : t("aiUsage.actions.left", { count: Math.max(usage.aiActionsRemaining, 0) });

  if (compact) {
    return (
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ alignItems: "center" }}>
        <Chip
          icon={<WorkspacePremiumRoundedIcon />}
          label={`${planName} · ${statusLabel}`}
          size="small"
          variant="outlined"
          sx={{ borderRadius: 1.5 }}
        />
        <Chip
          icon={<AutoAwesomeRoundedIcon />}
          label={actionsLabel}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ borderRadius: 1.5 }}
        />
      </Stack>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 1.5,
        backgroundColor: "background.paper"
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          <WorkspacePremiumRoundedIcon color="primary" sx={{ fontSize: 20 }} />
          <div>
            <Typography fontWeight={800}>{t("aiUsage.title")}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t("aiUsage.subtitle")}
            </Typography>
          </div>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
          <Chip label={`${t("aiUsage.plan.label")}: ${planName}`} variant="outlined" sx={{ borderRadius: 1.5 }} />
          <Chip label={`${t("aiUsage.status.label")}: ${statusLabel}`} variant="outlined" sx={{ borderRadius: 1.5 }} />
          <Chip label={`${t("aiUsage.actions.label")}: ${actionsLabel}`} color="primary" variant="outlined" sx={{ borderRadius: 1.5 }} />
        </Stack>
      </Stack>
    </Paper>
  );
}
