// plugins/ytmp4.js
import fetch from "node-fetch";

/**
 * Comando .ytmp4
 * Descarga un video de YouTube en MP4 usando MayAPI
 */
export async function handler(m, { conn, text }) {
  try {
    // Validar que el usuario haya enviado un link
    if (!text || !text.trim()) {
      return conn.sendMessage(
        m.chat,
        { text: "❌ Por favor, envía un enlace de YouTube.\nEjemplo: .ytmp4 <link>" },
        { quoted: m }
      );
    }

    const apiKey = "may-0595dca2"; // Tu API key
    const videoUrl = text.trim();

    // Llamada a la API
    const apiEndpoint = `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(
      videoUrl
    )}&type=Mp4&apikey=${apiKey}`;

    const response = await fetch(apiEndpoint);
    const data = await response.json();

    if (!data.status) {
      return conn.sendMessage(
        m.chat,
        { text: `❌ Error al obtener el video: ${data.message || "desconocido"}` },
        { quoted: m }
      );
    }

    const { title, quality, url: downloadUrl } = data.result;

    // Mensaje de información del video
    const infoMessage = `📹 *Título:* ${title}\n` +
                        `🎞️ *Calidad:* ${quality}\n` +
                        `🔗 *Descarga:* ${downloadUrl}`;

    await conn.sendMessage(m.chat, { text: infoMessage }, { quoted: m });

    // Opcional: enviar el video directamente (si el tamaño lo permite)
    await conn.sendMessage(
      m.chat,
      { video: { url: downloadUrl }, caption: title },
      { quoted: m }
    );

  } catch (error) {
    console.error(error);
    conn.sendMessage(
      m.chat,
      { text: `❌ Ocurrió un error: ${error.message}` },
      { quoted: m }
    );
  }
}

// Configuración del comando
handler.command = /^ytmp4$/i;
handler.help = ["ytmp4 <link>"];
handler.tags = ["downloader"]; // Limitar por usuario si tu bot usa limit