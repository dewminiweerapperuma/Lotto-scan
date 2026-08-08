import Card from "@/components/ui/Card";

const FEATURES = [
  { icon: "🔄", title: "Auto Updated", body: "Results fetched automatically from NLB & DLB websites at 11:15 PM every night. Backup fetch at 11:45 PM." },
  { icon: "💻", title: "Works Everywhere", body: "Desktop website that works on any browser. No download needed. Just open and check your ticket." },
  { icon: "🔒", title: "Private & Secure", body: "Your ticket numbers are never permanently stored. All checks are anonymous and secure." },
  { icon: "⚡", title: "Instant Results", body: "Get your result in under 2 seconds. No waiting, no page reloading, no hassle." },
];

export default function Features() {
  return (
    <section className="py-24 max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <p className="text-gold text-sm font-body uppercase tracking-widest mb-3">Why LottoScan</p>
        <h2 className="font-display font-bold text-4xl md:text-5xl mb-4">Built Different</h2>
        <p className="text-white/40 font-body text-lg max-w-xl mx-auto">
          Everything you need, nothing you don't
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {FEATURES.map((f) => (
          <Card key={f.title} hover>
            <div className="text-3xl mb-4">{f.icon}</div>
            <h3 className="font-display font-bold text-lg mb-2 text-white">{f.title}</h3>
            <p className="text-white/40 font-body text-sm leading-relaxed">{f.body}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
