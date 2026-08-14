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
import "./VisualNovelSection.css";
import { GithubLogo, CopilotLogo, ClaudeCodeLogo, CodexLogo, CursorLogo, AiStudioLogo } from "../assets/Logos";

function GameSeparator({ reverse = false, type = 'dark', variant = 'arcade' }: { reverse?: boolean, type?: 'dark' | 'light' | 'racing' | 'dating', variant?: 'arcade' | 'rpg' | 'platform' | 'puzzle' | 'racing' | 'dating' }) {
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

  
  const racings = [
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon marquee-pixel-icon--racing" key="1" style={{width: '32px', height: '32px'}}><rect width="8" height="8" fill="#fff"/><rect x="8" width="8" height="8" fill="#111"/><rect y="8" width="8" height="8" fill="#111"/><rect x="8" y="8" width="8" height="8" fill="#fff"/></svg>,
    <svg viewBox="0 0 16 16" className="marquee-pixel-icon marquee-pixel-icon--racing" key="2" style={{width: '32px', height: '32px'}}><rect width="8" height="8" fill="#fff"/><rect x="8" width="8" height="8" fill="#111"/><rect y="8" width="8" height="8" fill="#111"/><rect x="8" y="8" width="8" height="8" fill="#fff"/></svg>
  ];
  
  // Dating Sim inspired
  const datings = [
    <svg viewBox="0 0 24 24" className="marquee-pixel-icon" key="1" style={{width: '28px', height: '28px'}}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 24 24" className="marquee-pixel-icon" key="2" style={{width: '28px', height: '28px'}}><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 24 24" className="marquee-pixel-icon" key="3" style={{width: '28px', height: '28px'}}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" fill="currentColor"/></svg>,
    <svg viewBox="0 0 24 24" className="marquee-pixel-icon" key="4" style={{width: '28px', height: '28px'}}><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1h-4v-2h4zM9 4c.55 0 1 .45 1 1h-4c0-.55.45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z" fill="currentColor"/></svg>
  ];

  const iconSet = variant === 'arcade' ? arcades : variant === 'rpg' ? rpgs : variant === 'platform' ? platforms : variant === 'racing' ? racings : variant === 'dating' ? datings : puzzles;
  
  return (
    <div className={`game-marquee-container game-marquee-container--${type}`} aria-hidden="true">
      <div className={`game-marquee-track ${reverse ? 'reverse' : ''}`}>
        {[...Array(60)].map((_, i) => (
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
    image: "/websitesection2.1.webp",
    imagePosition: "center 20%",
    title: "Plug-and-Play AI Skills",
    text: "Effortlessly connect our SDKs and structured API specs to your choice of AI IDE, feeding standard game rules and API schemas directly into your LLM toolchain.",
    logos: [
      { name: "AI Studio", icon: <AiStudioLogo size={24} /> },
      { name: "Copilot", icon: <CopilotLogo size={24} /> },
      { name: "Claude Code", icon: <ClaudeCodeLogo size={24} /> },
      { name: "Cursor", icon: <CursorLogo size={24} /> },
      { name: "OpenAI", icon: <CodexLogo size={24} /> }
    ]
  },
  {
    image: "/websitesection2,2new-1.webp",
    title: "Instant Preview",
    text: "Streamline your dev loop directly from GitHub to browser. Test AI-generated game code safely inside our lightweight iframe-based sandbox environment.",
    logos: [
      { name: "GitHub", icon: <GithubLogo size={24} /> }
    ]
  },
  {
    image: "/websitesection2.3.webp",
    title: "Real-Time Data & Tailored Analytics",
    text: "Build, customize, and export custom reporting dashboards to track player engagement, game performance metrics,—giving you and your AI agent the exact insights needed to continuously optimize game.",
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



function TachometerWidget() {
  const [rpm, setRpm] = React.useState(0);
  
  React.useEffect(() => {
    let animationFrameId;
    let startTime = Date.now();
    const duration = 4000;
    
    const keyframes = [
      { time: 0, rpm: 0.1 },
      { time: 0.2, rpm: 0.75 },
      { time: 0.35, rpm: 0.3 },
      { time: 0.55, rpm: 0.95 },
      { time: 0.65, rpm: 0.8 },
      { time: 0.85, rpm: 0.1 },
      { time: 1.0, rpm: 0.1 }
    ];

    function animate() {
      const now = Date.now();
      let t = ((now - startTime) % duration) / duration;
      let currentRpm = 0.1;
      for (let i = 0; i < keyframes.length - 1; i++) {
        const k1 = keyframes[i];
        const k2 = keyframes[i + 1];
        if (t >= k1.time && t <= k2.time) {
          const progress = (t - k1.time) / (k2.time - k1.time);
          const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
          currentRpm = k1.rpm + (k2.rpm - k1.rpm) * ease;
          break;
        }
      }
      setRpm(currentRpm);
      animationFrameId = requestAnimationFrame(animate);
    }
    animate();
    
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const displayRpm = (rpm * 10).toFixed(1);
  const needleRotation = -120 + (rpm * 240);

  return (
    <div className="racing-hud__tachometer">
      <svg viewBox="0 0 200 200" className="racing-hud__gauge">
        <circle cx="100" cy="100" r="90" fill="rgba(0,0,0,0.6)" stroke="#333" strokeWidth="4"/>
        <path d="M 40 160 A 85 85 0 1 1 160 160" fill="none" stroke="#fff" strokeWidth="10" strokeDasharray="2 12" />
        <path d="M 140 50 A 85 85 0 0 1 160 160" fill="none" stroke="#ff003c" strokeWidth="10" />
        <text x="100" y="110" fill="#fff" fontSize="48" fontWeight="900" fontStyle="italic" textAnchor="middle">{displayRpm}</text>
        <text x="100" y="135" fill="#a1a1aa" fontSize="14" fontWeight="bold" textAnchor="middle">x1000 RPM</text>
        <g style={{ transform: `rotate(${needleRotation}deg)`, transformOrigin: '100px 100px' }}>
          <circle cx="100" cy="100" r="8" fill="#ff003c" />
          <polygon points="96,100 104,100 100,25" fill="#ff003c" />
        </g>
      </svg>
    </div>
  );
}

function RacingHUD() {
  const [rpm, setRpm] = React.useState(0);
  
  React.useEffect(() => {
    let animationFrameId;
    let startTime = Date.now();
    const duration = 4000;
    
    const keyframes = [
      { time: 0, rpm: 0.1 },
      { time: 0.2, rpm: 0.75 },
      { time: 0.35, rpm: 0.3 },
      { time: 0.55, rpm: 0.95 },
      { time: 0.65, rpm: 0.8 },
      { time: 0.85, rpm: 0.1 },
      { time: 1.0, rpm: 0.1 }
    ];

    function animate() {
      const now = Date.now();
      let t = ((now - startTime) % duration) / duration;
      let currentRpm = 0.1;
      for (let i = 0; i < keyframes.length - 1; i++) {
        const k1 = keyframes[i];
        const k2 = keyframes[i + 1];
        if (t >= k1.time && t <= k2.time) {
          const progress = (t - k1.time) / (k2.time - k1.time);
          const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
          currentRpm = k1.rpm + (k2.rpm - k1.rpm) * ease;
          break;
        }
      }
      setRpm(currentRpm);
      animationFrameId = requestAnimationFrame(animate);
    }
    animate();
    
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const displaySpeed = Math.floor(180 + rpm * 80);
  const gear = rpm < 0.4 ? 4 : rpm < 0.8 ? 5 : 6;

  return (
    <div className="racing-hud">
      <div className="racing-hud__speedometer">
        <svg viewBox="0 0 200 200" className="racing-hud__gauge">
          <circle cx="100" cy="100" r="90" fill="rgba(0,0,0,0.6)" stroke="#333" strokeWidth="4"/>
          <path d="M 30 150 A 90 90 0 1 1 170 150" fill="none" stroke="#ff003c" strokeWidth="8" strokeLinecap="round" strokeDasharray="300" strokeDashoffset="100" />
          <text x="100" y="110" fill="#fff" fontSize="48" fontWeight="900" fontStyle="italic" textAnchor="middle">{displaySpeed}</text>
          <text x="100" y="135" fill="#a1a1aa" fontSize="14" fontWeight="bold" textAnchor="middle">KM/H</text>
          <text x="145" y="80" fill="#ff003c" fontSize="24" fontWeight="900" fontStyle="italic">{gear}</text>
        </svg>
      </div>
    </div>
  );
}


export default function DeveloperLanding(): React.ReactElement {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isWalletConnectModalOpen, setIsWalletConnectModalOpen] = useState(false);

  const openSignInModal = () => {
    if (user) {
      navigate(getPortalPath(true));
    } else {
      setIsWalletConnectModalOpen(true);
    }
  };

  const handleWalletConnectClose = () => {
    setIsWalletConnectModalOpen(false);
  };

  return (
    <div className="landing-page">
      <SiteHeader />
      <main>
        {/* P1: Hero section */}
        <section className="landing-hero" id="home">
          <div className="landing-container">
            <div className="landing-hero__grid">
              
              <div className="landing-hero__copy">
                <h1>
                  <span className="text-[32px] font-semibold text-black">Games Reflect How You See the World.</span>
                </h1>
                
                <p className="landing-hero__lede text-[24px] font-semibold text-black">
                  Launch faster, connect with players, and let real-time feedback shape your next hit
                </p>


              </div>
              
              <HeroGameDeck />
            </div>
          </div>
        </section>

        <section className="capability-strip" aria-label="Platform capabilities" style={{ backgroundColor: '#000', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', overflow: 'hidden', transform: 'translateY(-99%)' }}>
            <svg viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ width: '100%', height: '50px', display: 'block' }}>
              <path fill="#000" d="M0,60 C320,180, 420,-60, 1440,60 L1440,120 L0,120 Z" />
            </svg>
          </div>
          <div className="landing-container capability-strip__grid">
            <div>
              <strong style={{ fontSize: '16px', fontWeight: 600 }}>Full AI<br />Integration</strong>
            </div>
            <div>
              <strong style={{ fontSize: '16px', fontWeight: 600 }}>Instant<br />Publishing</strong>
            </div>
            <div>
              <strong style={{ fontSize: '16px', fontWeight: 600 }}>In-App<br />Purchase</strong>
            </div>
            <div>
              <strong style={{ fontSize: '16px', fontWeight: 600 }}>Public Verifiable<br />Randomness</strong>
            </div>
          </div>
        </section>

        <GameSeparator type="racing" variant="racing" />
        
        {/* P2: The AI-Powered Iteration Loop */}
        <section className="landing-section landing-section--racing" id="grow">
<div className="landing-container relative-z">
            <div className="section-heading section-heading--center">
              <h2>End-to-End AI Integration</h2>
              <p>
                Structured APIs and rules that empower any AI toolchain to manage everything from initial code integration and testing to deployment and live data management.
              </p>
            </div>
            <div className="feature-grid">
              {aiIterationFeatures.map(({ image, imagePosition, title, text, logos }, index) => (
                <div key={title} style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  {index === 0 && <TachometerWidget />}
                  {index === aiIterationFeatures.length - 1 && <RacingHUD />}
                  <article className="feature-card feature-card--with-image" style={{ flex: 1 }}>
                  <span className="feature-card__number">0{index + 1}</span>
                  <div className="feature-card__image-container">
                    <img src={image} alt={title} className="feature-card__image" style={imagePosition ? { objectPosition: imagePosition } : undefined} referrerPolicy="no-referrer" />
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  {logos && (
                    <div style={{ display: 'flex', gap: '16px', marginTop: '16px', alignItems: 'center' }}>
                      {logos.map((logo) => (
                        <div key={logo.name} title={logo.name} style={{ color: 'var(--text-secondary, #666)' }}>
                          {logo.icon}
                        </div>
                      ))}
                    </div>
                  )}
                </article>
                </div>
              ))}
            </div>
          </div>
        </section>

        <GameSeparator type="dating" reverse variant="dating" />
        {/* P3: From Concept to hit */}
        <section className="vn-themed-section" id="release">
          <div className="landing-container vn-layout">
            <ol className="vn-process-list">
              <li className="vn-list-item">
                <div className="vn-step-plate"><span>01</span></div>
                <div className="vn-step-avatar">
                  <span className="vn-mystery-icon">💖</span>
                </div>
                <div className="vn-list-content">
                  <h3>Private Preview</h3>
                  <p>Invite a select audience to playtest, gather early reviews, and build your wishlist.</p>
                </div>
                <div className="vn-decorations">
                  <div className="vn-heart vn-heart-1">🤍</div>
                  <div className="vn-heart vn-heart-2">💛</div>
                  <div className="vn-heart vn-heart-3">🤍</div>
                </div>
              </li>
              <li className="vn-list-item">
                <div className="vn-step-plate"><span>02</span></div>
                <div className="vn-step-avatar">
                  <span className="vn-mystery-icon">💖<span style={{ fontSize: '14px', marginLeft: '2px', fontWeight: 600 }}>x2</span></span>
                </div>
                <div className="vn-list-content">
                  <h3>Grey Release</h3>
                  <p>
                    Roll out to a controlled player base to safely test mechanics, balance, and stability.
                  </p>
                </div>
                <div className="vn-decorations">
                  <div className="vn-heart vn-heart-1">🤍</div>
                  <div className="vn-heart vn-heart-2">💛</div>
                  <div className="vn-heart vn-heart-3">🤍</div>
                </div>
              </li>
              <li className="vn-list-item">
                <div className="vn-step-plate"><span>03</span></div>
                <div className="vn-step-avatar">
                  <span className="vn-mystery-icon">💖<span style={{ fontSize: '14px', marginLeft: '2px', fontWeight: 600 }}>x3</span></span>
                </div>
                <div className="vn-list-content">
                  <h3>Scale to a Hit</h3>
                  <p>
                    Launch globally with confidence and begin monetizing your polished game.
                  </p>
                </div>
                <div className="vn-decorations">
                  <div className="vn-heart vn-heart-1">🤍</div>
                  <div className="vn-heart vn-heart-2">💛</div>
                  <div className="vn-heart vn-heart-3">🤍</div>
                </div>
              </li>
            </ol>
            <div className="vn-hero-row">
              <div className="vn-character-col">
                <img src="https://storage.randseed.org/Creator/section3.png" alt="VN Character" className="vn-character-sprite" />
              </div>
              <div className="vn-content-col">
                <div className="vn-heading-box">
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
                </div>
              </div>
            </div>
            <button
              className="vn-btn"
              type="button"
            >
              Your life is about to change 
              <span className="vn-btn-heart-container">
                🤍
                <span className="vn-bubble-heart">🤍</span>
                <span className="vn-bubble-heart">🤍</span>
                <span className="vn-bubble-heart">🤍</span>
                <span className="vn-bubble-heart">🤍</span>
                <span className="vn-bubble-heart">🤍</span>
              </span>
            </button>
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
