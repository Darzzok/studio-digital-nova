import {
  Hero,
  Services,
  APropos,
  Processus,
  CasClients,
  Tarifs,
  Contact,
} from "@/components/sections";

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <Services />
      <APropos />
      <Processus />
      <Tarifs />
      <CasClients />
      <Contact />
    </main>
  );
}
