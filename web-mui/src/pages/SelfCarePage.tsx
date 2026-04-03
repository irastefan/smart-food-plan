import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import { Alert, CircularProgress, Paper, Snackbar, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useLanguage } from "../app/providers/LanguageProvider";
import {
  createSelfCareItem,
  createSelfCareSlot,
  deleteSelfCareItem,
  deleteSelfCareSlot,
  getCurrentWeekdayKey,
  updateSelfCareItem,
  updateSelfCareSlot,
  type SelfCareItem,
  type SelfCareSlot,
  type SelfCareWeekdayKey
} from "../features/self-care/api/selfCareApi";
import { useSelfCareRoutine } from "../features/self-care/hooks/useSelfCareRoutine";
import { ConfirmActionDialog } from "../shared/ui/ConfirmActionDialog";
import { PageActionButton } from "../shared/ui/PageActionButton";
import { PageTitle } from "../shared/ui/PageTitle";
import { DashboardTopbar } from "../widgets/dashboard/DashboardTopbar";
import { SelfCareAssistantDialog } from "../widgets/self-care/SelfCareAssistantDialog";
import { SelfCareItemDialog } from "../widgets/self-care/SelfCareItemDialog";
import { SelfCareSlotDialog } from "../widgets/self-care/SelfCareSlotDialog";
import { SelfCareWeekBoard } from "../widgets/self-care/SelfCareWeekBoard";

type LayoutContext = {
  openSidebar: () => void;
  collapsed: boolean;
  registerPageAgentAction: (action: (() => void) | null) => void;
  clearPageAgentAction: () => void;
  registerPageAgentOpen: (value: boolean) => void;
  clearPageAgentOpen: () => void;
  registerPageAddAction: (action: (() => void) | null) => void;
  clearPageAddAction: () => void;
  registerPageLoading: (value: boolean) => void;
  clearPageLoading: () => void;
};

