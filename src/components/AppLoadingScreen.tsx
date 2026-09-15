import React from "react";

interface AppLoadingScreenProps {
  message?: string;
}

export function AppLoadingScreen({
  message = "Preparing your workspace...",
}: AppLoadingScreenProps): React.ReactElement {
  return (
    <div className="app-loading" role="status" aria-live="polite">
      <div className="app-loading__mark" aria-hidden="true"><span /></div>
      <strong>Randseed Creator</strong>
      <div className="app-loading__bar" aria-hidden="true"><span /></div>
      <p>{message}</p>
    </div>
  );
}