import React, { useState, useEffect } from "react";
import "./CreatorGuide.css";
import { SiteHeader } from "../../components/SiteHeader";
import { Menu, X } from "lucide-react";

export default function CreatorGuide() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("welcome");
  const [activeTitle, setActiveTitle] = useState("Welcome to RandSeed");

  useEffect(() => {
    const handleScroll = () => {
      const headings = Array.from(document.querySelectorAll('section[id], h3[id], h4[id], p[id], div[id]'));
      let active = null;
      for (const heading of headings) {
        const rect = heading.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.45) {
          active = heading.id;
        }
      }
      if (active) {
        setActiveSection(active);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const activeLink = document.querySelector(`.guide-sidebar a[href="#${activeSection}"]`);
    const sidebar = document.querySelector('.guide-nav');
    if (activeLink && sidebar) {
      const linkRect = activeLink.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();
      
      if (linkRect.top < sidebarRect.top || linkRect.bottom > sidebarRect.bottom) {
        sidebar.scrollTo({
          top: sidebar.scrollTop + linkRect.top - sidebarRect.top - (sidebarRect.height / 2) + (linkRect.height / 2),
          behavior: 'smooth'
        });
      }
      setActiveTitle(activeLink.textContent || "Contents");
    }
  }, [activeSection]);

  const handleNavClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setActiveSection(id);
    setIsMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - (window.innerHeight * 0.25);
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const NavLinks = () => {
    const isWelcomeActive = ['welcome', 'code-to-game', 'start-creating', 'community', 'monetization', 'vrf', 'funding', 'why-no-ai'].includes(activeSection);
    const isGetStartedActive = activeSection.startsWith('get-started');
    const isSecurityActive = ['security', 'pre-launch'].includes(activeSection);
    const isSdkActive = activeSection.startsWith('sdk');

    return (
      <ul className="flex flex-col gap-4 m-0 p-0 list-none text-sm">
        <li className="font-bold text-gray-900">
          <a href="#welcome" onClick={(e) => handleNavClick(e, 'welcome')} className={`nav-link font-bold ${activeSection === 'welcome' ? 'active' : ''}`}>Welcome to RandSeed</a>
          {isWelcomeActive && (
            <ul className="flex flex-col gap-1 ml-4 list-none border-l border-gray-200 pl-2 font-normal">
              <li><a href="#code-to-game" onClick={(e) => handleNavClick(e, 'code-to-game')} className={`nav-link ${activeSection === 'code-to-game' ? 'active' : ''}`}>From Code to Playable Game</a></li>
              <li><a href="#start-creating" onClick={(e) => handleNavClick(e, 'start-creating')} className={`nav-link ${activeSection === 'start-creating' ? 'active' : ''}`}>Start Creating Faster</a></li>
              <li><a href="#community" onClick={(e) => handleNavClick(e, 'community')} className={`nav-link ${activeSection === 'community' ? 'active' : ''}`}>Built-in Player & Community Capabilities</a></li>
              <li><a href="#monetization" onClick={(e) => handleNavClick(e, 'monetization')} className={`nav-link ${activeSection === 'monetization' ? 'active' : ''}`}>Native Micro-Crypto Commercialization</a></li>
              <li><a href="#vrf" onClick={(e) => handleNavClick(e, 'vrf')} className={`nav-link ${activeSection === 'vrf' ? 'active' : ''}`}>Fair Gaming & Randomness (VRF)</a></li>
              <li><a href="#funding" onClick={(e) => handleNavClick(e, 'funding')} className={`nav-link ${activeSection === 'funding' ? 'active' : ''}`}>Creator Seed Funding</a></li>
              <li><a href="#why-no-ai" onClick={(e) => handleNavClick(e, 'why-no-ai')} className={`nav-link ${activeSection === 'why-no-ai' ? 'active' : ''}`}>Why don't we provide an AI interface to generate games from prompts?</a></li>
            </ul>
          )}
        </li>
        <li className="font-bold text-gray-900">
          <a href="#get-started" onClick={(e) => handleNavClick(e, 'get-started')} className={`nav-link font-bold ${activeSection === 'get-started' ? 'active' : ''}`}>Get Started</a>
          {isGetStartedActive && (
            <ul className="flex flex-col gap-1 ml-4 list-none border-l border-gray-200 pl-2 font-normal">
              <li>
                <a href="#get-started-create" onClick={(e) => handleNavClick(e, 'get-started-create')} className={`nav-link ${activeSection === 'get-started-create' ? 'active' : ''}`}>1. Create Game</a>
                {activeSection.startsWith('get-started-create') && (
                  <ul className="flex flex-col gap-1 ml-4 list-none border-l border-gray-200 pl-2">
                    <li><a href="#get-started-create-quick" onClick={(e) => handleNavClick(e, 'get-started-create-quick')} className={`nav-link ${activeSection === 'get-started-create-quick' ? 'active' : ''}`} style={{fontSize: '13px'}}>Quick Start: Conceptualize your game and prototype with AI tools</a></li>
                  </ul>
                )}
              </li>
              <li>
                <a href="#get-started-architecture" onClick={(e) => handleNavClick(e, 'get-started-architecture')} className={`nav-link ${activeSection === 'get-started-architecture' ? 'active' : ''}`}>2. Choose Your Game Architecture</a>
                {activeSection.startsWith('get-started-architecture') && (
                  <ul className="flex flex-col gap-1 ml-4 list-none border-l border-gray-200 pl-2">
                    <li><a href="#get-started-architecture-static" onClick={(e) => handleNavClick(e, 'get-started-architecture-static')} className={`nav-link ${activeSection === 'get-started-architecture-static' ? 'active' : ''}`} style={{fontSize: '13px'}}>A. Static Game / Zero-Ops Backend</a></li>
                    <li><a href="#get-started-architecture-self" onClick={(e) => handleNavClick(e, 'get-started-architecture-self')} className={`nav-link ${activeSection === 'get-started-architecture-self' ? 'active' : ''}`} style={{fontSize: '13px'}}>B. Self-Hosted Backend</a></li>
                  </ul>
                )}
              </li>
              <li>
                <a href="#get-started-release" onClick={(e) => handleNavClick(e, 'get-started-release')} className={`nav-link ${activeSection === 'get-started-release' ? 'active' : ''}`}>3. From Creation to Private Release</a>
                {activeSection.startsWith('get-started-release') && (
                  <ul className="flex flex-col gap-1 ml-4 list-none border-l border-gray-200 pl-2">
                    <li><a href="#get-started-release-step1" onClick={(e) => handleNavClick(e, 'get-started-release-step1')} className={`nav-link ${activeSection === 'get-started-release-step1' ? 'active' : ''}`} style={{fontSize: '13px'}}>Step 1: Activate Creator Identity</a></li>
                    <li><a href="#get-started-release-step2" onClick={(e) => handleNavClick(e, 'get-started-release-step2')} className={`nav-link ${activeSection === 'get-started-release-step2' ? 'active' : ''}`} style={{fontSize: '13px'}}>Step 2: Create Game and Prepare Project</a></li>
                    <li><a href="#get-started-release-step3" onClick={(e) => handleNavClick(e, 'get-started-release-step3')} className={`nav-link ${activeSection === 'get-started-release-step3' ? 'active' : ''}`} style={{fontSize: '13px'}}>Step 3: Connect Code Repository</a></li>
                    <li><a href="#get-started-release-step4" onClick={(e) => handleNavClick(e, 'get-started-release-step4')} className={`nav-link ${activeSection === 'get-started-release-step4' ? 'active' : ''}`} style={{fontSize: '13px'}}>Step 4: Integrate Player System and Payments</a></li>
                    <li><a href="#get-started-release-step5" onClick={(e) => handleNavClick(e, 'get-started-release-step5')} className={`nav-link ${activeSection === 'get-started-release-step5' ? 'active' : ''}`} style={{fontSize: '13px'}}>Step 5: Debug in Sandbox</a></li>
                    <li><a href="#get-started-release-step6" onClick={(e) => handleNavClick(e, 'get-started-release-step6')} className={`nav-link ${activeSection === 'get-started-release-step6' ? 'active' : ''}`} style={{fontSize: '13px'}}>Step 6: Create Private Link</a></li>
                  </ul>
                )}
              </li>
            </ul>
          )}
        </li>
        <li className="font-bold text-gray-900 mt-2">
          <a href="#security" onClick={(e) => handleNavClick(e, 'security')} className={`nav-link font-bold ${activeSection === 'security' ? 'active' : ''}`}>Security and Publishing Recommendations</a>
          {isSecurityActive && (
            <ul className="flex flex-col gap-1 ml-4 list-none border-l border-gray-200 pl-2 font-normal">
              <li><a href="#pre-launch" onClick={(e) => handleNavClick(e, 'pre-launch')} className={`nav-link ${activeSection === 'pre-launch' ? 'active' : ''}`}>Creator Pre-Launch Checklist</a></li>
            </ul>
          )}
        </li>
        <li className="font-bold text-gray-900 mt-2">
          <a href="#public-release" onClick={(e) => handleNavClick(e, 'public-release')} className={`nav-link font-bold ${activeSection === 'public-release' ? 'active' : ''}`}>Public Release</a>
        </li>
        <li className="font-bold text-gray-900 mt-2">
          <a href="#sdk" onClick={(e) => handleNavClick(e, 'sdk')} className={`nav-link font-bold ${activeSection === 'sdk' ? 'active' : ''}`}>SDK Capabilities</a>
          {isSdkActive && (
            <ul className="flex flex-col gap-1 ml-4 list-none border-l border-gray-200 pl-2 font-normal">
              <li><a href="#sdk-lifecycle" onClick={(e) => handleNavClick(e, 'sdk-lifecycle')} className={`nav-link ${activeSection === 'sdk-lifecycle' ? 'active' : ''}`}>Lifecycle</a></li>
              <li><a href="#sdk-identity" onClick={(e) => handleNavClick(e, 'sdk-identity')} className={`nav-link ${activeSection === 'sdk-identity' ? 'active' : ''}`}>Player Identity</a></li>
              <li><a href="#sdk-cloud-save" onClick={(e) => handleNavClick(e, 'sdk-cloud-save')} className={`nav-link ${activeSection === 'sdk-cloud-save' ? 'active' : ''}`}>Cloud Save</a></li>
              <li><a href="#sdk-commercialization" onClick={(e) => handleNavClick(e, 'sdk-commercialization')} className={`nav-link ${activeSection === 'sdk-commercialization' ? 'active' : ''}`}>Commercialization</a></li>
              <li><a href="#sdk-leaderboard" onClick={(e) => handleNavClick(e, 'sdk-leaderboard')} className={`nav-link ${activeSection === 'sdk-leaderboard' ? 'active' : ''}`}>Leaderboard & Rewards</a></li>
              <li><a href="#sdk-analytics" onClick={(e) => handleNavClick(e, 'sdk-analytics')} className={`nav-link ${activeSection === 'sdk-analytics' ? 'active' : ''}`}>Analytics</a></li>
            </ul>
          )}
        </li>
      </ul>
    );
  };

  return (
    <div className="creator-guide relative">
      <SiteHeader />
      <main className="guide-main">
        {/* Desktop Sidebar */}
        <div className="guide-sidebar hidden lg:block">
          <nav className="guide-nav sticky top-[112px]">
            {NavLinks()}
          </nav>
        </div>

        {/* Content */}
        <div className="guide-content pb-24">
          <h1 className="text-[24px] font-bold tracking-tight mb-8 text-[#1a1a1a]">From Creation to Game Revenue</h1>
          
          <section id="welcome" className="mb-16">
            <h2 className="text-[20px] font-bold tracking-tight mb-6">Welcome to RandSeed</h2>
            <p className="text-[14px] text-[#242424] mb-10 ">
              RandSeed Creator is an open game platform tailored for AI game creators, helping AI Game Creators bring their games to players faster. You can quickly deploy code into playable Web games, integrating player systems, social features, payments, and provably fair random capabilities. When your game requires more complex server-side logic, you can also connect your own infrastructure.
            </p>
            <div className="guide-card mt-8">
              <h3 className="text-[18px] font-bold tracking-tight mb-4">RandSeed Game Suite</h3>
              <p className="text-[14px] text-[#242424] leading-[1.7] mb-4 ">Let creators focus purely on gameplay mechanics and AI collaboration, we handle the rest of the infrastructure.</p>
              <ul className="space-y-3 list-disc pl-5 text-[14px] text-[#242424] leading-[1.7] ">
                <li><strong>Zero-Ops Backend Integration:</strong> Pure static Web games work out-of-the-box, connecting directly to platform identity, cloud saves, payment gateways, and leaderboards without setting up cloud services.</li>
                <li><strong>From Git to Instant Play:</strong> Seamlessly bind GitHub repositories. Code commits automatically trigger cloud builds, deployment testing, and instant previews.</li>
                <li><strong>Native Platform-Level Player Experience:</strong> The platform centrally hosts single sign-on (SSO), player wallets/balances, floating back buttons, and lightweight interactive components.</li>
                <li><strong>Controlled Private Playtesting:</strong> Bypass platform review and distribute immutable versions to target players via exclusive Private Links. Direct commercial monetization is enabled even during playtesting.</li>
                <li><strong>Built-in Feedback Channel:</strong> Feature structured feedback and rating systems during playtesting, helping you rapidly validate gameplay and collect authentic suggestions within a small user group.</li>
                <li><strong>Automated Public Release:</strong> Bid farewell to black-box publishing. Once a game hits baseline metrics (10 valid playtest players + a 5/10 approval rating), it automatically graduates to the official public lobby.</li>
                <li><strong>Full-Stack Architecture Seamless Extension:</strong> Support mature teams in retaining self-built authoritative game servers, integrating order validation, item delivery, and matchmaking leaderboards via standardized server APIs.</li>
                <li><strong>Built-in Cold Start Traffic Pool:</strong> Feature a built-in Game Bounties mechanism and player achievement incentives subsidized by the platform to quickly match you with your first batch of real playtesters.</li>
              </ul>
            </div>
          </section>

          <div id="code-to-game" className="mt-12 mb-8">
            <h3 className="text-[18px] font-bold tracking-tight mb-4">From Code to Playable Game</h3>
            <ul className="space-y-3 list-disc pl-5 text-[14px] text-[#242424] leading-[1.7] ">
              <li><strong>One-Click Integration & Automated Deployment:</strong> Connect code repositories, build, and publish games without setting up custom delivery pipelines.</li>
              <li><strong>Free Hosted Backend Capabilities:</strong> Out-of-the-box services for common game scenarios, allowing creators to run games without managing servers initially.</li>
              <li><strong>Retain Technical Flexibility:</strong> Professional teams can still host their own authoritative game servers to implement more complex logic.</li>
            </ul>
          </div>
          
          <div id="start-creating" className="mt-12 mb-8">
            <h3 className="text-[18px] font-bold tracking-tight mb-4">Start Creating Faster</h3>
            <ul className="space-y-3 list-disc pl-5 text-[14px] text-[#242424] leading-[1.7] ">
              <li><strong>Game Templates:</strong> Access common gameplay templates to minimize project initialization costs.</li>
              <li><strong>Platform SDK:</strong> A unified SDK to integrate identity, cloud saves, social, payments, leaderboards, etc., eliminating the need to reinvent the wheel for every feature.</li>
              <li><strong>AI-Oriented Context & Skills:</strong> Help tools like Cursor and Claude Code understand platform interfaces, template structures, and publishing workflows.</li>
            </ul>
          </div>

          <div id="community" className="mt-12 mb-8">
            <h3 className="text-[18px] font-bold tracking-tight mb-4">Built-in Player & Community Capabilities</h3>
            <ul className="space-y-2 list-disc pl-5 mb-6 text-[14px] text-[#242424] leading-[1.7] ">
              <li>Player identity and account systems</li>
              <li>Game progress, achievements, and honor saves</li>
              <li>Leaderboards</li>
              <li>Chat</li>
              <li>Game reviews</li>
              <li>Multiplayer matchmaking</li>
            </ul>
            <p className="text-[#3b3b42] italic">
              Creators can channel their energy into gameplay, content, and community operations rather than setting up accounts, databases, and social infrastructure first.
            </p>
          </div>

          <div id="monetization" className="mt-12 mb-8">
            <h3 className="text-[18px] font-bold tracking-tight mb-4">Native Micro-Crypto Commercialization</h3>
            <ul className="space-y-3 list-disc pl-5 text-[14px] text-[#242424] leading-[1.7] ">
              <li>Support stablecoin payments, lowering the friction of microtransactions.</li>
              <li>Support Creator Tokens for community incentives, premium content, or exclusive privileges.</li>
              <li>Optimized for in-game microtransactions, perfectly matching chapter unlocks, items, tips, tournament registration, and more.</li>
            </ul>
          </div>

          <div id="vrf" className="mt-12 mb-8">
            <h3 className="text-[18px] font-bold tracking-tight mb-4">Fair Gaming & Randomness (VRF)</h3>
            <ul className="space-y-3 list-disc pl-5 text-[14px] text-[#242424] leading-[1.7] ">
              <li>Provide Verifiable Random Function (VRF) interfaces.</li>
              <li>Players can verify random outcomes themselves, rather than blindly trusting the game server.</li>
              <li>Serves as the bedrock for fair draws, probability-based gameplay, competitive resolution, and betting games.</li>
              <li>Separate compliance, risk control, regional restrictions, and responsible gaming requirements will apply to betting scenarios.</li>
            </ul>
          </div>

          <div id="funding" className="mt-12 mb-8">
            <h3 className="text-[18px] font-bold tracking-tight mb-4">Creator Seed Funding</h3>
            <ul className="space-y-3 list-disc pl-5 text-[14px] text-[#242424] leading-[1.7] ">
              <li><strong>New Game Bounties:</strong> Launch incentives for qualifying new games, templates, gameplay experiments, or ecosystem contributions.</li>
              <li><strong>Player Rewards</strong> can be tied to milestones like launch, retention, player feedback, transaction volume, or community contributions.</li>
            </ul>
          </div>

          <div id="why-no-ai" className="mt-12 mb-8">
            <h3 className="text-[18px] font-bold tracking-tight mb-4">Why don't we provide an AI interface to generate games from prompts?</h3>
            <p className="text-[14px] text-[#242424] leading-[1.7] mb-6 ">
              In designing RandSeed Creator, we clearly defined our product boundaries: we focus on game distribution, monetization, and player interaction infrastructure, rather than building an end-to-end generative AI game maker.
            </p>
            <p className="text-[14px] text-[#242424] leading-[1.7] mb-6 ">This strategic choice is grounded in our three core beliefs about game development and our target audience:</p>
            
            <ol className="guide-steps space-y-6 text-[14px] text-[#242424] leading-[1.7] ">
              <li>
                <strong>The barrier to great games lies in personalized design, not generated randomness.</strong><br/>
                Prompts can generate a Brick Breaker or Snake prototype in seconds, but they cannot build a mature title with long-term retention, closed-loop math economies, and a unique audiovisual identity. Engaging games depend on granular mechanic design, precisely curated and edited audio, and cohesive art styles—all of which demand the creator's active intent and iterative polishing.
              </li>
              <li>
                <strong>Respect mature and diverse creator toolchains.</strong><br/>
                Our target users are semi-professional independent developers and high-potential creators. Within this community, everyone has their own established workflow—often combining specific game engines, local IDEs (like VS Code/Cursor), digital audio workstations, and custom-chosen AI assistants. Forcing a closed, natural-language-based "in-browser generator" would only restrict professional creators' flexibility.
              </li>
              <li>
                <strong>Solve the industry's real pain points: publishing, cold start, and player connection.</strong><br/>
                For independent creators with development capabilities, the bottleneck is never "writing the first runnable webpage." The true hurdles lie in the subsequent phases:
                <ul className="mt-4 list-disc pl-5 space-y-2">
                  <li><strong>Engineering friction:</strong> How can static games connect to accounts, payments, leaderboards, and cloud saves without server management?</li>
                  <li><strong>Cold start desert:</strong> How can a new game find its first 10–20 real players to gather meaningful feedback and reviews?</li>
                  <li><strong>Distribution and monetization:</strong> How can creators achieve instant global settlement while bypassing storefronts' heavy commission fees and grueling payout delays?</li>
                </ul>
              </li>
            </ol>
            
            <div className="bg-[#f3e8ff] text-[var(--portal-purple)] p-6 rounded-xl mt-8 font-medium">
              RandSeed's mission is to be the silent publisher and operations engine behind creators—you keep the creative tools you love, and we provide a frictionless publishing pipeline, automated playtesting environments, and a built-in player ecosystem with preloaded incentives.
            </div>
          </div>

          <section id="get-started" className="mb-16 pt-8 border-t border-gray-200">
            <h2 className="text-[20px] font-bold tracking-tight mb-6">Get Started</h2>
            
            <h3 id="get-started-create" className="text-[18px] font-bold tracking-tight mb-4 mt-8">1. Create Game</h3>
            <p id="get-started-create-quick" className="text-[14px] text-[#242424] leading-[1.7] mb-4 "><strong>Quick Start:</strong> Conceptualize your game and prototype with AI tools</p>
            <ul className="space-y-2 list-disc pl-5 mb-8 text-[14px] text-[#242424] leading-[1.7] ">
              <li>Choose a game genre or template from the RandSeed Template Library.</li>
              <li>Modify gameplay, visuals, and content in your favorite AI tools.</li>
              <li>Connect your game's code repository with your AI tools.</li>
              <li>Every game should use an independent code repository to facilitate automated deployment and testing.</li>
            </ul>

            <h3 id="get-started-architecture" className="text-[18px] font-bold tracking-tight mb-4">2. Choose Your Game Architecture</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h4 id="get-started-architecture-static" className="font-bold text-[16px] mb-2">A. Static Game / Zero-Ops Backend</h4>
                <p className="text-[14px] text-gray-600 mb-4">Best suited for client-heavy games such as Web, HTML5, or WebGL.</p>
                <p className="text-[14px] font-medium mb-2">The platform will provide:</p>
                <ul className="list-disc pl-5 space-y-2 text-[14px] text-[#242424] leading-[1.7] mb-4">
                  <li>Player identity and login</li>
                  <li>Cloud saves and cross-device recovery</li>
                  <li>Leaderboards</li>
                  <li>Chapter unlocking, static items, creator tipping</li>
                  <li>Event tracking and reward distribution</li>
                </ul>
                <p className="text-xs text-gray-500 italic mt-auto">Perfect for creators who want to focus entirely on gameplay and content without maintaining databases, accounts, or payment infrastructure.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h4 id="get-started-architecture-self" className="font-bold text-[16px] mb-2">B. Self-Hosted Backend</h4>
                <p className="text-[14px] text-gray-600 mb-4">Best suited for multiplayer, competitive, server-authoritative, or complex in-game economic systems.</p>
                <p className="text-[14px] font-medium mb-2">Your server will be able to:</p>
                <ul className="list-disc pl-5 space-y-2 text-[14px] text-[#242424] leading-[1.7] mb-4">
                  <li>Validate player sessions</li>
                  <li>Create and confirm orders</li>
                  <li>Receive signed webhooks and execute item delivery</li>
                  <li>Authoritatively submit leaderboards and reward distributions</li>
                </ul>
              </div>
            </div>

            <h3 id="get-started-release" className="text-[18px] font-bold tracking-tight mb-6">3. From Creation to Private Release</h3>
            <div className="space-y-8 pl-4 border-l-2 border-[#e9e3f4] ml-2">
              <div className="relative">
                <div className="absolute w-4 h-4 rounded-full bg-[var(--portal-purple)] -left-[25px] top-1"></div>
                <h4 id="get-started-release-step1" className="font-bold text-[16px]">Step 1: Activate Creator Identity</h4>
                <p className="text-[14px] text-[#242424] leading-[1.7] mt-2">Log in to the Creator Center using your main RandSeed account. Once activated, you can create and manage your games.</p>
              </div>
              
              <div className="relative">
                <div className="absolute w-4 h-4 rounded-full bg-[var(--portal-purple)] -left-[25px] top-1"></div>
                <h4 id="get-started-release-step2" className="font-bold text-[16px]">Step 2: Create Game and Prepare Project</h4>
                <p className="text-[14px] text-[#242424] leading-[1.7] mt-2 mb-2">Fill in the essential information for your game:</p>
                <ul className="list-disc pl-5 space-y-2 text-[14px] text-[#242424] leading-[1.7]">
                  <li>Game name, version number, and description</li>
                  <li>Categories, age ratings, device compatibility, and tags</li>
                </ul>
                <p className="text-[14px] text-gray-500 mt-3 italic">We recommend maintaining clean version numbers and commit logs from day one to easily track feedback and rollback builds.</p>
              </div>

              <div className="relative">
                <div className="absolute w-4 h-4 rounded-full bg-[var(--portal-purple)] -left-[25px] top-1"></div>
                <h4 id="get-started-release-step3" className="font-bold text-[16px]">Step 3: Connect Code Repository</h4>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-[14px] text-[#242424] leading-[1.7]">
                  <li>Authorize RandSeed App to connect to your game's GitHub repository.</li>
                  <li>Select your build branch.</li>
                  <li>Import RandSeed build configurations.</li>
                  <li>Push code to trigger automated builds.</li>
                  <li>Monitor build logs, versions, and your Sandbox URL directly on the RandSeed Dashboard.</li>
                </ul>
                <p className="text-[14px] text-gray-500 mt-3 italic">The platform uses the creator's own GitHub Actions to perform builds, and only receives the verified build artifacts. This keeps queue times low, improves security, and ensures you retain full control over your build environment.</p>
              </div>

              <div className="relative">
                <div className="absolute w-4 h-4 rounded-full bg-[var(--portal-purple)] -left-[25px] top-1"></div>
                <h4 id="get-started-release-step4" className="font-bold text-[16px]">Step 4: Integrate Player System and Payments</h4>
                <p className="text-[14px] text-[#242424] leading-[1.7] mt-2 mb-2">Leverage the platform SDK to integrate:</p>
                <ul className="list-disc pl-5 space-y-2 text-[14px] text-[#242424] leading-[1.7] mb-4">
                  <li>Retrieve the current player's identity and profile</li>
                  <li>Manage login, logout, and guest-to-account upgrades</li>
                  <li>Save game progress, achievements, and honors</li>
                  <li>Read and write to leaderboards</li>
                  <li>Send or display chat content</li>
                  <li>Gather game reviews</li>
                  <li>Create or join multiplayer matches</li>
                </ul>
                <p className="text-[14px] text-[var(--portal-purple)] font-medium mb-4">We recommend deciding early in your design phase which data can be processed on the client side and which data must be authoritatively stored on the server.</p>
                
                <p className="font-medium text-gray-800 mb-2">Typical payment integration scenarios:</p>
                <ul className="list-disc pl-5 space-y-2 text-[14px] text-[#242424] leading-[1.7] mb-4">
                  <li>Unlocking chapters, characters, skins, or items</li>
                  <li>Redeeming platform-backed achievements/rewards</li>
                  <li>Event tickets, tournament registration, and prize pools</li>
                </ul>
                
                <p className="font-medium text-gray-800 mb-2">When integrating payments, always:</p>
                <ul className="list-disc pl-5 space-y-2 text-[14px] text-[#242424] leading-[1.7]">
                  <li>Clearly display products, prices, and delivery terms.</li>
                  <li>Prompt users to confirm before transaction initiation.</li>
                  <li>Handle orders, fulfillment, and duplicate requests idempotently.</li>
                  <li>Validate high-value transactions and entitlement delivery server-side.</li>
                </ul>
              </div>

              <div className="relative">
                <div className="absolute w-4 h-4 rounded-full bg-[var(--portal-purple)] -left-[25px] top-1"></div>
                <h4 id="get-started-release-step5" className="font-bold text-[16px]">Step 5: Debug in Sandbox</h4>
                <p className="text-[14px] text-[#242424] leading-[1.7] mt-2 mb-4">The Sandbox is a private testing environment dedicated to creators. Every push to the monitored branch automatically updates the Sandbox to point to the latest successful build for quick validation.</p>
                <p className="font-medium text-gray-800 mb-2">Key areas to check:</p>
                <ul className="list-disc pl-5 space-y-2 text-[14px] text-[#242424] leading-[1.7] mb-4">
                  <li>Initial load times and asset caching</li>
                  <li>Login and logout states</li>
                  <li>Cloud save reads/writes, offline recoveries, and cross-device syncing</li>
                  <li>Payments, rewards, and rapid double-click protections</li>
                  <li>Mobile touch controls, audio unlocking, and full-screen experience</li>
                  <li>WebSocket reconnections, API rate limiting, and graceful degradation</li>
                </ul>
                <p className="text-[14px] text-gray-500 italic">For WebGL/WASM games, we recommend addressing cross-origin isolation, bundle sizes, mobile memory footprints, and gesture interactions early on.</p>
              </div>

              <div className="relative">
                <div className="absolute w-4 h-4 rounded-full bg-[var(--portal-purple)] -left-[25px] top-1"></div>
                <h4 id="get-started-release-step6" className="font-bold text-[16px]">Step 6: Create Private Link</h4>
                <p className="text-[14px] text-[#242424] leading-[1.7] mt-2 mb-4">When a build is stable enough for playtesting, select that version to generate a Private Link. A Private Link is not just a demo link; it is your first line of product validation. Invite players to experience a locked version and gather:</p>
                <ul className="list-disc pl-5 space-y-2 text-[14px] text-[#242424] leading-[1.7] mb-4">
                  <li>Game ratings and written reviews</li>
                  <li>Bug reports, performance, and compatibility feedback</li>
                  <li>Critical feedback on gameplay, difficulty, onboarding, and monetization</li>
                  <li>Version-specific feedback (ensuring new updates don't dilute findings from older builds)</li>
                </ul>
                
                <p className="font-medium text-gray-800 mb-2">Private Link Rules:</p>
                <ul className="list-disc pl-5 space-y-2 text-[14px] text-[#242424] leading-[1.7]">
                  <li>The link remains fixed to a specific, immutable build.</li>
                  <li>Subsequent Sandbox updates will not affect active testing links.</li>
                  <li>Links can have expiration dates and can be revoked at any time.</li>
                  <li>The game will not appear in the public directory.</li>
                </ul>
              </div>
            </div>
          </section>

          <section id="security" className="mb-16 pt-8 border-t border-gray-200">
            <h2 className="text-[20px] font-bold tracking-tight mb-6">Security and Publishing Recommendations</h2>
            <ul className="space-y-3 list-disc pl-5 text-[14px] text-[#242424] leading-[1.7] ">
              <li>Never commit long-term, high-privilege cloud credentials into your code repositories or CI/CD environments.</li>
              <li>Use short-lived tokens, signed callbacks, idempotent keys, and replay protection to process server-side transactions.</li>
              <li>Once a Private Link is distributed, ensure you retain version traceability and revocation mechanisms.</li>
              <li>Player data must be strictly isolated by game and player—cross-game reads are strictly prohibited.</li>
              <li>Perform size, format, and checksum validations on all critical data (saves, orders, leaderboards).</li>
              <li>For games involving real-value transactions, rewards, or multiplayer competition, all critical outcomes must be authoritatively decided server-side.</li>
            </ul>
          </section>

          <div id="pre-launch" className="mt-12 mb-8">
            <h3 className="text-[18px] font-bold tracking-tight mb-4">Creator Pre-Launch Checklist</h3>
            <ul className="space-y-3 list-none pl-0">
              {['Completed basic game details, ratings, and device compatibility.',
                'Connected to the correct GitHub repository, branch, and build directory.',
                'Verified loading, login, cloud saves, and error recoveries in Sandbox.',
                'Confirmed the Private Link maps to the correct, immutable build version.',
                'Thoroughly tested on mobile and major web browsers.',
                'Verified payment, reward workflows, and double-click protections.',
                'Prepared a clear version rollback plan.',
                'Avoided exposing sensitive credentials in code, repositories, or build logs.'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 shrink-0 w-5 h-5 rounded bg-green-100 text-green-600 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <section id="public-release" className="mb-16 pt-8 border-t border-gray-200">
            <h2 className="text-[20px] font-bold tracking-tight mb-6">Public Release</h2>
            <p className="text-[14px] text-[#242424] leading-[1.7] mb-4 ">Games can apply for a public release once they meet the following criteria:</p>
            <ol className="list-decimal pl-5 space-y-2 text-[14px] text-[#242424] leading-[1.7]">
              <li>At least 10 valid users have completed Private testing.</li>
              <li>At least 5 valid ratings have been submitted, achieving an average rating of 5/10 or higher.</li>
              <li>The creator has resolved all blocking bugs, payment exceptions, security vulnerabilities, and policy-violating content risks.</li>
              <li>Submitted updated public game information, age ratings, device compatibility, release notes, and necessary media assets.</li>
            </ol>
          </section>

          <section id="sdk" className="mb-16 pt-8 border-t border-gray-200">
            <h2 className="text-[20px] font-bold tracking-tight mb-6">SDK Capabilities</h2>
            <p className="text-[14px] text-[#242424] leading-[1.7] mb-8 ">The SDK provides unified platform capabilities. When integrating, always prioritize using the platform SDK over relying on page structures or internal web endpoints.</p>
            
            <div className="space-y-6">
              <div>
                <h3 id="sdk-lifecycle" className="text-[18px] font-bold">Lifecycle</h3>
                <p className="text-[14px] text-[#242424] leading-[1.7]">Notify the host container to shut down loading screens once game assets are fully loaded, ensuring a seamless visual transition between the platform shell and your game.</p>
              </div>
              
              <div>
                <h3 id="sdk-identity" className="text-[18px] font-bold">Player Identity</h3>
                <p className="text-[14px] text-[#242424] leading-[1.7]">Read login states, player profiles, and balances, or trigger platform logins when required.</p>
              </div>
              
              <div>
                <h3 id="sdk-cloud-save" className="text-[18px] font-bold">Cloud Save</h3>
                <p className="text-[14px] text-[#242424] leading-[1.7] mb-2">Support saving, reading, and deleting game data. Core objectives:</p>
                <ul className="list-disc pl-5 space-y-2 text-[14px] text-[#242424] leading-[1.7] mb-2">
                  <li>Isolate data by player and game.</li>
                  <li>Support multiple save slots.</li>
                  <li>Synchronize across devices.</li>
                  <li>Enable offline-first local saves with automatic synchronization upon network recovery.</li>
                  <li>Handle conflicts and perform data validations.</li>
                </ul>
                <p className="text-xs text-gray-500 italic">Note: Do not rely on cloud saves as your sole sync point; consider local caching, retry mechanisms, and write-on-exit patterns.</p>
              </div>
              
              <div>
                <h3 id="sdk-commercialization" className="text-[18px] font-bold">Commercialization</h3>
                <p className="text-[14px] text-[#242424] leading-[1.7] mb-2">For static games, we plan to support chapter/content unlocks, static items, and creator tips. When handling payments:</p>
                <ul className="list-disc pl-5 space-y-2 text-[14px] text-[#242424] leading-[1.7]">
                  <li>Clearly display products and pricing.</li>
                  <li>Implement double-confirmation checks prior to transaction initiation.</li>
                  <li>Do not equate "payment success" directly with "delivery completion" without verification.</li>
                  <li>Build specific pathways to handle failures, timeouts, and refunds.</li>
                </ul>
              </div>
              
              <div>
                <h3 id="sdk-leaderboard" className="text-[18px] font-bold">Leaderboard & Rewards</h3>
                <p className="text-[14px] text-[#242424] leading-[1.7]">Report high scores, display unified platform leaderboards, and allow players to claim milestones/rewards directly through the platform interface. For competitive or high-value rewards, server-side authoritative validation is strongly recommended.</p>
              </div>
              
              <div>
                <h3 id="sdk-analytics" className="text-[18px] font-bold">Analytics</h3>
                <p className="text-[14px] text-[#242424] leading-[1.7]">Track custom events to understand player acquisition, retention, level progress, failure points, and payment conversions.</p>
              </div>
            </div>

            <div className="mt-12 p-4 bg-orange-50 text-orange-800 rounded-lg text-sm border border-orange-200">
              <strong>Status:</strong> The SDK V1 interface definition is currently in the planning phase and should not be treated as a live API.
            </div>
          </section>

        </div>
      </main>
      
      {/* Mobile FAB */}
      <button 
        className="lg:hidden fixed bottom-6 left-6 z-40 bg-[var(--portal-purple)] text-white rounded-full px-5 py-4 shadow-[0_8px_30px_rgba(97,54,154,0.3)] flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform"
        onClick={() => setIsMobileMenuOpen(true)}
        aria-label="Table of Contents"
      >
        <Menu size={20} />
        <span className="font-semibold text-sm truncate max-w-[200px]">{activeTitle}</span>
      </button>

      {/* Mobile Bottom Sheet */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="relative bg-white rounded-t-[24px] max-h-[85vh] flex flex-col shadow-2xl animate-slide-up pb-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-[20px] m-0">Table of Contents</h2>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto hide-scrollbar">
              <nav className="guide-nav-mobile space-y-6">
                {NavLinks()}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
