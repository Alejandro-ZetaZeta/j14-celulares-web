import Link from "next/link";
import Image from "next/image";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { getCatalogCollections, getFeaturedProducts } from "@/lib/data/catalog";
import { getSiteSettings } from "@/lib/site-settings";

// No revalidate = 60 here — caching is handled by `use cache` + cacheTag
// in the data layer. Revalidates only when an admin mutates data.

export default async function HomePage() {
  const [featuredSlice, collections, settings] = await Promise.all([getFeaturedProducts(), getCatalogCollections(), getSiteSettings()]);
  const homeCollections = collections.filter((collection) => collection.show_on_home);
  const hero = settings.hero;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="section-black relative overflow-hidden">
        {/* Subtle background gradient mesh */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,113,227,0.18) 0%, transparent 70%)",
          }}
        />

        {/* Mobile-only artwork: atmospheric silhouettes behind the copy */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none lg:hidden">
          <Image
            src="/hero-mobile-left.png"
            alt=""
            width={180}
            height={240}
            className="absolute -left-2 top-[-2rem] h-[10rem] w-[8rem] object-contain opacity-15 select-none"
            priority
          />
          <Image
            src="/hero-mobile-right.png"
            alt=""
            width={480}
            height={640}
            className="absolute -right-8 bottom-4 h-[20rem] w-[16rem] rotate-12 object-contain opacity-15 select-none"
            priority
          />
        </div>

        {/* 3-column hero grid: image | content | image */}
        <div className="w-full section-padding relative z-10 px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-8">

            {/* Left image — BRAZOS_CRUZADOS */}
            <AnimatedSection delay={0.05} className="hidden lg:flex justify-center">
              <Image
                src="/BRAZOS_CRUZADOS.png"
                alt="Persona con brazos cruzados"
                width={640}
                height={780}
                className="w-[min(500px,22vw)] h-auto object-contain drop-shadow-2xl select-none"
                priority
              />
            </AnimatedSection>

            {/* Center content */}
            <div className="min-w-0 w-full max-w-full justify-self-center text-center lg:w-[min(680px,45vw)]">
              <AnimatedSection delay={0}>
                {hero.eyebrow.visible && <p className="text-[var(--accent)] text-[15px] font-medium tracking-wide mb-4">{hero.eyebrow.text}</p>}
              </AnimatedSection>

              <AnimatedSection delay={0.08}>
                {hero.headline.visible && <h1 className="text-hero text-fit-grow text-white mb-6 max-w-[680px] mx-auto">{hero.headline.text}</h1>}
              </AnimatedSection>

              <AnimatedSection delay={0.16}>
                {hero.description.visible && <p className="text-body-lg text-[#A1A1A6] mb-10 max-w-[480px] mx-auto whitespace-pre-line">{hero.description.text}</p>}
              </AnimatedSection>

              <AnimatedSection delay={0.24}>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {hero.primaryButton.visible && <Link href={hero.primaryButton.href} className="btn-primary" id="hero-cta-catalogo">{hero.primaryButton.text}</Link>}
                  {hero.secondaryButton.visible && <Link href={hero.secondaryButton.href} className="btn-secondary !text-white !border-white/30 hover:!bg-white/10" id="hero-cta-servicio">{hero.secondaryButton.text}</Link>}
                </div>
              </AnimatedSection>
            </div>

            {/* Right image — J14Premium */}
            <AnimatedSection delay={0.05} className="hidden lg:flex justify-center">
              <Image
                src="/J14Premium.png"
                alt="J14 Premium"
                width={640}
                height={780}
                className="w-[min(500px,22vw)] h-auto object-contain drop-shadow-2xl select-none"
                priority
              />
            </AnimatedSection>

          </div>
        </div>
      </section>

      {/* ── Category Teaser ──────────────────────────────────── */}
      <section className="section-gray section-padding">
        <div className="container-apple">
          <AnimatedSection>
            <p className="text-[13px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] text-center mb-2">
              Encuentra tu equipo
            </p>
            <h2 className="text-headline text-center mb-12">
              Encuentra lo que buscas.
            </h2>
            <p className="mx-auto -mt-8 mb-10 max-w-xl text-center text-body text-[var(--text-secondary)]">
              Explora por tipo de equipo, condición o colección. Estas categorías se administran desde el panel.
            </p>
          </AnimatedSection>

          {homeCollections.length > 0 ? <div className="grid grid-cols-1 gap-5 sm:relative sm:left-1/2 sm:w-screen sm:-translate-x-1/2 sm:px-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)]">
            {homeCollections.map((collection, i) => {
              const gradients = ["from-[#1C1C1E] to-[#2C2C2E]", "from-[#0071E3] to-[#00457C]", "from-[#30D158] to-[#248A3D]"];
              return (
              <AnimatedSection key={collection.id} delay={i * 0.1}>
                <Link
                  href={`/catalogo?coleccion=${collection.slug}`}
                  id={`cat-${collection.slug}`}
                  className={`group block rounded-[var(--radius-xl)] bg-gradient-to-br ${gradients[i % gradients.length]} p-7 text-white transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl`}
                >
                  <span className="mb-4 block text-4xl" aria-hidden="true">{collection.label.slice(0, 1)}</span>
                  <h3 className="mb-1 text-[20px] font-semibold">{collection.label}</h3>
                  <p className="mb-5 text-[14px] text-white/70">{collection.description || "Explora equipos disponibles"}</p>
                  <span className="text-[13px] font-medium text-white group-hover:underline">
                    Explorar →
                  </span>
                </Link>
              </AnimatedSection>
              );
            })}
          </div> : <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-6 py-10 text-center"><p className="font-semibold text-[var(--text-primary)]">Categorías en preparación</p><p className="mt-2 text-[14px] text-[var(--text-secondary)]">Pronto encontrarás accesos directos para explorar el catálogo.</p></div>}
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────────── */}
      {featuredSlice.length > 0 && (
        <section className="section-padding bg-[var(--bg-primary)]">
          <div className="container-wide">
            <AnimatedSection>
              <p className="text-[13px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] text-center mb-2">
                Selección J14
              </p>
              <h2 className="text-headline text-center mb-12">
                Hechos para llamar la atención.
              </h2>
            </AnimatedSection>

            <div className="flex flex-col gap-6">
              {featuredSlice.map((product, i) => {
                const price = Math.min(...product.product_variants.map((variant) => variant.price));
                return <AnimatedSection key={product.id} delay={i * 0.07}>
                  <Link href={`/catalogo/${product.id}`} className={`featured-showcase group ${i % 2 ? "featured-showcase-reverse" : ""}`}>
                    <div className="featured-showcase-image">
                      {product.image_url ? <Image src={product.image_url} alt={`${product.brand} ${product.model}`} fill className="object-contain p-8 transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 50vw" /> : <div className="flex h-full items-center justify-center text-white/40">Sin imagen</div>}
                    </div>
                    <div className="featured-showcase-copy">
                      <p className="catalog-kicker !text-white/60">{product.featured_eyebrow || "Selección J14"}</p>
                      <h3 className="text-fit-grow mt-3 text-[clamp(1.8rem,4vw,3.4rem)] font-semibold tracking-[-.045em] text-white">{product.featured_headline || `${product.brand} ${product.model}`}</h3>
                       <div className="mt-7 flex items-center gap-5"><span className="text-[14px] font-medium text-white/80">Desde ${price.toLocaleString("en-US")}</span><span className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[var(--text-primary)]">{product.featured_cta || "Conocer equipo"} →</span></div>
                    </div>
                  </Link>
                </AnimatedSection>;
              })}
            </div>

            <AnimatedSection delay={0.3}>
              <div className="text-center mt-12">
                <Link href="/catalogo" className="btn-secondary" id="home-ver-catalogo-completo">
                  Ver catálogo completo
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ── Technical Service Teaser ──────────────────────────── */}
      <section className="section-dark section-padding">
        <div className="container-apple text-center">
          <AnimatedSection>
            <span className="text-4xl mb-6 block">🔧</span>
            <h2 className="text-headline text-white mb-4">
              ¿Tu equipo está en reparación?
            </h2>
            <p className="text-body-lg text-[#A1A1A6] mb-8 max-w-[460px] mx-auto">
              Consulta el estado de tu dispositivo en tiempo real con solo tu número de ticket.
            </p>
            <Link
              href="/servicio-tecnico"
              className="btn-primary"
              id="home-cta-servicio-tecnico"
            >
              Consultar mi Ticket
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
