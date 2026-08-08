interface InputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  label?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export default function Input({ value, onChange, placeholder, type = "text", label, error, className = "", disabled }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-text-secondary text-sm font-body font-medium">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-white border border-border-default rounded-[10px] px-4 py-3 text-text-primary font-body text-sm placeholder-text-muted focus:outline-none focus:border-gold focus:ring-4 focus:ring-gold/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm ${
          error ? "border-lose focus:border-lose focus:ring-lose/15" : ""
        } ${className}`}
      />
      {error && <p className="text-lose text-xs font-body mt-1">{error}</p>}
    </div>
  );
}
