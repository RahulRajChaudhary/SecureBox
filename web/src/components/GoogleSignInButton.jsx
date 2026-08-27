import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

function GoogleLogo() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

export function GoogleSignInButton({
  onCredential,
  loading = false,
}) {
  const buttonRef = useRef(null);
  const initializedRef = useRef(false);
  const [awaitingPopup, setAwaitingPopup] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timeoutId;

    const initializeGoogle = () => {
      if (cancelled || initializedRef.current) return;

      const google = window.google;

      if (!google?.accounts?.id || !buttonRef.current) {
        timeoutId = window.setTimeout(initializeGoogle, 100);
        return;
      }

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      if (!clientId) {
        console.error("VITE_GOOGLE_CLIENT_ID is not configured.");
        return;
      }

      google.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }) => {
          if (credential) {
            onCredential(credential);
          }
        },
      });

      google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: buttonRef.current.parentElement?.clientWidth || 400,
      });

      initializedRef.current = true;
    };

    initializeGoogle();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [onCredential]);

  useEffect(() => {
    const handleBlur = () => setAwaitingPopup(true);
    const handleFocus = () => setAwaitingPopup(false);

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const busy = loading || awaitingPopup;

  return (
    <div className="relative w-full">
      <div
        className="pointer-events-none flex w-full items-center justify-center gap-2.5 rounded-md border border-edge bg-surface px-3 py-2 text-sm font-medium text-ink"
        aria-hidden="true"
      >
        {busy ? (
          <Loader2
            size={16}
            className="animate-spin text-accent"
          />
        ) : (
          <GoogleLogo />
        )}

        Sign in with Google
      </div>

      <div
        ref={buttonRef}
        className={`absolute inset-0 overflow-hidden opacity-0 ${
          busy ? "pointer-events-none" : ""
        }`}
      />
    </div>
  );
}