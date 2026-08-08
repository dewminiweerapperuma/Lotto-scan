import Link from "next/link";
import Button from "@/components/ui/Button";
import NumberBall from "@/components/ui/NumberBall";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Glow blobs */}
      <div className="glow-blob-gold w-[600px] h-[600px] top-0 left-1/2 -translate-x-1/2 -translate-y-1/4" />
      <div className="glow-blob-green w-[400px] h-[400px] bottom-0 right-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-gold/5 border border-gold/20 rounded-full px-4 py-2 mb-8">
          <span>🎫</span>
          <span className="text-gold text-sm font-body">Sri Lanka's Smartest Lottery Checker</span>
        </div>

        {/* Heading */}
        <h1 className="font-display font-extrabold text-5xl md:text-7xl leading-tight mb-6">
          Check Your Lottery<br />
          Ticket{" "}
          <span className="text-gold-gradient">Instantly</span>
        </h1>

        {/* Subheading */}
        <p className="text-white/50 font-body text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Enter your numbers and find out if you won any Sri Lankan NLB or DLB lottery in seconds. Results updated automatically at 11:15 PM every night.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/check">
            <Button size="lg">Check My Ticket →</Button>
          </Link>
          <Link href="/results">
            <Button variant="secondary" size="lg">View Today's Results</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-20">
          {[
            { value: "16", label: "Lotteries Supported" },
            { value: "11:15 PM", label: "Updated Daily" },
            { value: "Free", label: "Always Free to Use" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="font-display font-bold text-2xl text-gold">{stat.value}</div>
              <div className="text-white/40 text-sm font-body">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Hero mockup card */}
        <div className="max-w-md mx-auto">
          <div className="bg-panel border border-gold/20 rounded-3xl p-6 shadow-gold animate-float">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white font-display font-bold">Mega Power</p>
                <p className="text-white/40 text-xs font-body">Draw #1234 · Today</p>
              </div>
              <span className="bg-win/10 border border-win/20 text-win text-xs px-3 py-1 rounded-full font-body">You Won!</span>
            </div>
            <div className="flex gap-2 justify-center mb-4">
              {[12, 34, 56, 23, 78].map((n, i) => (
                <NumberBall key={i} number={n} variant={[0, 2, 4].includes(i) ? "matched" : "unmatched"} />
              ))}
            </div>
            <div className="text-center">
              <p className="text-white/40 text-xs font-body">Prize Amount</p>
              <p className="text-gold font-display font-extrabold text-2xl">Rs. 2,000,000</p>
            </div>
          </div>

          {/* Floating badges */}
          <div className="flex justify-between -mt-4 px-4">
            <div className="bg-panel border border-white/10 rounded-2xl px-4 py-2 text-sm font-body text-white/60 shadow-card">
              🎯 3 Numbers Matched
            </div>
            <div className="bg-panel border border-gold/20 rounded-2xl px-4 py-2 text-sm font-body text-gold shadow-gold">
              🏆 1st Prize
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
