import React, { useEffect } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export interface ToastProps {
  message: string;
  tone?: "success" | "error";
  onDismiss: () => void;
  duration?: number;
}

export function Toast({
  message,
  tone = "success",
  onDismiss,
  duration = 3200,
}: ToastProps): React.ReactElement {
  useEffect(() => {
    const timeoutId = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timeoutId);
  }, [duration, onDismiss]);

  const Icon = tone === "error" ? AlertCircle : CheckCircle2;

  return (
    <div className="toast-viewport toast-viewport--portal" aria-live={tone === "error" ? "assertive" : "polite"}>
      <div className="toast" role={tone === "error" ? "alert" : "status"}>
        <Icon size={18} aria-hidden="true" />
        <span>{message}</span>
      </div>
    </div>
  );
}
