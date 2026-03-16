import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Accordion, AccordionDetails, AccordionSummary, Chip, Paper, Stack, Typography } from "@mui/material";
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

        <Accordion
          disableGutters
          elevation={0}
          defaultExpanded={false}
          sx={{ background: "transparent", boxShadow: "none", "&::before": { display: "none" } }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreRoundedIcon />}
            sx={{ px: 0, minHeight: 36, "& .MuiAccordionSummary-content": { my: 0 } }}
          >
            <Typography variant="body2" fontWeight={700}>
              {tools.length} tools
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0, pt: 0.5, pb: 0 }}>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {tools.map((tool) => (
                <Chip key={tool.name} label={tool.name} size="small" variant="outlined" />
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Paper>
  );
}
