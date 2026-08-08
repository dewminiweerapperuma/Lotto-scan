import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { LOTTERIES, LOTTERY_EMOJIS } from "@/lib/constants";

export default function LotteryGrid() {
  return (
    <section className="py-24 bg-panel/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-gold text-sm font-body uppercase tracking-widest mb-3">Coverage</p>
          <h2 className="font-display font-bold text-4xl md:text-5xl mb-4">All 16 Sri Lankan Lotteries</h2>
          <p className="text-white/40 font-body text-lg max-w-xl mx-auto">
            We support every NLB and DLB lottery draw
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {LOTTERIES.map((lottery) => (
            <Card key={lottery.name} hover padding="sm" className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{LOTTERY_EMOJIS[lottery.name] || "🎫"}</span>
                <Badge variant={lottery.board === "NLB" ? "blue" : "gold"}>
                  {lottery.board}
                </Badge>
              </div>
              <div>
                <p className="text-white font-body font-medium text-sm leading-tight">{lottery.name}</p>
                <p className="text-gold font-display font-bold text-sm mt-1">{lottery.topPrize}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
