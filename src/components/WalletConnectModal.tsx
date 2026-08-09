import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ChevronRight,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Mail,
} from "lucide-react";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: (verifiedId?: string) => void;
}

const DEFAULT_ICONS: Record<string, string> = {
  metamask:
    "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg",
  binance:
    "https://upload.wikimedia.org/wikipedia/commons/e/e8/Binance_Logo.svg",
};

const InternetIdentityIcon = () => (
  <img
    src="/internet-computer-icp-logo.svg"
    alt="Internet Identity"
    className="w-[24px] h-[24px] object-contain"
  />
);

const PhantomIcon = () => (
  <svg
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full object-contain"
  >
    <rect width="128" height="128" rx="20" fill="#AB9FF2" />
    <path
      d="M42 34C42 34 26 40 26 62C26 84 32 94 40 94C48 94 48 84 48 84C48 84 54 94 64 94C74 94 74 84 74 84C74 84 80 94 88 94C96 94 102 84 102 62C102 40 86 34 86 34C86 34 78 30 64 30C50 30 42 34 42 34Z"
      fill="white"
    />
    <circle cx="56" cy="54" r="6" fill="#AB9FF2" />
    <circle cx="72" cy="54" r="6" fill="#AB9FF2" />
  </svg>
);

const CoinbaseIcon = () => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full object-contain"
  >
    <rect width="100" height="100" rx="20" fill="#0052FF" />
    <circle cx="50" cy="50" r="32" fill="white" />
    <rect x="36" y="36" width="28" height="28" rx="4" fill="#0052FF" />
  </svg>
);

const OkxIcon = () => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full object-contain"
  >
    <rect width="100" height="100" rx="20" fill="black" />
    <rect x="18" y="24" width="24" height="24" rx="4" fill="white" />
    <rect x="18" y="52" width="24" height="24" rx="4" fill="white" />
    <rect x="58" y="24" width="24" height="24" rx="4" fill="white" />
    <rect x="58" y="52" width="24" height="24" rx="4" fill="white" />
    <rect x="38" y="38" width="24" height="24" rx="4" fill="white" />
  </svg>
);

const getWalletIcon = (w: any) => {
  if (w.id === "okx") return <OkxIcon />;
  if (w.id === "coinbase") return <CoinbaseIcon />;
  if (w.id === "phantom") return <PhantomIcon />;
  if (w.id === "metamask")
    return (
      <img
        src={DEFAULT_ICONS.metamask}
        className="w-6 h-6 object-contain"
        alt="MetaMask logo"
      />
    );
  if (w.id === "binance")
    return (
      <img
        src={DEFAULT_ICONS.binance}
        className="w-6 h-6 object-contain"
        alt="Binance logo"
      />
    );
  if (w.icon && typeof w.icon === "string")
    return (
      <img
        src={w.icon}
        className="w-6 h-6 object-contain"
        alt={`${w.name} logo`}
      />
    );
  return (
    <div className="w-full h-full bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-sm">
      {w.name.charAt(0)}
    </div>
  );
};

type Step = "SELECT_WALLET" | "CONNECTING" | "PENDING" | "SUCCESS";

