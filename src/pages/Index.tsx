import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Nav } from "@/components/volums/Nav";
import { Hero } from "@/components/volums/Hero";
import { Pourquoi } from "@/components/volums/Pourquoi";
import { Appartements } from "@/components/volums/Appartements";
import { PourQui } from "@/components/volums/PourQui";
import { Promesse } from "@/components/volums/Promesse";
import { Contact } from "@/components/volums/Contact";

const Index = () => {
  const { hash } = useLocation();

  // Arrivée sur l'accueil avec une ancre (ex. depuis le menu de /appartements)
  // → on scrolle vers la section. Plusieurs passes : la mise en page bouge
  // pendant le chargement des images, on recale donc le scroll au fil du temps.
  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    const timers = [50, 200, 450, 800].map((d) =>
      window.setTimeout(() => {
        document
          .getElementById(id)
          ?.scrollIntoView({ behavior: "auto", block: "start" });
      }, d),
    );
    return () => timers.forEach((tid) => window.clearTimeout(tid));
  }, [hash]);

  return (
    <main className="min-h-screen bg-cream text-ink">
      <Nav />
      <Hero />
      <Pourquoi />
      <Appartements />
      <PourQui />
      <Promesse />
      <Contact />
    </main>
  );
};

export default Index;
