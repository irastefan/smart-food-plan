import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Accordion, AccordionDetails, AccordionSummary, Box, Paper, Stack, Typography } from "@mui/material";
import type { AgentMessage } from "../../features/ai/api/openaiAgentApi";
import { useLanguage } from "../../app/providers/LanguageProvider";

type AiAgentConversationProps = {
  messages: AgentMessage[];
  isSubmitting?: boolean;
};

export function AiAgentConversation({ messages, isSubmitting = false }: AiAgentConversationProps) {
  const { t } = useLanguage();

  if (messages.length === 0 && !isSubmitting) {
    return null;
  }

  return (
    <Stack spacing={{ xs: 1, md: 1.5 }}>
      {messages.map((message) => (
        <Stack
          key={message.id}
          direction="row"
          justifyContent={message.role === "user" ? "flex-end" : "flex-start"}
          alignItems="flex-start"
        >
          {message.role === "tool" ? (
            <Paper
              sx={{
                p: { xs: 1.2, md: 1.5 },
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
                width: "100%",
                maxWidth: 820,
                background: (theme) => theme.palette.action.hover
              }}
            >
              <Stack spacing={0.75}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <Typography variant="caption" sx={{ opacity: 0.78, textTransform: "uppercase", letterSpacing: 0.7, fontWeight: 800, fontSize: 11 }}>
                    {message.toolName}
                  </Typography>
                </Stack>
                <Accordion
                  disableGutters
                  elevation={0}
                  defaultExpanded={false}
                  sx={{
                    background: "transparent",
                    boxShadow: "none",
                    "&::before": { display: "none" }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreRoundedIcon />}
                    sx={{
                      minHeight: 32,
                      px: 0,
                      "& .MuiAccordionSummary-content": {
                        my: 0,
                        alignItems: "center"
                      }
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {t("aiAgent.toolOutput")}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 0, pt: 0.5, pb: 0 }}>
                    <Box
                      component="pre"
                    sx={{
                      m: 0,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                      fontSize: { xs: 12, md: 13 },
                      lineHeight: 1.55,
                      overflowX: "auto"
                    }}
                  >
                      {message.text}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Stack>
            </Paper>
          ) : message.role === "user" ? (
            <Box
              sx={{
                mx: { xs: 0.5, md: 0.75 },
                px: { xs: 1.3, md: 1.45 },
                py: { xs: 1.05, md: 1.15 },
                borderRadius: 1.1,
                maxWidth: 720,
                background: (theme) =>
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(16,185,129,0.34), rgba(16,185,129,0.22))"
                    : "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.14))",
                color: "text.primary"
              }}
            >
              <Box
                component="pre"
                sx={{
                  m: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "inherit",
                  fontSize: { xs: 13.5, md: 14.5 },
                  lineHeight: 1.5,
                  overflowX: "auto"
                }}
              >
                {message.text}
              </Box>
              {message.images && message.images.length > 0 ? (
                <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 0.85 }}>
                  {message.images.map((image) => (
                    <Box
                      key={`${message.id}-${image.name}`}
                      component="img"
                      src={image.dataUrl}
                      alt={image.name}
                      sx={{
                        width: 72,
                        height: 72,
                        objectFit: "cover",
                        borderRadius: 1,
                        display: "block",
                        border: "1px solid",
                        borderColor: "rgba(255,255,255,0.14)"
                      }}
                    />
                  ))}
                </Stack>
              ) : null}
            </Box>
          ) : (
            <Box
              sx={{
                width: "100%",
                maxWidth: 760,
                pt: 0.15
              }}
            >
              <Box
                component="pre"
                sx={{
                  m: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "inherit",
                  fontSize: { xs: 14, md: 15 },
                  lineHeight: 1.7,
                  overflowX: "auto",
                  color: "text.primary"
                }}
              >
                {message.text}
              </Box>
            </Box>
          )}
        </Stack>
      ))}

      {isSubmitting ? (
        <Stack direction="row" justifyContent="flex-start" alignItems="flex-start">
          <Box
            sx={{
              minHeight: { xs: 28, md: 32 },
              display: "flex",
              alignItems: "center",
              pl: 0.25
            }}
          >
            <Stack direction="row" spacing={0.6} alignItems="center" sx={{ minWidth: 28 }}>
              {[0, 1, 2].map((index) => (
                <Box
                  key={index}
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    backgroundColor: "text.secondary",
                    opacity: 0.35,
                    animation: "aiTyping 1.2s infinite ease-in-out",
                    animationDelay: `${index * 0.18}s`,
                    "@keyframes aiTyping": {
                      "0%, 80%, 100%": {
                        transform: "translateY(0)",
                        opacity: 0.28
                      },
                      "40%": {
                        transform: "translateY(-4px)",
                        opacity: 1
                      }
                    }
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Stack>
      ) : null}
    </Stack>
  );
}
