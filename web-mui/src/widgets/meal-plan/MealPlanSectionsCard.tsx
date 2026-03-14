import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AddShoppingCartRoundedIcon from "@mui/icons-material/AddShoppingCartRounded";
import { Box, Card, CardContent, Chip, Grid, IconButton, LinearProgress, Stack, Typography, Button } from "@mui/material";
import type { MealPlanDay, MealPlanItem } from "../../features/meal-plan/api/mealPlanApi";

type MealPlanSectionsCardProps = {
  day: MealPlanDay | null;
  itemsLabel: string;
  servingsLabel: string;
  emptyLabel: string;
  title: string;
  subtitle: string;
  addLabel: string;
  editLabel: string;
  deleteLabel: string;
  addToShoppingLabel: string;
  onAddItem: (sectionId: string, sectionTitle: string) => void;
  onEditItem: (sectionId: string, sectionTitle: string, item: MealPlanItem) => void;
  onDeleteItem: (sectionId: string, item: MealPlanItem) => void;
  onAddToShoppingItem: (sectionId: string, item: MealPlanItem) => void;
};

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function MealPlanSectionsCard({
  day,
  itemsLabel,
  servingsLabel,
  emptyLabel,
  title,
  subtitle,
  addLabel,
  editLabel,
  deleteLabel,
  addToShoppingLabel,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onAddToShoppingItem
}: MealPlanSectionsCardProps) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
        </Stack>

        <Grid container spacing={2}>
          {day?.sections.map((section) => (
            <Grid key={section.id} size={{ xs: 12, md: 6 }}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  background: (theme) =>
                    theme.palette.mode === "dark"
                      ? "linear-gradient(180deg, rgba(19,30,45,0.95), rgba(16,25,39,0.95))"
                      : "#ffffff"
                }}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography fontWeight={800}>{section.title}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" label={`${section.items.length} ${itemsLabel}`} />
                      <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => onAddItem(section.id, section.title)}>
                        {addLabel}
                      </Button>
                    </Stack>
                  </Stack>

                  <Typography variant="h5" mb={1}>
                    {formatNumber(section.totals.caloriesKcal)} kcal
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, section.totals.caloriesKcal / 8)}
                    sx={{ mb: 2, height: 8, borderRadius: 999 }}
                  />

                  <Stack spacing={1.25}>
                    {section.items.length > 0 ? (
                      section.items.map((item) => (
                        <Stack
                          key={item.id}
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ py: 0.75 }}
                        >
                          <Box>
                            <Typography fontWeight={700}>{item.title}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.type === "recipe"
                                ? `${formatNumber(item.servings ?? 1)} ${servingsLabel}`
                                : `${formatNumber(item.amount ?? 0)} ${item.unit ?? "g"}`}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography fontWeight={800}>{formatNumber(item.nutrition.caloriesKcal)} kcal</Typography>
                            <IconButton size="small" onClick={() => onAddToShoppingItem(section.id, item)} title={addToShoppingLabel}>
                              <AddShoppingCartRoundedIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => onEditItem(section.id, section.title, item)} title={editLabel}>
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => onDeleteItem(section.id, item)} title={deleteLabel}>
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Stack>
                      ))
                    ) : (
                      <Typography color="text.secondary">{emptyLabel}</Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
