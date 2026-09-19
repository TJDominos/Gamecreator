import React from "react";
import {
  MessageSquare,
  ShieldCheck,
  Twitter,
  Activity,
  DatabaseZap,
  Mail,
  ArrowUpRight,
} from "lucide-react";
import "./Footer.scss";
import { useWltPrice } from "../hooks/useWltPrice";
import {
  formatSmallPrice,
  formatChange,
  formatCurrencyCompact,
} from "../utils/format";

const Footer: React.FC = () => {
  const { stats } = useWltPrice();

  const isPositive = (stats.change24h ?? 0) >= 0;

  return (
    <footer className="home-footer">
      <div className="home-footer-inner">
        <div className="home-footer-main">
          <div className="home-footer-brand">
            <div className="home-footer-logo-row">
              <span className="font-bold">Randseed</span>
            </div>
            <p>
              
              Play, Build and Connect in AI games
            </p>
          </div>

          <a
            href="https://jup.ag/tokens/G45pgo5kzUMPnXGqrLeDXXgxSrVx6ssXJiJTDWpHjups"
            target="_blank"
            rel="noreferrer"
            className="home-footer-metrics"
          >
            <div className="home-footer-metric">
              <span className="metric-label">$WLT Price</span>
              <strong className="metric-value">
                {formatSmallPrice(stats.price)}
              </strong>
            </div>
            <div className="home-footer-metric">
              <span className="metric-label">24H Change</span>
              <strong
                className={`metric-value ${isPositive ? "positive" : "negative"}`}
              >
                {formatChange(stats.change24h)}
              </strong>
            </div>
            <div className="home-footer-metric">
              <span className="metric-label">FDV</span>
              <strong className="metric-value">
                {formatCurrencyCompact(stats.fdv)}
              </strong>
            </div>
            <div className="home-footer-metric-icon">
              <ArrowUpRight size={18} className="arrow-icon" />
            </div>
          </a>

          <div className="home-footer-links">
            <div className="home-footer-column">
              <h3>RANDSEED</h3>
              <ul>
                <li>
                  <a
                    href="https://randseed.org/community/about"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="https://randseed.org/community/roadmap"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Roadmap
                  </a>
                </li>
                <li>
                  <a
                    href="https://randseed.org/community/wltoken"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    $WLT Token
                  </a>
                </li>
                <li>
                  <a
                    href="https://randseed.org/community/howtowin"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    How to Win
                  </a>
                </li>
                <li>
                  <a href="https://creator.randseed.org">
                    Game Creator
                  </a>
                </li>
              </ul>
            </div>

            <div className="home-footer-column">
              <h3>SUPPORT</h3>
              <ul>
                <li>
                  <a href="mailto:support@randseed.org">
                    <Mail
                      className="home-footer-link-icon"
                      aria-hidden="true"
                    />
                    Contact Us
                  </a>
                </li>
                <li>
                  <a
                    href="https://discord.gg/randseed-org-1427934954939224104"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg
                      className="home-footer-link-icon"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                    </svg>
                    Discord
                  </a>
                </li>
                <li>
                  <a
                    href="https://x.com/randseedgame"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg
                      className="home-footer-link-icon"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L5.09 22.75H1.78l7.534-8.61L1.12 2.25h6.82l4.696 6.136 5.608-6.136zm-1.162 17.51h1.832L7.02 4.14H5.068l12.014 15.62z" />
                    </svg>
                    @Randseedgame
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/RandSeedOrg/GameVRF"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg
                      className="home-footer-link-icon"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                    GameVRF
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="home-footer-bottom flex flex-wrap items-center justify-center py-6 mt-8 mx-0 md:mx-0 w-full border-t border-black/10 gap-x-2 gap-y-1">
          <p style={{ margin: "0" }}>© 2026 Randseed. All rights reserved.</p>
          <div className="flex items-center text-[14px] text-black/60 md:ml-2">
            <span style={{ marginRight: "6px" }}>Powered by</span>
            <div className="flex items-center" style={{ gap: "8px" }}>
              <a
                href="https://internetcomputer.org"
                target="_blank"
                rel="noreferrer"
                className="flex items-center"
              >
                <img
                  src="/internet-computer-icp-logo.svg"
                  alt="ICP"
                  className="h-[14px] object-contain opacity-80 hover:opacity-100 transition-opacity"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </a>
              <a
                href="https://solana.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center"
              >
                <img
                  src="/solana-sol-logo-horizontal.svg"
                  alt="Solana"
                  className="h-[14px] object-contain opacity-80 hover:opacity-100 transition-opacity"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </a>
              <a
                href="https://ethereum.org"
                target="_blank"
                rel="noreferrer"
                className="flex items-center"
              >
                <img
                  src="/ethereum-eth-logo-full-horizontal.svg"
                  alt="EVM"
                  className="h-[14px] object-contain opacity-80 hover:opacity-100 transition-opacity"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
