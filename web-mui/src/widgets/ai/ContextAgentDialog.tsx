import { Box, Stack } from "@mui/material";
import type { ReactNode } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { isRtlLanguage } from "../../shared/i18n/languages";
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

  return (
    <PageAssistantDialogShell open={open} onClose={onClose} title={t("aiAgent.title")}>
      <Stack dir={isRtl ? "rtl" : "ltr"} sx={{ height: "100%", direction: isRtl ? "rtl" : "ltr" }}>
        <Box sx={{ flex: 1, overflow: "auto", px: { xs: 2, md: 0 }, py: 2, direction: isRtl ? "rtl" : "ltr" }}>
          <Stack spacing={2} sx={{ maxWidth: 980, mx: "auto", height: "100%" }}>
            {outerHeader}
            <AgentWorkspace {...workspaceProps} />
          </Stack>
        </Box>
      </Stack>
    </PageAssistantDialogShell>
  );
}
