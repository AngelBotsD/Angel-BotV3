import path from 'path';
import { toAudio } from './converter.js';
import chalk from 'chalk';
import fetch from 'node-fetch';
import PhoneNumber from 'awesome-phonenumber';
import fs from 'fs';
import util from 'util';
import { fileTypeFromBuffer } from 'file-type';
import { format } from 'util';
import { fileURLToPath } from 'url';
import store from './store.js';
import * as Jimp from 'jimp';
import pino from 'pino';
import * as baileys from '@whiskeysockets/baileys';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const {
  makeWASocket: _makeWaSocket, 
  proto,
  downloadContentFromMessage,
  jidDecode,
  areJidsSameUser,
  generateWAMessage,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  WAMessageStubType,
  extractMessageContent,
  makeInMemoryStore,
  getAggregateVotesInPollMessage,
  prepareWAMessageMedia,
  WA_DEFAULT_EPHEMERAL
} = baileys;

export function makeWASocket(connectionOptions, options = {}) {
    let conn = _makeWaSocket(connectionOptions);

    let sock = Object.defineProperties(conn, {
        chats: {
            value: { ...(options.chats || {}) },
            writable: true
        },
        decodeJid: {
    value(jid) {
        if (!jid || typeof jid !== 'string') return (!nullish(jid) && jid) || null;
        return jid.decodeJid();
    },
    writable: true,
    configurable: true,
    enumerable: true
},

normalizeJid: {
    value(jid) {
        if (!jid) return jid;
        jid = conn.decodeJid(jid);
        return jid && jid.endsWith('@s.whatsapp.net') ? jid : jid;
    },
    writable: true,
    configurable: true,
    enumerable: true
},
        logger: {
            get() {
                return {
                    info(...args) {
                        console.log(
                            chalk.bold.bgRgb(51, 204, 51)('INFO '),
                            `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                            chalk.cyan(format(...args))
                        );
                    },
                    error(...args) {
                        console.log(
                            chalk.bold.bgRgb(247, 38, 33)('ERROR '),
                            `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                            chalk.rgb(255, 38, 0)(format(...args))
                        );
                    },
                    warn(...args) {
                        console.log(
                            chalk.bold.bgRgb(255, 153, 0)('WARNING '),
                            `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                            chalk.redBright(format(...args))
                        );
                    },
                    trace(...args) {
                        console.log(
                            chalk.grey('TRACE '),
                            `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                            chalk.white(format(...args))
                        );
                    },
                    debug(...args) {
                        console.log(
                            chalk.bold.bgRgb(66, 167, 245)('DEBUG '),
                            `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                            chalk.white(format(...args))
                        );
                    }
                };
            },
            enumerable: true
        },
        sendSylph: {
            async value(jid, text = '', buffer, title, body, url, quoted, options) {
                jid = conn.normalizeJid(jid);
                if (buffer) try {
                    let type = await conn.getFile(buffer);
                    buffer = type.data;
                } catch {
                    buffer = buffer;
                }
                const mentionedJid = await conn.parseMention(text);
                const normalizedMentions = mentionedJid.map(jid => conn.normalizeJid(jid));
                let prep = generateWAMessageFromContent(conn.normalizeJid(jid), {
                    extendedTextMessage: {
                        text: text,
                        contextInfo: {
                            externalAdReply: {
                                title: title,
                                body: body,
                                thumbnail: buffer,
                                sourceUrl: url
                            },
                            mentionedJid: normalizedMentions
                        }
                    }
                }, { quoted: quoted });
                return conn.relayMessage(conn.normalizeJid(jid), prep.message, { messageId: prep.key.id });
            }
        },
        sendSylphy: {
            async value(jid, medias, options = {}) {
                jid = conn.normalizeJid(jid);
                if (typeof jid !== "string") {
                    throw new TypeError(`jid must be string, received: ${jid} (${jid?.constructor?.name})`);
                }
                if (!Array.isArray(medias)) {
                    throw new TypeError(`medias must be array, received: ${medias} (${medias?.constructor?.name})`);
                }
                for (const media of medias) {
                    if (!media || typeof media !== 'object') {
                        throw new TypeError(`media must be object, received: ${media} (${media?.constructor?.name})`);
                    }
                    if (!media.type || (media.type !== "image" && media.type !== "video")) {
                        throw new TypeError(`media.type must be "image" or "video", received: ${media.type} (${media.type?.constructor?.name})`);
                    }
                    if (!media.data || (!media.data.url && !Buffer.isBuffer(media.data))) {
                        throw new TypeError(`media.data must be object with url or buffer, received: ${media.data} (${media.data?.constructor?.name})`);
                    }
                }
                if (medias.length < 2) {
                    throw new RangeError("Minimum 2 media");
                }
                const delay = !isNaN(options.delay) ? options.delay : 500;
                delete options.delay;
                const album = baileys.generateWAMessageFromContent(
                    jid,
                    {
                        messageContextInfo: {},
                        albumMessage: {
                            expectedImageCount: medias.filter(media => media.type === "image").length,
                            expectedVideoCount: medias.filter(media => media.type === "video").length,
                            ...(options.quoted ? {
                                contextInfo: {
                                    remoteJid: conn.normalizeJid(options.quoted.key.remoteJid),
                                    fromMe: options.quoted.key.fromMe,
                                    stanzaId: options.quoted.key.id,
                                    participant: conn.normalizeJid(options.quoted.key.participant || options.quoted.key.remoteJid),
                                    quotedMessage: options.quoted.message,
                                },
                            } : {}),
                        },
                    },
                    {}
                );
                await conn.relayMessage(album.key.remoteJid, album.message, { messageId: album.key.id });
                for (let i = 0; i < medias.length; i++) {
                    const { type, data, caption } = medias[i];
                    const message = await baileys.generateWAMessage(
                        album.key.remoteJid,
                        { [type]: data, caption: caption || "" },
                        { upload: conn.waUploadToServer }
                    );
                    message.message.messageContextInfo = {
                        messageAssociation: { associationType: 1, parentMessageKey: album.key },
                    };
                    await conn.relayMessage(message.key.remoteJid, message.message, { messageId: message.key.id });
                    await baileys.delay(delay);
                }
                return album;
            }
        },
        sendListB: {
            async value(jid, title, text, buttonText, buffer, listSections, quoted, options = {}) {
                jid = conn.normalizeJid(jid);
                let img, video;

                if (buffer) {
                    if (/^https?:\/\//i.test(buffer)) {
                        try {
                            const response = await fetch(buffer);
                            const contentType = response.headers.get('content-type');
                            if (/^image\//i.test(contentType)) {
                                img = await prepareWAMessageMedia({ image: { url: buffer } }, { upload: conn.waUploadToServer });
                            } else if (/^video\//i.test(contentType)) {
                                video = await prepareWAMessageMedia({ video: { url: buffer } }, { upload: conn.waUploadToServer });
                            } else {
                                console.error("Tipo MIME no compatible:", contentType);
                            }
                        } catch (error) {
                            console.error("Error al obtener el tipo MIME:", error);
                        }
                    } else {
                        try {
                            const type = await conn.getFile(buffer);
                            if (/^image\//i.test(type.mime)) {
                                img = await prepareWAMessageMedia({ image: { url: buffer } }, { upload: conn.waUploadToServer });
                            } else if (/^video\//i.test(type.mime)) {
                                video = await prepareWAMessageMedia({ video: { url: buffer } }, { upload: conn.waUploadToServer });
                            }
                        } catch (error) {
                            console.error("Error al obtener el tipo de archivo:", error);
                        }
                    }
                }

                const sections = [...listSections];

                const message = {
                    interactiveMessage: {
                        header: {
                            title: title,
                            hasMediaAttachment: false,
                            imageMessage: img ? img.imageMessage : null,
                            videoMessage: video ? video.videoMessage : null
                        },
                        body: { text: text },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: 'single_select',
                                    buttonParamsJson: JSON.stringify({
                                        title: buttonText,
                                        sections
                                    })
                                }
                            ],
                            messageParamsJson: ''
                        }
                    }
                };

                let msgL = generateWAMessageFromContent(jid, {
                    viewOnceMessage: {
                        message
                    }
                }, { userJid: conn.user.jid, quoted });

                conn.relayMessage(jid, msgL.message, { messageId: msgL.key.id, ...options });
            }
        },
        sendBot: {
            async value(jid, text = '', buffer, title, body, url, quoted, options) {
                jid = conn.normalizeJid(jid);
                if (buffer) try {
                    let type = await conn.getFile(buffer);
                    buffer = type.data;
                } catch {
                    buffer = buffer;
                }
                const mentionedJid = await conn.parseMention(text);
                const normalizedMentions = mentionedJid.map(jid => conn.normalizeJid(jid));
                let prep = generateWAMessageFromContent(jid, {
                    extendedTextMessage: {
                        text: text,
                        contextInfo: {
                            externalAdReply: {
                                title: title,
                                body: body,
                                thumbnail: buffer,
                                sourceUrl: url
                            },
                            mentionedJid: normalizedMentions
                        }
                    }
                }, { quoted: quoted });
                return conn.relayMessage(jid, prep.message, { messageId: prep.key.id });
            }
        },
        sendPayment: {
            async value(jid, amount, text, quoted, options) {
                jid = conn.normalizeJid(jid);
                const mentionedJid = await conn.parseMention(text);
                const normalizedMentions = mentionedJid.map(jid => conn.normalizeJid(jid));
                conn.relayMessage(jid, {
                    requestPaymentMessage: {
                        currencyCodeIso4217: 'PEN',
                        amount1000: amount,
                        requestFrom: null,
                        noteMessage: {
                            extendedTextMessage: {
                                text: text,
                                contextInfo: {
                                    externalAdReply: {
                                        showAdAttribution: true
                                    },
                                    mentionedJid: normalizedMentions
                                }
                            }
                        }
                    }
                }, {});
            }
        },
        getFile: {
            async value(PATH, saveToFile = false) {
                let res, filename;
                const data = Buffer.isBuffer(PATH) ? PATH : PATH instanceof ArrayBuffer ? Buffer.from(PATH) : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await fetch(PATH)).buffer() : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0);
                if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer');
                const type = await fileTypeFromBuffer(data) || {
                    mime: 'application/octet-stream',
                    ext: '.bin'
                };
                if (data && saveToFile && !filename) (filename = path.join(__dirname, '../tmp/' + new Date * 1 + '.' + type.ext), await fs.promises.writeFile(filename, data));
                return {
                    res,
                    filename,
                    ...type,
                    data,
                    deleteFile() {
                        return filename && fs.promises.unlink(filename);
                    }
                };
            },
            enumerable: true
        },
        waitEvent: {
            value(eventName, is = () => true, maxTries = 25) {
                return new Promise((resolve, reject) => {
                    let tries = 0;
                    let on = (...args) => {
                        if (++tries > maxTries) reject('Max tries reached');
                        else if (is()) {
                            conn.ev.off(eventName, on);
                            resolve(...args);
                        }
                    };
                    conn.ev.on(eventName, on);
                });
            }
        },
        sendContact: {
            async value(jid, data, quoted, options) {
                jid = conn.normalizeJid(jid);
                if (!Array.isArray(data)) data = [data];
                if (!Array.isArray(data[0]) && typeof data[0] === 'string') data = [data];
                let contacts = [];
                for (let [number, name] of data) {
                    number = number.replace(/[^0-9]/g, '');
                    let njid = number + '@s.whatsapp.net';
                    let biz = await conn.getBusinessProfile(njid).catch(_ => null) || {};
                    let vcard = `
BEGIN:VCARD
VERSION:3.0
N:;${name.replace(/\n/g, '\\n')};;;
FN:${name.replace(/\n/g, '\\n')}
TEL;type=CELL;type=VOICE;waid=${number}:${PhoneNumber('+' + number).getNumber('international')}${biz.description ? `
X-WA-BIZ-NAME:${(conn.chats[njid]?.vname || conn.getName(njid) || name).replace(/\n/, '\\n')}
X-WA-BIZ-DESCRIPTION:${biz.description.replace(/\n/g, '\\n')}
`.trim() : ''}
END:VCARD
        `.trim();
                    contacts.push({ vcard, displayName: name });
                }
                return await conn.sendMessage(jid, {
                    ...options,
                    contacts: {
                        ...options,
                        displayName: (contacts.length >= 2 ? `${contacts.length} kontak` : contacts[0].displayName) || null,
                        contacts,
                    }
                }, { quoted, ...options });
            },
            enumerable: true
        },
        resize: {
            value(buffer, ukur1, ukur2) {
                return new Promise(async (resolve, reject) => {
                    try {
                        var baper = await Jimp.read(buffer);
                        var ab = await baper.resize(ukur1, ukur2).getBufferAsync(Jimp.MIME_JPEG);
                        resolve(ab);
                    } catch (error) {
                        reject(error);
                    }
                });
            }
        },
        relayWAMessage: {
            async value(pesanfull) {
                const remoteJid = conn.normalizeJid(pesanfull.key.remoteJid);
                if (pesanfull.message.audioMessage) {
                    await conn.sendPresenceUpdate('recording', remoteJid);
                } else {
                    await conn.sendPresenceUpdate('composing', remoteJid);
                }
                var mekirim = await conn.relayMessage(remoteJid, pesanfull.message, { messageId: pesanfull.key.id });
                conn.ev.emit('messages.upsert', { messages: [pesanfull], type: 'append' });
                return mekirim;
            }
        },
        sendListM: {
            async value(jid, button, rows, quoted, options = {}) {
                jid = conn.normalizeJid(jid);
                let fsizedoc = '1'.repeat(10);
                const sections = [
                    {
                        title: button.title,
                        rows: [...rows]
                    }
                ];
                const mentionedJid = await conn.parseMention(button.description);
                const normalizedMentions = mentionedJid.map(jid => conn.normalizeJid(jid));
                const listMessage = {
                    text: button.description,
                    footer: button.footerText,
                    mentions: normalizedMentions,
                    ephemeralExpiration: '86400',
                    title: '',
                    buttonText: button.buttonText,
                    sections
                };
                conn.sendMessage(jid, listMessage, {
                    quoted,
                    ephemeralExpiration: fsizedoc,
                    contextInfo: {
                        forwardingScore: fsizedoc,
                        isForwarded: true,
                        mentions: normalizedMentions,
                        ...options
                    }
                });
            }
        },
        sendList: {
            async value(jid, title, text, footer, buttonText, buffer, listSections, quoted, options) {
                jid = conn.normalizeJid(jid);
                if (buffer) try {
                    let type = await conn.getFile(buffer);
                    b