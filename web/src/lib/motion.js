// Shared animation variants/transitions so motion feels consistent
// instead of every component inventing its own timing.

export const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
};

export const backdropFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const row = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
};

export const springy = { type: 'spring', stiffness: 420, damping: 34 };
export const quick = { duration: 0.16, ease: 'easeOut' };

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export const staggerItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};
