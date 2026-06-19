import { createClient } from '@supabase/supabase-js';

const supabaseUrl =process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// O Soro da Verdade: Vamos imprimir no console o que o Next.js está lendo
console.log("🔍 URL lida pelo Next:", supabaseUrl);
console.log("🔍 Chave lida pelo Next:", supabaseKey ? "✅ Chave Encontrada" : "❌ UNDEFINED");

if (!supabaseUrl || !supabaseKey) {
  throw new Error("FALHA CRÍTICA: O Next.js não está carregando as variáveis do .env.local!");
}

export const supabase = createClient(supabaseUrl, supabaseKey);