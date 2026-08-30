import { createBrowserClient } from '@supabase/ssr'

// 1. Lemos as variáveis do ficheiro .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 2. O Soro da Verdade: Imprimimos no console o que o Next.js está a ler
console.log("🔍 URL lida pelo Next:", supabaseUrl);
console.log("🔍 Chave lida pelo Next:", supabaseKey ? "✅ Chave Encontrada" : "❌ UNDEFINED");

// 3. A Trava de Segurança
if (!supabaseUrl || !supabaseKey) {
  throw new Error("FALHA CRÍTICA: O Next.js não está a carregar as variáveis do .env.local!");
}

// 4. Criamos a conexão usando o pacote novo (que lê os Cookies), passando as variáveis verificadas
export const supabase = createBrowserClient(supabaseUrl, supabaseKey)