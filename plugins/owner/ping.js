import speed from "performance-now";
import { exec } from "child_process";

let handler = async (m, { conn }) => {
  let timestamp = speed();

  exec(`neofetch --stdout`, (error, stdout, stderr) => {
    let latensi = speed() - timestamp;
    let child = stdout.toString("utf-8");
    let ssd = child.replace(/Memory:/, "Ram:");

    conn.sendMessage(m.chat, {
      text:`${ssd}\n乂 *Speed* : ${latensi.toFixed(4)} _ms_`,
    }, { quoted: m });
  });
};

handler.command = ["ping", "p"];

export default handler;