import type { Metadata } from "next";
import "./globals.css";
import { LayoutDashboard, Users, MessageCircle } from "lucide-react";
import Providers from "./providers";
import Link from "next/link"; // O jeito certo de fazer links no Next.js!

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
      <body className="flex h-screen bg-slate-50 text-slate-900 antialiased">
        
        {/* Sidebar (Menu Lateral) */}
        <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-10">
          <div className="p-6 text-2xl font-bold border-b border-slate-800">
            Cinder<span className="text-blue-500">CRM</span>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 mt-4">
            {/* Veja o href="/" com aspas aqui */}
            <Link href="/" className="flex items-center gap-3 p-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-medium">
              <LayoutDashboard size={20} />
              Pipeline (Kanban)
            </Link>
            
            <Link href="/contatos" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition font-medium text-slate-300 hover:text-white">
              <Users size={20} />
              Contatos
            </Link>
            
            <Link href="/mensagens" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition font-medium text-slate-300 hover:text-white">
              <MessageCircle size={20} />
              Inbox WhatsApp
            </Link>
          </nav>
        </aside>

        {/* Área Principal */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <Providers>
            {children}
          </Providers>
        </main>

      </body>
    </html>
  );
}