import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight,
  BadgeDollarSign,
  Check,
  CircleDollarSign,
  CloudUpload,
  Code2,
  Compass,
  Gamepad2,
  Gauge,
  Gift,
  Layers3,
  MessageCircleMore,
  MousePointer2,
  Network,
  Play,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Wallet,
  WalletCards,
  Zap,
  Target,
Ghost, Sword, Crown } from "lucide-react";
import Footer from "../components/Footer";
import { WalletConnectModal } from "../components/WalletConnectModal";
import { useAuth } from "../auth/AuthContext";
import { GameCard } from "../components/GameCard";
import "./DeveloperLanding.css";

function GameSeparator({ reverse = false, type = 'dark', variant = 'arcade' }: { reverse?: boolean, type?: 'dark' | 'light', variant?: 'arcade' | 'rpg' | 'platform' | 'puzzle' }) {
  // Fighting / Arcade (Street Fighter inspired)
  const arcades = [
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="1"><path d="M3,12 h10 v2 h-10 z M2,14 h12 v2 h-12 z M7,4 h2 v8 h-2 z M6,2 h4 v2 h-4 z M11,10 h2 v2 h-2 z M13,8 h2 v2 h-2 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="2"><path d="M1,4 h2 l2,5 l2,-5 h2 l-3,8 h-2 z M9,4 h5 v2 h-3 v2 h3 v4 h-5 v-2 h3 v-2 h-3 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="3"><path d="M10,4 h2 v8 h-2 z M12,6 h2 v4 h-2 z M6,4 h4 v8 h-4 z M4,6 h2 v4 h-2 z M2,7 h2 v2 h-2 z M0,7 h1 v2 h-1 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="4"><path d="M0,6 h16 v4 h-16 z M1,7 h14 v2 h-14 z" fill="currentColor" fillRule="evenodd"/><path d="M1,7 h6 v2 h-6 z" fill="currentColor"/></svg>
  ];
  
  // Creature / RPG (Pokémon inspired)
  const rpgs = [
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="1"><path d="M5,1 h6 v2 h-6 z M3,3 h10 v2 h-10 z M1,5 h4 v2 h-4 z M11,5 h4 v2 h-4 z M1,9 h4 v2 h-4 z M11,9 h4 v2 h-4 z M3,11 h2 v2 h-2 z M11,11 h2 v2 h-2 z M5,13 h6 v2 h-6 z M5,5 h6 v1 h-6 z M5,10 h6 v1 h-6 z M5,6 h1 v4 h-1 z M10,6 h1 v4 h-1 z M7,7 h2 v2 h-2 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="2"><path d="M8,1 h4 l-3,6 h4 l-8,8 v-5 h-3 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="3"><path d="M3,1 h10 v14 h-10 z M4,2 h8 v6 h-8 z" fill="currentColor" fillRule="evenodd"/><path d="M4,10 h3 v3 h-3 z M5,9 h1 v5 h-1 z M10,11 h2 v2 h-2 z M11,9 h2 v2 h-2 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="4"><path d="M7,1 h2 v2 h2 v2 h2 v4 h-2 v2 h-2 v2 h-2 v2 h-2 v-2 h-2 v-2 h-2 v-2 h-2 v-4 h2 v-2 h2 v-2 z M7,3 h2 v10 h-2 z M5,7 h6 v2 h-6 z" fill="currentColor" fillRule="evenodd"/></svg>
  ];
  
  // Jump & Run (Super Mario inspired)
  const platforms = [
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="1"><path d="M2,2 h12 v12 h-12 z M6,4 h6 v4 h-2 v2 h-4 v-2 h2 v-2 h-2 z M7,11 h2 v2 h-2 z M3,3 h1 v1 h-1 z M12,3 h1 v1 h-1 z M3,12 h1 v1 h-1 z M12,12 h1 v1 h-1 z" fill="currentColor" fillRule="evenodd"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="2"><path d="M5,2 h6 v2 h-6 z M3,4 h10 v2 h-10 z M1,6 h14 v4 h-14 z M3,10 h10 v2 h-10 z M5,12 h6 v4 h-6 z M4,6 h2 v2 h-2 z M10,6 h2 v2 h-2 z M7,4 h2 v2 h-2 z" fill="currentColor" fillRule="evenodd"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="3"><path d="M2,4 h12 v4 h-12 z M4,8 h8 v8 h-8 z M3,5 h1 v2 h-1 z M5,9 h1 v7 h-1 z" fill="currentColor" fillRule="evenodd"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="4"><path d="M5,1 h6 v2 h-6 z M3,3 h10 v10 h-10 z M5,13 h6 v2 h-6 z M6,4 h4 v8 h-4 z" fill="currentColor" fillRule="evenodd"/></svg>
  ];
  
  // Voxel / Sandbox (Minecraft inspired)
  const puzzles = [
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="1"><path d="M2,12 h2 v2 h-2 z M4,10 h2 v2 h-2 z M6,8 h2 v2 h-2 z M8,6 h2 v2 h-2 z M10,4 h2 v2 h-2 z M8,2 h2 v2 h-2 z M10,0 h4 v2 h-4 z M14,2 h2 v4 h-2 z M12,4 h2 v2 h-2 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="2"><path d="M2,12 h2 v2 h-2 z M4,10 h2 v2 h-2 z M6,8 h2 v2 h-2 z M8,6 h2 v2 h-2 z M10,4 h2 v2 h-2 z M12,2 h2 v2 h-2 z M14,0 h2 v2 h-2 z M10,6 h2 v2 h-2 z M6,10 h2 v2 h-2 z M4,14 h2 v2 h-2 z M0,10 h2 v2 h-2 z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="3"><path d="M2,2 h12 v12 h-12 z M3,4 h3 v3 h-3 z M10,4 h3 v3 h-3 z M6,8 h4 v2 h2 v4 h-2 v-2 h-4 v2 h-2 v-4 h2 z" fill="currentColor" fillRule="evenodd"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon" key="4"><path d="M2,3 h4 v2 h-4 z M10,3 h4 v2 h-4 z M1,5 h14 v4 h-14 z M3,9 h10 v2 h-10 z M5,11 h6 v2 h-6 z M7,13 h2 v2 h-2 z" fill="currentColor"/></svg>
  ];

  const iconSet = variant === 'arcade' ? arcades : variant === 'rpg' ? rpgs : variant === 'platform' ? platforms : puzzles;

  return (
    <div className={`game-marquee-container game-marquee-container--${type}`} aria-hidden="true">
      <div className={`game-marquee-track ${reverse ? 'reverse' : ''}`}>
        {[...Array(20)].map((_, i) => (
           <React.Fragment key={i}>
             {iconSet}
           </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function getPortalPath(hasOrganization: boolean): string {
  return hasOrganization
    ? "/dashboard"
    : "/onboarding";
}

function RandseedMark({
  className = "",
}: {
  className?: string;
}): React.ReactElement {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      role="img"
      aria-label="RandSeed"
    >
      <path
        fill="#f68532"
        d="M50 42C42 31 25 26 25 11c0-8 6-11 12-11 7 0 11 5 13 10 2-5 6-10 13-10 6 0 12 3 12 11 0 15-17 20-25 31Z"
      />
      <path
        fill="#39aaa1"
        d="M58 50c11-8 16-25 31-25 8 0 11 6 11 12 0 7-5 11-10 13 5 2 10 6 10 13 0 6-3 12-11 12-15 0-20-17-31-25Z"
      />
      <path
        fill="#2878c7"
        d="M50 58c8 11 25 16 25 31 0 8-6 11-12 11-7 0-11-5-13-10-2 5-6 10-13 10-6 0-12-3-12-11 0-15 17-20 25-31Z"
      />
      <path
        fill="#61369a"
        d="M42 50c-11 8-16 25-31 25C3 75 0 69 0 63c0-7 5-11 10-13-5-2-10-6-10-13 0-6 3-12 11-12 15 0 20 17 31 25Z"
      />
      <circle cx="50" cy="50" r="10" fill="#09090b" />
    </svg>
  );
}

const heroGames = [
  { 
    title: "Subway Surfers", 
    genre: "Endless Runner", 
    creator: "SYBO Games", 
    creatorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=SYBO",
    tone: "blue", 
    icon: Target, 
    mediaUrl: "https://storage.randseed.org/Creator/216x384-subway-surfers.mp4", 
    mediaType: "video" as const 
  },
  { 
    title: "Pro Shooter", 
    genre: "Action", 
    creator: "DevStudio", 
    creatorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=DevStudio",
    tone: "red", 
    icon: Target, 
    mediaUrl: "https://storage.randseed.org/Creator/proshooter.mp4", 
    mediaType: "video" as const 
  },
  { title: "Grid Run", genre: "Puzzle", creator: "Pixel Logic", creatorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pixel", tone: "cyan", icon: Gamepad2 },
  { title: "Crown Clash", genre: "Strategy", creator: "Epic Forge", creatorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Epic", tone: "blue", icon: Trophy },
  { title: "Orbit", genre: "Skill", creator: "Space Cats", creatorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Space", tone: "lime", icon: MousePointer2 },
];

function HeroGameDeck(): React.ReactElement {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(
      () => setActiveIndex((index) => (index + 1) % heroGames.length),
      2600,
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="hero-game-stage" aria-label="Featured game previews">
      <div className="hero-stage-glow" />
      {heroGames.map((game, index) => {
        const position =
          (index - activeIndex + heroGames.length) % heroGames.length;
        const Icon = game.icon;
        return (
          <GameCard
            className={`hero-game-card hero-game-card--${position}`}
            key={game.title}
            title={game.title}
            genre={game.genre}
            creator={game.creator}
            creatorAvatar={game.creatorAvatar}
            tone={game.tone}
            icon={game.icon}
            mediaUrl={game.mediaUrl}
            mediaType={game.mediaType}
          >
            <div
              aria-hidden={position > 2 ? "true" : "false"}
              style={{ display: "none" }}
            />
          </GameCard>
        );
      })}
    </div>
  );
}

const aiIterationFeatures = [
  {
    image: "https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&q=80&w=600",
    title: "AI Skills",
    text: "Integrate specialized AI capabilities directly into your workflow to automate complex development tasks.",
  },
  {
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=600",
    title: "Sandbox Environment",
    text: "Safely test and iterate on your game mechanics in a fully isolated, production-mirrored sandbox.",
  },
  {
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600",
    title: "Live Game Data",
    text: "Harness real-time analytics and player metrics to continuously refine and optimize your game.",
  },
];

const monetizationFeatures = [
  {
    icon: WalletCards,
    title: "In-App Purchases",
    text: "Seamlessly integrate virtual goods, battle passes, and premium content.",
  },
  {
    icon: CircleDollarSign,
    title: "Subscriptions",
    text: "Create recurring revenue streams with VIP tiers and exclusive benefits.",
  },
  {
    icon: Gift,
    title: "Tipping & Rewards",
    text: "Let players support you directly or earn from engagement-based rewards.",
  },
];

const showcaseGames = [
  { title: "Neon Dash", genre: "Arcade", creator: "DevStudio", tone: "violet", icon: Zap },
  { title: "Lucky Drop", genre: "Chance", creator: "Lucky Games", tone: "orange", icon: Gift },
  { title: "Grid Run", genre: "Puzzle", creator: "Pixel Logic", tone: "cyan", icon: Gamepad2 },
  { title: "Crown Clash", genre: "Strategy", creator: "Epic Forge", tone: "blue", icon: Trophy },
  { title: "Orbit", genre: "Skill", creator: "Space Cats", tone: "lime", icon: MousePointer2 },
  { title: "Vault 9", genre: "Adventure", creator: "Quest Labs", tone: "rose", icon: Layers3 },
];

import { SiteHeader } from "../components/SiteHeader";

export default function DeveloperLanding(): React.ReactElement {
  const { isSignedIn, organization, signIn } = useAuth();
  const navigate = useNavigate();
  const [isWalletConnectModalOpen, setWalletConnectModalOpen] = useState(false);
  const signInButtonRef = useRef<HTMLButtonElement>(null);

  function openPortal(): void {
    if (isSignedIn) {
      navigate(getPortalPath(Boolean(organization)));
      return;
    }
    setWalletConnectModalOpen(true);
  }

  function openSignInModal(): void {
    setWalletConnectModalOpen(true);
  }

  function handleWalletConnectClose(verifiedId?: string): void {
    setWalletConnectModalOpen(false);
    if (typeof verifiedId === "string") {
      signIn(verifiedId);
      navigate(getPortalPath(Boolean(organization)));
    }
    signInButtonRef.current?.focus();
  }

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Build on RandSeed �?Launch, Grow & Earn";
    document.documentElement.classList.add("developer-landing-active");
    return () => {
      document.title = previousTitle;
      document.documentElement.classList.remove("developer-landing-active");
    };
  }, []);

  return (
    <div className="developer-landing">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <SiteHeader />

      <main id="main-content">
        <section className="landing-hero">
          <div className="landing-hero__shape landing-hero__shape--one" />
          <div className="landing-hero__shape landing-hero__shape--two" />
          <div className="landing-container landing-hero__grid">
            <div className="landing-hero__copy">
              <h1 className="hero-title-effect">
                Games are an expression of your worldview
              </h1>
              <p className="landing-hero__lede">
                Launch faster, connect with players, and let real-time feedback shape your next hit
              </p>
            </div>
            <HeroGameDeck />
          </div>
        </section>

        <section className="capability-strip" aria-label="Platform capabilities">
          <div className="landing-container capability-strip__grid">
            <div>
              <strong>AI Loop</strong>
              <span>full integration cycle</span>
            </div>
            <div>
              <strong>Instant</strong>
              <span>from upload to publish</span>
            </div>
            <div>
              <strong>Monetize</strong>
              <span>flexible earning models</span>
            </div>
            <div>
              <strong>VRF</strong>
              <span>verifiable randomness</span>
            </div>
          </div>
        </section>        <GameSeparator type="dark" reverse variant="arcade" />
        {/* P2: The AI-Powered Iteration Loop */}
        <section className="landing-section landing-section--light" id="grow">
          <div className="landing-container">
            <div className="section-heading section-heading--center">
              <h2>End-to-End AI Integration</h2>
              <p>
                Structured APIs and rules that empower any AI toolchain to manage everything from initial code integration and testing to deployment and live data management.
              </p>
            </div>
            <div className="feature-grid">
              {aiIterationFeatures.map(({ image, title, text }, index) => (
                <article className="feature-card feature-card--with-image" key={title}>
                  <span className="feature-card__number">0{index + 1}</span>
                  <div className="feature-card__image-container">
                    <img src={image} alt={title} className="feature-card__image" />
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <GameSeparator type="dark" variant="platform" />
        {/* P3: From Concept to hit */}
        <section className="landing-section landing-section--light landing-section--process">
          <div className="landing-container process-layout">
            <div className="section-heading">
              <h2>
                Immediate release
                <br />
                No waiting period
              </h2>
              <p>
                Skip the lengthy review processes. Deploy your game instantly to
                a subset of players, gather actionable feedback, and scale to a
                massive audience the moment you're ready.
              </p>
              <button
                className="text-link"
                type="button"
                onClick={openSignInModal}
              >
                Launch your game <ArrowRight aria-hidden="true" />
              </button>
            </div>
            <ol className="process-list">
              <li>
                <span className="process-list__step">01</span>
                <div className="process-list__icon process-list__icon--image">
                  <img src="https://api.dicebear.com/9.x/pixel-art/svg?seed=Princess&backgroundColor=ffdfba" alt="Private Preview" />
                </div>
                <div>
                  <h3>Private Preview</h3>
                  <p>Invite a select audience to playtest, gather early reviews, and build your wishlist.</p>
                </div>
              </li>
              <li>
                <span className="process-list__step">02</span>
                <div className="process-list__icon process-list__icon--image">
                  <img src="https://api.dicebear.com/9.x/pixel-art/svg?seed=Knight&backgroundColor=baffc9" alt="Grey Release" />
                </div>
                <div>
                  <h3>Grey Release</h3>
                  <p>
                    Roll out to a controlled player base to safely test mechanics, balance, and stability.
                  </p>
                </div>
              </li>
              <li>
                <span className="process-list__step">03</span>
                <div className="process-list__icon process-list__icon--image">
                  <img src="https://api.dicebear.com/9.x/pixel-art/svg?seed=King&backgroundColor=bae1ff" alt="Scale to a Hit" />
                </div>
                <div>
                  <h3>Scale to a Hit</h3>
                  <p>
                    Launch globally with confidence and begin monetizing your polished game.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <GameSeparator type="light" reverse variant="rpg" />
        {/* P4: Support various in app purchase format */}
        <section className="landing-section landing-section--light" id="earn">
          <div className="landing-container">
            <div className="section-heading section-heading--center">
              <p className="landing-eyebrow">Flexible Monetization</p>
              <h2>
                Support various in-app purchase formats
              </h2>
              <p>
                Maximize your revenue with built-in tools that let you monetize
                exactly how you want—from traditional IAPs to modern creator
                support models.
              </p>
            </div>
            <div className="feature-grid">
              {monetizationFeatures.map(({ icon: Icon, title, text }, index) => (
                <article className="feature-card" key={title}>
                  <span className="feature-card__number">0{index + 1}</span>
                  <div className="feature-card__icon">
                    <Icon aria-hidden="true" />
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        
        <GameSeparator type="dark" variant="puzzle" />
        <section className="closing-cta" id="start">
          <div className="closing-cta__shape closing-cta__shape--one" />
          <div className="closing-cta__shape closing-cta__shape--two" />
          <div className="landing-container closing-cta__inner">
            <RandseedMark className="closing-cta__mark" />
            <h2>Your next game deserves real players.</h2>
            <p>
              Publish on RandSeed, get feedback from the community, and unlock
              new ways to grow and earn.
            </p>
            <div className="landing-actions">
              <button
                className="button button--light"
                type="button"
                onClick={openSignInModal}
              >
                Submit my game <ArrowRight aria-hidden="true" />
              </button>
            </div>
            <p className="closing-cta__tagline">
              Launch fast. Play fair. Earn together.
            </p>
          </div>
        </section>
      </main>

      <Footer />

      <WalletConnectModal
        isOpen={isWalletConnectModalOpen}
        onClose={handleWalletConnectClose}
      />
    </div>
  );
}