export function SelfCarePage() {
  const { t } = useLanguage();
  const {
    openSidebar,
    registerPageAgentAction,
    clearPageAgentAction,
    registerPageAgentOpen,
    clearPageAgentOpen,
    registerPageAddAction,
    clearPageAddAction,
    registerPageLoading,
    clearPageLoading
  } = useOutletContext<LayoutContext>();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const { week, setWeek, isLoading, errorMessage, refresh } = useSelfCareRoutine();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [slotDialogState, setSlotDialogState] = useState<{ open: boolean; weekday: SelfCareWeekdayKey; slot?: SelfCareSlot | null }>({
    open: false,
    weekday: getCurrentWeekdayKey(),
    slot: null
  });
  const [itemDialogState, setItemDialogState] = useState<{ open: boolean; slot: SelfCareSlot | null; item?: SelfCareItem | null }>({
    open: false,
    slot: null,
    item: null
  });
  const [pendingDelete, setPendingDelete] = useState<
    | { type: "slot"; slot: SelfCareSlot }
    | { type: "item"; slot: SelfCareSlot; item: SelfCareItem }
    | null
  >(null);

  useEffect(() => {
    registerPageAgentAction(() => setAssistantOpen((current) => !current));
    return () => {
      clearPageAgentAction();
    };
  }, [clearPageAgentAction, registerPageAgentAction]);

  useEffect(() => {
    registerPageAgentOpen(assistantOpen);
    return () => {
      clearPageAgentOpen();
    };
  }, [assistantOpen, clearPageAgentOpen, registerPageAgentOpen]);

  useEffect(() => {
    registerPageAddAction(() => {
      setSlotDialogState({ open: true, weekday: getCurrentWeekdayKey(), slot: null });
    });
    return () => {
      clearPageAddAction();
    };
  }, [clearPageAddAction, registerPageAddAction]);

  useEffect(() => {
    registerPageLoading(isLoading);
    return () => {
      clearPageLoading();
    };
  }, [clearPageLoading, isLoading, registerPageLoading]);

  const weekdayCount = useMemo(() => week?.weekdays.filter((weekday) => weekday.slots.length > 0).length ?? 0, [week]);

  async function handleSubmitSlot(input: { weekday: SelfCareWeekdayKey; name: string }) {
    try {
      const nextWeek = slotDialogState.slot
        ? await updateSelfCareSlot(slotDialogState.slot.id, {
            weekday: input.weekday,
            name: input.name
          })
        : await createSelfCareSlot({
            weekday: input.weekday,
            name: input.name
          });
      setWeek(nextWeek);
      setSlotDialogState({ open: false, weekday: input.weekday, slot: null });
      setFeedback({ type: "success", message: t(slotDialogState.slot ? "selfCare.status.slotUpdated" : "selfCare.status.slotAdded") });
    } catch (error) {
      console.error("Failed to save self-care slot", error);
      setFeedback({ type: "error", message: t("selfCare.status.slotSaveError") });
    }
  }

  async function handleSubmitItem(input: { title: string; description: string; note: string }) {
    if (!itemDialogState.slot) {
      return;
    }

    try {
      const nextWeek = itemDialogState.item
        ? await updateSelfCareItem(itemDialogState.item.id, input)
        : await createSelfCareItem(itemDialogState.slot.id, input);
      setWeek(nextWeek);
      setItemDialogState({ open: false, slot: null, item: null });
      setFeedback({ type: "success", message: t(itemDialogState.item ? "selfCare.status.itemUpdated" : "selfCare.status.itemAdded") });
    } catch (error) {
      console.error("Failed to save self-care item", error);
      setFeedback({ type: "error", message: t("selfCare.status.itemSaveError") });
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }

    try {
      const nextWeek = pendingDelete.type === "slot"
        ? await deleteSelfCareSlot(pendingDelete.slot.id)
        : await deleteSelfCareItem(pendingDelete.item.id);
      setWeek(nextWeek);
      setFeedback({
        type: "success",
        message: t(pendingDelete.type === "slot" ? "selfCare.status.slotDeleted" : "selfCare.status.itemDeleted")
      });
      setPendingDelete(null);
    } catch (error) {
      console.error("Failed to delete self-care entity", error);
      setFeedback({
        type: "error",
        message: t(pendingDelete.type === "slot" ? "selfCare.status.slotDeleteError" : "selfCare.status.itemDeleteError")
      });
    }
  }

  const handleCloseAssistant = useCallback(() => {
    setAssistantOpen(false);
  }, []);

  return (
    <Stack spacing={3} sx={{ pb: { xs: 10, md: 8 } }}>
      <DashboardTopbar onOpenSidebar={openSidebar} title={t("selfCare.title")} subtitle={t("selfCare.subtitle")} />

      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <PageTitle title={t("selfCare.title")} />
        {isDesktop ? (
          <Stack direction="row" spacing={1}>
            <PageActionButton
              icon={<AddRoundedIcon fontSize="small" />}
              label={t("selfCare.actions.addSlot")}
              onClick={() => setSlotDialogState({ open: true, weekday: getCurrentWeekdayKey(), slot: null })}
            />
            <PageActionButton
              icon={<SmartToyRoundedIcon fontSize="small" />}
              label={t("aiAgent.title")}
              onClick={() => setAssistantOpen(true)}
              variant="agent"
            />
          </Stack>
        ) : null}
      </Stack>

      <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 1 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <div>
            <Typography variant="h6" fontWeight={800} sx={{ textAlign: "start" }}>
              {t("selfCare.summary.title")}
            </Typography>
            <Typography color="text.secondary">
              {t("selfCare.summary.subtitle")}
            </Typography>
          </div>
          <Stack direction="row" spacing={3}>
            <div>
              <Typography variant="caption" color="text.secondary">{t("selfCare.summary.days")}</Typography>
              <Typography variant="h5" fontWeight={800}>{weekdayCount}</Typography>
            </div>
            <div>
              <Typography variant="caption" color="text.secondary">{t("selfCare.summary.slots")}</Typography>
              <Typography variant="h5" fontWeight={800}>
                {week?.weekdays.reduce((sum, weekday) => sum + weekday.slots.length, 0) ?? 0}
              </Typography>
            </div>
            <div>
              <Typography variant="caption" color="text.secondary">{t("selfCare.summary.steps")}</Typography>
              <Typography variant="h5" fontWeight={800}>
                {week?.weekdays.reduce((sum, weekday) => sum + weekday.slots.reduce((slotSum, slot) => slotSum + slot.items.length, 0), 0) ?? 0}
              </Typography>
            </div>
          </Stack>
        </Stack>
      </Paper>

      {feedback ? <Alert severity={feedback.type}>{feedback.message}</Alert> : null}
      {errorMessage ? <Alert severity="error">{t(errorMessage as never)}</Alert> : null}

      {isLoading ? (
        <Paper sx={{ p: 6, borderRadius: 1.25, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Paper>
      ) : !week ? (
        <Paper sx={{ p: 6, borderRadius: 1.25, textAlign: "center", border: "1px dashed", borderColor: "divider" }}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>{t("selfCare.emptyTitle")}</Typography>
          <Typography color="text.secondary">{t("selfCare.empty")}</Typography>
        </Paper>
      ) : (
        <SelfCareWeekBoard
          week={week}
          onAddSlot={(weekday) => setSlotDialogState({ open: true, weekday, slot: null })}
          onEditSlot={(slot) => setSlotDialogState({ open: true, weekday: slot.weekday, slot })}
          onDeleteSlot={(slot) => setPendingDelete({ type: "slot", slot })}
          onAddItem={(slot) => setItemDialogState({ open: true, slot, item: null })}
          onEditItem={(slot, item) => setItemDialogState({ open: true, slot, item })}
          onDeleteItem={(slot, item) => setPendingDelete({ type: "item", slot, item })}
          onOpenAgent={() => setAssistantOpen(true)}
        />
      )}

      <SelfCareSlotDialog
        open={slotDialogState.open}
        initialWeekday={slotDialogState.weekday}
        slot={slotDialogState.slot ?? undefined}
        onClose={() => setSlotDialogState((current) => ({ ...current, open: false, slot: null }))}
        onSubmit={handleSubmitSlot}
      />

      <SelfCareItemDialog
        open={itemDialogState.open}
        item={itemDialogState.item ?? undefined}
        onClose={() => setItemDialogState({ open: false, slot: null, item: null })}
        onSubmit={handleSubmitItem}
      />

      <ConfirmActionDialog
        open={Boolean(pendingDelete)}
        title={t("common.delete")}
        message={
          pendingDelete?.type === "slot"
            ? t("selfCare.confirmDeleteSlot", { name: pendingDelete.slot.name } as never)
            : pendingDelete
              ? t("selfCare.confirmDeleteItem", { name: pendingDelete.item.title } as never)
              : ""
        }
        confirmLabel={t("common.delete")}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
      />

      <SelfCareAssistantDialog open={assistantOpen} week={week} onClose={handleCloseAssistant} onDataChanged={refresh} />

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={2800}
        onClose={() => setFeedback(null)}
        message={feedback?.message ?? ""}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Stack>
  );
}
