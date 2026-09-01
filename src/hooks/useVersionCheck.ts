import { useState, useEffect, useCallback, useRef } from "react";

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useVersionCheck() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const currentVersion = useRef<string | null>(null);

  const checkVersion = useCallback(async () => {
    try {
      // Append timestamp to bust cache
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!response.ok) return;

      const data = await response.json();
      const serverVersion = data.version;

      if (!currentVersion.current) {
        // First check, just set the current version
        currentVersion.current = serverVersion;
      } else if (currentVersion.current !== serverVersion) {
        // Version mismatch detected!
        setHasUpdate(true);
      }
    } catch (error) {
      console.warn("Failed to check for platform updates:", error);
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkVersion();

    // Check periodically
    const intervalId = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

    // Check when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkVersion();
      }
    };

    // Check when window regains focus
    const handleFocus = () => {
      checkVersion();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkVersion]);

  const refreshPage = () => {
    // Reloads from server, bypassing local cache
    window.location.reload();
  };

  return { hasUpdate, refreshPage };
}
