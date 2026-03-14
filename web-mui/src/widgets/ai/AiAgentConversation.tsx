import { Paper, Stack, Typography } from "@mui/material";
import type { AgentMessage } from "../../features/ai/api/openaiAgentApi";

type AiAgentConversationProps = {
  messages: AgentMessage[];
  emptyTitle: string;
  emptySubtitle: string;
};

export function AiAgentConversation({ messages, emptyTitle, emptySubtitle }: AiAgentConversationProps) {
  if (messages.length === 0) {
    return (
      <Paper sx={{ p: 6, borderRadius: 2, border: "1px dashed", borderColor: "divider", textAlign: "center" }}>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>
          {emptyTitle}
        </Typography>
        <Typography color="text.secondary">{emptySubtitle}</Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      {messages.map((message) => (
        <Paper
          key={message.id}
          sx={{
            p: 2.25,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            ml: message.role === "user" ? { md: 8 } : 0,
            mr: message.role === "assistant" || message.role === "tool" ? { md: 8 } : 0,
            backgroundColor:
              message.role === "user"
                ? "primary.main"
                : message.role === "tool"
                  ? "action.hover"
                  : "background.paper",
            color: message.role === "user" ? "primary.contrastText" : "text.primary"
          }}
        >
          <Stack spacing={1}>
            <Typography variant="caption" sx={{ opacity: 0.8, textTransform: "uppercase", letterSpacing: 0.8 }}>
              {message.role === "tool" ? message.toolName : message.role}
            </Typography>
            <Typography component="pre" sx={{ m: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: message.role === "tool" ? "monospace" : "inherit" }}>
              {message.text}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
