import { Nav } from "@/components/volums/Nav";
import { Hero } from "@/components/volums/Hero";
import { Pourquoi } from "@/components/volums/Pourquoi";
import { Appartements } from "@/components/volums/Appartements";
import { PourQui } from "@/components/volums/PourQui";
import { Promesse } from "@/components/volums/Promesse";
import { Contact } from "@/components/volums/Contact";

const Index = () => (
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

export default Index;
