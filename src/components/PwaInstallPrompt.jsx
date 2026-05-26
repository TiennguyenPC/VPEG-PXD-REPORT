import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

const DISMISS_KEY = 'epc_pwa_install_dismissed';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  };

  const showIOSHint = isIOS && !isStandalone && !dismissed;
  const showAndroidInstall = deferredPrompt && !isStandalone && !dismissed;
  if (isStandalone || dismissed || (!showIOSHint && !showAndroidInstall)) return null;

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-[60] px-3 pt-[max(0.5rem,env(safe-area-inset-top))] print:hidden">
      <div className="flex items-center gap-2 rounded-xl border border-[#5252ff]/40 bg-[var(--bg-panel)] shadow-lg px-3 py-2.5">
        <Download className="w-4 h-4 text-[#7373ff] shrink-0" />
        <p className="flex-1 text-[11px] text-[var(--text-main)] leading-snug">
          {showIOSHint ? (
            <>
              <strong>iPhone:</strong> Safari → nút <strong>Chia sẻ</strong> → <strong>Thêm vào Màn hình chính</strong>
            </>
          ) : (
            <>
              Cài <strong>VPEG</strong> lên màn hình chính để mở nhanh như app.
            </>
          )}
        </p>
        {showAndroidInstall && (
        <button
          type="button"
          onClick={handleInstall}
          className="shrink-0 text-[10px] font-bold text-white bg-[#5252ff] hover:bg-[#4141d6] px-2.5 py-1.5 rounded-md"
        >
          Cài
        </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 p-1 text-[var(--text-muted)] hover:text-[var(--text-strong)]"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
