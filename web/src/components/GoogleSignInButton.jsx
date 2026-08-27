import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

export function GoogleSignInButton({ onCredential, loading = false }) {
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const [awaitingPopup, setAwaitingPopup] = useState(false);

  useEffect(() => {
    const google = window.google;
    if (!google?.accounts?.id || !buttonRef.current || !containerRef.current) return;

    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: (response) => onCredential(response.credential),
    });
    google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      width: Math.round(containerRef.current.clientWidth),
    });
  }, [onCredential]);

  useEffect(() => {

    function handleBlur() {
      setAwaitingPopup(true);
    }
    function handleFocus() {
      setAwaitingPopup(false);
    }
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const busy = loading || awaitingPopup;

  return (
    <div ref={containerRef} className="relative w-full">
      <div ref={buttonRef} />
      {busy && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-bg/80">
          <Loader2 size={18} className="animate-spin text-accent" />
        </div>
      )}
    </div>
  );
}
