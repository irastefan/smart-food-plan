import { Box, Stack } from "@mui/material";
import type { ReactNode } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
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
  const { t } = useLanguage();

  return (
    <PageAssistantDialogShell open={open} onClose={onClose} title={t("aiAgent.title")}>
      <Stack sx={{ height: "100%" }}>
        <Box sx={{ flex: 1, overflow: "auto", px: { xs: 2, md: 0 }, py: 2 }}>
          <Stack spacing={2} sx={{ maxWidth: 980, mx: "auto", height: "100%" }}>
            {outerHeader}
            <AgentWorkspace {...workspaceProps} />
          </Stack>
        </Box>
      </Stack>
    </PageAssistantDialogShell>
  );
}
