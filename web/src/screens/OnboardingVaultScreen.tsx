import { KeyboardEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Checkbox } from "@/components/Checkbox";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  clearVaultDirectoryHandle,
  loadVaultDirectoryHandle,
  saveVaultDirectoryHandle
} from "@/utils/vaultStorage";
import styles from "./OnboardingVaultScreen.module.css";

type StatusState =
  | {
      type: "info" | "success" | "error";
      message: string;
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
  const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);
  const [selectedHandle, setSelectedHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [rememberSelection, setRememberSelection] = useState<boolean>(false);
  const [status, setStatus] = useState<StatusState>(null);
  const [isBusy, setIsBusy] = useState<boolean>(false);

  const folderLabel = useMemo(
    () => selectedFolderName ?? "No folder selected",
    [selectedFolderName]
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
              message: "We need permission to access the remembered folder. Please select it again."
            });
          }
          return;
        }

        if (!cancelled) {
          setSelectedHandle(handle);
          setSelectedFolderName(handle.name);
          setStatus({
            type: "success",
            message: `Reconnected to “${handle.name}”. Vault files will sync here.`
          });
        }
      } catch (error) {
        console.error("Failed to restore vault folder", error);
        if (!cancelled) {
          setStatus({
            type: "error",
            message: "We couldn't restore the previously selected folder. Please choose it again."
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
        message: "Your browser does not support selecting folders yet."
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
          message: "We were not granted permission to use that folder."
        });
        return;
      }

      setSelectedHandle(handle);
      if (handle?.name) {
        setSelectedFolderName(handle.name);
        setStatus({
          type: "success",
          message: `Connected to “${handle.name}”. Vault files will sync here.`
        });
      } else {
        setStatus({
          type: "info",
          message: "Folder connected. We will finalize setup after confirming permissions."
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
              message:
                "We connected but could not remember that folder. Try enabling storage access."
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
          message: "We could not access that folder. Please try again or choose another."
        });
      }
    } finally {
      setIsBusy(false);
    }
  }, [rememberSelection]);

  const createVaultStructure = useCallback(() => {
    setStatus({
      type: "info",
      message:
        "A fresh /vault structure will be generated once you confirm the destination folder."
    });
  }, []);

  const showVaultHelp = useCallback(() => {
    setStatus({
      type: "info",
      message:
        "Vault is a folder that contains recipes, products, days, shopping, and user settings in Markdown/YAML files."
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
            message: "We connected but could not remember that folder. Try enabling storage access."
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
          <ThemeToggle />
        </div>
        <header className={styles.hero}>
          <h1 className={styles.title}>Welcome</h1>
          <p className={styles.subtitle}>Select your Vault folder</p>
        </header>

        <Card title="Current folder" className={styles.folderCard}>
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
            <p className={styles.folderHint}>
              Your recipes, products, days and shopping list will be stored as Markdown/YAML files
              inside this folder. You can sync it later via GitHub or Drive.
            </p>
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
            Choose existing folder
          </Button>
          <Button
            onClick={createVaultStructure}
            leadingIcon={<SparkleIcon />}
            trailingIcon={<ArrowIcon />}
            disabled={isBusy}
          >
            Create new Vault
          </Button>
        </div>

        <div className={styles.rememberRow}>
          <Checkbox
            id="remember-folder"
            label="Remember this folder on this device"
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
            How Vault works
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
            {status.message}
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
        d="M5 9H17C18.1046 9 19 9.89543 19 11V16C19 17.1046 18.1046 18 17 18H7C5.34315 18 4 16.6569 4 15V11C4 9.89543 4.89543 9 6 9Z"
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

function ArrowIcon(): JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 3L8.5 7L4 11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon(): JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="7" r="6" stroke="var(--color-text-secondary)" strokeWidth="1.4" />
      <rect x="6.2" y="6" width="1.4" height="4" rx="0.7" fill="var(--color-text-primary)" fillOpacity="0.75" />
      <rect x="6.2" y="3.6" width="1.4" height="1.4" rx="0.7" fill="var(--color-text-primary)" fillOpacity="0.75" />
    </svg>
  );
}

function HelpBadge(): JSX.Element {
  return (
    <span className={styles.infoIcon} title="Learn more about Vault folders.">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2Z"
          stroke="var(--color-text-secondary)"
          strokeWidth="1.4"
        />
        <path
          d="M8 11V7.75C8 7.33579 8.33579 7 8.75 7V7C9.16421 7 9.5 6.66421 9.5 6.25V6.25C9.5 5.55964 8.94036 5 8.25 5H7.75C7.05964 5 6.5 5.55964 6.5 6.25"
          stroke="var(--color-text-secondary)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="7.2" y="11.1997" width="1.6" height="1.6" rx="0.8" fill="var(--color-text-primary)" fillOpacity="0.8" />
      </svg>
    </span>
  );
}
