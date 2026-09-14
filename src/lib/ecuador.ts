// Ecuadorian administrative divisions used for billing address selection.
// Provinces and cities use official, correctly-spelled names.

export const ECUADOR_PROVINCES = [
  "Azuay",
  "Bolívar",
  "Cañar",
  "Carchi",
  "Chimborazo",
  "Cotopaxi",
  "El Oro",
  "Esmeraldas",
  "Galápagos",
  "Guayas",
  "Imbabura",
  "Loja",
  "Los Ríos",
  "Manabí",
  "Morona Santiago",
  "Napo",
  "Orellana",
  "Pastaza",
  "Pichincha",
  "Santa Elena",
  "Santo Domingo de los Tsáchilas",
  "Sucumbíos",
  "Tungurahua",
  "Zamora Chinchipe",
] as const;

export const ECUADOR_CITIES: Record<(typeof ECUADOR_PROVINCES)[number], string[]> = {
  Azuay: ["Cuenca", "Gualaceo", "Paute", "Girón", "Santa Isabel", "Sígsig", "Nabón", "Pucará"],
  "Bolívar": ["Guaranda", "San Miguel", "Chimbo", "Echeandía", "Caluma", "Las Naves"],
  "Cañar": ["Azogues", "Biblián", "Cañar", "La Troncal", "Suscal", "El Tambo", "Déleg"],
  Carchi: ["Tulcán", "San Gabriel", "El Ángel", "Huaca", "Bolívar", "Mira"],
  Chimborazo: ["Riobamba", "Alausí", "Guamote", "Chambo", "Guano", "Penipe", "Cumandá"],
  Cotopaxi: ["Latacunga", "La Maná", "Pujilí", "Saquisilí", "San Miguel de Salcedo", "Sigchos"],
  "El Oro": ["Machala", "Pasaje", "Santa Rosa", "Huaquillas", "Piñas", "Zaruma", "Arenillas", "Puerto Bolívar"],
  Esmeraldas: ["Esmeraldas", "Atacames", "Quinindé", "Muisne", "San Lorenzo", "Rioverde", "Valdez"],
  "Galápagos": ["Puerto Baquerizo Moreno", "Puerto Ayora", "Puerto Villamil"],
  Guayas: ["Guayaquil", "Durán", "Samborondón", "Daule", "Milagro", "Balzar", "El Triunfo", "Naranjal", "Yaguachi", "Salitre", "Playas"],
  Imbabura: ["Ibarra", "Otavalo", "Cotacachi", "Atuntaqui", "Pimampiro", "San Miguel de Urcuquí"],
  Loja: ["Loja", "Catamayo", "Cariamanga", "Macará", "Alamor", "Vilcabamba", "Zapotillo", "Celica"],
  "Los Ríos": ["Babahoyo", "Quevedo", "Vinces", "Ventanas", "Valencia", "Buena Fe", "Mocache", "Puebloviejo"],
  "Manabí": ["Portoviejo", "Manta", "Montecristi", "Jipijapa", "Chone", "Bahía de Caráquez", "Calceta", "El Carmen", "Tosagua", "Rocafuerte", "Sucre"],
  "Morona Santiago": ["Macas", "Gualaquiza", "Sucúa", "Palora", "Limón Indanza", "Santiago de Méndez", "San Juan Bosco"],
  Napo: ["Tena", "Archidona", "El Chaco", "Baeza", "Carlos Julio Arosemena Tola"],
  Orellana: ["Puerto Francisco de Orellana", "La Joya de los Sachas", "Loreto", "Aguarico"],
  Pastaza: ["Puyo", "Mera", "Santa Clara", "Arajuno"],
  Pichincha: ["Quito", "Cayambe", "Machachi", "Sangolquí", "Pedro Vicente Maldonado", "Puerto Quito", "San Miguel de los Bancos", "Tabacundo"],
  "Santa Elena": ["Santa Elena", "Salinas", "La Libertad"],
  "Santo Domingo de los Tsáchilas": ["Santo Domingo", "La Concordia"],
  "Sucumbíos": ["Nueva Loja", "Shushufindi", "La Bonita", "Cuyabeno", "Cascales", "Lumbaquí"],
  Tungurahua: ["Ambato", "Baños de Agua Santa", "Pelileo", "Píllaro", "Cevallos", "Mocha", "Quero", "Tisaleo"],
  "Zamora Chinchipe": ["Zamora", "Yantzaza", "El Pangui", "Zumba", "Guayzimi", "Centinela del Cóndor"],
};

export function citiesForProvince(province: string): string[] {
  return ECUADOR_CITIES[province as keyof typeof ECUADOR_CITIES] ?? [];
}