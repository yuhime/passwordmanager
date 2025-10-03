import { useEffect, useState } from "react";
import LoadingPage from "./loading-page";
import { AnimatePresence, motion } from "motion/react";
import { invoke } from "@tauri-apps/api/core";
import ErrorPage from "./error-page";
import RequestPasswordPage from "./request-password-page";
import InitializationPage from "./request-password-page-init";

interface AppWrapperProps {
  children: React.ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [needInitialization, setNeedInitialization] = useState(false);
  const [showMain, setShowMain] = useState(false);

  useEffect(() => {
    setNeedInitialization(false);
    setRequiresPassword(false);
    setLoading(true);
  }, [showMain]);

  useEffect(() => {
    console.log("Loading data...");

    async function loadData() {
      try {
        if (await invoke("need_initialization")) {
          setNeedInitialization(true);
          setLoading(false);
          return;
        }

        if (await invoke("is_decrypted")) {
          setLoading(false);
          return;
        }

        setRequiresPassword(true);
        setLoading(false);
      } catch (error) {
        setError(String(error));
      }
    }

    loadData();
  }, [loading]);

  const currentView = error
    ? "error"
    : loading
      ? "loading"
      : requiresPassword
        ? "requiresPassword"
        : needInitialization
          ? "needInitialization"
          : "content";

  return (
    <AnimatePresence mode="wait">
      {currentView === "loading" && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <LoadingPage />
        </motion.div>
      )}

      {currentView === "requiresPassword" && (
        <motion.div
          key="requiresPassword"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <RequestPasswordPage setShowMain={setShowMain} />
        </motion.div>
      )}

      {currentView === "needInitialization" && (
        <motion.div
          key="needInitialization"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <InitializationPage setError={setError} setShowMain={setShowMain} />
        </motion.div>
      )}

      {currentView === "error" && (
        <motion.div
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ErrorPage error={error!} />
        </motion.div>
      )}

      {currentView === "content" && <>{children}</>}
    </AnimatePresence>
  );
}
