interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: "none" | "gold" | "green" | "red";
  padding?: "sm" | "md" | "lg";
  hover?: boolean;
}

const GLOW = { 
  none: "", 
  gold: "card-gold", 
  green: "card-green", 
  red: "border-lose/30 bg-lose-light/30 shadow-sm" 
};
const PADDING = { sm: "p-4 rounded-[16px]", md: "p-6 rounded-[20px]", lg: "p-8 rounded-[24px]" };

export default function Card({ children, className = "", glow = "none", padding = "md", hover = false }: CardProps) {
  return (
    <div className={`card ${GLOW[glow]} ${PADDING[padding]} ${hover ? "transition-all duration-300 hover:-translate-y-[2px] hover:border-border-hover cursor-pointer" : ""} ${className}`}>
      {children}
    </div>
  );
}
