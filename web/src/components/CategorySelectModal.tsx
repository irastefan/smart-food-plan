import { useState, useCallback } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { useTranslation } from "@/i18n/I18nProvider";
import styles from "./CategorySelectModal.module.css";

type CategorySelectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (categoryId: string | null) => Promise<void>;
  categories: Array<{ id: string; name: string }>;
  itemName: string;
  isLoading?: boolean;
};

export function CategorySelectModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  categories, 
  itemName,
  isLoading = false 
}: CategorySelectModalProps): JSX.Element {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    await onSelect(selectedCategory || null);
    setSelectedCategory("");
    onClose();
  }, [selectedCategory, onSelect, onClose]);

  const handleClose = useCallback(() => {
    setSelectedCategory("");
    onClose();
  }, [onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("shopping.selectCategory.title")} size="small">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.itemInfo}>
          <span className={styles.label}>{t("shopping.selectCategory.adding")}:</span>
          <span className={styles.itemName}>{itemName}</span>
        </div>

        <div className={styles.field}>
          <label htmlFor="category-select" className={styles.label}>
            {t("shopping.selectCategory.category")}
          </label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.select}
            autoFocus
          >
            <option value="">{t("shopping.selectCategory.noCategory")}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isLoading}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t("common.adding") : t("shopping.selectCategory.add")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}