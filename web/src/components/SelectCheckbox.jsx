import { Check } from 'lucide-react';

// Shared selection checkbox for file/folder cards and rows. Never shown on
// hover — only appears once selection mode is active (`active`, i.e.
// something is already selected via the "Select" menu item), so normal
// browsing hover stays exactly as it was.
export function SelectCheckbox({ checked, active, onToggle, className = '' }) {
  if (!active && !checked) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      title={checked ? 'Deselect' : 'Select'}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
        checked
          ? 'border-accent bg-accent text-bg'
          : 'border-edge bg-bg/70 text-transparent backdrop-blur-sm hover:border-accent/60'
      } ${className}`}
    >
      <Check size={13} strokeWidth={3} />
    </button>
  );
}
