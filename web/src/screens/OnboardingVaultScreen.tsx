import { KeyboardEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Checkbox } from "@/components/Checkbox";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslation } from "@/i18n/I18nProvider";
import {
  clearVaultDirectoryHandle,
  loadVaultDirectoryHandle,
  saveVaultDirectoryHandle
} from "@/utils/vaultStorage";
import styles from "./OnboardingVaultScreen.module.css";

type StatusMessageKey =
  | "onboarding.status.restorePermission"
  | "onboarding.status.reconnected"
  | "onboarding.status.restoreError"
  | "onboarding.status.unsupported"
  | "onboarding.status.permissionDenied"
  | "onboarding.status.connected"
  | "onboarding.status.connectedPending"
  | "onboarding.status.rememberFailed"
  | "onboarding.status.accessError"
  | "onboarding.status.createInfo"
  | "onboarding.status.vaultInfo";

type StatusState =
  | {
      type: "info" | "success" | "error";
      messageKey: StatusMessageKey;
      messageParams?: Record<string, string>;
    }
  | null;

const REMEMBER_KEY = "smartFoodPlan.rememberVault";

async function ensureDirectoryAccess(handle: FileSystemDirectoryHandle): Promise<boolean> {
  if (!handle.queryPermission || !handle.requestPermission) {
    return true;
  }

  const descriptor: FileSystemPermissionDescriptor = { mode: "readwrite" };
  const permission = await handle.queryPermission(descriptor);

  if (permission === "granted") {
    return true;
  }

  if (permission === "denied") {
    return false;
  }

  const requestResult = await handle.requestPermission(descriptor);
  return requestResult === "granted";
}

export function OnboardingVaultScreen(): JSX.Element {
  const { t } = useTranslation();
  const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);
  const [selectedHandle, setSelectedHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [rememberSelection, setRememberSelection] = useState<boolean>(false);
  const [status, setStatus] = useState<StatusState>(null);
  const [isBusy, setIsBusy] = useState<boolean>(false);

  const folderLabel = useMemo(
    () => selectedFolderName ?? t("onboarding.noFolder"),
    [selectedFolderName, t]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const remembered =
      window.localStorage.getItem(REMEMBER_KEY) !== null
        ? window.localStorage.getItem(REMEMBER_KEY) === "true"
        : false;
    setRememberSelection(remembered);

    if (!remembered || !window.indexedDB) {
      return;
    }

    let cancelled = false;

    const restoreHandle = async () => {
      try {
        const handle = await loadVaultDirectoryHandle();
        if (!handle) {
          return;
        }

        const hasAccess = await ensureDirectoryAccess(handle);
        if (!hasAccess) {
          await clearVaultDirectoryHandle();
          if (!cancelled) {
            setStatus({
              type: "info",
              messageKey: "onboarding.status.restorePermission"
            });
          }
          return;
        }

        if (!cancelled) {
          setSelectedHandle(handle);
          setSelectedFolderName(handle.name);
          setStatus({
            type: "success",
            messageKey: "onboarding.status.reconnected",
            messageParams: { folder: handle.name }
          });
        }
      } catch (error) {
        console.error("Failed to restore vault folder", error);
        if (!cancelled) {
          setStatus({
            type: "error",
            messageKey: "onboarding.status.restoreError"
          });
        }
      }
    };

    void restoreHandle();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectExistingFolder = useCallback(async () => {
    if (!window.showDirectoryPicker) {
      setStatus({
        type: "error",
        messageKey: "onboarding.status.unsupported"
      });
      return;
    }

    try {
      setIsBusy(true);
      setStatus(null);
      const handle = await window.showDirectoryPicker();
      if (!handle) {
        return;
      }

      const hasAccess = await ensureDirectoryAccess(handle);
      if (!hasAccess) {
        setStatus({
          type: "error",
          messageKey: "onboarding.status.permissionDenied"
        });
        return;
      }

      setSelectedHandle(handle);
      if (handle?.name) {
        setSelectedFolderName(handle.name);
        setStatus({
          type: "success",
          messageKey: "onboarding.status.connected",
          messageParams: { folder: handle.name }
        });
      } else {
        setStatus({
          type: "info",
          messageKey: "onboarding.status.connectedPending"
        });
      }

      if (rememberSelection) {
        if ("indexedDB" in window) {
          try {
            await saveVaultDirectoryHandle(handle);
            window.localStorage.setItem(REMEMBER_KEY, "true");
          } catch (error) {
            console.error("Failed to persist directory handle", error);
            setStatus({
              type: "error",
              messageKey: "onboarding.status.rememberFailed"
            });
          }
        }
      } else {
        if ("indexedDB" in window) {
          await clearVaultDirectoryHandle();
        }
        window.localStorage.setItem(REMEMBER_KEY, "false");
      }
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") {
        setStatus(null);
      } else {
        setStatus({
          type: "error",
          messageKey: "onboarding.status.accessError"
        });
      }
    } finally {
      setIsBusy(false);
    }
  }, [rememberSelection]);

  const createVaultStructure = useCallback(() => {
    setStatus({
      type: "info",
      messageKey: "onboarding.status.createInfo"
    });
  }, []);

  const showVaultHelp = useCallback(() => {
    setStatus({
      type: "info",
      messageKey: "onboarding.status.vaultInfo"
    });
  }, []);

  const handleHelperKeyDown = useCallback(
    (event: KeyboardEvent<HTMLSpanElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showVaultHelp();
      }
    },
    [showVaultHelp]
  );

  const handleRememberChange = useCallback(
    async (checked: boolean) => {
      setRememberSelection(checked);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(REMEMBER_KEY, checked ? "true" : "false");
      }

      if (!checked) {
        if (typeof window !== "undefined" && "indexedDB" in window) {
          await clearVaultDirectoryHandle();
        }
        return;
      }

      if (selectedHandle && typeof window !== "undefined" && "indexedDB" in window) {
        try {
          await saveVaultDirectoryHandle(selectedHandle);
        } catch (error) {
          console.error("Failed to persist directory handle", error);
          setStatus({
            type: "error",
            messageKey: "onboarding.status.rememberFailed"
          });
        }
      }
    },
    [selectedHandle]
  );

  return (
    <main className={styles.root}>
      <div className={styles.glow} />
      <div className={styles.inner}>
        <div className={styles.topBar}>
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <header className={styles.hero}>
          <h1 className={styles.title}>{t("onboarding.title")}</h1>
          <p className={styles.subtitle}>{t("onboarding.subtitle")}</p>
        </header>

        <Card title={t("onboarding.currentFolder")} className={styles.folderCard}>
          <div className={styles.folderHeader}>
            <div className={styles.folderNameRow}>
              <FolderIcon />
              <div>
                <p className={`${styles.folderName} ${selectedFolderName ? "" : styles.folderEmpty}`}>
                  {folderLabel}
                </p>
              </div>
            </div>
            <HelpBadge />
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoIcon}>
              <InfoIcon />
            </span>
            <p className={styles.folderHint}>{t("onboarding.folderHint")}</p>
          </div>
        </Card>

        <div className={styles.actions}>
          <Button
            variant="outlined"
            onClick={selectExistingFolder}
            leadingIcon={<FolderOpenIcon />}
            trailingIcon={<ArrowIcon />}
            disabled={isBusy}
          >
            {t("onboarding.chooseExisting")}
          </Button>
          <Button
            onClick={createVaultStructure}
            leadingIcon={<SparkleIcon />}
            trailingIcon={<ArrowIcon />}
            disabled={isBusy}
          >
            {t("onboarding.createVault")}
          </Button>
        </div>

        <div className={styles.rememberRow}>
          <Checkbox
            id="remember-folder"
            label={t("onboarding.remember")}
            checked={rememberSelection}
            onChange={handleRememberChange}
          />
          <span
            className={styles.helperLink}
            role="button"
            tabIndex={0}
            onClick={showVaultHelp}
            onKeyDown={handleHelperKeyDown}
          >
            {t("onboarding.howVaultWorks")}
          </span>
        </div>

        {status && (
          <p
            className={`${styles.statusMessage} ${
              status.type === "success"
                ? styles.statusSuccess
                : status.type === "error"
                  ? styles.statusError
                  : styles.statusInfo
            }`}
          >
            {t(status.messageKey, status.messageParams)}
          </p>
        )}
      </div>
    </main>
  );
}

