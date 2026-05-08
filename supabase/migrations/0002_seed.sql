-- Seed initial : 4 appartements existants (sans photos — à uploader via /admin)
insert into public.properties (
  slug, ref, dispo, arrondissement, quartier, name, name_italic, baseline,
  short_description, long_description, surface, chambres, sdb, etage,
  couchages, min_stay, loyer, loyer_num, price_per_sqm, inclus, transport,
  host_name, host_role, sort_order
) values
(
  'appt-beaumarchais', '4 BEAUMAR 1', '04 MAI 2026', '11ᵉ Arrondissement', 'Bastille',
  'Appt', 'Beaumarchais',
  'T4 haussmannien de 105 m² tout équipé, boulevard Beaumarchais.',
  '105 m² · 3 chambres · 2 salles de bain · 1ᵉʳ étage avec ascenseur · balcon sur le boulevard Beaumarchais.',
  array[
    'Appartement haussmannien situé au premier étage d''un immeuble de standing du boulevard Beaumarchais — parquet point de Hongrie, moulures restaurées et balcon filant côté boulevard.',
    'Entièrement rénové en 2024 par un studio d''architecture parisien : menuiseries en chêne fumé, enduits à la chaux travaillés à la main, cuisine équipée Lacanche. Le plan — double séjour à l''avant, deux suites à l''arrière — convient autant à une famille qu''à un cadre recevant pour le travail.',
    'À deux minutes à pied du métro Chemin Vert (ligne 8), quinze minutes en taxi de La Défense ou du Roissybus.'
  ],
  '105 m²', '3', '2', '1ᵉʳ · ascenseur', '6 personnes', '30 nuits', '7 500 €', 7500, '71 €/m²',
  array[
    'Ménage hebdomadaire & change du linge','Wi-Fi fibre 1 Gbps symétrique',
    'Charges & taxe de séjour incluses','Cuisine équipée · Lacanche & Miele',
    'Conciergerie 24/7 · WhatsApp','Pack d''accueil à l''arrivée',
    'Ascenseur · 1ᵉʳ étage','Linge Frette · cosmétiques Diptyque',
    'Smart TV · Netflix & Canal+','Lave-linge / sèche-linge',
    'Famille bienvenue · lit bébé sur demande','Animaux acceptés · supplément 200 €/mois'
  ],
  'Métro Chemin Vert (L8) à 2 min · Bastille (L1·5·8) à 6 min',
  'Élise Caron','Votre hôte résidente · Paris 11ᵉ', 1
),
(
  'appt-richard-lenoir', '3R LENOIR 2R', '29 AVRIL 2026', '11ᵉ Arrondissement', 'Richard Lenoir',
  'Appt', 'Richard Lenoir',
  'T5 haussmannien de 147 m² alliant ancien et design contemporain.',
  '147 m² · 4 chambres · 3 salles de bain · 3ᵉ étage avec ascenseur · vue dégagée sur le boulevard Richard Lenoir.',
  array[
    'Vaste T5 de 147 m² au troisième étage, traversant et lumineux, avec une vue dégagée sur le boulevard Richard Lenoir et son marché bi-hebdomadaire.',
    'Dialogue maîtrisé entre éléments haussmanniens d''origine — parquet, cheminées en marbre, moulures — et mobilier contemporain signé. Quatre chambres, trois salles de bain en pierre, cuisine ouverte sur un séjour double.',
    'Idéal pour un séjour familial prolongé ou un comité de direction en relocation à Paris.'
  ],
  '147 m²', '4', '3', '3ᵉ · ascenseur', '10 personnes', '30 nuits', '8 500 €', 8500, '58 €/m²',
  array[
    'Ménage hebdomadaire & change du linge','Wi-Fi fibre 1 Gbps symétrique',
    'Charges & taxe de séjour incluses','Cuisine équipée Lacanche',
    'Conciergerie 24/7 · WhatsApp','Pack d''accueil à l''arrivée',
    'Ascenseur · 3ᵉ étage','Linge Frette · cosmétiques Diptyque',
    'Smart TV · Netflix & Canal+','Lave-linge / sèche-linge',
    'Bureau équipé pour télétravail','Famille bienvenue · lit bébé sur demande'
  ],
  'Métro Richard Lenoir (L5) à 1 min · Oberkampf (L5·9) à 5 min',
  'Élise Caron','Votre hôte résidente · Paris 11ᵉ', 2
),
(
  'duplex-beaumarchais', '11 BEAUMAR 5L', '29 AVRIL 2026', '4ᵉ Arrondissement', 'Marais',
  'Duplex', 'Beaumarchais',
  'Duplex contemporain de 80 m² sous verrière, design minimaliste.',
  '80 m² · 2 chambres · 2 salles de bain · 5ᵉ étage avec ascenseur · verrière zénithale.',
  array[
    'Duplex de 80 m² au cœur du Marais, dernier étage. Une verrière zénithale baigne le séjour de lumière toute la journée.',
    'Architecture intérieure minimaliste : enduits clairs, chêne massif, pierre de Bourgogne. Deux chambres en mezzanine, chacune avec sa salle de bain.',
    'Pour un couple ou un voyageur d''affaires en quête d''un pied-à-terre confidentiel à Paris.'
  ],
  '80 m²', '2', '2', '5ᵉ · ascenseur', '6 personnes', '30 nuits', '7 500 €', 7500, '94 €/m²',
  array[
    'Ménage hebdomadaire & change du linge','Wi-Fi fibre 1 Gbps symétrique',
    'Charges & taxe de séjour incluses','Cuisine équipée Miele',
    'Conciergerie 24/7 · WhatsApp','Pack d''accueil à l''arrivée',
    'Ascenseur · 5ᵉ étage','Linge Frette · cosmétiques Diptyque',
    'Smart TV · Netflix & Canal+','Lave-linge / sèche-linge',
    'Verrière zénithale','Climatisation'
  ],
  'Métro Saint-Paul (L1) à 4 min · Bastille (L1·5·8) à 6 min',
  'Élise Caron','Votre hôte résidente · Paris 4ᵉ', 3
),
(
  'pied-a-terre-beaumarchais', '11 BEAUMAR 2R', '29 AVRIL 2026', '4ᵉ Arrondissement', 'Marais',
  'Pied-à-terre', 'Beaumarchais',
  'T2 chic et chaleureux de 45 m², finitions haut de gamme.',
  '45 m² · 1 chambre · 1 salle de bain · 2ᵉ étage avec ascenseur · cœur du Marais.',
  array[
    'Pied-à-terre de 45 m² au deuxième étage, dans une rue calme du Marais. Volumes intimes, finitions haut de gamme.',
    'Salon avec cheminée d''origine, chambre séparée, cuisine ouverte équipée. Idéal pour un séjour court ou un voyageur solo en mission longue.',
    'À deux pas de la place des Vosges et du musée Picasso.'
  ],
  '45 m²', '1', '1', '2ᵉ · ascenseur', '4 personnes', '30 nuits', '3 200 €', 3200, '71 €/m²',
  array[
    'Ménage hebdomadaire & change du linge','Wi-Fi fibre 1 Gbps symétrique',
    'Charges & taxe de séjour incluses','Cuisine équipée',
    'Conciergerie 24/7 · WhatsApp','Pack d''accueil à l''arrivée',
    'Ascenseur · 2ᵉ étage','Linge Frette · cosmétiques Diptyque',
    'Smart TV · Netflix & Canal+','Lave-linge',
    'Cheminée d''origine','Voyageur solo bienvenu'
  ],
  'Métro Saint-Paul (L1) à 3 min · Chemin Vert (L8) à 5 min',
  'Élise Caron','Votre hôte résidente · Paris 4ᵉ', 4
)
on conflict (slug) do nothing;
