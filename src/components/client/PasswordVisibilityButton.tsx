type PasswordVisibilityButtonProps = {
  visible: boolean;
  onToggle: () => void;
};

export default function PasswordVisibilityButton({ visible, onToggle }: PasswordVisibilityButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--text-tertiary)] hover:text-[var(--accent)]"
    >
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {visible ? <><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.2 0 9.8 7 9.8 7a17.6 17.6 0 0 1-3.1 3.8" /><path d="M6.6 6.6C3.8 8.3 2.2 12 2.2 12a17.5 17.5 0 0 0 5.4 5.6A10.8 10.8 0 0 0 12 19c1.1 0 2.1-.2 3-.5" /></> : <><path d="M2.2 12S5.8 5 12 5s9.8 7 9.8 7-3.6 7-9.8 7-9.8-7-9.8-7Z" /><circle cx="12" cy="12" r="2.5" /></>}
      </svg>
    </button>
  );
}
