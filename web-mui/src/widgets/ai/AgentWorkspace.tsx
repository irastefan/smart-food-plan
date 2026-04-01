import { Alert, Box, Chip, CircularProgress, Stack } from "@mui/material";
import { useEffect, useState, type ReactNode } from "react";
import { AiAssistantPanel, type AiAssistantPanelProps, type AiAssistantPanelRenderProps } from "./AiAssistantPanel";

type AgentWorkspaceProps<TExtra = void> = Omit<AiAssistantPanelProps<TExtra>, "renderTop" | "renderBottom" | "onExtraResult"> & {
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
      <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }} spacing={2}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
      {loadError ? <Alert severity="error">{loadError}</Alert> : null}
      {header ? <Box>{header}</Box> : null}

      <AiAssistantPanel
        key={panelKey}
        {...panelProps}
        onExtraResult={(nextExtra) => {
          setExtra(nextExtra);
          onExtraResult?.(nextExtra);
        }}
        renderTop={
          quickPrompts.length > 0
            ? ({ setDraft }) => (
                <Stack
                  direction="row"
                  spacing={0.75}
                  sx={{
                    overflowX: "auto",
                    overflowY: "hidden",
                    flexWrap: "nowrap",
                    pb: 0.25,
                    scrollSnapType: "x proximity",
                    WebkitOverflowScrolling: "touch",
                    "&::-webkit-scrollbar": {
                      display: "none"
                    },
                    scrollbarWidth: "none"
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
                        height: { xs: 28, md: 30 },
                        fontSize: { xs: 12, md: 13 },
                        flexShrink: 0,
                        scrollSnapAlign: "start"
                      }}
                    />
                  ))}
                </Stack>
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
            {hint ? <Box>{hint}</Box> : null}
          </Stack>
        )}
      />
    </Stack>
  );
}
