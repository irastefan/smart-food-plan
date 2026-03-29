import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import { Checkbox, Chip, IconButton, Paper, Stack, Typography } from "@mui/material";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { getLocalizedUnitLabel } from "../../shared/lib/units";
import type { ShoppingItem } from "../../features/shopping/api/shoppingApi";

type ShoppingCategorySectionProps = {
  title: string;
  items: ShoppingItem[];
  doneLabel: string;
  onDeleteCategory?: () => void;
  onToggleDone: (item: ShoppingItem) => void;
  onDelete: (item: ShoppingItem) => void;
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
  doneLabel,
  onDeleteCategory,
  onToggleDone,
  onDelete
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
                p: { xs: 1, md: 1.25 },
                borderRadius: 1.25,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: item.isDone ? "action.selected" : "background.paper"
              }}
            >
              <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ minWidth: 0, flex: 1 }}>
                <Checkbox checked={item.isDone} onChange={() => onToggleDone(item)} sx={{ mt: -0.35, ml: -0.35 }} />
                <Stack sx={{ minWidth: 0 }}>
                  <Typography
                    fontWeight={700}
                    sx={{
                      textDecoration: item.isDone ? "line-through" : "none",
                      opacity: item.isDone ? 0.7 : 1,
                      lineHeight: 1.25,
                      overflowWrap: "anywhere"
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Stack direction="row" spacing={0.8} alignItems="center" useFlexGap flexWrap="wrap" sx={{ mt: 0.2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                      {formatAmount(item, getLocalizedUnitLabel((key) => t(key as never), item.unit))}
                    </Typography>
                    {item.note ? (
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2, overflowWrap: "anywhere" }}>
                        {item.note}
                      </Typography>
                    ) : null}
                  </Stack>
                </Stack>
              </Stack>

              <Stack direction="row" spacing={0.25} alignItems="center" sx={{ pt: 0.1, flexShrink: 0 }}>
                {item.isDone ? <Chip size="small" icon={<ShoppingCartRoundedIcon />} label={doneLabel} /> : null}
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
