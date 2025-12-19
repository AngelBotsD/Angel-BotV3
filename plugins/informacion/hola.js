let handler = async (m, { conn, usedPrefix: _p }) => {
  try {
    const sections = [
      {
        title: "Opciones disponibles",
        rows: [
          { title: "📋 Menú", description: "Ver todo el menú", rowId: `${_p}menu` },
          { title: "📊 Estado", description: "Ver tu estado", rowId: `${_p}estado` },
          { title: "👑 Creador", description: "Información del creador", rowId: `${_p}owner` }
        ]
      }
    ];

    await conn.sendMessage(
      m.chat,
      {
        text: "👋 Hola! Selecciona una opción:",
        footer: "Angel Bot",
        title: "MENÚ INTERACTIVO",
        buttonText: "Abrir opciones",
        sections: sections
      },
      { quoted: m }
    );

  } catch (e) {
    console.error(e);
    await conn.sendMessage(m.chat, "❎ Ocurrió un error al mostrar el menú.", {}, { quoted: m });
  }
};

handler.command = /^hola$/i;
handler.tags = ['main'];
handler.help = ['hola'];
export default handler;