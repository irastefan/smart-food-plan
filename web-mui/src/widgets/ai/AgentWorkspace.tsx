import { Alert, Box, Chip, CircularProgress, Stack } from "@mui/material";
import { useEffect, useState, type ReactNode } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { isRtlLanguage } from "../../shared/i18n/languages";
import { AiAssistantPanel, type AiAssistantPanelProps, type AiAssistantPanelRenderProps } from "./AiAssistantPanel";

export type AgentWorkspaceProps<TExtra = void> = Omit<AiAssistantPanelProps<TExtra>, "renderTop" | "renderBottom" | "onExtraResult"> & {
  panelKey?: string;
  isLoading?: boolean;
  loadError?: string | null;
  header?: ReactNode;
  quickPrompts?: string[];
  hint?: ReactNode;
  onExtraResult?: (extra: TExtra | undefined) => void;
  renderTemplate?: (props: AiAssistantPanelRenderProps & {
    extra: TExtra | undefined;
    clearExtra: () => void;
  }) => ReactNode;
};

export function AgentWorkspace<TExtra = void>({
  panelKey,
  isLoading = false,
  loadError = null,
  header,
  quickPrompts = [],
  hint,
  onExtraResult,
  renderTemplate,
  ...panelProps
}: AgentWorkspaceProps<TExtra>) {
  const { language } = useLanguage();
  const isRtl = isRtlLanguage(language);
  const [extra, setExtra] = useState<TExtra | undefined>(undefined);

  useEffect(() => {
    setExtra(undefined);
  }, [panelKey]);

  function clearExtra() {
    setExtra(undefined);
    onExtraResult?.(undefined);
  }

  if (isLoading) {
    return (
      <Stack
        dir={isRtl ? "rtl" : "ltr"}
        style={{ direction: isRtl ? "rtl" : "ltr" }}
        alignItems="center"
        justifyContent="center"
        sx={{ py: 8, direction: isRtl ? "rtl" : "ltr" }}
        spacing={2}
      >
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack
      dir={isRtl ? "rtl" : "ltr"}
      style={{ direction: isRtl ? "rtl" : "ltr" }}
      spacing={2}
      sx={{ flex: 1, minHeight: 0, direction: isRtl ? "rtl" : "ltr" }}
    >
      {loadError ? <Alert severity="error">{loadError}</Alert> : null}
      {header ? <Box sx={{ width: "100%", textAlign: "start" }}>{header}</Box> : null}

      <AiAssistantPanel
        key={panelKey}
        {...panelProps}
        onExtraResult={(nextExtra) => {
          setExtra(nextExtra);
          onExtraResult?.(nextExtra);
        }}
        renderTop={
          quickPrompts.length > 0
            ? ({ setDraft, visibleMessages, isSubmitting }) => (
                visibleMessages.length === 0 && !isSubmitting ? (
                  <Stack
                    direction={isRtl ? "row-reverse" : "row"}
                    spacing={0.9}
                    useFlexGap
                    flexWrap="wrap"
                    justifyContent="center"
                    sx={{
                      pb: { xs: 0.5, md: 0.75 },
                      maxWidth: 760,
                      mx: "auto"
                    }}
                  >
                    {quickPrompts.map((prompt) => (
                      <Chip
                        key={prompt}
                        label={prompt}
                        variant="outlined"
                        clickable
                        onClick={() => setDraft(prompt)}
                        sx={{
                          height: { xs: 30, md: 32 },
                          fontSize: { xs: 12, md: 13 }
                        }}
                      />
                    ))}
                  </Stack>
                ) : null
              )
            : undefined
        }
        renderBottom={(props) => (
          <Stack spacing={1.25}>
            {renderTemplate?.({
              ...props,
              extra,
              clearExtra
            })}
            {hint ? <Box sx={{ width: "100%", textAlign: "start" }}>{hint}</Box> : null}
          </Stack>
        )}
      />
    </Stack>
  );
}
