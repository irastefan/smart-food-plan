import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AddShoppingCartRoundedIcon from "@mui/icons-material/AddShoppingCartRounded";
import { Box, Button, Card, Divider, IconButton, Stack, Typography } from "@mui/material";
import { useLanguage } from "../../app/providers/LanguageProvider";
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
  const { t } = useLanguage();

  return (
    <Stack spacing={2}>
      <Box sx={{ px: { xs: 0.5, md: 0 } }}>
        <Typography variant="h5" mb={0.5}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" },
          gap: 2
        }}
      >
        {day?.sections.map((section) => (
          <Card
            key={section.id}
            sx={{
              overflow: "hidden",
              height: "100%",
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "linear-gradient(180deg, rgba(31,36,54,0.98), rgba(24,29,44,0.98))"
                  : "linear-gradient(180deg, #ffffff, #f8fafc)"
            }}
          >
            <Box sx={{ px: 3, py: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h4" mb={0.5} sx={{ fontSize: { xs: "1.55rem", sm: "1.75rem" } }}>
                    {section.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {`${t("mealPlan.macro.carbs")} ${formatNumber(section.totals.carbsG)}g · ${t("mealPlan.macro.fat")} ${formatNumber(section.totals.fatG)}g · ${t("mealPlan.macro.protein")} ${formatNumber(section.totals.proteinG)}g`}
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: "1.45rem", sm: "1.65rem" } }}>
                  {formatNumber(section.totals.caloriesKcal)}
                </Typography>
              </Stack>
            </Box>

            <Divider />

            <Stack divider={<Divider />}>
              {section.items.length > 0 ? (
                section.items.map((item) => (
                  <Stack key={item.id} spacing={1.1} sx={{ px: 3, py: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                      <Typography
                        variant="h6"
                        sx={{ wordBreak: "break-word", minWidth: 0, fontSize: { xs: "0.98rem", sm: "1.25rem" } }}
                      >
                        {item.title}
                      </Typography>
                      <Typography fontWeight={800} sx={{ flexShrink: 0 }}>
                        {formatNumber(item.nutrition.caloriesKcal)}
                      </Typography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: { xs: "0.72rem", sm: "0.82rem" }, minWidth: 0 }}
                      >
                        {`${
                          item.type === "recipe"
                            ? `${formatNumber(item.servings ?? 1)} ${servingsLabel}`
                            : `${formatNumber(item.amount ?? 0)} ${item.unit ?? "g"}`
                        } · ${t("mealPlan.macro.carbs")} ${formatNumber(item.nutrition.carbsG)}g · ${t("mealPlan.macro.fat")} ${formatNumber(item.nutrition.fatG)}g · ${t("mealPlan.macro.protein")} ${formatNumber(item.nutrition.proteinG)}g`}
                      </Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
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
                  </Stack>
                ))
              ) : (
                <Typography color="text.secondary" sx={{ px: 3, py: 2.5 }}>
                  {emptyLabel}
                </Typography>
              )}
            </Stack>

            <Divider />

            <Box sx={{ px: 3, py: 1.5 }}>
              <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => onAddItem(section.id, section.title)}>
                {addLabel}
              </Button>
            </Box>
          </Card>
        ))}
      </Box>
    </Stack>
  );
}
