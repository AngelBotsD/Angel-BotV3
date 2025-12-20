import axios from "axios";

const handler = async (m, { conn, text }) => {
  // Si no hay texto, tomar el del mensaje citado
  if (!text && m.quoted?.text) text = m.quoted.text;
  if (!text) {
    return conn.sendMessage(
      m.chat,
      { text: "Escribe un texto o responde un mensaje para crear el sticker Brat.", ...global.rcanal },
      { quoted: m }
    );
  }

  try {
    // Reacción inicial
    await conn.sendMessage(m.chat, { react: { text: "🕒", key: m.key } });

    // API_KEY directo en el código
    const API_KEY = "Angxlllll";

    // POST a la API Brat
    const r = await axios.post(
      "https://api-sky.ultraplus.click/brat",
      { text: text, size: 512 },
      { headers: { apikey: API_KEY } }
    );

    // Verificar que la API devolvió URL
    if (!r.data?.url) {
      throw new Error("La API no devolvió la URL del sticker");
    }

    // Enviar sticker
    await conn.sendMessage(
      m.chat,
      { sticker: { url: r.data.url }, ...global.rcanal },
      { quoted: m }
    );

    // Reacción final
    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

  } catch (e) {
    console.error(e);
    // Reacción de error
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
    // Mensaje de error seguro
    return conn.sendMessage(
      m.chat,
      { text: `Ocurrió un error al generar el sticker.\n\n💡 Razón: ${e.message}`, ...global.rcanal },
      { quoted: m }
    );
  }
};

handler.help = ["brat <texto>"];
handler.tags = ["stickers"];
handler.command = /^brat$/i;
export default handler;