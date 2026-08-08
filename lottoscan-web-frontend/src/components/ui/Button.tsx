interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const VARIANTS = {
  primary: "bg-gold text-white font-display font-semibold hover:bg-gold-dark shadow-md shadow-gold/30 hover:shadow-lg active:scale-95",
  secondary: "bg-white text-text-primary border border-border-default hover:border-border-hover shadow-sm hover:shadow active:scale-95",
  ghost: "bg-transparent text-text-secondary hover:bg-brand-section hover:text-text-primary active:scale-95",
  danger: "bg-lose-light text-lose border border-red-200 hover:bg-lose-light/80 active:scale-95",
};
const SIZES = { sm: "px-4 py-2 text-xs rounded-[8px]", md: "px-6 py-3 text-sm rounded-[12px]", lg: "px-8 py-4 text-base rounded-[12px]" };

export default function Button({ children, onClick, variant = "primary", size = "md", disabled, loading, fullWidth, type = "button", className = "" }: ButtonProps) {
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      className={`flex items-center justify-center gap-2 font-display transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? "w-full" : ""} ${className}`}>
      {loading && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
      {children}
    </button>
  );
}
