import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { projects, type ProjectGroup } from "./data/projects";
import { stats as heroStats } from "./data/stats.js";
import { ProjectCard } from "./components/ProjectCard";
import "./styles.css";

gsap.registerPlugin(ScrollTrigger);

const projectFilters: { label: string; group: ProjectGroup | "All" }[] = [
  { label: "All work", group: "All" }, { label: "Shopify", group: "Shopify" },
  { label: "WordPress", group: "WordPress" }, { label: "Custom web", group: "Custom" }, { label: "Other", group: "Other" },
];

const words = "I build thoughtful digital storefronts and websites, from custom Shopify sections to the small details that keep a live site running smoothly.".split(" ");
const skills = ["WordPress", "Shopify", "Wix", "WooCommerce", "Liquid", "Elementor", "ACF", "PHP", "JavaScript", "HTML / CSS", "Bootstrap", "cPanel", "DNS", "SSL"];
const roleWords = ["Shopify Developer", "WordPress Expert", "Liquid Specialist", "WooCommerce Builder"];

function Preloader({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || sessionStorage.getItem("sm-loaded")) { onComplete(); return; }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 1150, 1);
      setCount(Math.round(progress * 100));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else { sessionStorage.setItem("sm-loaded", "1"); window.setTimeout(onComplete, 180); }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onComplete]);
  return <div className="preloader" aria-label={`Loading ${count}%`}><span className="preloader-mark">SM</span><span className="preloader-count">{String(count).padStart(3, "0")}<small> / 100</small></span><span className="preloader-line"><i style={{ transform: `scaleX(${count / 100})` }} /></span></div>;
}

function LiveClock({ city = false }: { city?: boolean }) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => setTime(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <span className={`clock-label${city ? " clock-city" : ""}`}>{city ? "KARACHI" : "KHI"} <b>{time || "--:--:--"}</b> PKT</span>;
}

function RoleTicker() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % roleWords.length), 2000);
    return () => window.clearInterval(timer);
  }, []);
  return <p className="hero-role-line">I am a <span className="role-ticker-mask"><span key={roleWords[index]} className="role-ticker-word">{roleWords[index]}</span></span></p>;
}

function Cursor() {
  const dot = useRef<HTMLSpanElement>(null);
  const ring = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;
    let targetX = 0;
    let targetY = 0;
    let ringX = 0;
    let ringY = 0;
    let started = false;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      targetX = event.clientX;
      targetY = event.clientY;
      dot.current?.classList.add("cursor-visible");
      ring.current?.classList.add("cursor-visible");
      if (!started) { ringX = targetX; ringY = targetY; started = true; }
      gsap.set(dot.current, { x: targetX, y: targetY });
    };
    const follow = () => {
      if (!started) return;
      ringX += (targetX - ringX) * .15;
      ringY += (targetY - ringY) * .15;
      gsap.set(ring.current, { x: ringX, y: ringY });
    };
    const enter = (event: PointerEvent) => { if ((event.target as HTMLElement).closest("[data-cursor='view']")) ring.current?.classList.add("cursor-view"); };
    const leave = (event: PointerEvent) => { if (!(event.relatedTarget as HTMLElement | null)?.closest("[data-cursor='view']")) ring.current?.classList.remove("cursor-view"); };
    window.addEventListener("pointermove", move);
    gsap.ticker.add(follow);
    document.addEventListener("pointerover", enter);
    document.addEventListener("pointerout", leave);
    return () => { window.removeEventListener("pointermove", move); gsap.ticker.remove(follow); document.removeEventListener("pointerover", enter); document.removeEventListener("pointerout", leave); };
  }, []);
  return <><span ref={dot} className="cursor-dot" aria-hidden="true" /><span ref={ring} className="cursor-ring" aria-hidden="true"><span>VIEW</span></span></>;
}

const navLinks = [
  { id: "work", label: "Work" },
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "toolkit", label: "Expertise" },
];
const menuLinks = [{ id: "work", title: "Selected work" }, { id: "about", title: "About" }, { id: "services", title: "Capabilities" }, { id: "experience", title: "Experience" }, { id: "contact", title: "Contact" }];

