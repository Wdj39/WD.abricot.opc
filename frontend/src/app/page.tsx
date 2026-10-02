import { redirect } from "next/navigation";

// La racine du site n'a pas de contenu propre :
// on renvoie directement vers le tableau de bord.
// Si l'utilisateur n'est pas connecté, le proxy le renverra ensuite vers /login.
export default function Home() {
  redirect("/dashboard");
}