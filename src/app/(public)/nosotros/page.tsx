import Link from "next/link";
import Image from "next/image";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { getAboutContent } from "@/lib/about";

// No revalidate here — caching is handled by `use cache` + cacheTag
// in the data layer. Revalidates when an admin mutates content.

export default async function NosotrosPage() {
  const about = await getAboutContent();
  const { hero, manifesto, story, milestones, values, stats, cta } = about;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="section-black relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 30% 0%, rgba(0,113,227,0.22) 0%, transparent 65%), radial-gradient(ellipse 60% 50% at 85% 90%, rgba(0,113,227,0.12) 0%, transparent 60%)",
          }}
        />
        {/* Mobile-only artwork: low-opacity image off to one side, behind the copy */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none lg:hidden">
          <Image
            src="/BIENVENIDA.png"
            alt=""
            width={480}
            height={640}
            className="absolute -right-10 top-8 h-[20rem] w-[16rem] rotate-6 object-contain opacity-15 select-none"
            priority
          />
        </div>

        <div className="container-apple section-padding relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12">
            <div className="max-w-3xl">
              <AnimatedSection delay={0} repeat>
                {hero.kicker.visible && (
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="h-px w-10 bg-[var(--accent)]" />
                    <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">{hero.kicker.text}</p>
                  </div>
                )}
              </AnimatedSection>
              <AnimatedSection delay={0.08} repeat>
                {hero.headline.visible && (
                  <h1 className="text-editorial mt-6 text-[clamp(2.6rem,7.5vw,5.5rem)] text-white">
                    {hero.headline.text}
                  </h1>
                )}
              </AnimatedSection>
              <AnimatedSection delay={0.16} repeat>
                {hero.subhead.visible && (
                  <p className="mt-8 max-w-xl text-body-lg leading-7 text-[#A1A1A6]">{hero.subhead.text}</p>
                )}
              </AnimatedSection>
            </div>
            {/* Desktop: image to the right of the hero text */}
            <AnimatedSection delay={0.16} className="hidden lg:flex justify-end">
              <Image
                src="/BIENVENIDA.png"
                alt="Bienvenida"
                width={640}
                height={780}
                className="w-[min(320px,18vw)] h-auto object-contain drop-shadow-2xl select-none"
                priority
              />
            </AnimatedSection>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-8" aria-hidden="true">
          <span className="flex h-9 w-6 items-start justify-center rounded-full border border-white/25 p-1.5">
            <span className="h-2 w-1 rounded-full bg-white/60 animate-bounce" />
          </span>
        </div>
      </section>

      {/* ── Manifesto ────────────────────────────────────────── */}
      <section className="bg-[var(--bg-primary)] py-24 md:py-32">
        <div className="container-apple">
          <AnimatedSection repeat>
            {manifesto.visible && (
              <blockquote className="mx-auto max-w-3xl text-center">
                <span aria-hidden="true" className="text-editorial block text-5xl leading-none text-[var(--accent)]">“</span>
                <p className="text-editorial mt-2 text-[clamp(1.6rem,4vw,2.75rem)] text-[var(--text-primary)]">{manifesto.text}</p>
              </blockquote>
            )}
          </AnimatedSection>
        </div>
      </section>

      {/* ── Story ────────────────────────────────────────────── */}
      <section className="section-gray section-padding">
        <div className="container-wide grid gap-12 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
          <div className="md:sticky md:top-28 md:self-start">
            <AnimatedSection repeat>
              {story.title.visible && (
                <>
                  <p className="catalog-kicker">Nuestra historia</p>
                  <h2 className="text-editorial mt-3 text-[clamp(1.9rem,3.5vw,2.9rem)] text-[var(--text-primary)]">{story.title.text}</h2>
                </>
              )}
              {story.intro.visible && <p className="mt-5 text-body leading-7 text-[var(--text-secondary)]">{story.intro.text}</p>}
            </AnimatedSection>
          </div>
          <div className="space-y-7">
            {story.paragraphs.map((paragraph, index) => {
              if (!paragraph.visible) return null;
              return (
                <AnimatedSection key={paragraph.id} delay={index * 0.06} repeat>
                  <p className={`text-[1.05rem] leading-8 text-[var(--text-primary)] ${index === 0 ? "drop-cap" : ""}`}>{paragraph.text}</p>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Milestones ───────────────────────────────────────── */}
      <section className="bg-[var(--bg-primary)] section-padding">
        <div className="container-apple">
          <AnimatedSection repeat>
            <div className="max-w-2xl">
              {milestones.title.visible && <h2
              className="text-editorial text-[clamp(1.9rem,3.5vw,2.9rem)] text-[var(--text-primary)]">{milestones.title.text}</h2>}
              {milestones.intro.visible && <p className="mt-4 text-body leading-7 text-[var(--text-secondary)]">{milestones.intro.text}</p>}
            </div>
          </AnimatedSection>

          <div className="about-timeline mt-16 space-y-12">
            {milestones.items.map((item, index) => {
              if (!item.visible) return null;
              const left = index % 2 === 0;
              return (
                <AnimatedSection key={item.id} delay={index * 0.06} direction={left ? "left" : "right"} repeat>
                  <div className={`relative md:grid md:grid-cols-2 md:gap-12 ${left ? "" : ""}`}>
                    <span aria-hidden="true" className="absolute left-[1.25rem] top-2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-[var(--accent)] bg-[var(--bg-primary)] shadow-[0_0_0_4px_rgba(0,113,227,0.15)] md:left-1/2" />
                    <div className={`pl-12 md:pl-0 ${left ? "md:pr-16 md:text-right" : "md:col-start-2 md:pl-16"}`}>
                      <p className="text-editorial text-[2.2rem] leading-none text-[var(--accent)]">{item.year}</p>
                      <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">{item.title}</h3>
                      <p className="mt-2 text-[0.95rem] leading-7 text-[var(--text-secondary)]">{item.description}</p>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Values ───────────────────────────────────────────── */}
      <section className="section-gray section-padding">
        <div className="container-apple">
          <AnimatedSection repeat>
            <div className="mx-auto max-w-2xl text-center">
              {values.title.visible && <h2 className="text-editorial text-[clamp(1.9rem,3.5vw,2.9rem)] text-[var(--text-primary)]">{values.title.text}</h2>}
              {values.intro.visible && <p className="mt-4 text-body leading-7 text-[var(--text-secondary)]">{values.intro.text}</p>}
            </div>
          </AnimatedSection>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.items.map((value, index) => {
              if (!value.visible) return null;
              return (
                <AnimatedSection key={value.id} delay={index * 0.06} repeat>
                  <div className="card-apple group h-full p-6 hover:!transform-none">
                    <span className="text-editorial block text-3xl text-[var(--accent)] transition-transform duration-300 group-hover:-translate-y-1" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    <h3 className="mt-4 text-[18px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">{value.title}</h3>
                    <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">{value.description}</p>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      {stats.items.some((item) => item.visible) && (
        <section className="section-dark section-padding">
          <div className="container-apple">
            <AnimatedSection repeat>
              {stats.title.visible && <h2 className="text-center text-[13px] font-semibold uppercase tracking-[0.22em] text-[#A1A1A6]">{stats.title.text}</h2>}
            </AnimatedSection>
            <div className="mt-12 grid grid-cols-2 gap-10 lg:grid-cols-4">
              {stats.items.map((item, index) => {
                if (!item.visible) return null;
                return (
                  <AnimatedSection key={item.id} delay={index * 0.06} repeat>
                    <div className="text-center">
                      <p className="text-editorial text-[clamp(2.4rem,5vw,3.8rem)] text-white">{item.value}</p>
                      <p className="mt-2 text-[14px] text-[#A1A1A6]">{item.label}</p>
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────── */}
      {cta.visible && (
        <section className="bg-[var(--bg-primary)] py-24 md:py-28">
          <div className="container-apple text-center">
            <AnimatedSection repeat>
              <h2 className="text-editorial mx-auto max-w-2xl text-[clamp(1.9rem,4vw,3rem)] text-[var(--text-primary)]">{cta.title}</h2>
              <p className="mx-auto mt-5 max-w-md text-body leading-7 text-[var(--text-secondary)]">{cta.body}</p>
              <Link href={cta.buttonHref} className="btn-primary mt-9">{cta.buttonText}</Link>
            </AnimatedSection>
          </div>
        </section>
      )}
    </>
  );
}
