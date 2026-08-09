import React from "react";
import "./CreatorGuide.css";
import { SiteHeader } from "./components/SiteHeader";
import { GameCard } from "./components/GameCard";
import { Play, ShieldCheck, Zap, Gift, Gamepad2, Trophy, MousePointer2, Layers3 } from "lucide-react";
import "./developer-landing/DeveloperLanding.css";

const activeBounties = [
  { title: "Neon Dash", genre: "Arcade", creator: "DevStudio", tone: "violet", icon: Zap, reward: "5,000 WLT" },
  { title: "Lucky Drop", genre: "Chance", creator: "Lucky Games", tone: "orange", icon: Gift, reward: "2,500 WLT" },
  { title: "Grid Run", genre: "Puzzle", creator: "Pixel Logic", tone: "cyan", icon: Gamepad2, reward: "10,000 WLT" },
  { title: "Crown Clash", genre: "Strategy", creator: "Epic Forge", tone: "blue", icon: Trophy, reward: "1,000 WLT" },
  { title: "Orbit", genre: "Skill", creator: "Space Cats", tone: "lime", icon: MousePointer2, reward: "500 WLT" },
  { title: "Vault 9", genre: "Adventure", creator: "Quest Labs", tone: "rose", icon: Layers3, reward: "3,000 WLT" },
];

export default function CreatorBounties() {
  return (
    <div className="creator-guide">
      <SiteHeader />
      <main className="guide-main">
        <div className="guide-sidebar">
          <nav className="guide-nav">
            <div className="guide-nav__section">
              <h3>Bounty Program</h3>
              <ul>
                <li><a href="#overview" className="active">Overview</a></li>
                <li><a href="#active-bounties">Active Bounties</a></li>
                <li><a href="#rules">Rules & Payouts</a></li>
              </ul>
            </div>
          </nav>
        </div>
        <div className="guide-content">
          <section id="overview">
            <h1>Creator Bounties</h1>
            <p className="lead">
              Get rewarded for your creativity. Join our Creator Bounty program, build innovative games, hit engagement milestones, and earn substantial rewards directly from the platform.
            </p>
            
            <div className="guide-card">
              <h2>How it works</h2>
              <ol className="guide-steps">
                <li>
                  <strong>Claim a Bounty:</strong> Browse the active bounties and choose one that fits your skills.
                </li>
                <li>
                  <strong>Build and Submit:</strong> Develop your game and submit it for review before the deadline.
                </li>
                <li>
                  <strong>Hit Milestones:</strong> Meet the required engagement metrics or quality standards.
                </li>
                <li>
                  <strong>Get Paid:</strong> Earn WLT rewards directly to your wallet once verified.
                </li>
              </ol>
            </div>
            
            <h2 id="active-bounties">Active Bounties</h2>
            <p>
              Explore the currently active bounties and the top games that have claimed them.
            </p>
            
            <div className="showcase-grid" style={{ gridAutoRows: '280px', gap: '20px', marginTop: '32px' }}>
              {activeBounties.map(({ title, genre, creator, tone, icon: Icon, reward }, index) => (
                <GameCard
                  className="showcase-card"
                  key={title}
                  title={title}
                  genre={genre}
                  creator={creator}
                  tone={tone}
                  icon={Icon}
                  hideMeta={true}
                >
                  <div className="showcase-card__overlay">
                    <span className="game-card-creator">Reward: {reward}</span>
                    <h3>{title}</h3>
                    <div className="showcase-card__play" aria-hidden="true">
                      <Play />
                    </div>
                  </div>
                  {index === 1 && (
                    <span className="showcase-card__badge">
                      <ShieldCheck aria-hidden="true" /> Verified fair
                    </span>
                  )}
                </GameCard>
              ))}
            </div>

            <h2 id="rules" style={{ marginTop: '64px' }}>Rules & Payouts</h2>
            <p>To ensure fair play and quality submissions, all participants must adhere to the following rules:</p>
            <ul>
              <li>Games must be original and created specifically for the bounty.</li>
              <li>Only games meeting the minimum performance and quality guidelines will be considered.</li>
              <li>Payouts are distributed within 14 days of the milestone being verified.</li>
              <li>We reserve the right to disqualify submissions containing malicious code or using bot traffic.</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