function Navigation({ onTheme, active }: { onTheme: () => void; active: string }) {
  const [visible, setVisible] = useState(true);
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  useEffect(() => {
    let previous = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = window.scrollY;
        setCompact(next > 80);
        if (next < 80 || next < previous - 3) setVisible(true);
        else if (next > previous + 3) setVisible(false);
        previous = next;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, []);
  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    const esc = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", esc);
    return () => { document.body.classList.remove("menu-open"); window.removeEventListener("keydown", esc); };
  }, [menuOpen]);
  const close = () => setMenuOpen(false);
  const point = (event: React.PointerEvent<HTMLAnchorElement> | React.FocusEvent<HTMLAnchorElement>) => setPill({ x: event.currentTarget.offsetLeft, w: event.currentTarget.offsetWidth });
  return <>
    <header className={`island-header ${visible || menuOpen ? "nav-visible" : "nav-hidden"}${compact ? " is-compact" : ""}`}>
      <nav className="island" aria-label="Main navigation">
        <button className="island-logo" type="button" aria-label="Toggle color theme" onClick={onTheme}><span className="island-mark">SM</span><span className="island-name">Syed Ali Moosa</span></button>
        <div className="island-links" onPointerLeave={() => setPill(null)}>
          <span className="island-pill" aria-hidden="true" style={pill ? { transform: `translateX(${pill.x}px)`, width: pill.w, opacity: 1 } : undefined} />
          {navLinks.map((link) => <a key={link.id} href={`#${link.id}`} aria-current={active === link.id ? "location" : undefined} className={active === link.id ? "is-active" : ""} onPointerEnter={point} onFocus={point}>{link.label}{link.count && <sup>{link.count}</sup>}</a>)}
        </div>
        <a className="island-cta" href="#contact"><span>Let's talk</span><b aria-hidden="true">&#8599;</b></a>
        <button className="island-menu" type="button" aria-expanded={menuOpen} aria-controls="menu-overlay" onClick={() => setMenuOpen(!menuOpen)}><span>{menuOpen ? "Close" : "Menu"}</span><i aria-hidden="true" /></button>
      </nav>
    </header>
    <div className={`menu-overlay ${menuOpen ? "menu-opened" : ""}`} id="menu-overlay" aria-hidden={!menuOpen}>
      <div className="menu-overlay-inner shell"><span className="section-kicker">Navigate / Karachi, PK</span>{menuLinks.map((item, index) => <a href={`#${item.id}`} onClick={close} key={item.id} tabIndex={menuOpen ? 0 : -1}><span>0{index + 1}</span>{item.title}<b aria-hidden="true">&#8599;</b></a>)}<LiveClock /></div>
    </div>
  </>;
}

const codeLines = [
  "{% for product in collection.products %}",
  "  <img src=\"{{ product.image | img_url }}\">",
  "  <h3>{{ product.title }}</h3>",
  "  <p>{{ product.price | money }}</p>",
  "  <button>Add to cart</button>",
  "{% endfor %}",
];
const codeText = codeLines.join("\n");

function Highlight({ text }: { text: string }) {
  return <>{text.split(/(\{%[^%]*%\}|\{\{[^}]*\}\}|<\/?[a-z0-9]+|>)/g).map((part, index) => {
    if (part.startsWith("{%")) return <span className="tok-tag" key={index}>{part}</span>;
    if (part.startsWith("{{")) return <span className="tok-var" key={index}>{part}</span>;
    if (part.startsWith("<") || part === ">") return <span className="tok-html" key={index}>{part}</span>;
    return part;
  })}</>;
}

