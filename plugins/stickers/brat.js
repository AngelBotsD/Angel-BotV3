import axios from "axios";

const API_URL = "https://api-sky.ultraplus.click/brat";
const API_KEY = process.env.API_KEY || "Angxlllll";

let handler = async (m, { text }) => {
  if (!text) return m.reply("✏️ Escribe un texto para usar brat");

  try {
    const r = await axios.post(
      API_URL,
      { text },
      { headers: { apikey: API_KEY } }
    );

    console.log(r.data);

    if (!r.data || !r.data.result)
      return m.reply("❌ La API no devolvió texto");

    await m.reply(r.data.result);

  } catch (e) {
    console.error(e);
    m.reply("❌ Error usando el comando brat");
  }
};

handler.command = /^brat$/i;
handler.help = ["brat <texto>"];
handler.tags = ["texto"];

export default handler;