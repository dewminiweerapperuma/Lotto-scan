interface BadgeProps {
  children: React.ReactNode;
  variant?: "gold" | "green" | "red" | "grey" | "blue";
}

const VARIANTS = {
  gold: "bg-gold-light text-gold-dark border border-gold-border",
  green: "bg-win-light text-win border border-green-200 dark:border-green-800/60",
  red: "bg-lose-light text-lose border border-red-200 dark:border-red-900/60",
  grey: "bg-brand-section text-text-secondary border border-border-default",
  blue: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60",
};

export default function Badge({ children, variant = "grey" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-body font-semibold border ${VARIANTS[variant]}`}>
      {children}
    </span>
  );
}