function DevStage({ stats }: { stats: number[] }) {
  const [typed, setTyped] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setTyped(codeText.length); return; }
    let timer = 0;
    let index = 0;
    const step = () => {
      index += 1;
      setTyped(index);
      if (index >= codeText.length) timer = window.setTimeout(() => { index = 0; setTyped(0); timer = window.setTimeout(step, 700); }, 4200);
      else timer = window.setTimeout(step, codeText[index - 1] === "\n" ? 280 : 30 + Math.random() * 32);
    };
    timer = window.setTimeout(step, 1900);
    return () => window.clearTimeout(timer);
  }, []);
  const shown = codeText.slice(0, typed);
  const done = typed >= codeText.length ? codeLines.length : shown.split("\n").length - 1;
  const lines = shown.split("\n");
  return <div className="dev-stage" role="img" aria-label="A Liquid code editor building a Shopify product card live">
    <span className="dev-glow" aria-hidden="true" />
    <span className="dev-grid" aria-hidden="true" />
    <span className="dev-chip chip-code"><code>&lt;Liquid /&gt; &lt;PHP /&gt; Shopify<span className="typing-cursor">_</span></code></span>
    <div className="dev-window editor-window" aria-hidden="true">
      <div className="win-bar"><i /><i /><i /><span>product-card.liquid</span></div>
      <pre className="editor-code">{lines.map((line, index) => <span className="code-line" key={index}><em>{index + 1}</em><Highlight text={line} />{index === lines.length - 1 && <u className="code-caret" />}</span>)}</pre>
    </div>
    <div className="dev-window preview-window" aria-hidden="true">
      <div className="win-bar"><i /><i /><i /><span>yourstore.com / collections / all</span></div>
      <div className="preview-body">
        <div className={`pv-img${done >= 2 ? " on" : ""}`}><img src="/images/airbon-product.png" alt="" loading="lazy" /></div>
        <h4 className={`pv-title${done >= 3 ? " on" : ""}`}>Air Quality Monitor</h4>
        <p className={`pv-price${done >= 4 ? " on" : ""}`}>$129.00</p>
        <span className={`pv-btn${done >= 5 ? " on" : ""}`}>Add to cart</span>
      </div>
    </div>
    <span className="dev-chip chip-deploy"><i /> Theme synced <small>live in 1.2s</small></span>
    <span className="availability-seal" role="img" aria-label="Available for work"><svg viewBox="0 0 100 100" aria-hidden="true"><defs><path id="sealPath" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" /></defs><text><textPath href="#sealPath">AVAILABLE FOR WORK &#8226; 2026 &#8226; </textPath></text></svg><i /></span>
    <div className="dev-chip-row">
      <span className="dev-chip chip-stat"><b>{stats[1]}+</b><small>years building</small></span>
      <span className="dev-chip chip-stat"><b>{stats[0]}+</b><small>sites shipped</small></span>
      <span className="dev-chip chip-clock"><LiveClock city /></span>
    </div>
  </div>;
}

function MagneticLink({ href, children, className = "", target, rel }: { href: string; children: React.ReactNode; className?: string; target?: string; rel?: string }) {
  return <a className={`magnetic ${className}`} href={href} target={target} rel={rel} onPointerMove={(event) => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    const dx = (event.clientX - box.left - box.width / 2) * .18;
    const dy = (event.clientY - box.top - box.height / 2) * .18;
    gsap.to(event.currentTarget, { x: dx, y: dy, duration: .35, ease: "power3.out" });
  }} onPointerLeave={(event) => gsap.to(event.currentTarget, { x: 0, y: 0, duration: .65, ease: "elastic.out(1, .4)" })}>{children}</a>;
}