export function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const [wallets, setWallets] = useState<
    {
      id: string;
      name: string;
      installed: boolean;
      icon?: string;
      url?: string;
    }[]
  >([]);
  const [step, setStep] = useState<Step>("SELECT_WALLET");
  const [selectedWallet, setSelectedWallet] = useState<{
    name: string;
    icon?: string | React.ReactNode;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setStep("SELECT_WALLET"), 300);
      return;
    }

    const safeCheck = (check: () => any) => {
      try {
        return !!check();
      } catch (e) {
        return false;
      }
    };

    const detected = [
      {
        id: "metamask",
        name: "MetaMask",
        installed: safeCheck(() => (window as any).ethereum?.isMetaMask),
        url: "https://metamask.io/download/",
      },
      {
        id: "okx",
        name: "OKX Wallet",
        installed: safeCheck(() => (window as any).okxwallet),
        url: "https://www.okx.com/web3/build/projects/wallets",
      },
      {
        id: "coinbase",
        name: "Coinbase Wallet",
        installed: safeCheck(
          () =>
            (window as any).coinbaseWalletExtension ||
            (window as any).ethereum?.isCoinbaseWallet,
        ),
        url: "https://www.coinbase.com/wallet",
      },
      {
        id: "binance",
        name: "Binance Wallet",
        installed: safeCheck(() => (window as any).BinanceChain),
        url: "https://www.bnbchain.org/en/binance-wallet",
      },
      {
        id: "phantom",
        name: "Phantom",
        installed: safeCheck(() => (window as any).phantom?.solana),
        url: "https://phantom.app/",
      },
    ];

    const handleInjectedProvider = (e: any) => {
      const providerDetail = e.detail;
      if (providerDetail && providerDetail.info) {
        setWallets((prev) => {
          if (!prev.find((w) => w.name === providerDetail.info.name)) {
            return [
              ...prev,
              {
                id: providerDetail.info.uuid,
                name: providerDetail.info.name,
                installed: true,
                icon: providerDetail.info.icon,
              },
            ];
          }
          return prev;
        });
      }
    };

    window.addEventListener("eip6963:announceProvider", handleInjectedProvider);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    setWallets((prev) => {
      const all = [...prev];
      detected.forEach((d) => {
        if (
          !all.find(
            (w) =>
              w.name.toLowerCase() === d.name.toLowerCase() ||
              (w.name.toLowerCase().includes("metamask") &&
                d.name.toLowerCase().includes("metamask")),
          )
        ) {
          all.push(d);
        }
      });
      return all;
    });

    return () =>
      window.removeEventListener(
        "eip6963:announceProvider",
        handleInjectedProvider,
      );
  }, [isOpen]);

  const handleWalletSelect = async (wallet: any) => {
    setSelectedWallet({ name: wallet.name, icon: getWalletIcon(wallet) });
    setStep("CONNECTING");

    if (
      wallet.id === "metamask" &&
      typeof (window as any).ethereum !== "undefined"
    ) {
      try {
        const accounts = await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts && accounts.length > 0) {
          setStep("SUCCESS");
          setTimeout(() => {
            onClose(accounts[0]);
          }, 1500);
          return;
        }
      } catch (error) {
        console.error("MetaMask connection error:", error);
        // It may fail in iframes or if user rejects, fallback to original mock
      }
    }

    setTimeout(() => {
      setStep("PENDING");
      setTimeout(() => {
        setStep("SUCCESS");
        setTimeout(() => {
          const generatedId = `0x${wallet.id}-${Math.random().toString(36).substring(2, 10)}`;
          onClose(generatedId);
        }, 1500);
      }, 3000);
    }, 2000);
  };

  const handleEmailSelect = () => {
    setSelectedWallet({ name: "Email" });
    setStep("CONNECTING");
    setTimeout(() => {
      setStep("SUCCESS");
      setTimeout(() => {
        const generatedId = `email-${Math.random().toString(36).substring(2, 10)}`;
        onClose(generatedId);
      }, 1500);
    }, 1500);
  };

  const handleInternetIdentitySelect = () => {
    setSelectedWallet({
      name: "Internet Identity",
      icon: <InternetIdentityIcon />,
    });
    setStep("CONNECTING");
    setTimeout(() => {
      setStep("SUCCESS");
      setTimeout(() => {
        const generatedId = `ii-${Math.random().toString(36).substring(2, 10)}`;
        onClose(generatedId);
      }, 1500);
    }, 1500);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const getOrderedWallets = () => {
    const installed = wallets.filter((w) => w.installed);
    const uninstalled = [...wallets.filter((w) => !w.installed)].sort(
      (a, b) => {
        if (a.id === "phantom") return -1;
        if (b.id === "phantom") return 1;
        return 0;
      },
    );
    return [...installed, ...uninstalled];
  };

  const orderedWallets = getOrderedWallets();

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center pointer-events-auto bg-black/30 backdrop-blur-md px-4 pb-4 sm:pb-0"
          onClick={() => {
            if (step === "SELECT_WALLET") {
              onClose();
            }
          }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 100, scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-[#FFF] w-[90%] sm:w-[380px] rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] border border-[#e2e4e8]"
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-4 border-b border-black/5">
              <h3 className="font-semibold text-black tracking-wide text-[16px]">
                {step === "SELECT_WALLET" ? "Connect Wallet" : "Sign In Status"}
              </h3>
              <button
                onClick={() => onClose()}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-800 hover:bg-black/5 rounded-2xl transition-colors"
                disabled={step === "PENDING" || step === "CONNECTING"}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-4 flex-1 min-h-0 overflow-y-auto w-full pt-4 pb-4 custom-scrollbar">
              {step === "SELECT_WALLET" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <p className="text-[14px] text-[#7a8699] mb-3 px-3">
                    Select an installed wallet to sign in, or use your email.
                  </p>
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={handleEmailSelect}
                      className="w-full h-[40px] md:h-[36px] flex flex-row items-center justify-between px-3 rounded-[12px] transition-all hover:bg-black/5 cursor-pointer"
                    >
                      <div className="flex flex-row items-center gap-2.5">
                        <div className="w-[24px] h-[24px] flex items-center justify-center shrink-0 text-black/80">
                          <Mail
                            className="w-[24px] h-[24px]"
                            strokeWidth={1.5}
                          />
                        </div>
                        <span className="font-semibold text-black text-[14px]">
                          Sign in with email
                        </span>
                      </div>
                      <ChevronRight className="w-[14px] h-[14px] text-black/30" />
                    </button>

                    <div className="flex flex-col items-center">
                      <button
                        onClick={handleInternetIdentitySelect}
                        className="w-full h-[40px] md:h-[36px] flex flex-row items-center justify-between px-3 rounded-[12px] transition-all hover:bg-black/5 cursor-pointer"
                      >
                        <div className="flex flex-row items-center gap-2.5">
                          <div className="w-[24px] h-[24px] flex items-center justify-center shrink-0">
                            <InternetIdentityIcon />
                          </div>
                          <span className="font-semibold text-black text-[14px]">
                            Internet Identity
                          </span>
                        </div>
                        <ChevronRight className="w-[14px] h-[14px] text-black/30" />
                      </button>

                      <div className="flex flex-row items-center justify-center gap-2 mt-1">
                        <span className="text-[10px] text-black/45">
                          Coming from our old site?
                        </span>
                        <button className="text-[10px] text-black/65 underline underline-offset-2 hover:text-black transition-colors">
                          Retrieve account
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-row items-center justify-center gap-2 px-3 py-[4px] my-1 opacity-70">
                      <div className="flex-1 h-[1px] bg-black/10"></div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-black/40">
                        OR
                      </span>
                      <div className="flex-1 h-[1px] bg-black/10"></div>
                    </div>

                    {orderedWallets.length === 0 ? (
                      <div className="p-3 text-center rounded-2xl bg-white border border-black/5 text-slate-500 text-[14px]">
                        No compatible wallets detected.
                      </div>
                    ) : (
                      orderedWallets.map((w) => (
                        <button
                          key={w.id}
                          onClick={() =>
                            w.installed
                              ? handleWalletSelect(w)
                              : w.url && window.open(w.url, "_blank")
                          }
                          className={`w-full h-[40px] md:h-[36px] flex items-center justify-between px-3 rounded-[12px] transition-all ${w.installed ? "hover:bg-black/5 cursor-pointer" : "hover:bg-black/5 cursor-pointer opacity-70"}`}
                        >
                          <div className="flex flex-row items-center gap-2.5">
                            <div className="w-[24px] h-[24px] flex items-center justify-center rounded-[6px] overflow-hidden shrink-0 bg-white shadow-sm border border-black/5 p-[1px]">
                              {getWalletIcon(w)}
                            </div>
                            <span
                              className={`font-semibold flex-1 text-left text-[14px] ${w.installed ? "text-black" : "text-black/60"}`}
                            >
                              {w.name}
                            </span>
                          </div>
                          {w.installed ? (
                            <div className="flex flex-row items-center justify-center gap-2">
                              <span className="text-[9px] uppercase font-bold text-[#5F40A1] bg-[#5F40A1]/10 flex items-center justify-center px-1.5 py-0.5 rounded-[12px]">
                                Installed
                              </span>
                              <ChevronRight className="w-[14px] h-[14px] text-black/30" />
                            </div>
                          ) : (
                            <div className="flex flex-row items-center justify-center gap-2">
                              <span className="text-[9px] uppercase font-bold text-black/45 flex items-center justify-center px-1.5 py-0.5 rounded-[12px] bg-black/5">
                                Get
                              </span>
                              <ExternalLink className="w-[14px] h-[14px] text-black/45" />
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {step === "CONNECTING" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-3 text-center gap-4"
                >
                  <div className="relative">
                    {selectedWallet?.name === "Email" ? (
                      <div className="w-14 h-14 flex flex-row items-center justify-center text-black/80 z-10 relative">
                        <Mail className="w-full h-full" strokeWidth={1.5} />
                      </div>
                    ) : selectedWallet?.icon ? (
                      <div className="w-14 h-14 flex items-center justify-center z-10 relative [&>svg]:w-full [&>svg]:h-full [&>img]:w-full [&>img]:h-full [&>img]:object-contain">
                        {selectedWallet.icon}
                      </div>
                    ) : null}
                    <div className="absolute inset-0 bg-[#126b6f] blur-md opacity-20 rounded-2xl animate-pulse"></div>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <h4 className="font-bold text-sm text-slate-800">
                      {selectedWallet?.name === "Email"
                        ? "Connecting to Email..."
                        : "Approve connection"}
                    </h4>
                    <p className="text-sm text-slate-500 max-w-[80%] mx-auto text-center">
                      {selectedWallet?.name === "Email"
                        ? "Please wait"
                        : `Please open your ${selectedWallet?.name} extension to sign the message.`}
                    </p>
                  </div>
                </motion.div>
              )}

              {step === "PENDING" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-3 text-center gap-4"
                >
                  <Loader2 className="w-12 h-12 text-[#126b6f] animate-spin" />
                  <div className="flex flex-col items-center gap-4">
                    <h4 className="font-bold text-sm text-slate-800">
                      Sign in Pending
                    </h4>
                    <p className="text-sm text-slate-500 text-center">
                      Waiting for confirmation.
                    </p>
                  </div>
                </motion.div>
              )}

              {step === "SUCCESS" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-3 text-center gap-4"
                >
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                  <div className="flex flex-col items-center gap-4">
                    <h4 className="font-bold text-sm text-emerald-600">
                      Sign in Successful!
                    </h4>
                    <p className="text-sm text-slate-500 text-center">
                      You are now connected.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
