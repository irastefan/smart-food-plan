import { Box, Stack } from "@mui/material";
import { useEffect, useState, type ReactNode } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { getAiUsage, getCachedAiUsage, type AiUsageState } from "../../features/ai/api/aiUsageApi";
import { isRtlLanguage } from "../../shared/i18n/languages";
import { AiUsageSummary } from "./AiUsageSummary";
import { AgentWorkspace, type AgentWorkspaceProps } from "./AgentWorkspace";
import { PageAssistantDialogShell } from "./PageAssistantDialogShell";

type ContextAgentDialogProps<TExtra = void> = AgentWorkspaceProps<TExtra> & {
  open: boolean;
  onClose: () => void;
  outerHeader?: ReactNode;
};

export function ContextAgentDialog<TExtra = void>({
  open,
  onClose,
  outerHeader,
  ...workspaceProps
}: ContextAgentDialogProps<TExtra>) {
  const { t, language } = useLanguage();
  const isRtl = isRtlLanguage(language);
  const [usage, setUsage] = useState<AiUsageState | null>(getCachedAiUsage());

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadUsage() {
      try {
        const nextUsage = await getAiUsage();
        if (!cancelled) {
          setUsage(nextUsage);
        }
      } catch (error) {
        console.error("Failed to load AI usage", error);
      }
    }

    void loadUsage();

    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <PageAssistantDialogShell open={open} onClose={onClose} title={t("aiAgent.title")}>
      <Stack dir={isRtl ? "rtl" : "ltr"} style={{ direction: isRtl ? "rtl" : "ltr" }} sx={{ height: "100%", direction: isRtl ? "rtl" : "ltr" }}>
        <Box
          style={{ direction: isRtl ? "rtl" : "ltr" }}
          sx={{ flex: 1, overflow: "auto", px: { xs: 2, md: 0 }, py: 2, direction: isRtl ? "rtl" : "ltr" }}
        >
          <Stack spacing={2} style={{ direction: isRtl ? "rtl" : "ltr" }} sx={{ maxWidth: 980, mx: "auto", height: "100%" }}>
            {usage ? <AiUsageSummary usage={usage} compact /> : null}
            {outerHeader}
            <AgentWorkspace {...workspaceProps} />
          </Stack>
        </Box>
      </Stack>
    </PageAssistantDialogShell>
  );
}
