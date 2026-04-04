import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { Checkbox, CircularProgress, Chip, IconButton, Paper, Stack, Typography } from "@mui/material";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { getLocalizedUnitLabel } from "../../shared/lib/units";
import type { ShoppingItem } from "../../features/shopping/api/shoppingApi";

type ShoppingCategorySectionProps = {
  title: string;
  items: ShoppingItem[];
  onDeleteCategory?: () => void;
  onToggleDone: (item: ShoppingItem) => void;
  onDelete: (item: ShoppingItem) => void;
  pendingItemId?: string | null;
};

function formatAmount(item: ShoppingItem, unitLabel: string): string {
  if (item.amount == null) {
    return unitLabel;
  }
  return `${Number.isInteger(item.amount) ? item.amount : item.amount.toFixed(1)} ${unitLabel}`;
}

export function ShoppingCategorySection({
  title,
  items,
  onDeleteCategory,
  onToggleDone,
  onDelete,
  pendingItemId = null
}: ShoppingCategorySectionProps) {
  const { t } = useLanguage();

  return (
    <Paper sx={{ p: { xs: 1.4, md: 2 }, borderRadius: 1.25, border: "1px solid", borderColor: "divider" }}>
      <Stack spacing={{ xs: 1.25, md: 1.75 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Typography variant="h6" fontWeight={800}>{title}</Typography>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Chip label={`${items.length}`} size="small" />
            {onDeleteCategory ? (
              <IconButton size="small" onClick={onDeleteCategory}>
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            ) : null}
          </Stack>
        </Stack>

        <Stack spacing={{ xs: 0.8, md: 1 }}>
          {items.map((item) => (
            <Stack
              key={item.id}
              direction="row"
              spacing={1}
              alignItems="flex-start"
              justifyContent="space-between"
              sx={{
                p: { xs: 0.75, md: 1.1 },
                borderRadius: 1.25,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: item.isDone ? "action.selected" : "background.paper"
              }}
            >
              <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ minWidth: 0, flex: 1 }}>
                {pendingItemId === item.id ? (
                  <Stack sx={{ width: 42, pt: 0.55, alignItems: "center", flexShrink: 0 }}>
                    <CircularProgress size={18} thickness={5} />
                  </Stack>
                ) : (
                  <Checkbox
                    checked={item.isDone}
                    onChange={() => onToggleDone(item)}
                    sx={{ mt: -0.35, marginInlineStart: -0.35 }}
                  />
                )}
                <Stack sx={{ minWidth: 0 }}>
                  <Typography
                    fontWeight={700}
                    sx={{
                      fontSize: { xs: "0.94rem", md: "1rem" },
                      textDecoration: item.isDone ? "line-through" : "none",
                      opacity: item.isDone ? 0.7 : 1,
                      lineHeight: 1.25,
                      overflowWrap: "anywhere"
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Stack direction="row" spacing={0.8} alignItems="center" useFlexGap flexWrap="wrap" sx={{ mt: 0.2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2, fontSize: { xs: "0.78rem", md: "0.875rem" } }}>
                      {formatAmount(item, getLocalizedUnitLabel((key) => t(key as never), item.unit))}
                    </Typography>
                    {item.note ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ lineHeight: 1.2, overflowWrap: "anywhere", fontSize: { xs: "0.78rem", md: "0.875rem" } }}
                      >
                        {item.note}
                      </Typography>
                    ) : null}
                  </Stack>
                </Stack>
              </Stack>

              <Stack direction="row" spacing={0.25} alignItems="center" sx={{ pt: 0.05, flexShrink: 0 }}>
                <IconButton size="small" onClick={() => onDelete(item)}>
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}
