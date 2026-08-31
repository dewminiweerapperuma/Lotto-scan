import Card from "@/components/ui/Card";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="bg-brand-bg min-h-screen pt-24 pb-16">
      <div className="container max-w-3xl">
        {/* Header */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-text-primary mb-3">
            About LottoScan
          </h1>
          <p className="text-text-secondary font-body text-base md:text-lg">
            Sri Lanka's smartest lottery ticket checking platform
          </p>
        </div>

        {/* Content Cards */}
        <div className="space-y-6">
          <Card className="bg-white border border-border-default shadow-sm p-6">
            <h2 className="text-lg md:text-xl font-display font-extrabold text-text-primary mb-3">
              What is LottoScan?
            </h2>
            <p className="text-text-secondary font-body text-sm md:text-base leading-relaxed">
              LottoScan is a modern, free web application built specifically for Sri Lankan lottery players to verify their draw numbers instantly. Instead of spending time manually inspecting draw sheets on official boards like nlb.lk or dlb.lk, players can simply input ticket numbers or use the live camera scanner to get results within seconds.
            </p>
          </Card>

          <Card className="bg-white border border-border-default shadow-sm p-6">
            <h2 className="text-lg md:text-xl font-display font-extrabold text-text-primary mb-4 border-b border-border-default/50 pb-2">
              Automated Verification Cycle
            </h2>
            <div className="space-y-1">
              {[
                { time: "11:00 PM", desc: "Official NLB & DLB daily draws are completed" },
                { time: "11:15 PM", desc: "LottoScan scraper fetches official winning numbers from repositories" },
                { time: "11:45 PM", desc: "Secondary backup runs if draw results are delayed" },
                { time: "11:55 PM", desc: "Alert notification triggers if draw records are empty" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-start md:items-center gap-4 py-3 border-b border-border-default/45 last:border-0"
                >
                  <span className="text-gold-dark font-mono font-bold text-xs md:text-sm w-20 shrink-0 select-none bg-gold-light/40 px-2 py-0.5 rounded border border-gold-border/30 text-center">
                    {item.time}
                  </span>
                  <span className="text-text-secondary font-body text-sm leading-relaxed">
                    {item.desc}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-white border border-border-default shadow-sm p-6">
            <h2 className="text-lg md:text-xl font-display font-extrabold text-text-primary mb-4">
              Supported Lottery Boards
            </h2>
            <p className="text-text-secondary font-body text-sm md:text-base leading-relaxed mb-4">
              LottoScan parses draws for both major Sri Lankan boards automatically:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                "Ada Kotipathi",
                "Ada Sampatha",
                "Dhana Nidhanya",
                "Govisetha",
                "Handahana",
                "Jaya Sampatha",
                "Kapruka",
                "Lagna Wasanawa",
                "Mahajana Sampatha",
                "Mega Power",
                "NLB Jaya",
                "Sasiri",
                "Shanida Wasanawa",
                "Suba Dawsak",
                "Super Ball",
                "Supiri Dhana Sampatha",
              ].map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-2 text-xs md:text-sm font-body text-text-secondary bg-brand-section px-3 py-2 rounded-xl border border-border-default hover:border-gold-border transition-colors truncate"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                  {name}
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-white border border-border-default shadow-sm p-6">
            <h2 className="text-lg md:text-xl font-display font-extrabold text-text-primary mb-3">
              Privacy Policy
            </h2>
            <p className="text-text-secondary font-body text-sm md:text-base leading-relaxed">
              We respect user privacy. All ticket checks are processed in-memory during validation. None of your entered numbers, zodiacs, letters, or scanned values are stored permanently in databases. Logs are recorded as anonymous totals for count statistics.
            </p>
          </Card>

          <div className="text-center pt-6">
            <Link
              href="/check"
              className="inline-block bg-gold text-white font-display font-semibold text-base px-8 py-4 rounded-[12px] hover:bg-gold-dark hover:shadow-lg transition-all active:scale-95 shadow-[0_4px_16px_rgba(232,168,0,0.25)]"
            >
              Check My Ticket Now →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
