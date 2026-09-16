"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { api, formatINR } from "@/lib/api";
import { Menu, X, Check, Star, MessageCircle, ArrowRight } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api<any>("/plans")
      .then((d) => setPlans(d.plans.slice(0, 3)))
      .catch(() => {});
  }, []);

  const ctaHref = user ? "/dashboard" : "/signup";
  const plansHref = user ? "/dashboard/plans" : "/signup";
  const expertHref = user?.planId ? "/dashboard/chat" : "https://wa.me/919693959083";

  const services = [
    { icon: "₹", title: "GST Services", desc: "Complete GST support from registration to filing and notices.", items: ["GST Registration", "Monthly & Quarterly Filing", "GST Reconciliation", "GST Notice Assistance", "Annual GST Compliance"] },
    { icon: "◫", title: "Income Tax", desc: "Tax filing and advisory for individuals, professionals and businesses.", items: ["Individual ITR Filing", "Business Income Tax", "Tax Planning", "Advance Tax Assistance", "Notice Support"] },
    { icon: "▣", title: "Accounting & Bookkeeping", desc: "Keep your books clean, updated and ready for decision-making.", items: ["Monthly Bookkeeping", "Profit & Loss", "Balance Sheet", "Expense Tracking", "Bank Reconciliation", "Payroll Support"] },
    { icon: "◆", title: "Company & ROC", desc: "Business registration and ongoing MCA / ROC compliance.", items: ["Private Limited Company", "LLP Registration", "Partnership Registration", "Annual ROC Filing", "MCA Documentation"] },
  ];

  const whys = [
    { icon: "👨‍💼", title: "Dedicated Experts", desc: "Professionals who understand your business and your books." },
    { icon: "💬", title: "WhatsApp Support", desc: "Ask questions, share documents and receive updates easily." },
    { icon: "🎯", title: "One Point of Contact", desc: "No jumping between multiple accountants or consultants." },
    { icon: "⚡", title: "Fast Turnaround", desc: "Stay ahead of deadlines with organised compliance management." },
  ];

  const audience = ["🚀 Startups", "🏢 MSMEs", "💻 IT & SaaS", "🛒 E-commerce", "🎨 Agencies", "👨‍💻 Freelancers"];

  const steps = [
    { title: "Tell us what you need", desc: "Share your requirement through our website or WhatsApp." },
    { title: "Meet your expert", desc: "We connect you with the right compliance professional." },
    { title: "Share documents", desc: "Upload the required documents securely." },
    { title: "We handle it", desc: "GST, ITR, accounting, ROC and documentation." },
    { title: "Stay compliant", desc: "Receive acknowledgements, reports and ongoing support." },
  ];

  const faqs = [
    { q: "Do I get a dedicated CA?", a: "Depending on your selected plan, you get a dedicated compliance professional or CA who becomes your primary point of contact." },
    { q: "Can I upload documents on WhatsApp?", a: "Yes. You can share required documents and receive updates through WhatsApp." },
    { q: "Do you help with GST notices?", a: "Yes. SMRIDHI provides GST notice assistance and expert guidance based on your plan and requirements." },
    { q: "Do you work with startups?", a: "Absolutely. We support startups with registration, GST, accounting, taxation and ongoing ROC compliance." },
    { q: "How do payments work?", a: "Select a plan and contact our team. We will guide you through payment and onboarding." },
    { q: "Where are you based?", a: "SMRIDHI is based in Bengaluru, Karnataka, India." },
  ];

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#172033]">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-[15px]" style={{ borderBottom: "1px solid rgba(20,40,70,.08)" }}>
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl font-display text-xl font-extrabold text-white" style={{ background: "linear-gradient(135deg,var(--navy),var(--green))", boxShadow: "0 8px 20px rgba(16,35,63,.18)" }}>
              S
            </div>
            <div className="leading-tight">
              <div className="font-display text-xl font-extrabold tracking-tight" style={{ color: "var(--navy)" }}>SMRIDHI</div>
              <div className="text-[10px] font-semibold" style={{ color: "#7b8492" }}>Business Compliance &amp; Finance</div>
            </div>
          </div>
          <nav className="hidden items-center gap-7 text-sm font-semibold md:flex" style={{ color: "#4d596c" }}>
            <a href="#services" className="transition hover:text-[#087f5b]">Services</a>
            <a href="#why" className="transition hover:text-[#087f5b]">Why SMRIDHI</a>
            <a href="#pricing" className="transition hover:text-[#087f5b]">Pricing</a>
            <a href="#how" className="transition hover:text-[#087f5b]">How It Works</a>
            <a href="#faq" className="transition hover:text-[#087f5b]">FAQ</a>
          </nav>
          <div className="hidden items-center gap-2.5 md:flex">
            <a href="https://wa.me/919693959083" className="btn-secondary" style={{ borderRadius: 10 }}>
              <MessageCircle className="h-4 w-4" style={{ color: "#087f5b" }} /> WhatsApp
            </a>
            {user ? (
              <Link href={ctaHref} className="btn-primary" style={{ borderRadius: 10 }}>
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link href="/signup" className="btn-primary" style={{ borderRadius: 10 }}>
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          <button className="border-0 bg-transparent text-2xl md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && (
          <nav className="flex flex-col gap-3 border-t bg-white px-6 py-4 text-sm font-semibold md:hidden" style={{ borderColor: "var(--border)", color: "#4d596c" }}>
            <a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
            <a href="#why" onClick={() => setMenuOpen(false)}>Why SMRIDHI</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
            <a href="#how" onClick={() => setMenuOpen(false)}>How It Works</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
            <Link href={ctaHref} className="btn-primary mt-2">Get Started</Link>
          </nav>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ padding: "95px 0 90px", background: "radial-gradient(circle at 85% 15%,rgba(16,168,120,.15),transparent 28%),radial-gradient(circle at 10% 90%,rgba(215,168,62,.10),transparent 24%),linear-gradient(135deg,#ffffff,#f3f7fb)" }}>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-extrabold text-[#087f5b]" style={{ background: "#e8f6f0", borderColor: "#ccecdf" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-[#10a878]" /> CA-Verified · Trusted Compliance Support
            </div>
            <h1 className="font-display text-5xl font-extrabold leading-[1.04] tracking-[-3.5px] lg:text-[70px]" style={{ color: "var(--navy)" }}>
              Your Business. <br />
              Our <em className="not-italic" style={{ color: "#087f5b" }}>Compliance.</em>
            </h1>
            <p className="mt-5 max-w-xl text-lg" style={{ color: "var(--muted)" }}>
              GST, Income Tax, Accounting, Bookkeeping and ROC compliance — handled by professionals so you can focus on growing your business.
            </p>
            <div className="mt-3 mb-8 flex flex-wrap gap-6 text-[13px] font-semibold" style={{ color: "#586477" }}>
              <span><span className="font-black text-[#087f5b]">✓</span> 2,000+ businesses supported</span>
              <span><span className="font-black text-[#087f5b]">✓</span> CA-verified professionals</span>
              <span><span className="font-black text-[#087f5b]">✓</span> 24×7 WhatsApp support</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={plansHref} className="btn-primary px-6 py-3.5 text-base" style={{ borderRadius: 10 }}>Explore Plans <ArrowRight className="h-5 w-5" /></Link>
              <Link href={expertHref} className="btn-secondary px-6 py-3.5 text-base" style={{ borderRadius: 10 }}>
                <MessageCircle className="h-5 w-5 text-[#087f5b]" /> Talk to an Expert
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-[25px] border bg-white p-6" style={{ borderColor: "#e3e8ef", boxShadow: "0 30px 80px rgba(16,35,63,.14)" }}>
              <div className="mb-6 flex items-center justify-between">
                <div className="font-display text-base font-extrabold" style={{ color: "var(--navy)" }}>SMRIDHI Compliance</div>
                <span className="badge font-bold text-[#087f5b]" style={{ background: "#e8f6f0", border: "1px solid #ccecdf" }}>● ALL ON TRACK</span>
              </div>
              {[
                { label: "GST Compliance", v: "100%" },
                { label: "Income Tax", v: "92%" },
                { label: "ROC Compliance", v: "88%" },
              ].map((r) => (
                <div key={r.label} className="mb-5">
                  <div className="mb-1.5 flex justify-between text-sm font-semibold">
                    <span style={{ color: "#4d596c" }}>{r.label}</span>
                    <span style={{ color: "var(--navy)" }}>{r.v}</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "#eef2f7" }}>
                    <div className="h-2 rounded-full" style={{ width: r.v, background: "linear-gradient(90deg,var(--green),var(--green2))" }} />
                  </div>
                </div>
              ))}
              <div className="mt-7 grid grid-cols-2 gap-3">
                {[
                  { n: "2,000+", l: "Businesses Supported" },
                  { n: "24×7", l: "Expert Support" },
                ].map((s) => (
                  <div key={s.l} className="rounded-2xl p-4" style={{ background: "var(--light)", border: "1px solid var(--border)" }}>
                    <div className="font-display text-2xl font-extrabold" style={{ color: "var(--green)" }}>{s.n}</div>
                    <div className="text-xs font-semibold" style={{ color: "#687386" }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="font-display text-4xl font-extrabold tracking-tight" style={{ color: "var(--navy)" }}>What We Do</h2>
          <p className="mt-2 text-lg" style={{ color: "var(--muted)" }}>Everything your business needs. One place.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <div key={s.title} className="rounded-2xl border bg-white p-6 transition hover:-translate-y-1" style={{ borderColor: "var(--border)", boxShadow: "0 6px 20px rgba(16,35,63,.05)" }}>
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl font-display text-xl font-extrabold text-white" style={{ background: "linear-gradient(135deg,var(--navy),var(--green))" }}>{s.icon}</div>
              <h3 className="font-display text-lg font-extrabold" style={{ color: "var(--navy)" }}>{s.title}</h3>
              <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>{s.desc}</p>
              <ul className="mt-4 space-y-2">
                {s.items.map((it) => (
                  <li key={it} className="flex items-start gap-2 text-sm" style={{ color: "#4d596c" }}>
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#087f5b" }} /> {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Why SMRIDHI */}
      <section id="why" className="py-20" style={{ background: "var(--cream)" }}>
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="font-display text-4xl font-extrabold tracking-tight" style={{ color: "var(--navy)" }}>Why SMRIDHI</h2>
            <p className="mt-2 text-lg" style={{ color: "var(--muted)" }}>More than compliance. A partner for your business.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-3xl p-8" style={{ background: "linear-gradient(135deg,var(--navy),var(--navy2))", color: "white" }}>
              <h3 className="font-display text-2xl font-extrabold">Stop chasing accountants. Start focusing on growth.</h3>
              <p className="mt-3 text-sm opacity-80">
                Your business shouldn&apos;t slow down because of GST deadlines, tax filings or accounting work. SMRIDHI brings everything together under one dedicated team.
              </p>
              <ul className="mt-6 space-y-3 text-sm font-medium">
                {["One dedicated point of contact", "Compliance deadline tracking", "WhatsApp-first support", "Transparent annual pricing"].map((x) => (
                  <li key={x}><span className="mr-2 font-black text-[#10a878]">✓</span>{x}</li>
                ))}
              </ul>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {whys.map((w) => (
                <div key={w.title} className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--border)" }}>
                  <div className="mb-3 text-3xl">{w.icon}</div>
                  <h3 className="font-bold" style={{ color: "var(--navy)" }}>{w.title}</h3>
                  <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-12 text-center">
            <h3 className="font-display text-2xl font-extrabold" style={{ color: "var(--navy)" }}>Built for businesses at every stage</h3>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {audience.map((a) => (
                <span key={a} className="rounded-full border bg-white px-5 py-2.5 text-sm font-bold" style={{ borderColor: "#dbe3ec", color: "#4d596c" }}>{a}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="font-display text-4xl font-extrabold tracking-tight" style={{ color: "var(--navy)" }}>How It Works</h2>
          <p className="mt-2 text-lg" style={{ color: "var(--muted)" }}>Simple. Clear. Done.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-5">
          {steps.map((st, i) => (
            <div key={st.title} className="relative rounded-2xl border bg-white p-6 text-center" style={{ borderColor: "var(--border)" }}>
              <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full font-display font-extrabold text-white" style={{ background: "linear-gradient(135deg,var(--green),var(--green2))" }}>{i + 1}</div>
              <h3 className="font-bold" style={{ color: "var(--navy)" }}>{st.title}</h3>
              <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>{st.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20" style={{ background: "var(--light)" }}>
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="font-display text-4xl font-extrabold tracking-tight" style={{ color: "var(--navy)" }}>Simple Pricing</h2>
            <p className="mt-2 text-lg" style={{ color: "var(--muted)" }}>Choose the plan that fits your business.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((p: any) => (
              <div key={p._id} className="relative rounded-3xl border bg-white p-8" style={{ borderColor: p.popular ? "var(--green)" : "var(--border)", borderWidth: 2, boxShadow: p.popular ? "0 20px 50px rgba(8,127,91,.15)" : "0 6px 20px rgba(16,35,63,.05)" }}>
                {p.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5 text-xs font-extrabold text-white" style={{ background: "linear-gradient(135deg,var(--green),var(--green2))" }}>MOST POPULAR</span>
                )}
                <div className="text-xs font-bold uppercase tracking-wide" style={{ color: "#7b8492" }}>{p.name}</div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-extrabold" style={{ color: "var(--navy)" }}>{formatINR(p.price)}</span>
                  <span className="text-sm font-semibold" style={{ color: "#7b8492" }}>/{p.billingCycle}</span>
                </div>
                <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>{p.description}</p>
                <ul className="mt-6 space-y-2.5 border-t pt-6" style={{ borderColor: "var(--border)" }}>
                  {(p.features || []).slice(0, 7).map((f: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#4d596c" }}>
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#087f5b" }} /> {f}
                    </li>
                  ))}
                </ul>
                <Link href={plansHref} className={`${p.popular ? "btn-primary" : "btn-dark"} mt-8 w-full`} style={{ borderRadius: 10 }}>
                  Choose {p.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Professional Support */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid items-center gap-10 rounded-3xl px-8 py-12 md:grid-cols-2 lg:px-16" style={{ background: "linear-gradient(135deg,var(--navy),var(--navy2))", color: "white" }}>
          <div>
            <h2 className="font-display text-4xl font-extrabold tracking-tight">Real experts. Real support.</h2>
            <p className="mt-3 opacity-80">Your finances deserve more than an automated dashboard. SMRIDHI combines technology with human expertise so you always have someone to speak to when you need help.</p>
          </div>
          <div className="space-y-3 text-sm font-semibold">
            {["CA-verified professionals", "Dedicated compliance support", "WhatsApp-first communication", "Business-focused tax & finance guidance"].map((x) => (
              <div key={x} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3"><Check className="h-5 w-5 shrink-0 text-[#10a878]" /> {x}</div>
            ))}
            <Link href={expertHref} className="btn-primary mt-2 px-6 py-3" style={{ borderRadius: 10 }}>Talk to an Expert</Link>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="mx-auto max-w-4xl px-4 pb-20 text-center">
        <div className="flex justify-center gap-1" style={{ color: "#d7a83e" }}>
          {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
        </div>
        <blockquote className="mx-auto mt-5 max-w-2xl text-xl font-medium md:text-2xl" style={{ color: "var(--navy)" }}>
          &ldquo;Instead of worrying about GST deadlines, filings and accounting, I can focus on actually running my business.&rdquo;
        </blockquote>
        <p className="mt-4 text-sm font-semibold" style={{ color: "#7b8492" }}>— Business Owner · Bengaluru</p>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 pb-20">
        <h2 className="mb-10 text-center font-display text-4xl font-extrabold tracking-tight" style={{ color: "var(--navy)" }}>Questions? We&apos;ve got answers.</h2>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
              <summary className="cursor-pointer list-none font-semibold" style={{ color: "var(--navy)" }}>{f.q}<span className="float-right font-bold" style={{ color: "#087f5b" }}>+</span></summary>
              <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="rounded-3xl p-10 text-center md:p-16" style={{ background: "radial-gradient(circle at 70% 20%,rgba(16,168,120,.25),transparent 40%),linear-gradient(135deg,var(--green),var(--green2))" }}>
          <h2 className="font-display text-4xl font-extrabold tracking-tight text-white">Your business deserves better compliance.</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/90">
            Let SMRIDHI handle the paperwork, deadlines and filings — while you focus on building the next big thing.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href={ctaHref} className="px-6 py-3.5 text-base font-extrabold text-[var(--navy)]" style={{ background: "white", borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,.15)" }}>
              Get Started <ArrowRight className="ml-1 inline h-5 w-5" />
            </Link>
            <a href="https://wa.me/919693959083" className="border-2 border-white/70 px-6 py-3.5 text-base font-extrabold text-white transition hover:bg-white/10" style={{ borderRadius: 10 }}>
              💬 Talk on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-14" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl font-display text-lg font-extrabold text-white" style={{ background: "linear-gradient(135deg,var(--navy),var(--green))" }}>S</div>
              <div className="leading-tight">
                <div className="font-display text-lg font-extrabold" style={{ color: "var(--navy)" }}>SMRIDHI</div>
                <div className="text-[10px] font-semibold" style={{ color: "#7b8492" }}>Business Compliance &amp; Finance</div>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm" style={{ color: "var(--muted)" }}>
              Business Compliance &amp; Financial Services for Indian businesses. GST, Income Tax, Accounting and ROC — managed by professionals with dedicated support.
            </p>
            <p className="mt-4 text-sm" style={{ color: "#7b8492" }}>
              Srinivasa, Flat No. 3, 3rd Floor, Whitefield, Bengaluru, Karnataka, India
            </p>
          </div>
          <div className="text-sm">
            <div className="mb-4 font-display font-extrabold" style={{ color: "var(--navy)" }}>Quick Links</div>
            <ul className="space-y-2.5" style={{ color: "#4d596c" }}>
              <li><a href="#services" className="hover:text-[#087f5b]">Services</a></li>
              <li><a href="#why" className="hover:text-[#087f5b]">Why SMRIDHI</a></li>
              <li><a href="#pricing" className="hover:text-[#087f5b]">Pricing</a></li>
              <li><a href="#how" className="hover:text-[#087f5b]">How It Works</a></li>
              <li><a href="#faq" className="hover:text-[#087f5b]">FAQ</a></li>
            </ul>
          </div>
          <div className="text-sm">
            <div className="mb-4 font-display font-extrabold" style={{ color: "var(--navy)" }}>Get in touch</div>
            <ul className="space-y-2.5" style={{ color: "#4d596c" }}>
              <li><a href="mailto:hello@smaridhi.com" className="hover:text-[#087f5b]">hello@smaridhi.com</a></li>
              <li><a href="tel:+919693959083" className="hover:text-[#087f5b]">+91 96939 59083</a></li>
              <li><a href="https://wa.me/919693959083" className="hover:text-[#087f5b]">WhatsApp Support</a></li>
            </ul>
          </div>
          <div className="text-sm" style={{ color: "#4d596c" }}>
            <div className="mb-4 font-display font-extrabold" style={{ color: "var(--navy)" }}>Support</div>
            <p>24×7 Support — call, email or WhatsApp</p>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-6xl border-t px-4 pt-6 text-center text-xs" style={{ borderColor: "var(--border)", color: "#7b8492" }}>
          © {new Date().getFullYear()} SMRIDHI. All Rights Reserved. · Business Compliance &amp; Financial Services · Bengaluru, India
        </div>
      </footer>
    </div>
  );
}