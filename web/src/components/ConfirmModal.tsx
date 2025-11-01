import { Button } from "./Button";
import { Modal } from "./Modal";
import { useTranslation } from "@/i18n/I18nProvider";
import styles from "./ConfirmModal.module.css";

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
};

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText,
  cancelText,
  variant = "warning",
  isLoading = false 
}: ConfirmModalProps): JSX.Element {
  const { t } = useTranslation();

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="small">
      <div className={styles.content}>
        <div className={`${styles.icon} ${styles[variant]}`}>
          {variant === "danger" && "⚠️"}
          {variant === "warning" && "❓"}
          {variant === "info" && "ℹ️"}
        </div>
        
        <p className={styles.message}>{message}</p>
        
        <div className={styles.actions}>
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onClose} 
            disabled={isLoading}
          >
            {cancelText || t("common.cancel")}
          </Button>
          <Button 
            type="button" 
            variant={variant === "danger" ? "outlined" : undefined}
            onClick={handleConfirm} 
            disabled={isLoading}
            className={variant === "danger" ? styles.dangerButton : ""}
          >
            {isLoading ? t("common.processing") : (confirmText || t("common.confirm"))}
          </Button>
        </div>
      </div>
    </Modal>
  );
}