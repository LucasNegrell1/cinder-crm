import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Extração GreenAPI
    const typeWebhook = body?.typeWebhook;
    
    // Só processa se for uma mensagem nova de fato
    if (typeWebhook !== 'incomingMessageReceived') {
      return NextResponse.json({ message: "Ignorado - Não é uma mensagem recebida" });
    }

    // Limpa o número (tira o @c.us que a Green API envia)
    const rawPhone = body?.senderData?.sender || body?.senderData?.chatId;
    const phone = rawPhone ? rawPhone.replace('@c.us', '').replace('@g.us', '') : null;
    
    const name = body?.senderData?.senderName || "Lead do WhatsApp";
    
    const messageText = body?.messageData?.textMessageData?.textMessage || 
                        body?.messageData?.extendedTextMessageData?.text || 
                        "Mensagem de mídia/áudio recebida";

    if (!phone) {
      return NextResponse.json({ error: "Sem número de telefone" }, { status: 400 });
    }

    // 2. Número existe?
    const { data: existingContact } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .eq('phone', phone)
      .single();

    let contactId;

    if (existingContact) {
      // Já é cliente
      contactId = existingContact.id;
    } else {
      // 3. Lead Novo identificado 
      const { data: newContact, error: contactError } = await supabaseAdmin
        .from('contacts')
        .insert([{ name: name, phone: phone }])
        .select('id')
        .single();

      if (contactError) throw contactError;
      contactId = newContact.id;

      // 4. Buscar a primeira coluna do Kanban (CORRIGIDO PARA list_order)
      const { data: firstStage } = await supabaseAdmin
        .from('stages')
        .select('id')
        .order('list_order', { ascending: true }) 
        .limit(1)
        .single();

      // 5. Cria o Card no Kanban
      if (firstStage) {
        const { error: oppError } = await supabaseAdmin
          .from('opportunities')
          .insert([{
            title: `Lead WhatsApp - ${name}`,
            contact_id: contactId,
            stage_id: firstStage.id,
            value: 0
          }]);
          
        if (oppError) console.error("Erro ao criar oportunidade:", oppError);
      }
    }

    // 6. Salvar mensagem no histórico (CORRIGIDO COM DIRECTION INBOUND)
    await supabaseAdmin
      .from('messages')
      .insert([{
        contact_id: contactId,
        content: messageText,
        direction: 'inbound' // Garante que o balãozinho de chat do cliente fique cinza
      }]);

    return NextResponse.json({ success: true, message: "Webhook processado com sucesso!" });

  } catch (error) {
    console.error("❌ Erro no Webhook:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}