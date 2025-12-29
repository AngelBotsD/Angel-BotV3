import makeWASocket, {
  useMultiFileAuthState,
  makeCacheableSignalKeyStore
} from "@whiskeysockets/baileys"

import fs from "fs"

const TIEMPO_FANTASMA = 1000 * 60 * 60 * 24 * 3

let data = {
  ultimaActividad: {},
  fantasmas: []
}

if (fs.existsSync("./fantasmasData.json")) {
  data = JSON.parse(fs.readFileSync("./fantasmasData.json", "utf8"))
}

function guardar() {
  fs.writeFileSync("./fantasmasData.json", JSON.stringify(data, null, 2))
}

async function iniciar() {

  const { state, saveCreds } = await useMultiFileAuthState("./auth")

  const sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, fs)
    },
    printQRInTerminal: true
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", ({ connection }) => {
    if (connection === "open") {
      console.log("✔ Conectado a WhatsApp")
    }
  })

  sock.ev.on("chats.upsert", async ({ chats }) => {

    for (let chat of chats) {

      if (!chat.id.endsWith("@g.us")) continue

      console.log("📥 Detectado grupo:", chat.name)

      const meta = await sock.groupMetadata(chat.id)

      for (let p of meta.participants) {
        const jid = p.id

        if (p.isAdmin || jid === sock.user.id) continue

        if (!data.ultimaActividad[jid]) {
          data.ultimaActividad[jid] = 0
        }

        if (!data.fantasmas.includes(jid)) {
          data.fantasmas.push(jid)
        }
      }

      guardar()
    }
  })

  sock.ev.on("messages.upsert", async ({ messages }) => {

    let m = messages[0]
    if (!m?.message) return
    if (m.key.fromMe) return

    const jid = m.key.participant || m.key.remoteJid
    if (!jid) return

    data.ultimaActividad[jid] = Date.now()

    data.fantasmas = data.fantasmas.filter(x => x !== jid)

    guardar()
  })

  sock.ev.on("messages.upsert", async ({ messages }) => {

    let m = messages[0]
    if (!m?.message) return

    const texto = m.message.conversation || ""
    if (!texto.startsWith(".fantasmas")) return

    let lista =
      data.fantasmas.length
        ? data.fantasmas.map(u => "• @" + u.split("@")[0]).join("\n")
        : "Nadie es fantasma 😎"

    await sock.sendMessage(m.key.remoteJid, {
      text: `👻 *LISTA DE FANTASMAS*\n\n${lista}`,
      mentions: data.fantasmas
    })
  })

  setInterval(() => {

    const ahora = Date.now()

    for (let jid in data.ultimaActividad) {

      let ultima = data.ultimaActividad[jid]

      if ((ahora - ultima) >= TIEMPO_FANTASMA) {

        if (!data.fantasmas.includes(jid))
          data.fantasmas.push(jid)
      }
    }

    guardar()

  }, 1000 * 60 * 30)

}

iniciar()

let handler = {}
handler.command = ["fantasmas"]
export default handler