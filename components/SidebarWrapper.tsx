"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar"; // Importa a sua sidebar original

export function SidebarWrapper() {
  const pathname = usePathname();

  // Se a rota for a de login, devolvemos 'null' (não desenha nada na tela)
  if (pathname === "/login") {
    return null;
  }

  // Se for qualquer outra rota do CRM, desenha a Sidebar normalmente
  return <Sidebar />;
}