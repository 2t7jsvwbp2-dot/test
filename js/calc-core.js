// Estimation des besoins en bois, partagée par l'accueil et le calculateur.

const INSULATION = [
  { id: "bonne", name: "Bonne", text: "Maison récente ou rénovée (après 2000)", kwhPerM2: 60 },
  { id: "moyenne", name: "Moyenne", text: "Isolation partielle (1975 – 2000)", kwhPerM2: 110 },
  { id: "faible", name: "Faible", text: "Maison ancienne peu isolée", kwhPerM2: 170 },
];

const APPLIANCES = [
  { id: "poele", name: "Poêle à bois", efficiency: 0.78 },
  { id: "insert", name: "Insert ou foyer fermé", efficiency: 0.7 },
  { id: "chaudiere", name: "Chaudière à bûches", efficiency: 0.85 },
  { id: "cheminee", name: "Cheminée ouverte", efficiency: 0.15 },
];

const USAGES = [
  { id: "principal", name: "Chauffage principal", share: 1 },
  { id: "appoint", name: "Appoint (soirées, mi-saison)", share: 0.35 },
  { id: "agrement", name: "Agrément (flambées)", share: 0.1 },
];

// Zones climatiques de la réglementation thermique, par département
const CLIMATE = {
  H1: { name: "Climat froid (Nord, Est, Centre, montagne)", factor: 1.15 },
  H2: { name: "Climat tempéré (Ouest, Sud-Ouest)", factor: 1 },
  H3: { name: "Climat doux (pourtour méditerranéen)", factor: 0.7 },
};
const H1_DEPTS = "01 02 03 05 08 10 14 15 19 21 23 25 27 28 38 39 42 43 45 51 52 54 55 57 58 59 60 61 62 63 67 68 69 70 71 73 74 75 76 77 78 80 87 88 89 90 91 92 93 94 95".split(" ");
const H3_DEPTS = "06 11 13 20 30 34 66 83".split(" ");

function climateOf(cp) {
  const d = deptOf(cp);
  if (!d) return "H2";
  if (H3_DEPTS.includes(d)) return "H3";
  if (H1_DEPTS.includes(d)) return "H1";
  return "H2";
}

// Renvoie les besoins en kWh utiles et en stères
function estimate({ surface = 100, insulation = "moyenne", climate = "H2", appliance = "poele", usage = "principal", essence = "chene" }) {
  const ins = INSULATION.find((i) => i.id === insulation) || INSULATION[1];
  const app = APPLIANCES.find((a) => a.id === appliance) || APPLIANCES[0];
  const use = USAGES.find((u) => u.id === usage) || USAGES[0];
  const ess = essenceById(essence) || ESSENCES[0];
  const kwh = surface * ins.kwhPerM2 * CLIMATE[climate].factor * use.share;
  const steres = kwh / (ess.kwh * app.efficiency);
  return { kwh, steres, ess, app, ins, use };
}

// Arrondi au demi-stère supérieur
const roundSteres = (s) => Math.max(0.5, Math.ceil(s * 2) / 2);