function App() {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [showCurtain, setShowCurtain] = useState(false);
  const [activeGroup, setActiveGroup] = useState<ProjectGroup | "All">("All");
  const [activeSection, setActiveSection] = useState("top");
  const [openService, setOpenService] = useState(0);
  const [processStep, setProcessStep] = useState(0);
  const [theme, setTheme] = useState("dark");
  const [emailCopied, setEmailCopied] = useState(false);
  const [nameFilled, setNameFilled] = useState(false);
  const [stats, setStats] = useState([0, 0]);
  const filteredProjects = useMemo(() => activeGroup === "All" ? projects : projects.filter((project) => project.group === activeGroup), [activeGroup]);
  const finishLoad = useMemo(() => () => setReady(true), []);

  useEffect(() => {
    if (!ready || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStats([heroStats.sites, heroStats.years]);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const count = (now: number) => {
      const progress = Math.min((now - start) / 1150, 1);
      setStats([heroStats.sites, heroStats.years].map((value) => Math.round(value * (1 - Math.pow(1 - progress, 3)))));
      if (progress < 1) frame = requestAnimationFrame(count);
    };
    frame = requestAnimationFrame(count);
    return () => cancelAnimationFrame(frame);
  }, [ready]);

  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "t" && !["INPUT", "TEXTAREA"].includes((event.target as HTMLElement).tagName)) setTheme((current) => current === "dark" ? "light" : "dark");
    };
    window.addEventListener("keydown", keyHandler);
    document.documentElement.dataset.theme = theme;
    return () => window.removeEventListener("keydown", keyHandler);
  }, [theme]);

  useEffect(() => {
    if (!ready) return;
    setShowCurtain(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setShowCurtain(false); return; }
    const frame = requestAnimationFrame(() => {
      gsap.to(".curtain-left", { xPercent: -101, duration: .95, ease: "expo.inOut" });
      gsap.to(".curtain-right", { xPercent: 101, duration: .95, ease: "expo.inOut", onComplete: () => setShowCurtain(false) });
    });
    return () => cancelAnimationFrame(frame);
  }, [ready]);

  useEffect(() => {
    if (!ready || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: false, smoothWheel: true, anchors: true, lerp: .085 });
    const update = () => ScrollTrigger.update();
    const raf = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      lenis.off("scroll", update);
      lenis.destroy();
      gsap.ticker.lagSmoothing(500, 33);
    };
  }, [ready]);

  useEffect(() => {
    const progress = document.querySelector<HTMLElement>(".scroll-progress");
    if (!progress) return;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [ready]);

  useEffect(() => {
    if (!ready || window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;
    const stage = document.querySelector<HTMLElement>(".dev-stage");
    const move = (event: PointerEvent) => {
      if (!stage || event.pointerType !== "mouse") return;
      const bounds = stage.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      gsap.to(".editor-window", { x: x * -14, y: y * -10, duration: .7, overwrite: "auto" });
      gsap.to(".preview-window", { x: x * 20, y: y * 14, duration: .7, overwrite: "auto" });
      gsap.to(".dev-glow", { x: x * 60, y: y * 40, duration: 1, overwrite: "auto" });
      gsap.to(".dev-chip", { x: x * 28, y: y * 20, duration: .8, stagger: .02, overwrite: "auto" });
    };
    const leave = () => gsap.to(".editor-window, .preview-window, .dev-glow, .dev-chip", { x: 0, y: 0, duration: .8, overwrite: "auto" });
    stage?.addEventListener("pointermove", move);
    stage?.addEventListener("pointerleave", leave);
    return () => { stage?.removeEventListener("pointermove", move); stage?.removeEventListener("pointerleave", leave); };
  }, [ready]);

  useLayoutEffect(() => {
    if (!root.current || !ready || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
      intro.fromTo(".hero-gridline", { scaleY: 0 }, { scaleY: 1, duration: .65, stagger: .035, transformOrigin: "top" })
        .fromTo(".hero-char", { yPercent: 115 }, { yPercent: 0, duration: .72, stagger: .025, clearProps: "transform" }, "-=.45")
        .from(".hero-kicker, .hero-role-line, .hero-intro, .hero-links, .hero-tech-tags", { y: 18, autoAlpha: 0, duration: .55, stagger: .07 }, "-=.5")
        .fromTo(".dev-window", { y: 46, scale: .94, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: .85, stagger: .16, ease: "power3.out" }, "-=.75")
        .fromTo(".dev-glow", { scale: .5, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.1, ease: "power2.out" }, "-=.9")
        .fromTo(".dev-chip, .availability-seal", { y: 18, scale: .82, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: .4, stagger: .08, ease: "back.out(1.5)" }, "-=.4")
        .fromTo(".island", { yPercent: -160, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: .6, ease: "power3.out" }, "-=.25")
        .add(() => setNameFilled(true), "-=.5");
      gsap.to(".dev-stage", { y: -42, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".hero-copy", { y: -18, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".dev-chip", { x: 22, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".hero-title", { autoAlpha: .68, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.utils.toArray<HTMLElement>(".reveal").forEach((element) => gsap.fromTo(element, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .85, ease: "power3.out", scrollTrigger: { trigger: element, start: "top 86%", once: true } }));
      const highlight = gsap.utils.toArray<HTMLElement>(".about-word");
      gsap.fromTo(highlight, { color: "#5b665f" }, { color: "#f4f2ea", stagger: .04, ease: "none", scrollTrigger: { trigger: ".about-copy", start: "top 75%", end: "bottom 55%", scrub: true } });
      const line = document.querySelector<HTMLElement>(".timeline-line-fill");
      if (line) gsap.fromTo(line, { scaleY: 0 }, { scaleY: 1, transformOrigin: "top", ease: "none", scrollTrigger: { trigger: ".experience", start: "top 60%", end: "bottom 55%", scrub: true } });
      ["top", "work", "about", "services", "process", "experience", "toolkit", "contact"].forEach((id) => ScrollTrigger.create({ trigger: id === "top" ? ".hero" : `#${id}`, start: "top 50%", end: "bottom 50%", onToggle: (self) => self.isActive && setActiveSection(id) }));
    }, root);
    return () => context.revert();
  }, [ready]);

  useLayoutEffect(() => {
    if (!ready) return;
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(frame);
  }, [ready, filteredProjects]);

  const toggleTheme = () => setTheme((current) => current === "dark" ? "light" : "dark");
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText("zaidialimoosa34@gmail.com");
      setEmailCopied(true);
      window.setTimeout(() => setEmailCopied(false), 1800);
    } catch { setEmailCopied(false); }
  };
  return <div ref={root} className={`portfolio theme-${theme}`}>
    {!ready && <Preloader onComplete={finishLoad} />}
    {showCurtain && <><div className="curtain curtain-left" /><div className="curtain curtain-right" /></>}
    <div className="film-grain" aria-hidden="true" />
    <Navigation onTheme={toggleTheme} active={activeSection} />
    <span className="scroll-progress" aria-hidden="true" />

    <main id="top">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-gridlines" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} className="hero-gridline" />)}</div>
        <div className="hero-nav-slot" aria-hidden="true" />
        <div className="hero-grid shell">
          <div className="hero-copy">
            <p className="hero-kicker"><span className="status-dot" /><span>Senior CMS &amp; E-commerce Developer</span><i aria-hidden="true">&middot;</i><span className="hero-location">Karachi, PK</span></p>
            <h1 className={`hero-title${nameFilled ? " name-filled" : ""}`} id="hero-title"><span className="hero-line hero-name-first">{"Syed Ali".split("").map((character, index) => <span className="hero-char" key={`first-${index}`}>{character === " " ? "\u00a0" : character}</span>)}</span><span className="hero-line hero-name-accent">{"Moosa".split("").map((character, index) => <span className="hero-char" key={`last-${index}`}>{character}</span>)}<i className="hero-dot">.</i></span></h1>
            <RoleTicker />
            <p className="hero-intro">I build thoughtful digital storefronts and websites, from custom Shopify sections to the details that keep a live site running smoothly.</p>
            <div className="hero-links"><MagneticLink className="pill-link pill-primary" href="#work">Explore my work <span aria-hidden="true">&#8595;</span></MagneticLink><MagneticLink className="text-link cv-link" href="/Syed_Ali_Moosa_CV.pdf" target="_blank" rel="noreferrer">Download CV <span aria-hidden="true">&#8599;</span></MagneticLink></div>
            <div className="hero-tech-tags" aria-label="Core technologies"><span>WordPress</span><i>/</i><span>Shopify</span><i>/</i><span>PHP</span></div>
          </div>
          <DevStage stats={stats} />
        </div>
        <div className="hero-bottom shell"><span>Selected work / 2023-2026</span><LiveClock /><a href="#work">Scroll to explore <i aria-hidden="true" /></a></div>
      </section>

      <section className="marquee-section" aria-label="Specialties"><div className="marquee-row marquee-a"><div>CMS / E-COMMERCE <i>*</i> STOREFRONTS THAT FEEL RIGHT <i>*</i> CMS / E-COMMERCE <i>*</i> STOREFRONTS THAT FEEL RIGHT <i>*</i></div></div><div className="marquee-row marquee-b"><div>WORDPRESS <i>+</i> SHOPIFY <i>+</i> THOUGHTFUL DETAILS <i>+</i> WORDPRESS <i>+</i> SHOPIFY <i>+</i> THOUGHTFUL DETAILS <i>+</i></div></div></section>

      <section className="about section-pad" id="about" aria-labelledby="about-title"><div className="shell about-layout"><div className="about-aside reveal"><p className="section-kicker">01 / Introduction</p><span className="about-orbit" aria-hidden="true"><i /><b>CMS</b><b>SHOP</b><b>BUILD</b></span><p className="about-aside-note">From structure to storefront, each detail has a job.</p></div><div className="about-main"><h2 id="about-title" className="about-copy">{words.map((word, index) => <span className="about-word" key={`${word}-${index}`}>{word}{index < words.length - 1 ? " " : ""}</span>)}</h2><div className="about-bottom reveal"><span>WordPress / Shopify / Wix</span><span>Karachi, Pakistan</span></div></div></div></section>

      <section className="work section-pad" id="work" aria-labelledby="work-title"><div className="shell"><div className="work-heading"><div><p className="section-kicker reveal">02 / Selected work</p><h2 className="section-title reveal" id="work-title">Made for a<br /><em>specific purpose.</em></h2></div><p className="work-note reveal">Nine live websites across storefronts, CMS platforms, and the web in between.</p></div><div className="work-controls"><div className="filter-row" role="group" aria-label="Filter projects">{projectFilters.map(({ label, group }) => <button key={label} type="button" className={activeGroup === group ? "filter active" : "filter"} aria-pressed={activeGroup === group} onClick={() => setActiveGroup(group)}>{label}<sup>{group === "All" ? "09" : String(projects.filter((project) => project.group === group).length).padStart(2, "0")}</sup></button>)}</div></div><div className="project-grid" key={activeGroup}>{filteredProjects.map((project, index) => <ProjectCard key={project.name} project={project} index={index} view="grid" />)}</div></div></section>

      <section className="services section-pad" id="services" aria-labelledby="services-title"><div className="shell services-layout"><div className="services-heading reveal"><p className="section-kicker">03 / Capabilities</p><h2 className="section-title" id="services-title">Good work,<br /><em>well supported.</em></h2><p>Practical website work, from storefront setup through live-site upkeep.</p></div><div className="service-list">{[
        { title: "Shopify development", detail: "Storefront setup, theme customization, Liquid sections, product pages, and app integrations.", tags: "SHOPIFY / LIQUID / STOREFRONT" },
        { title: "WordPress & WooCommerce", detail: "Responsive WordPress builds, WooCommerce setup, Elementor, ACF, and theme or plugin customization.", tags: "WORDPRESS / WOOCOMMERCE / ACF" },
        { title: "Hosting & site operations", detail: "Hosting, cPanel, DNS, SSL, migrations, backups, and live-site maintenance.", tags: "CPANEL / DNS / SSL / CARE" },
      ].map((service, index) => <article className={`service-item ${openService === index ? "expanded" : ""}`} key={service.title}><button type="button" aria-expanded={openService === index} onClick={() => setOpenService(openService === index ? -1 : index)}><span className="service-no">0{index + 1}</span><span className="service-title">{service.title}</span><span className="service-plus" aria-hidden="true">{openService === index ? "-" : "+"}</span></button><div className="service-answer" aria-hidden={openService !== index}><p>{service.detail}</p><span>{service.tags}</span></div></article>)}</div></div></section>

      <section className="process section-pad" id="process" aria-labelledby="process-title"><div className="shell process-shell"><div className="process-top reveal"><p className="section-kicker">04 / Working method</p><h2 className="section-title" id="process-title">A clear path from<br /><em>brief to browser.</em></h2></div><div className="process-body"><div className="process-steps" role="tablist" aria-label="Project stages">{[{ title: "Discover", note: "Get clear on the goal, audience, and content." }, { title: "Structure", note: "Map the pages, platform, and storefront flow." }, { title: "Build", note: "Develop the responsive experience and integrations." }, { title: "Launch", note: "Set up the live site and support its upkeep." }].map((step, index) => <button key={step.title} role="tab" aria-selected={processStep === index} className={processStep === index ? "process-step active" : "process-step"} onClick={() => setProcessStep(index)}><span>0{index + 1}</span><strong>{step.title}</strong></button>)}</div><div className="process-display" role="tabpanel"><span className="process-display-no">0{processStep + 1}</span><div className={`process-glyph glyph-${processStep}`} aria-hidden="true"><i /><i /><i /></div><h3>{["Discover", "Structure", "Build", "Launch"][processStep]}</h3><p>{["Get clear on the goal, audience, and content.", "Map the pages, platform, and storefront flow.", "Develop the responsive experience and integrations.", "Set up the live site and support its upkeep."][processStep]}</p><div className="process-meter"><i style={{ transform: `scaleX(${(processStep + 1) / 4})` }} /></div></div></div></div></section>

      <section className="experience section-pad" id="experience" aria-labelledby="experience-title"><div className="shell experience-layout"><div className="experience-heading reveal"><p className="section-kicker">05 / Experience</p><h2 className="section-title" id="experience-title">Built with care.<br /><em>Kept working.</em></h2><p>Hands-on CMS and e-commerce development across the website lifecycle.</p></div><div className="timeline"><span className="timeline-line"><i className="timeline-line-fill" /></span><article className="timeline-item reveal"><span className="timeline-node">01</span><div className="timeline-meta"><span>2025 - Present</span><b>HBOX Digital / Karachi</b></div><h3>CMS &amp; E-commerce Developer</h3><p>WordPress and Shopify builds, Liquid sections, theme customization, integration support, hosting, DNS, SSL, and backups.</p></article><article className="timeline-item reveal"><span className="timeline-node">02</span><div className="timeline-meta"><span>2023 - 2025</span><b>Techixpert / Karachi</b></div><h3>WordPress Developer</h3><p>Responsive business and e-commerce websites, WooCommerce setup, client-site maintenance, migrations, and launches.</p></article><div className="education-card reveal"><span className="section-kicker">Education / 2019-2022</span><h3>B.S. in Computer Science</h3><p>Shah Abdul Latif University</p></div></div></div></section>

      <section className="toolkit section-pad" id="toolkit" aria-labelledby="toolkit-title"><div className="shell"><div className="toolkit-heading"><div><p className="section-kicker reveal">06 / Toolkit</p><h2 className="section-title reveal" id="toolkit-title">Tools for the<br /><em>whole website.</em></h2></div><p className="toolkit-aside reveal">A practical mix of CMS, storefront, front-end, and operations tools.</p></div><div className="skill-playground"><div className="skill-orbit orbit-a" aria-hidden="true" /><div className="skill-orbit orbit-b" aria-hidden="true" /><div className="skill-core"><span>SM</span><small>TOOLKIT</small></div>{skills.map((skill, index) => <span className={`skill-chip skill-${index + 1}`} key={skill}>{skill}</span>)}</div><div className="toolkit-bottom"><div><span className="section-kicker">Front end</span><p>HTML / CSS / JavaScript / Bootstrap / PHP</p></div><div><span className="section-kicker">Languages</span><p>English / Urdu / Sindhi</p></div><div><span className="section-kicker">Operations</span><p>cPanel / DNS / SSL / Migrations / Backups</p></div><div><span className="section-kicker">Certification</span><p>NVL 4 IT (E-commerce) / CIT</p></div></div></div></section>

      <section className="contact" id="contact" aria-labelledby="contact-title"><div className="contact-grid" aria-hidden="true" /><div className="shell contact-inner"><p className="section-kicker reveal">07 / Contact</p><h2 className="contact-title reveal" id="contact-title">Let's build<br /><em>something</em><br />thoughtful<span>.</span></h2><div className="contact-bottom reveal"><p>For website builds, storefront updates, or ongoing maintenance.</p><div className="contact-actions"><MagneticLink href="mailto:zaidialimoosa34@gmail.com" className="contact-email">zaidialimoosa34@gmail.com <span aria-hidden="true">&#8599;</span></MagneticLink><button type="button" className="copy-email" onClick={copyEmail}>{emailCopied ? "Email copied" : "Copy email address"}</button><a href="tel:+923103492234">+92 310 3492234</a><a href="https://www.linkedin.com/in/alimoosazaidi" target="_blank" rel="noreferrer noopener">LinkedIn &#8599;</a></div></div><div className="contact-wordmark" aria-hidden="true">SYED ALI MOOSA</div></div></section>
    </main>
    <aside className={`section-rail ${activeSection === "top" ? "rail-hidden" : ""}`} aria-label="Section navigation">{[{ id: "top", label: "Start" }, { id: "work", label: "Work" }, { id: "about", label: "About" }, { id: "services", label: "Services" }, { id: "experience", label: "Experience" }, { id: "toolkit", label: "Toolkit" }, { id: "contact", label: "Contact" }].map(({ id, label }, index) => <a key={id} href={`#${id}`} aria-label={label} aria-current={activeSection === id ? "location" : undefined} className={activeSection === id ? "active" : ""}><span>{String(index + 1).padStart(2, "0")}</span></a>)}</aside>
    <footer className="site-footer"><div className="shell footer-row"><span>(c) {new Date().getFullYear()} Syed Ali Moosa</span><LiveClock /><a href="#top">Back to top &#8593;</a></div></footer>
    {ready && <Cursor />}
  </div>;
}

export default App;
