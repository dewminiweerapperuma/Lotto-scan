import Card from "@/components/ui/Card";
import Link from "next/link";
import Button from "@/components/ui/Button";

const STEPS = [
  { num: "01", icon: "📝", title: "Enter Your Numbers", body: "Type the numbers printed on your lottery ticket into the input boxes. Optionally enter the letter or zodiac sign too." },
  { num: "02", icon: "🔍", title: "We Check Instantly", body: "LottoScan compares your numbers against today's winning results from NLB and DLB fetched automatically at 11:15 PM." },
  { num: "03", icon: "🏆", title: "See Your Result", body: "Find out instantly if you won and exactly how much your prize is worth. Winners get full claim instructions." },
];

export default function HowItWorks() {
  return (
    <section className="py-24 max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <p className="text-gold text-sm font-body uppercase tracking-widest mb-3">Simple Process</p>
        <h2 className="font-display font-bold text-4xl md:text-5xl mb-4">How It Works</h2>
        <p className="text-white/40 font-body text-lg max-w-xl mx-auto">
          Check your lottery ticket in three simple steps
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {STEPS.map((step) => (
          <Card key={step.num} className="relative overflow-hidden group" hover>
            <div className="absolute top-4 right-4 font-display font-extrabold text-5xl text-white/3 select-none">
              {step.num}
            </div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-2xl mb-5">
                {step.icon}
              </div>
              <div className="text-gold text-xs font-body uppercase tracking-widest mb-2">Step {step.num}</div>
              <h3 className="font-display font-bold text-xl mb-3 text-white">{step.title}</h3>
              <p className="text-white/40 font-body text-sm leading-relaxed">{step.body}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Link href="/check">
          <Button size="lg">Check My Ticket Now →</Button>
        </Link>
      </div>
    </section>
  );
}
