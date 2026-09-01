import { RefreshCcw } from "lucide-react";
import { useVersionCheck } from "../hooks/useVersionCheck";
import { motion, AnimatePresence } from "motion/react";

export function VersionUpdateBanner() {
  const { hasUpdate, refreshPage } = useVersionCheck();

  return (
    <AnimatePresence>
      {hasUpdate && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-[9999]"
        >
          <div className="bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700/50 p-4 pr-5 flex items-center gap-4 max-w-sm">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
              <RefreshCcw className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[15px] mb-0.5 text-slate-100">
                Update Available
              </h4>
              <p className="text-[13px] text-slate-400 leading-tight">
                A new version of the portal has been released. Please refresh to continue.
              </p>
            </div>
            <button
              onClick={refreshPage}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-semibold rounded-lg transition-colors whitespace-nowrap active:scale-95"
            >
              Refresh
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
