import beaumarchais from "@/assets/appt-beaumarchais.jpg";
import lenoirT5 from "@/assets/appt-richard-lenoir-t5.jpg";
import duplex from "@/assets/appt-duplex.jpg";
import t2 from "@/assets/appt-t2.jpg";
import bedroom from "@/assets/appt-bedroom.jpg";
import hero from "@/assets/hero-beaumarchais.jpg";

export type Appt = {
  slug: string;
  ref: string;
  dispo: string;
  arrondissement: string;
  quartier: string;
  name: string;
  nameItalic: string;
  baseline: string;
  shortDescription: string;
  longDescription: string[];
  surface: string;
  chambres: string;
  sdb: string;
  etage: string;
  couchages: string;
  minStay: string;
  loyer: string;
  loyerNum: number;
  pricePerSqm: string;
  image: string;
  gallery: { src: string; label: string; caption: string }[];
  inclus: string[];
  transport: string;
  host: { name: string; role: string };
};

export const appartements: Appt[] = [
  {
    slug: "appt-beaumarchais",
    ref: "4 BEAUMAR 1",
    dispo: "04 MAI 2026",
    arrondissement: "11ᵉ Arrondissement",
    quartier: "Bastille",
    name: "Appt",
    nameItalic: "Beaumarchais",
    baseline: "T4 haussmannien de 105 m² tout équipé, boulevard Beaumarchais.",
    shortDescription:
      "105 m² · 3 chambres · 2 salles de bain · 1ᵉʳ étage avec ascenseur · balcon sur le boulevard Beaumarchais.",
    longDescription: [
      "Appartement haussmannien situé au premier étage d'un immeuble de standing du boulevard Beaumarchais — parquet point de Hongrie, moulures restaurées et balcon filant côté boulevard.",
      "Entièrement rénové en 2024 par un studio d'architecture parisien : menuiseries en chêne fumé, enduits à la chaux travaillés à la main, cuisine équipée Lacanche. Le plan — double séjour à l'avant, deux suites à l'arrière — convient autant à une famille qu'à un cadre recevant pour le travail.",
      "À deux minutes à pied du métro Chemin Vert (ligne 8), quinze minutes en taxi de La Défense ou du Roissybus.",
    ],
    surface: "105 m²",
    chambres: "3",
    sdb: "2",
    etage: "1ᵉʳ · ascenseur",
    couchages: "6 personnes",
    minStay: "30 nuits",
    loyer: "7 500 €",
    loyerNum: 7500,
    pricePerSqm: "71 €/m²",
    image: beaumarchais,
    gallery: [
      { src: beaumarchais, label: "01", caption: "Séjour à l'heure dorée" },
      { src: bedroom, label: "02", caption: "Chambre principale" },
      { src: hero, label: "03", caption: "Balcon sur boulevard" },
      { src: duplex, label: "04", caption: "Cuisine Lacanche" },
      { src: t2, label: "05", caption: "Entrée · parquet point de Hongrie" },
    ],
    inclus: [
      "Ménage hebdomadaire & change du linge",
      "Wi-Fi fibre 1 Gbps symétrique",
      "Charges & taxe de séjour incluses",
      "Cuisine équipée · Lacanche & Miele",
      "Conciergerie 24/7 · WhatsApp",
      "Pack d'accueil à l'arrivée",
      "Ascenseur · 1ᵉʳ étage",
      "Linge Frette · cosmétiques Diptyque",
      "Smart TV · Netflix & Canal+",
      "Lave-linge / sèche-linge",
      "Famille bienvenue · lit bébé sur demande",
      "Animaux acceptés · supplément 200 €/mois",
    ],
    transport: "Métro Chemin Vert (L8) à 2 min · Bastille (L1·5·8) à 6 min",
    host: { name: "Élise Caron", role: "Votre hôte résidente · Paris 11ᵉ" },
  },
  {
    slug: "appt-richard-lenoir",
    ref: "3R LENOIR 2R",
    dispo: "29 AVRIL 2026",
    arrondissement: "11ᵉ Arrondissement",
    quartier: "Richard Lenoir",
    name: "Appt",
    nameItalic: "Richard Lenoir",
    baseline: "T5 haussmannien de 147 m² alliant ancien et design contemporain.",
    shortDescription:
      "147 m² · 4 chambres · 3 salles de bain · 3ᵉ étage avec ascenseur · vue dégagée sur le boulevard Richard Lenoir.",
    longDescription: [
      "Vaste T5 de 147 m² au troisième étage, traversant et lumineux, avec une vue dégagée sur le boulevard Richard Lenoir et son marché bi-hebdomadaire.",
      "Dialogue maîtrisé entre éléments haussmanniens d'origine — parquet, cheminées en marbre, moulures — et mobilier contemporain signé. Quatre chambres, trois salles de bain en pierre, cuisine ouverte sur un séjour double.",
      "Idéal pour un séjour familial prolongé ou un comité de direction en relocation à Paris.",
    ],
    surface: "147 m²",
    chambres: "4",
    sdb: "3",
    etage: "3ᵉ · ascenseur",
    couchages: "10 personnes",
    minStay: "30 nuits",
    loyer: "8 500 €",
    loyerNum: 8500,
    pricePerSqm: "58 €/m²",
    image: lenoirT5,
    gallery: [
      { src: lenoirT5, label: "01", caption: "Séjour double traversant" },
      { src: bedroom, label: "02", caption: "Chambre principale" },
      { src: beaumarchais, label: "03", caption: "Salon contemporain" },
      { src: t2, label: "04", caption: "Bureau attenant" },
      { src: duplex, label: "05", caption: "Cuisine ouverte" },
    ],
    inclus: [
      "Ménage hebdomadaire & change du linge",
      "Wi-Fi fibre 1 Gbps symétrique",
      "Charges & taxe de séjour incluses",
      "Cuisine équipée Lacanche",
      "Conciergerie 24/7 · WhatsApp",
      "Pack d'accueil à l'arrivée",
      "Ascenseur · 3ᵉ étage",
      "Linge Frette · cosmétiques Diptyque",
      "Smart TV · Netflix & Canal+",
      "Lave-linge / sèche-linge",
      "Bureau équipé pour télétravail",
      "Famille bienvenue · lit bébé sur demande",
    ],
    transport: "Métro Richard Lenoir (L5) à 1 min · Oberkampf (L5·9) à 5 min",
    host: { name: "Élise Caron", role: "Votre hôte résidente · Paris 11ᵉ" },
  },
  {
    slug: "duplex-beaumarchais",
    ref: "11 BEAUMAR 5L",
    dispo: "29 AVRIL 2026",
    arrondissement: "4ᵉ Arrondissement",
    quartier: "Marais",
    name: "Duplex",
    nameItalic: "Beaumarchais",
    baseline: "Duplex contemporain de 80 m² sous verrière, design minimaliste.",
    shortDescription:
      "80 m² · 2 chambres · 2 salles de bain · 5ᵉ étage avec ascenseur · verrière zénithale.",
    longDescription: [
      "Duplex de 80 m² au cœur du Marais, dernier étage. Une verrière zénithale baigne le séjour de lumière toute la journée.",
      "Architecture intérieure minimaliste : enduits clairs, chêne massif, pierre de Bourgogne. Deux chambres en mezzanine, chacune avec sa salle de bain.",
      "Pour un couple ou un voyageur d'affaires en quête d'un pied-à-terre confidentiel à Paris.",
    ],
    surface: "80 m²",
    chambres: "2",
    sdb: "2",
    etage: "5ᵉ · ascenseur",
    couchages: "6 personnes",
    minStay: "30 nuits",
    loyer: "7 500 €",
    loyerNum: 7500,
    pricePerSqm: "94 €/m²",
    image: duplex,
    gallery: [
      { src: duplex, label: "01", caption: "Séjour sous verrière" },
      { src: bedroom, label: "02", caption: "Chambre en mezzanine" },
      { src: beaumarchais, label: "03", caption: "Coin lecture" },
      { src: t2, label: "04", caption: "Salle de bain en pierre" },
      { src: hero, label: "05", caption: "Vue sur les toits" },
    ],
    inclus: [
      "Ménage hebdomadaire & change du linge",
      "Wi-Fi fibre 1 Gbps symétrique",
      "Charges & taxe de séjour incluses",
      "Cuisine équipée Miele",
      "Conciergerie 24/7 · WhatsApp",
      "Pack d'accueil à l'arrivée",
      "Ascenseur · 5ᵉ étage",
      "Linge Frette · cosmétiques Diptyque",
      "Smart TV · Netflix & Canal+",
      "Lave-linge / sèche-linge",
      "Verrière zénithale",
      "Climatisation",
    ],
    transport: "Métro Saint-Paul (L1) à 4 min · Bastille (L1·5·8) à 6 min",
    host: { name: "Élise Caron", role: "Votre hôte résidente · Paris 4ᵉ" },
  },
  {
    slug: "pied-a-terre-beaumarchais",
    ref: "11 BEAUMAR 2R",
    dispo: "29 AVRIL 2026",
    arrondissement: "4ᵉ Arrondissement",
    quartier: "Marais",
    name: "Pied-à-terre",
    nameItalic: "Beaumarchais",
    baseline: "T2 chic et chaleureux de 45 m², finitions haut de gamme.",
    shortDescription:
      "45 m² · 1 chambre · 1 salle de bain · 2ᵉ étage avec ascenseur · cœur du Marais.",
    longDescription: [
      "Pied-à-terre de 45 m² au deuxième étage, dans une rue calme du Marais. Volumes intimes, finitions haut de gamme.",
      "Salon avec cheminée d'origine, chambre séparée, cuisine ouverte équipée. Idéal pour un séjour court ou un voyageur solo en mission longue.",
      "À deux pas de la place des Vosges et du musée Picasso.",
    ],
    surface: "45 m²",
    chambres: "1",
    sdb: "1",
    etage: "2ᵉ · ascenseur",
    couchages: "4 personnes",
    minStay: "30 nuits",
    loyer: "3 200 €",
    loyerNum: 3200,
    pricePerSqm: "71 €/m²",
    image: t2,
    gallery: [
      { src: t2, label: "01", caption: "Séjour avec cheminée" },
      { src: bedroom, label: "02", caption: "Chambre" },
      { src: beaumarchais, label: "03", caption: "Coin cuisine" },
      { src: duplex, label: "04", caption: "Salle de bain" },
    ],
    inclus: [
      "Ménage hebdomadaire & change du linge",
      "Wi-Fi fibre 1 Gbps symétrique",
      "Charges & taxe de séjour incluses",
      "Cuisine équipée",
      "Conciergerie 24/7 · WhatsApp",
      "Pack d'accueil à l'arrivée",
      "Ascenseur · 2ᵉ étage",
      "Linge Frette · cosmétiques Diptyque",
      "Smart TV · Netflix & Canal+",
      "Lave-linge",
      "Cheminée d'origine",
      "Voyageur solo bienvenu",
    ],
    transport: "Métro Saint-Paul (L1) à 3 min · Chemin Vert (L8) à 5 min",
    host: { name: "Élise Caron", role: "Votre hôte résidente · Paris 4ᵉ" },
  },
];

export const getAppt = (slug?: string) =>
  appartements.find((a) => a.slug === slug);
