import { Box, Card, CardContent, CircularProgress, Divider, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";

type MealPlanSummaryCardProps = {
  title: string;
  completion: number;
  completionLabel: string;
  proteinLabel: string;
  fatLabel: string;
  carbsLabel: string;
  proteinValue: number;
  fatValue: number;
  carbsValue: number;
};

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function MealPlanSummaryCard({
  title,
  completion,
  completionLabel,
  proteinLabel,
  fatLabel,
  carbsLabel,
  proteinValue,
  fatValue,
  carbsValue
}: MealPlanSummaryCardProps) {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" mb={2}>
          {title}
        </Typography>
        <Stack alignItems="center" spacing={2}>
          <Box sx={{ position: "relative", display: "inline-flex" }}>
            <CircularProgress
              variant="determinate"
              value={completion}
              size={160}
              thickness={4}
              sx={{
                color: "primary.main",
                "& .MuiCircularProgress-circle": {
                  strokeLinecap: "round"
                }
              }}
            />
            <Box
              sx={{
                inset: 0,
                position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Box textAlign="center">
                <Typography variant="h4">{completion}%</Typography>
                <Typography variant="body2" color="text.secondary">
                  {completionLabel}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider flexItem />

          <List disablePadding sx={{ width: "100%" }}>
            <ListItem disableGutters secondaryAction={<Typography fontWeight={800}>{formatNumber(proteinValue)} g</Typography>}>
              <ListItemText primary={proteinLabel} />
            </ListItem>
            <ListItem disableGutters secondaryAction={<Typography fontWeight={800}>{formatNumber(fatValue)} g</Typography>}>
              <ListItemText primary={fatLabel} />
            </ListItem>
            <ListItem disableGutters secondaryAction={<Typography fontWeight={800}>{formatNumber(carbsValue)} g</Typography>}>
              <ListItemText primary={carbsLabel} />
            </ListItem>
          </List>
        </Stack>
      </CardContent>
    </Card>
  );
}
