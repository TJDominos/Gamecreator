import React from "react";
import "./CreatorGuide.css";

import { SiteHeader } from "./components/SiteHeader";

export default function CreatorGuide() {
  return (
    <div className="creator-guide">
      <SiteHeader />

      <main className="guide-main">
        <div className="guide-sidebar">
          <nav className="guide-nav">
            <div className="guide-nav__section">
              <h3>Getting Started</h3>
              <ul>
                <li><a href="#introduction" className="active">Introduction</a></li>
                <li><a href="#quick-start">Quick Start</a></li>
                <li><a href="#requirements">Game Requirements</a></li>
              </ul>
            </div>
            <div className="guide-nav__section">
              <h3>Implementation</h3>
              <ul>
                <li><a href="#sdk">SDK Integration</a></li>
                <li><a href="#monetization">Monetization</a></li>
                <li><a href="#analytics">Analytics</a></li>
              </ul>
            </div>
            <div className="guide-nav__section">
              <h3>Publishing</h3>
              <ul>
                <li><a href="#submission">Submission Process</a></li>
                <li><a href="#review">Review Guidelines</a></li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="guide-content">
          <section id="introduction">
            <p className="lead">
              Welcome to the Games Creator Guide. Here you'll find everything you need to publish your web games, reach a global audience, and monetize effectively.
            </p>
            
            <div className="guide-card">
              <h2>Why publish with us?</h2>
              <ul>
                <li><strong>Massive Reach:</strong> Get your game in front of millions of active players globally.</li>
                <li><strong>Fair Revenue Share:</strong> Earn through transparent monetization without intrusive ads.</li>
                <li><strong>Developer Friendly:</strong> Simple submission process with minimal SDK requirements.</li>
                <li><strong>AI Powered:</strong> Leverage AI tools to optimize your game's performance and discoverability.</li>
              </ul>
            </div>

            <h2 id="quick-start">Quick Start</h2>
            <p>
              Follow these simple steps to get your game live:
            </p>
            <ol className="guide-steps">
              <li>
                <strong>Sign In / Register:</strong> Create a developer account on our portal.
              </li>
              <li>
                <strong>Upload Game Files:</strong> Submit your HTML5 game bundle (ZIP file).
              </li>
              <li>
                <strong>Configure Metadata:</strong> Add title, description, and promotional assets.
              </li>
              <li>
                <strong>Submit for Review:</strong> Our team will review your game within 48 hours.
              </li>
            </ol>
            
            <h2 id="requirements">Game Requirements</h2>
            <p>To ensure the best experience for our players, all submitted games must meet the following criteria:</p>
            <ul>
              <li>Must be a web-based game (HTML5, WebGL, WebAssembly).</li>
              <li>Fully responsive and playable on both desktop and mobile devices.</li>
              <li>No malicious code or intrusive popups.</li>
              <li>Optimized performance (loading time under 5 seconds on broadband).</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
