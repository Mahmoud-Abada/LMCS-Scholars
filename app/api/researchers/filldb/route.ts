import { dropAllTables } from "../../../../db/client";


const LMCS_RESEARCHERS = [
  { lastName: "ABDELMEZIEM", firstName: "" },
  { lastName: "ABDELAOUI", firstName: "Sabrina" },
  { lastName: "AMROUCHE", firstName: "Hakim" },
  { lastName: "ARTABAZ", firstName: "Saliha" },
  { lastName: "BENATCHBA", firstName: "Karima" },
  { lastName: "BESSEDIK", firstName: "Malika" },
  { lastName: "BELAHRACHE", firstName: "Abderahmane" },
  { lastName: "BOUKHEDIMI", firstName: "Sohila" },
  { lastName: "BOUKHADRA", firstName: "Adel" },
  { lastName: "BOUSBIA", firstName: "Nabila" },
  { lastName: "BOUSAHA", firstName: "Rima" },
  { lastName: "CHALAL", firstName: "Rachid" },
  { lastName: "CHERID", firstName: "Nacera" },
  { lastName: "DAHAMNI", firstName: "Foudil" },
  { lastName: "DEKICHE", firstName: "Narimane" },
  { lastName: "DELLYS", firstName: "Elhachmi" },
  { lastName: "FAYCEL", firstName: "Touka" },
  { lastName: "GHOMARI", firstName: "Abdesamed Réda" },
  { lastName: "GUERROUTE", firstName: "Elhachmi" },
  { lastName: "HAMANI", firstName: "Nacer" },
  { lastName: "HAROUNE", firstName: "Hayet" },
  { lastName: "HASSINI", firstName: "Sabrina" },
  { lastName: "KECHIDE", firstName: "Amine" },
  { lastName: "KHELOUAT", firstName: "Boualem" },
  { lastName: "KHELIFATI", firstName: "Si Larabi" },
  { lastName: "KERMI", firstName: "Adel" },
  { lastName: "KOUDIL", firstName: "Mouloud" },
  { lastName: "MAHIOU", firstName: "Ramdane" },
  { lastName: "NADER", firstName: "Fahima" },
  { lastName: "SI TAYEB", firstName: "Fatima" },
];

console.log("LMCS_RESEARCHERS", LMCS_RESEARCHERS);
(async () => {
  await dropAllTables();
  process.exit(0);
})();