import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar"; // Importando a Sidebar que vamos criar abaixo
import Providers from "./providers";
import { SidebarWrapper } from "@/components/SidebarWrapper";

export const metadata: Metadata = {
  title: "CinderCRM | Real Estate",
  description: "Gestão inteligente para consultoria imobiliária",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="flex h-screen bg-[#090C15] text-[#F8FAFC] antialiased overflow-hidden relative">
        
        {/* LUZES DE FUNDO (O efeito de Glow) */}
        {/* Luz azul superior esquerda */}
        <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-[#0284C7] opacity-[0.07] blur-[120px] pointer-events-none z-0"></div>
        
        {/* Luz roxa inferior direita */}
        <div className="absolute bottom-[-10%] right-[-5%] w-[30vw] h-[30vw] rounded-full bg-[#8B5CF6] opacity-[0.05] blur-[120px] pointer-events-none z-0"></div>

        {/* Sidebar */}
        <SidebarWrapper />

        {/* Área Principal */}
        <main className="flex-1 overflow-y-auto flex flex-col bg-transparent z-10 relative">
          <Providers>
            {children}
          </Providers>
        </main>

      </body>
    </html>
  );
}