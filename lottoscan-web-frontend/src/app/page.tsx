"use client";

import Link from "next/link";
import Card from "@/components/ui/Card";
import { LOTTERIES } from "@/lib/constants";
import TicketChecker from "@/components/sections/TicketChecker";
import LotteryGrid from "@/components/sections/LotteryGrid";
import LiveDrawHeroCard from "@/components/home/LiveDrawHeroCard";
import { useLanguage } from "@/context/LanguageContext";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-brand-bg pt-28 md:pt-36 pb-16 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gold/5 blur-[150px] pointer-events-none" />
        
        <div className="container relative z-10 text-center max-w-[960px] py-6 md:py-12">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 bg-gold-light border border-gold-border rounded-full px-5 py-2 mb-6 shadow-sm">
            <span className="text-sm">🎫</span>
            <span className="text-gold-dark text-xs md:text-sm font-display font-bold uppercase tracking-wider">
              {t("hero_badge")}
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold leading-[1.1] tracking-tight text-text-primary mb-6">
            {t("hero_title_1")}<br />
            {t("hero_title_ticket")} <span className="text-gold-gradient">{t("hero_title_instant")}</span>
          </h1>

          {/* Subheading */}
          <p className="text-text-secondary font-body text-base md:text-xl max-w-[620px] mx-auto mb-8 leading-relaxed">
            {t("hero_subtitle")}
          </p>

          {/* Two CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/check" className="w-full sm:w-auto bg-gold text-white font-display font-semibold text-lg px-8 py-4 rounded-[14px] hover:bg-gold-dark transition-all active:scale-95 shadow-[0_4px_20px_rgba(232,168,0,0.35)] hover:shadow-[0_8px_32px_rgba(232,168,0,0.45)] text-center">
              {t("hero_btn_check")}
            </Link>
            <Link href="/results" className="w-full sm:w-auto bg-white text-text-primary border border-border-default font-display font-semibold text-lg px-8 py-4 rounded-[14px] hover:border-border-hover transition-all shadow-sm hover:shadow active:scale-95 text-center">
              {t("hero_btn_results")}
            </Link>
          </div>

          {/* Stats Row - Dynamically derived from LOTTERIES and system capabilities */}
          <div className="flex items-center justify-center gap-4 md:gap-12 mt-12 border-t border-border-default pt-8 max-w-xl mx-auto">
            {[
              { value: `${LOTTERIES.length}`, label: t("stat_lotteries") },
              { value: "NLB & DLB", label: t("stat_boards") },
              { value: "100%", label: t("stat_data") },
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

          {/* Dynamic Live Draw Showcase Card */}
          <div className="mt-14 max-w-3xl mx-auto text-left">
            <LiveDrawHeroCard />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section bg-brand-section">
        <div className="container">
          <div className="text-center mb-16 max-w-xl mx-auto">
            <span className="text-gold font-display font-bold text-xs uppercase tracking-widest block mb-2">{t("how_it_works_badge")}</span>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-text-primary mb-3">{t("how_it_works_title")}</h2>
            <p className="text-text-secondary font-body text-base">{t("how_it_works_subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { num: "01", icon: "📷", title: t("step_1_title"), body: t("step_1_desc"), border: "border-b-2 border-b-gold" },
              { num: "02", icon: "🔍", title: t("step_2_title"), body: t("step_2_desc"), border: "border-b-2 border-b-gold", active: true },
              { num: "03", icon: "🏆", title: t("step_3_title"), body: t("step_3_desc"), border: "border-b-2 border-b-gold" },
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
              {t("how_it_works_btn")}
            </Link>
          </div>
        </div>
      </section>

      {/* All 16 Lotteries Section */}
      <LotteryGrid />

      {/* Quick Ticket Checker Section */}
      <section className="section bg-brand-section">
        <div className="container">
          <div className="text-center mb-16 max-w-xl mx-auto">
            <span className="text-gold font-display font-bold text-xs uppercase tracking-widest block mb-2">{t("quick_check_badge")}</span>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-text-primary mb-3">{t("quick_check_title")}</h2>
            <p className="text-text-secondary font-body text-base">{t("quick_check_subtitle")}</p>
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
              { icon: "🔄", title: t("feature_auto_update_title"), body: t("feature_auto_update_desc") },
              { icon: "📱", title: t("feature_mobile_title"), body: t("feature_mobile_desc") },
              { icon: "🔒", title: t("feature_secure_title"), body: t("feature_secure_desc") },
              { icon: "⚡", title: t("feature_instant_title"), body: t("feature_instant_desc") },
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
