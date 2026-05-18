// Génère un identifiant de réservation lisible et sans ambiguïté.
// Format: VLMS-XXXXXXXX (8 caractères alphanumériques majuscules).
// Caractères exclus pour éviter les confusions visuelles : 0, O, 1, I, L.

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // 31 chars
const LEN = 8;

export const generateBookingId = (): string => {
  let out = "VLMS-";
  // crypto.getRandomValues si dispo, sinon Math.random
  const buf = new Uint32Array(LEN);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < LEN; i++) buf[i] = Math.floor(Math.random() * 0xffffffff);
  }
  for (let i = 0; i < LEN; i++) {
    out += ALPHABET[buf[i] % ALPHABET.length];
  }
  return out;
};
