import { redirect } from "next/navigation";

// Die Root-URL ist bewusst nur ein Einstiegspunkt zum Admin-Login. Sie zeigt
// keine Event-Daten mehr an (früher: neuestes Event per findFirst) – Teilnehmer
// gelangen ausschließlich über ihren persönlichen Token-Link (/vote, /propose,
// /results?token=…) zur jeweiligen Abstimmung.
export default function HomePage() {
  redirect("/admin/login");
}
