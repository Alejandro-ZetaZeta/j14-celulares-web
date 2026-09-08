import { cacheLife, cacheTag } from "next/cache";
import { insforge } from "@/lib/insforge";

export interface AboutBlock {
  text: string;
  visible: boolean;
}

export interface AboutStoryParagraph {
  id: string;
  text: string;
  visible: boolean;
}

export interface AboutMilestone {
  id: string;
  year: string;
  title: string;
  description: string;
  visible: boolean;
}

export interface AboutValue {
  id: string;
  title: string;
  description: string;
  visible: boolean;
}

export interface AboutStat {
  id: string;
  value: string;
  label: string;
  visible: boolean;
}

export interface AboutCTA {
  title: string;
  body: string;
  buttonText: string;
  buttonHref: string;
  visible: boolean;
}

export interface AboutContent {
  hero: {
    kicker: AboutBlock;
    headline: AboutBlock;
    subhead: AboutBlock;
  };
  manifesto: AboutBlock;
  story: {
    title: AboutBlock;
    intro: AboutBlock;
    paragraphs: AboutStoryParagraph[];
  };
  milestones: {
    title: AboutBlock;
    intro: AboutBlock;
    items: AboutMilestone[];
  };
  values: {
    title: AboutBlock;
    intro: AboutBlock;
    items: AboutValue[];
  };
  stats: {
    title: AboutBlock;
    items: AboutStat[];
  };
  cta: AboutCTA;
}

export const DEFAULT_ABOUT_CONTENT: AboutContent = {
  hero: {
    kicker: { text: "Nuestra historia", visible: true },
    headline: { text: "De un mostrador a un nombre en el que confías.", visible: true },
    subhead: {
      text: "J14 Celulares nació en Quito con una idea sencilla: que comprar un smartphone no se sienta como una apuesta.",
      visible: true,
    },
  },
  manifesto: {
    text: "Creemos en vender equipos como nos gustaría recibirlos: verificados, descritos con honestidad y respaldados por una persona que responde por ellos.",
    visible: true,
  },
  story: {
    title: { text: "Nuestra historia", visible: true },
    intro: {
      text: "Lo que empezó como un pequeño local de barrio se convirtió en una tienda de referencia para smartphones y servicio técnico.",
      visible: true,
    },
    paragraphs: [
      {
        id: "start",
        text: "J14 Celulares arranca en el centro de Quito con un mostrador familiar, una vitrina y la convicción de vender equipos verificados. Cada teléfono se revisaba, se probaba y se entregaba con la misma certeza con la que lo recomendaríamos a alguien cercano.",
        visible: true,
      },
      {
        id: "growth",
        text: "Con los años, esa cercanía se convirtió en nuestro sello. Ampliamos el catálogo hacia equipos sellados y Open Box de las marcas que la gente busca, siempre comprobando origen y estado, y sumamos un servicio técnico transparente donde cada reparación puede seguirse paso a paso.",
        visible: true,
      },
      {
        id: "today",
        text: "Hoy seguimos siendo, en esencia, ese mismo local: la atención de primera mano, el precio honesto y la promesa de que detrás de cada equipo hay una persona que responde por él.",
        visible: true,
      },
    ],
  },
  milestones: {
    title: { text: "Cómo hemos llegado hasta aquí", visible: true },
    intro: {
      text: "Cada etapa nos ha enseñado algo y ha dejado huella en la forma en que trabajamos.",
      visible: true,
    },
    items: [
      { id: "m1", year: "2014", title: "El primer mostrador", description: "Un pequeño punto de venta en Quito abre con una mesa, una vitrina y la convicción de vender equipos verificados.", visible: true },
      { id: "m2", year: "2017", title: "Nace el servicio técnico", description: "Incorporamos un taller propio para cuidar los equipos que vendemos y los que llegan a repararse.", visible: true },
      { id: "m3", year: "2020", title: "Catálogo online", description: "Llevamos la tienda a la web con stock en tiempo real y envíos a todo el país.", visible: true },
      { id: "m4", year: "2024", title: "J14, una referencia", description: "Nos consolidamos como un nombre en el que la gente confía para comprar y reparar.", visible: true },
    ],
  },
  values: {
    title: { text: "Lo que nos mueve", visible: true },
    intro: { text: "Cuatro principios guían cada venta, cada reparación y cada conversación.", visible: true },
    items: [
      { id: "v1", title: "Honestidad", description: "Cada equipo se describe tal cual es: condición, origen y estado reales.", visible: true },
      { id: "v2", title: "Cercanía", description: "Tratamos a cada cliente como se trata a alguien conocido.", visible: true },
      { id: "v3", title: "Transparencia", description: "Reparaciones con seguimiento y precios claros desde el inicio.", visible: true },
      { id: "v4", title: "Cuidado", description: "Verificamos cada equipo antes de que llegue a tus manos.", visible: true },
    ],
  },
  stats: {
    title: { text: "J14 en cifras", visible: true },
    items: [
      { id: "s1", value: "10+", label: "años de trayectoria", visible: true },
      { id: "s2", value: "5.000+", label: "clientes atendidos", visible: true },
      { id: "s3", value: "3.000+", label: "equipos entregados", visible: true },
      { id: "s4", value: "100%", label: "equipos verificados", visible: true },
    ],
  },
  cta: {
    title: "¿Listo para tu próximo equipo?",
    body: "Explora el catálogo o consulta el estado de tu reparación. Estamos para ayudarte.",
    buttonText: "Ver catálogo",
    buttonHref: "/catalogo",
    visible: true,
  },
};

export async function getAboutContent(): Promise<AboutContent> {
  "use cache";
  cacheTag("site-settings");
  cacheLife("max");

  const { data, error } = await insforge.database
    .from("site_settings")
    .select("value")
    .eq("key", "about_content")
    .maybeSingle();

  if (error) {
    console.error("[getAboutContent] Error:", error.message);
    return DEFAULT_ABOUT_CONTENT;
  }

  return parseAboutContent(data?.value);
}

export function parseAboutContent(value?: string): AboutContent {
  try {
    const parsed = JSON.parse(value ?? "null") as Partial<AboutContent> | null;
    if (!parsed || typeof parsed !== "object") return DEFAULT_ABOUT_CONTENT;
    return mergeAboutContent(DEFAULT_ABOUT_CONTENT, parsed);
  } catch {
    return DEFAULT_ABOUT_CONTENT;
  }
}

function mergeAboutContent(base: AboutContent, patch: Partial<AboutContent>): AboutContent {
  return {
    hero: { ...base.hero, ...patch.hero },
    manifesto: { ...base.manifesto, ...patch.manifesto },
    story: {
      ...base.story,
      ...patch.story,
      paragraphs: Array.isArray(patch.story?.paragraphs) && patch.story.paragraphs.length > 0 ? patch.story.paragraphs : base.story.paragraphs,
    },
    milestones: {
      ...base.milestones,
      ...patch.milestones,
      items: Array.isArray(patch.milestones?.items) && patch.milestones.items.length > 0 ? patch.milestones.items : base.milestones.items,
    },
    values: {
      ...base.values,
      ...patch.values,
      items: Array.isArray(patch.values?.items) && patch.values.items.length > 0 ? patch.values.items : base.values.items,
    },
    stats: {
      ...base.stats,
      ...patch.stats,
      items: Array.isArray(patch.stats?.items) && patch.stats.items.length > 0 ? patch.stats.items : base.stats.items,
    },
    cta: { ...base.cta, ...patch.cta },
  };
}
