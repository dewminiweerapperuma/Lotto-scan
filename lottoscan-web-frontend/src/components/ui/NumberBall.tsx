interface NumberBallProps {
  number: number;
  matched?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "matched" | "unmatched" | "gold";
}

const SIZES = { sm: "w-9 h-9 text-sm", md: "w-12 h-12 text-base", lg: "w-16 h-16 text-xl" };

export default function NumberBall({ number, matched, size = "md", variant }: NumberBallProps) {
  const state = variant || (matched === true ? "matched" : matched === false ? "unmatched" : "default");
  return (
    <div className={`number-ball ${state} ${SIZES[size]} font-mono font-bold flex items-center justify-center`}>
      {number}
    </div>
  );
}