function FolderIcon(): JSX.Element {
  return (
    <svg width="52" height="46" viewBox="0 0 52 46" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="1"
        y="6"
        width="50"
        height="39"
        rx="11"
        stroke="var(--color-icon-container-strong)"
        strokeWidth="2"
        fill="var(--color-icon-container)"
      />
      <path
        d="M6 14C6 10.6863 8.68629 8 12 8H22L26 12H40C43.3137 12 46 14.6863 46 18V33C46 36.3137 43.3137 39 40 39H12C8.68629 39 6 36.3137 6 33V14Z"
        fill="var(--color-accent)"
        fillOpacity="0.22"
      />
    </svg>
  );
}

function FolderOpenIcon(): JSX.Element {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 5C4 4.44772 4.44772 4 5 4H9.2L11 6H17C17.5523 6 18 6.44772 18 7V9H6C4.89543 9 4 9.89543 4 11V5Z"
        fill="var(--color-icon-container-strong)"
      />
      <path
        d="M5 9H17C18.1046 9 19 9.89543 19 11V16C19 17.1046 18.1046 18 17 18H7C5.34315 18 4 16.6569 4 15V11C4 9.89543 4.89543 9 5 9Z"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkleIcon(): JSX.Element {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10.9998 3L12.3593 7.19449L16.6665 8.66667L12.3593 10.1388L10.9998 14.3333L9.64025 10.1388L5.33301 8.66667L9.64025 7.19449L10.9998 3Z"
        stroke="var(--color-accent)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M4.16634 12.3333L5.08301 12.6667L5.41634 13.5833L5.74968 12.6667L6.66634 12.3333L5.74968 12L5.41634 11.0833L5.08301 12L4.16634 12.3333Z"
        stroke="var(--color-accent)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M14.333 5.5L14.9997 5.74999L15.2497 6.41666L15.4997 5.74999L16.1663 5.5L15.4997 5.24999L15.2497 4.58333L14.9997 5.24999L14.333 5.5Z"
        stroke="var(--color-accent)"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon(): JSX.Element {
  return (
    <svg width="12" height="18" viewBox="0 0 12 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6.00033 16.5V7.5"
        stroke="var(--color-icon-container-strong)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 4.5H6.01"
        stroke="var(--color-icon-container-strong)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 8H12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 5L12 8L9 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HelpBadge(): JSX.Element {
  return (
    <span className={styles.helperBadge}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M9 16.5C12.5899 16.5 15.5 13.5899 15.5 10C15.5 6.41015 12.5899 3.5 9 3.5C5.41015 3.5 2.5 6.41015 2.5 10C2.5 13.5899 5.41015 16.5 9 16.5Z"
          stroke="var(--color-accent)"
          strokeWidth="1.3"
        />
        <path
          d="M9 7.5C9.53111 7.5 10 7.96889 10 8.5C10 8.91421 9.5 9.5 9.5 9.5"
          stroke="var(--color-accent)"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 12H9.01"
          stroke="var(--color-accent)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
