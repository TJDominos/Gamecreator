import React from "react";
import { Link } from "react-router";
import { WltLogo } from "./WltLogo";

export function OnboardingHeader(): React.ReactElement {
  return (
    <header className="onboarding-header">
      <Link to="/" className="portal-brand">
        <WltLogo />
        <span>Randseed</span>
        <b>Creators</b>
      </Link>
      <span>Creator onboarding</span>
    </header>
  );
}
