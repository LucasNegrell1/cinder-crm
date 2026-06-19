import { createClient } from '@supabase/supabase-js';

const supabaseUrl ="https://iufnogwqmtnqmieouwnq.supabase.co";
const supabaseKey ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1Zm5vZ3dxbXRucW1pZW91d25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NTIwNTIsImV4cCI6MjA5NjUyODA1Mn0.JMJ9AQxtE66x-W7ajNiDEynmemeWi3LTEjnD7WyLKjU";

// O Soro da Verdade: Vamos imprimir no console o que o Next.js está lendo
console.log("🔍 URL lida pelo Next:", supabaseUrl);
console.log("🔍 Chave lida pelo Next:", supabaseKey ? "✅ Chave Encontrada" : "❌ UNDEFINED");

if (!supabaseUrl || !supabaseKey) {
  throw new Error("FALHA CRÍTICA: O Next.js não está carregando as variáveis do .env.local!");
}

export const supabase = createClient(supabaseUrl, supabaseKey);