interface BadgeProps {
  children: React.ReactNode;
  variant?: "gold" | "green" | "red" | "grey" | "blue";
}

const VARIANTS = {
  gold: "bg-gold-light text-gold-dark border border-gold-border",
  green: "bg-win-light text-win border border-green-200",
  red: "bg-lose-light text-lose border border-red-200",
  grey: "bg-brand-section text-text-secondary border border-border-default",
  blue: "bg-blue-50 text-blue-700 border border-blue-150",
};

export default function Badge({ children, variant = "grey" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-body font-semibold border ${VARIANTS[variant]}`}>
      {children}
    </span>
  );
}
