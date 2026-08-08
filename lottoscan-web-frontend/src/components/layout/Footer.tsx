import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A] border-t border-white/10 text-white mt-20">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-display font-extrabold text-xl">
              <span>🎫</span>
              <span>
                <span className="text-white">Lotto</span>
                <span className="text-gold">Scan</span>
              </span>
            </div>
            <p className="text-white/40 text-sm font-body leading-relaxed max-w-xs">
              Check your ticket. Know instantly. Sri Lanka's smartest lottery ticket checker, supporting all NLB and DLB draws.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-body px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60">
              <span className="w-2 h-2 rounded-full bg-win animate-pulse"></span>
              NLB & DLB Supported
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-4">
            <h3 className="text-white font-display font-semibold text-sm uppercase tracking-widest">Quick Links</h3>
            <div className="space-y-2.5">
              {[
                { href: "/results", label: "Today's Results" },
                { href: "/check", label: "Check Ticket" },
                { href: "/about", label: "About" },
                { href: "/admin", label: "Admin Login" },
              ].map(link => (
                <Link key={link.href} href={link.href}
                  className="block text-white/50 hover:text-gold text-sm font-body transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Col 3 */}
          <div className="space-y-4">
            <h3 className="text-white font-display font-semibold text-sm uppercase tracking-widest">Results Schedule</h3>
            <div className="bg-black/20 border border-white/5 rounded-[20px] p-5 space-y-4">
              {[
                { time: "11:00 PM", label: "Draws completed", color: "bg-gold" },
                { time: "11:15 PM", label: "Primary fetch", color: "bg-win" },
                { time: "11:45 PM", label: "Backup fetch", color: "bg-blue-400" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`}></div>
                  <span className="text-gold font-mono text-xs font-bold w-16">{item.time}</span>
                  <span className="text-white/40 text-xs font-body">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-xs font-body">© 2026 LottoScan. All rights reserved.</p>
          <p className="text-white/35 text-xs font-body flex items-center gap-1">
            Built for Sri Lanka <span className="text-sm">🇱🇰</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
