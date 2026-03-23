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
    <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 1.25, border: "1px solid", borderColor: "divider" }}>
      <Stack spacing={2}>
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

        <Stack spacing={1}>
          {items.map((item) => (
            <Stack
              key={item.id}
              direction="row"
              spacing={1.5}
              alignItems="center"
              justifyContent="space-between"
              sx={{
                p: 1.5,
                borderRadius: 1.25,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: item.isDone ? "action.selected" : "background.paper"
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                <Checkbox checked={item.isDone} onChange={() => onToggleDone(item)} />
                <Stack sx={{ minWidth: 0 }}>
                  <Typography
                    fontWeight={700}
                    noWrap
                    sx={{ textDecoration: item.isDone ? "line-through" : "none", opacity: item.isDone ? 0.7 : 1 }}
                  >
                    {item.title}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                    <Typography variant="body2" color="text.secondary">
                      {formatAmount(item, getLocalizedUnitLabel((key) => t(key as never), item.unit))}
                    </Typography>
                    {item.note ? (
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {item.note}
                      </Typography>
                    ) : null}
                  </Stack>
                </Stack>
              </Stack>

              <Stack direction="row" spacing={0.5} alignItems="center">
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
