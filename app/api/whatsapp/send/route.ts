import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { phone, message } = await request.json();

    if (!phone || !message) {
      return NextResponse.json({ error: "Telefone e mensagem são obrigatórios" }, { status: 400 });
    }

    // Pega as chaves do seu .env.local
    const idInstance = process.env.GREEN_API_INSTANCE_ID;
    const apiTokenInstance = process.env.GREEN_API_TOKEN;

    if (!idInstance || !apiTokenInstance) {
      return NextResponse.json({ error: "Credenciais da Green API não configuradas" }, { status: 500 });
    }

    // URL oficial da Green API para enviar mensagens
    const url = `https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;

    // A GreenAPI exige que o número termine com @c.us
    const payload = {
      chatId: `${phone}@c.us`,
      message: message
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error("Erro ao enviar mensagem via GreenAPI:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}