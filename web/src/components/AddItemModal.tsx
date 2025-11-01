import { useState, useCallback } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { useTranslation } from "@/i18n/I18nProvider";
import type { ShoppingListItem } from "@/utils/vaultShopping";
import styles from "./AddItemModal.module.css";

type AddItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<ShoppingListItem, "id">) => Promise<void>;
  categories: Array<{ id: string; name: string }>;
  isLoading?: boolean;
};

export function AddItemModal({ isOpen, onClose, onAdd, categories, isLoading = false }: AddItemModalProps): JSX.Element {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!title.trim()) return;

    const quantityNum = quantity ? parseFloat(quantity.replace(",", ".")) : null;
    
    await onAdd({
      title: title.trim(),
      quantity: Number.isFinite(quantityNum) ? quantityNum : null,
      unit: unit.trim() || null,
      category: category || null,
      notes: notes.trim() || null,
      completed: false,
      source: { kind: "custom" }
    });

    // Reset form
    setTitle("");
    setQuantity("");
    setUnit("");
    setCategory("");
    setNotes("");
    onClose();
  }, [title, quantity, unit, category, notes, onAdd, onClose]);

  const handleClose = useCallback(() => {
    setTitle("");
    setQuantity("");
    setUnit("");
    setCategory("");
    setNotes("");
    onClose();
  }, [onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("shopping.addItem.title")} size="medium">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="item-title" className={styles.label}>
            {t("shopping.addItem.name")} *
          </label>
          <input
            id="item-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.input}
            placeholder={t("shopping.addItem.namePlaceholder")}
            required
            autoFocus
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="item-quantity" className={styles.label}>
              {t("shopping.addItem.quantity")}
            </label>
            <input
              id="item-quantity"
              type="number"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={styles.input}
              placeholder="1"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="item-unit" className={styles.label}>
              {t("shopping.addItem.unit")}
            </label>
            <input
              id="item-unit"
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className={styles.input}
              placeholder={t("shopping.addItem.unitPlaceholder")}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="item-category" className={styles.label}>
            {t("shopping.addItem.category")}
          </label>
          <select
            id="item-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={styles.select}
          >
            <option value="">{t("shopping.addItem.noCategory")}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="item-notes" className={styles.label}>
            {t("shopping.addItem.notes")}
          </label>
          <textarea
            id="item-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={styles.textarea}
            placeholder={t("shopping.addItem.notesPlaceholder")}
            rows={3}
          />
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isLoading}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={!title.trim() || isLoading}>
            {isLoading ? t("common.adding") : t("shopping.addItem.add")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}