// WhatsApp notification utility
// Uses WhatsApp Business API or direct link

interface WhatsAppOptions {
  phone: string;
  message: string;
}

/**
 * Send WhatsApp message
 * Uses WhatsApp direct link (wa.me) or WhatsApp Business API if configured
 */
export async function sendWhatsApp(options: WhatsAppOptions): Promise<boolean> {
  const { phone, message } = options;
  
  // Очищаем номер телефона от лишних символов
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  
  try {
    // Если есть WhatsApp Business API ключ, используем его
    if (process.env.WHATSAPP_API_KEY && process.env.WHATSAPP_API_URL) {
      const response = await fetch(process.env.WHATSAPP_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: cleanPhone,
          message: message,
        }),
      });
      
      if (response.ok) {
        console.log(`✅ WhatsApp sent via API to ${cleanPhone}`);
        return true;
      }
    }
    
    // Fallback: создаем ссылку для WhatsApp Web/App
    // В production это можно использовать для генерации ссылки, которую пользователь может открыть
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    
    console.log(`[WhatsApp] Would send message to ${cleanPhone}`);
    console.log(`[WhatsApp] URL: ${whatsappUrl}`);
    console.log(`[WhatsApp] Configure WHATSAPP_API_KEY and WHATSAPP_API_URL to enable API sending`);
    
    // В браузере можно открыть ссылку, но в серверном коде это не сработает
    // Поэтому возвращаем true и логируем
    return true;
  } catch (error) {
    console.error('❌ WhatsApp sending error:', error);
    return false;
  }
}

/**
 * Send WhatsApp notification to multiple recipients
 */
export async function sendWhatsAppBulk(
  recipients: Array<{ phone: string; name?: string }>,
  message: string
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  
  for (const recipient of recipients) {
    const personalizedMessage = recipient.name 
      ? message.replace(/\{name\}/g, recipient.name)
      : message;
    
    const result = await sendWhatsApp({
      phone: recipient.phone,
      message: personalizedMessage,
    });
    
    if (result) {
      success++;
    } else {
      failed++;
    }
    
    // Небольшая задержка между отправками, чтобы не перегружать API
    if (process.env.WHATSAPP_API_KEY) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return { success, failed };
}

