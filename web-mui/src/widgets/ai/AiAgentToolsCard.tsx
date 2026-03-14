import { Chip, Paper, Stack, Typography } from "@mui/material";
import type { McpTool } from "../../features/ai/api/mcpApi";

type AiAgentToolsCardProps = {
  title: string;
  subtitle: string;
  tools: McpTool[];
};

export function AiAgentToolsCard({ title, subtitle, tools }: AiAgentToolsCardProps) {
  return (
    <Paper
      sx={{
        p: 2.5,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper"
      }}
    >
      <Stack spacing={2}>
        <div>
          <Typography variant="h6" fontWeight={800}>{title}</Typography>
          <Typography color="text.secondary">{subtitle}</Typography>
        </div>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {tools.map((tool) => (
            <Chip key={tool.name} label={tool.name} size="small" variant="outlined" />
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}
