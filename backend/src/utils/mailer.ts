import tls from "node:tls";

export interface MailOptions {
    to: string;
    subject: string;
    html?: string;
    text?: string;
}

/**
 * Petit client SMTP sans dépendance externe (TLS implicite, port 465).
 * Suffisant pour l'envoi transactionnel (mot de passe oublié) via cPanel CMIDigit.
 */
export async function sendMail(opts: MailOptions): Promise<void> {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 465);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || user;

    if (!host || !user || !pass) {
        throw new Error("SMTP non configuré (SMTP_HOST / SMTP_USER / SMTP_PASS manquants)");
    }

    return new Promise<void>((resolve, reject) => {
        const socket = tls.connect({ host, port, servername: host });
        socket.setEncoding("utf8");
        socket.setTimeout(20000);

        let buffer = "";
        const pending: Array<{ code: number; res: (v: string) => void; rej: (e: Error) => void }> = [];

        const processBuffer = () => {
            // Une réponse SMTP = (0..n lignes "NNN-...") + une ligne finale "NNN ..."
            let match: RegExpMatchArray | null;
            while ((match = buffer.match(/^(?:\d{3}-[^\r\n]*\r?\n)*\d{3} [^\r\n]*\r?\n/))) {
                const resp = match[0];
                buffer = buffer.slice(resp.length);
                const code = parseInt(resp.slice(0, 3), 10);
                const p = pending.shift();
                if (!p) continue;
                if (code === p.code) p.res(resp);
                else p.rej(new Error(`SMTP a répondu « ${resp.trim()} » (attendu ${p.code})`));
            }
        };

        const waitFor = (code: number) =>
            new Promise<string>((res, rej) => {
                pending.push({ code, res, rej });
                processBuffer();
            });

        socket.on("data", (chunk: string) => {
            buffer += chunk;
            processBuffer();
        });
        socket.on("error", reject);
        socket.on("timeout", () => {
            socket.destroy();
            reject(new Error("SMTP timeout"));
        });

        const send = (cmd: string) => socket.write(cmd + "\r\n");
        const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");

        (async () => {
            try {
                await waitFor(220);
                send(`EHLO ${host}`);
                await waitFor(250);
                send("AUTH LOGIN");
                await waitFor(334);
                send(b64(user));
                await waitFor(334);
                send(b64(pass));
                await waitFor(235);
                send(`MAIL FROM:<${user}>`);
                await waitFor(250);
                send(`RCPT TO:<${opts.to}>`);
                await waitFor(250);
                send("DATA");
                await waitFor(354);

                const isHtml = !!opts.html;
                const headers = [
                    `From: ${from}`,
                    `To: ${opts.to}`,
                    `Subject: ${opts.subject}`,
                    "MIME-Version: 1.0",
                    `Content-Type: ${isHtml ? "text/html" : "text/plain"}; charset=utf-8`,
                ].join("\r\n");

                // Dot-stuffing : une ligne commençant par "." doit être doublée
                const rawBody = (opts.html || opts.text || "").replace(/\r?\n/g, "\r\n");
                const body = rawBody
                    .split("\r\n")
                    .map((line) => (line.startsWith(".") ? "." + line : line))
                    .join("\r\n");

                send(`${headers}\r\n\r\n${body}\r\n.`);
                await waitFor(250);
                send("QUIT");
                socket.end();
                resolve();
            } catch (err) {
                socket.destroy();
                reject(err as Error);
            }
        })();
    });
}
