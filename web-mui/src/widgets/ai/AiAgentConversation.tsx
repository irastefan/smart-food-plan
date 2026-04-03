import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PrecisionManufacturingRoundedIcon from "@mui/icons-material/PrecisionManufacturingRounded";
import { Accordion, AccordionDetails, AccordionSummary, Box, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import type { AgentMessage } from "../../features/ai/api/openaiAgentApi";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { isRtlLanguage } from "../../shared/i18n/languages";

type AiAgentConversationProps = {
  messages: AgentMessage[];
  isSubmitting?: boolean;
  activeToolName?: string | null;
  completedToolName?: string | null;
  showToolOutput?: boolean;
};

export function AiAgentConversation({
  messages,
  isSubmitting = false,
  activeToolName = null,
  completedToolName = null,
  showToolOutput = false
}: AiAgentConversationProps) {
  const { t, language } = useLanguage();
  const isRtl = isRtlLanguage(language);

  if (messages.length === 0 && !isSubmitting) {
    return null;
  }

  return (
    <Stack spacing={{ xs: 1, md: 1.5 }} dir={isRtl ? "rtl" : "ltr"} sx={{ direction: isRtl ? "rtl" : "ltr" }}>
      {messages.map((message) => (
        <Stack
          key={message.id}
          direction={isRtl ? "row-reverse" : "row"}
          justifyContent={message.role === "user" ? "flex-end" : "flex-start"}
          alignItems="flex-start"
        >
          {message.role === "tool" ? (
            <Paper
              sx={{
                p: { xs: 1.1, md: 1.25 },
                borderRadius: 1.25,
                border: "1px solid",
                borderColor: "divider",
                width: "100%",
                maxWidth: 560,
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.06)",
                boxShadow: "none"
              }}
            >
              <Stack spacing={1}>
                <Stack direction={isRtl ? "row-reverse" : "row"} spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "success.main",
                      color: "success.contrastText"
                    }}
                  >
                    <CheckCircleRoundedIcon sx={{ fontSize: 16 }} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography fontWeight={700} sx={{ fontSize: 13.5, textAlign: "start" }}>
                      {t("aiAgent.actionDone")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12.5, textAlign: "start" }}>
                      {t("aiAgent.actionDoneHint")}
                    </Typography>
                  </Box>
                </Stack>
                {showToolOutput ? (
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
                          overflowX: "auto",
                          textAlign: "start"
                        }}
                      >
                        {message.text}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ) : null}
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
                  overflowX: "auto",
                  textAlign: "start"
                }}
              >
                {message.text}
              </Box>
              {message.images && message.images.length > 0 ? (
                <Stack direction={isRtl ? "row-reverse" : "row"} spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 0.85 }}>
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
                  color: "text.primary",
                  textAlign: "start"
                }}
              >
                {message.text}
              </Box>
            </Box>
          )}
        </Stack>
      ))}

      {activeToolName ? (
        <Stack direction={isRtl ? "row-reverse" : "row"} justifyContent="flex-start" alignItems="flex-start">
          <Paper
            sx={{
              width: "100%",
              maxWidth: 560,
              overflow: "hidden",
              borderRadius: 1.25,
              border: "1px solid",
              borderColor: "divider",
              backgroundColor: (theme) =>
                theme.palette.mode === "dark" ? "rgba(15,23,42,0.68)" : "rgba(255,255,255,0.96)",
              boxShadow: "none"
            }}
          >
            <Stack spacing={1} sx={{ p: { xs: 1.1, md: 1.25 } }}>
              <Stack direction={isRtl ? "row-reverse" : "row"} spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "primary.main",
                    color: "primary.contrastText"
                  }}
                >
                  <PrecisionManufacturingRoundedIcon sx={{ fontSize: 16 }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography fontWeight={700} sx={{ fontSize: 13.5, textAlign: "start" }}>
                    {t("aiAgent.actionWorking")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12.5, textAlign: "start" }}>
                    {t("aiAgent.actionWorkingHint")}
                  </Typography>
                </Box>
              </Stack>
              <LinearProgress
                color="primary"
                sx={{
                  height: 6,
                  borderRadius: 999,
                  bgcolor: (theme) => theme.palette.action.hover
                }}
              />
            </Stack>
          </Paper>
        </Stack>
      ) : completedToolName ? (
        <Stack direction={isRtl ? "row-reverse" : "row"} justifyContent="flex-start" alignItems="flex-start">
          <Paper
            sx={{
              width: "100%",
              maxWidth: 560,
              overflow: "hidden",
              borderRadius: 1.25,
              border: "1px solid",
              borderColor: "divider",
              backgroundColor: (theme) =>
                theme.palette.mode === "dark" ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.06)",
              boxShadow: "none"
            }}
          >
            <Stack spacing={1} sx={{ p: { xs: 1.1, md: 1.25 } }}>
              <Stack direction={isRtl ? "row-reverse" : "row"} spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "success.main",
                    color: "success.contrastText"
                  }}
                >
                  <CheckCircleRoundedIcon sx={{ fontSize: 16 }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography fontWeight={700} sx={{ fontSize: 13.5, textAlign: "start" }}>
                    {t("aiAgent.actionDone")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12.5, textAlign: "start" }}>
                    {t("aiAgent.actionDoneHint")}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      ) : null}

      {isSubmitting ? (
        <Stack direction={isRtl ? "row-reverse" : "row"} justifyContent="flex-start" alignItems="flex-start">
          <Box
            sx={{
              minHeight: { xs: 28, md: 32 },
              display: "flex",
              alignItems: "center",
              paddingInlineStart: 0.25
            }}
          >
            <Stack direction={isRtl ? "row-reverse" : "row"} spacing={0.6} alignItems="center" sx={{ minWidth: 28 }}>
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
