"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Mail, Lock, LogIn, Loader2, UserPlus, Check, X as XIcon } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  
  // 🚀 O Supabase é inicializado aqui DENTRO com o pacote novo!
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Controle de qual tela estamos a ver
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Estados dos campos
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Estados de feedback
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // 🛡️ REGRAS DE VALIDAÇÃO (Calculadas em tempo real)
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const isPasswordValid = hasMinLength && hasUpperCase && hasSpecialChar && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMsg("");

    if (isRegisterMode) {
      // FLUXO DE CADASTRO
      if (!isPasswordValid) {
        setError("Por favor, cumpra todas as regras de segurança da senha.");
        setIsLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(), // Proteção contra espaços invisíveis
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSuccessMsg("Conta criada com sucesso! A entrar no sistema...");
        setTimeout(() => router.push("/"), 1500); 
      }
    } else {
      // FLUXO DE LOGIN SIMPLES
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(), // Proteção contra espaços invisíveis
        password,
      });

      if (signInError) {
        setError("E-mail ou senha incorretos. Tente novamente.");
      } else {
        router.push("/");
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#06080D] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background de bolinhas */}
      <div className="absolute inset-0 bg-[radial-gradient(#1E2538_2px,transparent_2px)] [background-size:30px_30px] opacity-40"></div>

      <div className="relative z-10 bg-[#10141F] border border-[#1E2538] rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-300">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            Cinder<span className="text-[#0284C7]">CRM</span>
          </h1>
          <p className="text-[#8B949E] text-sm mt-2">
            {isRegisterMode ? "Crie a sua conta de administrador" : "Faça login para aceder ao sistema"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-sm text-center">
              {successMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com" 
                className="w-full bg-[#06080D] border border-[#1E2538] text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-[#0284C7] transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-[#06080D] border border-[#1E2538] text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-[#0284C7] transition-all text-sm"
              />
            </div>
          </div>

          {isRegisterMode && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">Confirmar Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" size={18} />
                  <input 
                    type="password" 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a sua senha" 
                    className={`w-full bg-[#06080D] border text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none transition-all text-sm ${
                      confirmPassword.length > 0 
                        ? passwordsMatch ? "border-emerald-500/50 focus:border-emerald-500" : "border-red-500/50 focus:border-red-500"
                        : "border-[#1E2538] focus:border-[#0284C7]"
                    }`}
                  />
                </div>
              </div>

              <div className="bg-[#06080D] border border-[#1E2538] rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-[#8B949E] mb-3">Requisitos de segurança:</p>
                
                <ValidationItem isValid={hasMinLength} text="Mínimo de 8 caracteres" />
                <ValidationItem isValid={hasUpperCase} text="Pelo menos 1 letra maiúscula" />
                <ValidationItem isValid={hasSpecialChar} text="Pelo menos 1 caractere especial (@, #, !, etc)" />
                <ValidationItem isValid={passwordsMatch} text="As senhas são idênticas" />
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={isLoading || (isRegisterMode && !isPasswordValid)}
            className="w-full py-3 mt-4 bg-[#0284C7] hover:bg-[#0369a1] disabled:bg-[#1E2538] disabled:text-[#8B949E] text-white font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : (isRegisterMode ? <UserPlus size={18} /> : <LogIn size={18} />)}
            {isLoading ? "Processando..." : (isRegisterMode ? "Criar Conta" : "Entrar no Sistema")}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError("");
                setSuccessMsg("");
              }}
              className="text-sm text-[#8B949E] hover:text-white transition-colors"
            >
              {isRegisterMode 
                ? "Já tem uma conta? Faça login" 
                : "Ainda não tem conta? Crie uma agora"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

function ValidationItem({ isValid, text }: { isValid: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {isValid ? (
        <Check size={14} className="text-emerald-500" />
      ) : (
        <XIcon size={14} className="text-[#8B949E]" />
      )}
      <span className={isValid ? "text-white" : "text-[#8B949E]"}>
        {text}
      </span>
    </div>
  );
}