-- Migration 0008 — Galerie photos par pièce
-- Ajoute à property_photos le type de pièce + un index pour les pièces numérotées.
-- room : 'salon','salle_a_manger','cuisine','chambre','sdb','entree','bureau','exterieur','autre'
-- room_index : 1,2,3… pour chambre/sdb ; null sinon.
-- Les deux nullables — une photo non classée est traitée comme 'autre' côté front.

alter table property_photos
  add column if not exists room text,
  add column if not exists room_index smallint;
