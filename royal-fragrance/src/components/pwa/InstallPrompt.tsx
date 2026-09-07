"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

const DISMISS_KEY = "rf-install-dismissed-at";
const DISMISS_DAYS = 7; // don't nag again for a week after a dismiss

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function wasRecentlyDismissed() {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return daysSince < DISMISS_DAYS;
}

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-fatal — installability just won't be offered if this fails.
      });
    }

    if (isStandalone() || wasRecentlyDismissed()) return;

    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isSafari =
      /safari/i.test(window.navigator.userAgent) && !/crios|fxios/i.test(window.navigator.userAgent);

    if (isIos && isSafari) {
      // iOS has no install API at all — only a manual Share -> Add to
      // Home Screen flow, so this is the only way to surface it there.
      const timer = setTimeout(() => {
        setShowIosInstructions(true);
        setVisible(true);
      }, 4000);
      return () => clearTimeout(timer);
    }

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-xl2 border border-espresso/10 bg-cream p-4 shadow-premium sm:inset-x-auto sm:right-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-espresso text-cream">
        {showIosInstructions ? <Share size={18} /> : <Download size={18} />}
      </div>

      <div className="flex-1">
        <p className="font-display text-sm text-espresso">Install Royal Fragrance</p>
        {showIosInstructions ? (
          <p className="mt-1 text-xs text-rich/70">
            Tap the Share icon, then "Add to Home Screen" for quick access
            anytime.
          </p>
        ) : (
          <p className="mt-1 text-xs text-rich/70">
            Add Royal Fragrance to your home screen for quick access — no
            app store needed.
          </p>
        )}
        {!showIosInstructions && (
          <button
            onClick={handleInstall}
            className="mt-3 rounded-full bg-espresso px-4 py-1.5 text-xs font-medium text-cream transition hover:bg-rich"
          >
            Install
          </button>
        )}
      </div>

      <button onClick={dismiss} aria-label="Dismiss" className="text-rich/40 hover:text-espresso">
        <X size={16} />
      </button>
    </div>
  );
}
