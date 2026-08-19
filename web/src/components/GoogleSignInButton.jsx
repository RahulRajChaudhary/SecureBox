import { useEffect, useRef } from 'react';

export function GoogleSignInButton({ onCredential }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    const google = window.google;
    if (!google?.accounts?.id || !buttonRef.current) return;

    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: (response) => onCredential(response.credential),
    });
    google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      width: 320,
    });
  }, [onCredential]);

  return <div ref={buttonRef} />;
}
