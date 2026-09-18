"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { BrandModelGroup } from "@/lib/data/catalog";
import { normalize } from "@/lib/catalog-filters";
import CartButton from "@/components/cart/CartButton";

interface NavbarClientProps { brandGroups: BrandModelGroup[]; whatsappNumber: string }
type DropdownKey = "brands" | "contact" | null;

const links = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/servicio-tecnico", label: "Servicio Técnico" },
];

const CONTACT = {
  email: "celularesj14593@gmail.com",
  instagram: "https://www.instagram.com/celularesj14?stkn=ZDNlZDc0MzIxNw==",
  facebook: "https://www.facebook.com/celularesj14/",
};

function formatWhatsapp(number: string) {
  const digits = number.replace(/\D/g, "");
  if (digits.startsWith("593") && digits.length === 12) {
    const rest = digits.slice(3);
    return `+593 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`;
  }
  return `+${digits}`;
}

function CopyIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ContactMenu({ whatsappNumber, copied, onCopy, onNavigate }: { whatsappNumber: string; copied: boolean; onCopy: () => void; onNavigate?: () => void }) {
  const rowClass = "flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-[14px] font-medium text-foreground transition-colors hover:bg-(--bg-secondary)";
  return (
    <>
      <div className={`${rowClass} justify-between`}>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-text-tertiary">WhatsApp</p>
          <p className="select-all font-mono text-[13px] font-normal text-foreground">{formatWhatsapp(whatsappNumber)}</p>
        </div>
        <button type="button" onClick={onCopy} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-text-secondary transition-colors hover:border-accent hover:text-accent" aria-label="Copiar número de WhatsApp">
          <CopyIcon />{copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer" onClick={onNavigate} className={rowClass}>Ver el Instagram de J14</a>
      <a href={CONTACT.facebook} target="_blank" rel="noopener noreferrer" onClick={onNavigate} className={rowClass}>Ver la página de Facebook de J14</a>
      <a href={`mailto:${CONTACT.email}`} onClick={onNavigate} className="flex w-full flex-col items-start gap-0.5 rounded-sm px-3 py-2.5 text-[14px] font-medium text-foreground transition-colors hover:bg-(--bg-secondary)">
        <span className="text-[11px] font-semibold uppercase tracking-[.12em] text-text-tertiary">Correo de contacto</span>
        <span className="select-all whitespace-nowrap font-normal">{CONTACT.email}</span>
      </a>
    </>
  );
}

function SearchIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" /><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function PersonIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.8" /><path d="M5.5 19.5c.75-3.05 3.05-4.75 6.5-4.75s5.75 1.7 6.5 4.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

export default function NavbarClient({ brandGroups, whatsappNumber }: NavbarClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [open, setOpen] = useState<DropdownKey>(null);
  const [activeBrand, setActiveBrand] = useState(brandGroups[0]?.brand ?? "");
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [mobileContactOpen, setMobileContactOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (searchPanelRef.current && !searchPanelRef.current.contains(event.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [searchOpen]);

  const cancelClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
  const scheduleClose = () => { cancelClose(); closeTimer.current = setTimeout(() => setOpen(null), 140); };
  const copyWhatsapp = async () => {
    try {
      await navigator.clipboard.writeText(`+${whatsappNumber.replace(/\D/g, "")}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard API unavailable; the number stays selectable as text.
    }
  };
  const active = (href: string) => href === "/" ? pathname === href : pathname.startsWith(href);
  const query = normalize(search);
  const suggestions = query
    ? brandGroups.flatMap((group) => group.models.filter((model) => normalize(`${group.brand} ${model}`).includes(query)).map((model) => ({ brand: group.brand, model }))).slice(0, 6)
    : [];
  const selectedGroup = brandGroups.find((group) => group.brand === activeBrand) ?? brandGroups[0];

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!search.trim()) return;
    setSearchOpen(false);
    router.push(`/catalogo?q=${encodeURIComponent(search.trim())}`);
  }

  return (
    <>
      <header className={`navbar-glass fixed inset-x-0 top-0 z-50 transition-shadow duration-300 ${scrolled ? "navbar-glass-scrolled" : ""}`} onMouseLeave={scheduleClose}>
        <nav className="container-apple relative flex h-13 items-center gap-5">
          <div className="flex items-center gap-6 md:absolute md:left-1/2 md:-translate-x-1/2">
            <Link href="/" className="flex shrink-0 items-center hover:opacity-70" aria-label="J14 Celulares — Inicio"><Image src="/J14_Icono_Azul.jpg" alt="J14 Celulares" width={28} height={28} className="rounded-full object-cover" /></Link>
          <ul className="hidden items-center gap-6 md:flex">
             {links.map((link) => <li key={link.href}><Link href={link.href} className={`navbar-nav-link text-[14px] font-medium transition-colors ${active(link.href) ? "is-active text-accent" : "text-text-secondary hover:text-foreground"}`}>{link.label}</Link></li>)}
             <li onMouseEnter={() => { cancelClose(); setOpen("brands"); }}><button type="button" className={`navbar-nav-link text-[14px] font-medium ${open === "brands" ? "is-active text-foreground" : "text-text-secondary hover:text-foreground"}`} aria-haspopup="true" aria-expanded={open === "brands"} onClick={() => setOpen(open === "brands" ? null : "brands")} onFocus={() => setOpen("brands")}>Marcas</button></li>
             <li><Link href="/nosotros" className={`navbar-nav-link text-[14px] font-medium transition-colors ${active("/nosotros") ? "is-active text-accent" : "text-text-secondary hover:text-foreground"}`}>Nosotros</Link></li>
             <li className="relative" onMouseEnter={() => { cancelClose(); setOpen("contact"); }}>
               <button type="button" className={`navbar-nav-link text-[14px] font-medium ${open === "contact" ? "is-active text-foreground" : "text-text-secondary hover:text-foreground"}`} aria-haspopup="true" aria-expanded={open === "contact"} onClick={() => setOpen(open === "contact" ? null : "contact")} onFocus={() => setOpen("contact")}>Contáctanos</button>
               <AnimatePresence>
                 {open === "contact" && <motion.div initial={{ opacity: 0, y: -6, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: .98 }} transition={{ duration: .16 }} onMouseEnter={cancelClose} onMouseLeave={scheduleClose} className="absolute right-0 top-full z-50 mt-2 w-70 rounded-md border border-border bg-surface p-2 shadow-[0_12px_28px_rgba(0,0,0,.12)]">
                   <ContactMenu whatsappNumber={whatsappNumber} copied={copied} onCopy={() => void copyWhatsapp()} onNavigate={() => setOpen(null)} />
                 </motion.div>}
               </AnimatePresence>
             </li>
          </ul>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div ref={searchPanelRef} className="relative hidden md:block" role="search">
              <button type="button" onClick={() => setSearchOpen((value) => !value)} className={`search-trigger flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition hover:bg-(--bg-secondary) hover:text-foreground ${searchOpen ? "is-open" : ""}`} aria-label={searchOpen ? "Cerrar búsqueda" : "Abrir búsqueda"} title="Buscar"><SearchIcon /></button>
              <AnimatePresence>
                {searchOpen && <motion.div initial={{ opacity: 0, y: -6, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: .98 }} className="absolute right-0 top-10 w-[min(320px,calc(100vw-2rem))] rounded-md border border-border bg-surface p-3 shadow-[0_12px_28px_rgba(0,0,0,.12)]">
                  <form onSubmit={submitSearch}>
                    <label className="navbar-search-field flex h-9 items-center gap-2 rounded-full border border-border bg-(--bg-secondary) px-3 text-text-tertiary" htmlFor="navbar-search"><SearchIcon size={15} /><input id="navbar-search" autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar marca o modelo" className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-text-tertiary" /></label>
                  </form>
                  <div className="mt-3">{query ? suggestions.length ? suggestions.map((item) => <Link key={`${item.brand}-${item.model}`} href={`/catalogo?q=${encodeURIComponent(`${item.brand} ${item.model}`)}`} onClick={() => setSearchOpen(false)} className="block rounded-sm px-3 py-2 text-[13px] hover:bg-(--bg-secondary)"><span className="font-semibold">{item.brand}</span> <span className="text-text-secondary">{item.model}</span></Link>) : <p className="px-3 py-2 text-[13px] text-text-secondary">Sin coincidencias</p> : <><p className="px-3 text-[11px] font-semibold uppercase tracking-[.12em] text-text-tertiary">Buscar en catálogo</p><p className="px-3 pt-1 text-[13px] text-text-secondary">Escribe una marca o modelo para empezar.</p><div className="mt-2 flex flex-wrap gap-1 px-2">{brandGroups.slice(0, 4).map((group) => <Link key={group.brand} href={`/catalogo?brand=${encodeURIComponent(group.brand)}`} onClick={() => setSearchOpen(false)} className="rounded-full border border-border px-2.5 py-1 text-[12px] text-text-secondary hover:border-accent hover:text-accent">{group.brand}</Link>)}</div></>}</div>
                </motion.div>}
              </AnimatePresence>
             </div>
             <CartButton />
             <Link href="/cliente/dashboard" className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-[0_4px_12px_rgba(0,113,227,0.2)] transition hover:-translate-y-0.5 hover:bg-accent-hover md:flex" aria-label="Mi cuenta" title="Mi cuenta"><PersonIcon /></Link>
          </div>
           <button type="button" className="relative ml-0 flex h-8 w-8 shrink-0 items-center justify-center md:hidden" onClick={() => setMobileOpen((value) => !value)} aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={mobileOpen}>
             <span className={`absolute h-[1.5px] w-5 bg-foreground transition-transform duration-300 ease-in-out ${mobileOpen ? "rotate-45" : "-translate-y-1.5"}`} />
             <span className={`absolute h-[1.5px] w-5 bg-foreground transition-all duration-200 ease-in-out ${mobileOpen ? "scale-x-0 opacity-0" : ""}`} />
             <span className={`absolute h-[1.5px] w-5 bg-foreground transition-transform duration-300 ease-in-out ${mobileOpen ? "-rotate-45" : "translate-y-1.5"}`} />
           </button>
        </nav>
        <AnimatePresence>
          {open === "brands" && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} onMouseEnter={cancelClose} onMouseLeave={scheduleClose} className="absolute left-0 right-0 top-full border-t border-border bg-surface shadow-[0_18px_38px_rgba(0,0,0,.08)]"><div className="container-wide py-6"><div className="mb-4 flex items-center justify-between"><p className="catalog-kicker">Explora por marca</p><Link href="/catalogo" className="text-[13px] font-medium text-accent" onClick={() => setOpen(null)}>Ver todo el catálogo →</Link></div><div className="grid min-h-55 grid-cols-[minmax(130px,190px)_minmax(0,1fr)] overflow-hidden rounded-md border border-border bg-(--bg-secondary)"><div className="border-r border-border p-2">{brandGroups.map((group) => <Link key={group.brand} href={`/catalogo?brand=${encodeURIComponent(group.brand)}`} onMouseEnter={() => setActiveBrand(group.brand)} onFocus={() => setActiveBrand(group.brand)} onClick={() => setOpen(null)} className={`flex w-full items-center justify-between rounded-sm px-3 py-2.5 text-left text-[14px] font-semibold transition-colors ${activeBrand === group.brand ? "bg-surface text-accent shadow-sm" : "text-text-secondary hover:bg-surface hover:text-foreground"}`}>{group.brand}<span className="text-text-tertiary" aria-hidden="true">›</span></Link>)}</div><div className="min-w-0 bg-surface p-5">{selectedGroup && <><div className="flex items-baseline justify-between gap-3"><h3 className="text-[18px] font-semibold tracking-[-.02em] text-foreground">{selectedGroup.brand}</h3><span className="text-[12px] text-text-tertiary">{selectedGroup.models.length} modelos</span></div><div className="mt-4 grid max-h-55 grid-cols-2 gap-x-5 gap-y-1 overflow-y-auto pr-2 sm:grid-cols-3">{selectedGroup.models.map((model) => <Link key={model} href={`/catalogo?brand=${encodeURIComponent(selectedGroup.brand)}&model=${encodeURIComponent(model)}`} onClick={() => setOpen(null)} className="rounded-sm px-2 py-2 text-[13px] text-text-secondary hover:bg-(--bg-secondary) hover:text-accent">{model}</Link>)}</div></>}</div></div></div></motion.div>}
        </AnimatePresence>
      </header>
      <AnimatePresence>{mobileOpen && <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="navbar-glass navbar-glass-scrolled fixed inset-x-0 top-13 z-40 border-b border-border md:hidden"><ul className="container-apple py-4"><li className="mb-2"><form onSubmit={submitSearch} className="catalog-search flex w-full items-center gap-3"><SearchIcon size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar marca o modelo" aria-label="Buscar marca o modelo" /></form></li>{links.map((link) => <li key={link.href}><Link href={link.href} onClick={() => setMobileOpen(false)} className="block rounded-sm px-2 py-3 text-[17px] font-medium text-foreground hover:bg-(--bg-secondary)">{link.label}</Link></li>)}<li><button type="button" onClick={() => setMobileExpanded((value) => !value)} className="flex w-full items-center justify-between rounded-sm px-2 py-3 text-[17px] font-medium text-foreground">Marcas <span>{mobileExpanded ? "−" : "+"}</span></button>{mobileExpanded && <ul className="border-l border-(--border-strong) pb-2 pl-3">{brandGroups.map((group) => <li key={group.brand}><Link href={`/catalogo?brand=${encodeURIComponent(group.brand)}`} onClick={() => setMobileOpen(false)} className="block py-2 text-[15px] font-semibold text-foreground">{group.brand}</Link>{group.models.slice(0, 4).map((model) => <Link key={model} href={`/catalogo?brand=${encodeURIComponent(group.brand)}&model=${encodeURIComponent(model)}`} onClick={() => setMobileOpen(false)} className="block py-1 text-[14px] text-text-secondary">{model}</Link>)}</li>)}</ul>}</li><li><Link href="/nosotros" onClick={() => setMobileOpen(false)} className="block rounded-sm px-2 py-3 text-[17px] font-medium text-foreground hover:bg-(--bg-secondary)">Nosotros</Link></li><li><button type="button" onClick={() => setMobileContactOpen((value) => !value)} className="flex w-full items-center justify-between rounded-sm px-2 py-3 text-[17px] font-medium text-foreground">Contáctanos <span>{mobileContactOpen ? "−" : "+"}</span></button>{mobileContactOpen && <div className="border-l border-(--border-strong) pb-2 pl-2"><ContactMenu whatsappNumber={whatsappNumber} copied={copied} onCopy={() => void copyWhatsapp()} onNavigate={() => setMobileOpen(false)} /></div>}</li><li className="mt-2 border-t border-border pt-3"><Link href="/cliente/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center justify-center rounded-sm bg-accent px-4 py-3 text-white" aria-label="Mi cuenta"><PersonIcon /></Link></li></ul></motion.div>}</AnimatePresence>
      <div className="h-13" aria-hidden="true" />
    </>
  );
}
