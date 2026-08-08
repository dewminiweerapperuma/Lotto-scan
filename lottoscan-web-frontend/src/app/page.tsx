import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { LOTTERIES, LOTTERY_EMOJIS } from "@/lib/constants";
import TicketChecker from "@/components/sections/TicketChecker";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-brand-bg pt-20 md:pt-28 pb-16 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gold/5 blur-[150px] pointer-events-none" />
        
        <div className="container relative z-10 text-center max-w-[900px] py-12 md:py-20">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 bg-gold-light border border-gold-border rounded-full px-5 py-2 mb-8 shadow-sm">
            <span className="text-sm">🎫</span>
            <span className="text-gold-dark text-xs md:text-sm font-display font-bold uppercase tracking-wider">
              Sri Lanka's Smartest Lottery Checker
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-display font-extrabold leading-[1.08] tracking-tight text-text-primary mb-6">
            Check Your Lottery<br />
            Ticket <span className="text-gold-gradient">Instantly</span>
          </h1>

          {/* Subheading */}
          <p className="text-text-secondary font-body text-lg md:text-xl max-w-[560px] mx-auto mb-10 leading-relaxed">
            Enter your numbers or scan the QR code on your ticket. Get results in seconds for all 16 NLB and DLB lotteries.
          </p>

          {/* Two CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/check" className="w-full sm:w-auto bg-gold text-white font-display font-semibold text-lg px-8 py-4 rounded-[14px] hover:bg-gold-dark transition-all active:scale-95 shadow-[0_4px_20px_rgba(232,168,0,0.35)] hover:shadow-[0_8px_32px_rgba(232,168,0,0.45)] text-center">
              Check My Ticket →
            </Link>
            <Link href="/results" className="w-full sm:w-auto bg-white text-text-primary border border-border-default font-display font-semibold text-lg px-8 py-4 rounded-[14px] hover:border-border-hover transition-all shadow-sm hover:shadow active:scale-95 text-center">
              View Today's Results
            </Link>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-4 md:gap-12 mt-16 border-t border-border-default pt-10 max-w-xl mx-auto">
            {[
              { value: "16", label: "Lotteries Supported" },
              { value: "11:15 PM", label: "Updated Daily" },
              { value: "100%", label: "Free to Use" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-4 md:gap-12">
                {i > 0 && <div className="w-px h-8 bg-border-default shrink-0" />}
                <div className="text-center">
                  <p className="text-gold font-display font-extrabold text-2xl md:text-3xl leading-none mb-1.5">{stat.value}</p>
                  <p className="text-text-secondary font-body text-xs font-medium md:text-sm">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Hero Visual Mockup */}
          <div className="mt-20 relative max-w-[480px] mx-auto px-4">
            <div className="bg-white border border-border-default rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] border-l-4 border-l-gold text-left overflow-hidden">
              <div className="p-6 pb-4">
                {/* Visual Card Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="bg-gold-light border border-gold-border rounded-full px-3 py-1 text-gold-dark text-xs font-display font-bold uppercase tracking-wider">
                    ⚡ Mega Power
                  </div>
                  <div className="text-text-secondary font-body text-xs font-semibold">
                    Draw #1234 · Today
                  </div>
                </div>

                {/* Number Balls Row */}
                <div className="flex gap-2.5 justify-between mb-5">
                  {[12, 34, 56, 23, 78].map((n, i) => {
                    const isMatched = [0, 2, 4].includes(i);
                    return (
                      <div
                        key={i}
                        className={`w-[52px] h-[52px] rounded-full flex items-center justify-center font-display font-extrabold text-lg select-none transition-all duration-300
                          ${isMatched 
                            ? "bg-gold text-white shadow-[0_4px_12px_rgba(232,168,0,0.4)]" 
                            : "bg-brand-section text-text-muted"
                          }`}
                      >
                        {n}
                      </div>
                    );
                  })}
                </div>

                <div className="w-full h-px bg-border-default my-4" />

                {/* Result Row */}
                <div className="flex items-center justify-between pt-1 pb-3">
                  <span className="text-text-secondary font-body text-sm font-semibold">3 Numbers Matched</span>
                  <span className="text-gold font-display font-extrabold text-2xl">Rs. 5,000</span>
                </div>
              </div>

              {/* Green Win Banner */}
              <div className="bg-win-light text-win border-t border-green-150 px-6 py-3.5 text-sm font-body font-semibold flex items-center gap-2">
                <span>✅</span> You Won! Claim within 90 days.
              </div>
            </div>

            {/* Floating Mini Cards */}
            <div className="absolute top-1/2 -left-12 -translate-y-1/2 hidden md:block">
              <Card padding="sm" className="shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 pointer-events-none">
                <span className="text-text-secondary font-body text-xs font-bold flex items-center gap-1.5">
                  🎯 3 Matched
                </span>
              </Card>
            </div>
            <div className="absolute top-12 -right-12 hidden md:block">
              <Card padding="sm" className="shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gold-border hover:-translate-y-0.5 pointer-events-none">
                <span className="text-gold-dark font-body text-xs font-bold flex items-center gap-1.5">
                  🏆 3rd Prize
                </span>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section bg-brand-section">
        <div className="container">
          <div className="text-center mb-16 max-w-xl mx-auto">
            <span className="text-gold font-display font-bold text-xs uppercase tracking-widest block mb-2">HOW IT WORKS</span>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-text-primary mb-3">Three simple steps</h2>
            <p className="text-text-secondary font-body text-base">Check your lottery ticket in under 30 seconds</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { num: "01", icon: "📷", title: "Scan or Enter", body: "Scan the QR code on your ticket with your camera, or type your numbers manually", border: "border-b-2 border-b-gold" },
              { num: "02", icon: "🔍", title: "Instant Check", body: "We compare your numbers against today's official results from NLB and DLB automatically", border: "border-b-2 border-b-gold", active: true },
              { num: "03", icon: "🏆", title: "See Your Result", body: "Find out instantly if you've won and exactly how much your prize is worth", border: "border-b-2 border-b-gold" },
            ].map((step, i) => (
              <Card 
                key={i} 
                hover 
                padding="lg" 
                className={`relative group h-full flex flex-col justify-between ${step.active ? "bg-gold-light/20 border-gold-border shadow-md" : ""}`}
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-full bg-gold-light border border-gold-border flex items-center justify-center font-display font-extrabold text-gold-dark text-sm">
                      {step.num}
                    </div>
                    <span className="text-3xl select-none">{step.icon}</span>
                  </div>
                  <h3 className="text-text-primary font-display font-extrabold text-xl leading-tight">{step.title}</h3>
                  <p className="text-text-secondary font-body text-sm leading-relaxed">{step.body}</p>
                </div>
                {/* Thin gold bottom accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl bg-gold/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/check" className="inline-block bg-gold text-white font-display font-semibold px-8 py-4 rounded-[12px] hover:bg-gold-dark transition-all active:scale-95 shadow-[0_4px_16px_rgba(232,168,0,0.25)]">
              Check My Ticket Now →
            </Link>
          </div>
        </div>
      </section>

      {/* All 16 Lotteries Section */}
      <section className="section bg-white">
        <div className="container">
          <div className="text-center mb-16 max-w-xl mx-auto">
            <span className="text-gold font-display font-bold text-xs uppercase tracking-widest block mb-2">SUPPORTED LOTTERIES</span>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-text-primary mb-3">All 16 Sri Lankan Lotteries</h2>
            <p className="text-text-secondary font-body text-base">Complete prize structures for every NLB and DLB draw</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {LOTTERIES.map((lottery, i) => (
              <Card key={i} hover padding="sm" className="space-y-4 border border-border-default hover:border-gold-border">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{LOTTERY_EMOJIS[lottery.name] || "🎫"}</span>
                  <Badge variant={lottery.board === "NLB" ? "blue" : "gold"}>
                    {lottery.board}
                  </Badge>
                </div>
                <div>
                  <p className="text-text-primary font-body font-bold text-sm md:text-base leading-snug truncate">{lottery.name}</p>
                  <p className="text-gold font-mono font-extrabold text-xs md:text-sm mt-1">{lottery.topPrize}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Ticket Checker Section */}
      <section className="section bg-brand-section">
        <div className="container">
          <div className="text-center mb-16 max-w-xl mx-auto">
            <span className="text-gold font-display font-bold text-xs uppercase tracking-widest block mb-2">QUICK CHECK</span>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-text-primary mb-3">Enter Your Numbers Here</h2>
            <p className="text-text-secondary font-body text-base">Compare your ticket with today's winning numbers instantly</p>
          </div>

          <div className="max-w-5xl mx-auto bg-white border border-border-default rounded-[24px] shadow-sm p-6 md:p-8">
            <TicketChecker />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section bg-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: "🔄", title: "Auto Updated", body: "Results fetched at 11:15 PM nightly from official NLB & DLB servers" },
              { icon: "📱", title: "Mobile Friendly", body: "Works on any device. Install as a web app on your phone home screen" },
              { icon: "🔒", title: "Private & Secure", body: "Your ticket numbers are never stored. All checks are processed anonymously" },
              { icon: "⚡", title: "Instant Results", body: "Get your detailed matching logs and results in under 2 seconds" },
            ].map((f, i) => (
              <Card key={i} className="space-y-3.5 border border-border-default hover:border-gold-border">
                <div className="text-3xl">{f.icon}</div>
                <h3 className="text-text-primary font-display font-extrabold text-lg leading-tight">{f.title}</h3>
                <p className="text-text-secondary font-body text-sm leading-relaxed">{f.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
