import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import TerminalRoundedIcon from "@mui/icons-material/TerminalRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Accordion, AccordionDetails, AccordionSummary, Avatar, Box, Paper, Stack, Typography } from "@mui/material";
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
          spacing={{ xs: 0.75, md: 1 }}
          justifyContent={message.role === "user" ? "flex-end" : "flex-start"}
          alignItems="flex-start"
        >
          {message.role !== "user" ? (
            <Avatar
              sx={{
                width: { xs: 28, md: 32 },
                height: { xs: 28, md: 32 },
                bgcolor: message.role === "tool" ? "action.selected" : "primary.main",
                color: message.role === "tool" ? "text.primary" : "primary.contrastText",
                mt: 0.25
              }}
            >
              {message.role === "assistant" ? <SmartToyRoundedIcon sx={{ fontSize: 16 }} /> : <TerminalRoundedIcon sx={{ fontSize: 16 }} />}
            </Avatar>
          ) : null}

          <Paper
            sx={{
              p: { xs: 1.2, md: 1.5 },
              borderRadius: 1,
              border: "1px solid",
              borderColor: message.role === "user" ? "rgba(4, 120, 87, 0.35)" : "divider",
              width: "100%",
              maxWidth: message.role === "tool" ? 820 : 720,
              background: (theme) =>
                message.role === "user"
                  ? theme.palette.mode === "dark"
                    ? "linear-gradient(90deg, rgba(16,185,129,0.22), rgba(16,185,129,0.12))"
                    : "linear-gradient(90deg, rgba(16,185,129,0.16), rgba(16,185,129,0.08))"
                  : message.role === "tool"
                    ? theme.palette.action.hover
                    : theme.palette.background.paper,
              color: message.role === "user" ? "text.primary" : "text.primary"
            }}
          >
            <Stack spacing={0.75}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Typography variant="caption" sx={{ opacity: 0.78, textTransform: "uppercase", letterSpacing: 0.7, fontWeight: 800, fontSize: 11 }}>
                  {message.role === "tool" ? message.toolName : message.role}
                </Typography>
                {message.role === "user" ? (
                  <Avatar sx={{ width: 24, height: 24, bgcolor: "rgba(255,255,255,0.18)", color: "#ffffff" }}>
                    <PersonRoundedIcon sx={{ fontSize: 14 }} />
                  </Avatar>
                ) : null}
              </Stack>

              {message.role === "tool" ? (
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
              ) : (
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontFamily: "inherit",
                    fontSize: { xs: 14, md: 15 },
                    lineHeight: 1.55,
                    overflowX: "auto"
                  }}
                >
                  {message.text}
                </Box>
              )}
            </Stack>
          </Paper>

          {message.role === "user" ? (
            <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(16,185,129,0.9)", color: "#ffffff", mt: 0.5 }}>
              <PersonRoundedIcon sx={{ fontSize: 18 }} />
            </Avatar>
          ) : null}
        </Stack>
      ))}

      {isSubmitting ? (
        <Stack direction="row" spacing={{ xs: 0.75, md: 1 }} justifyContent="flex-start" alignItems="flex-start">
          <Avatar sx={{ width: { xs: 28, md: 32 }, height: { xs: 28, md: 32 }, bgcolor: "primary.main", color: "primary.contrastText", mt: 0.25 }}>
            <SmartToyRoundedIcon sx={{ fontSize: 16 }} />
          </Avatar>
          <Paper
            sx={{
              p: { xs: 1.1, md: 1.4 },
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              width: "100%",
              maxWidth: 260,
              backgroundColor: "background.paper"
            }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
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
              <Typography color="text.secondary">{t("aiAgent.loadingResponse")}</Typography>
            </Stack>
          </Paper>
        </Stack>
      ) : null}
    </Stack>
  );
}
