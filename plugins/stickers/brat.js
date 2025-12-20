import axios from "axios";

let handler = async (m, { args, conn }) => {
  const text = args.join(" ");
  if (!text) return m.reply("✏️ Escribe un texto para generar el brat");

  try {
    // Reacción al recibir el comando
    await conn.sendMessage(m.chat, {
      react: { text: "🕒", key: m.key }
    });

    const r = await axios.post(
      "https://api-sky.ultraplus.click/brat",
      { text },
      {
        headers: {
          apikey: "Angxlllll"
        }
      }
    );

    // Enviar imagen que devuelve la API
    await conn.sendMessage(
      m.chat,
      { image: { url: r.data.url } },
      { quoted: m }
    );

    // Reacción al terminar
    await conn.sendMessage(m.chat, {
      react: { text: "✅", key: m.key }
    });

  } catch (e) {
    console.error(e);
    m.reply("❌ Error al generar el brat");
  }
};

handler.help = ["brat <texto>"];
handler.tags = ["tools"];
handler.command = ["brat"];

export default handler;