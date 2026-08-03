declare const __WIDGET_VERSION__: string
/**
 * <godelmann-chatbot> — oeffentliches KI-Chat-Widget fuer godelmann.de.
 *
 * Web Component nach WHATWG-Standard (Custom Elements + Shadow DOM), ohne
 * Framework-Dependency. Spricht mit dem godelmann-chatbot-server (SPASS,
 * spass/examples/godelmann-chatbot-server): `POST {api-base}/api/chat`
 * (SSE-Stream im OpenAI-Delta-Format) + `GET {api-base}/altcha/challenge`
 * (self-hosted ALTCHA Proof-of-Work, spass-captcha).
 *
 * Spezifikation: docs/ANFORDERUNGEN.md · Integration: docs/EINBINDUNG.md
 */

const TAG_NAME = 'godelmann-chatbot';
const LS_CONVERSATION_KEY = 'gdm-chat-conversation-id';

/**
 * Sitzungs-Gedaechtnis des Chats (sessionStorage, gilt pro Tab).
 *
 * godelmann.de laedt bei JEDEM Seitenwechsel komplett neu — ohne dieses
 * Gedaechtnis faengt ein Beratungsgespraech auf jeder Unterseite wieder bei
 * der Begruessung an. Gesichert wird alles, was den Gespraechszustand
 * ausmacht: offen/zu, Verlauf, Stand der Zielgruppen-Weiche, PLZ-Erwartung
 * und die angefangene Eingabe — letztere nach JEDEM getippten Zeichen.
 *
 * Bewusst sessionStorage statt localStorage: endet mit dem Tab, damit kein
 * Gespraech tagelang im Browser liegen bleibt.
 */
const SS_SESSION_KEY = 'gdm-chat-session';

/** Serialisierte Nachricht im Sitzungs-Gedaechtnis: Untermenge von
 *  MessageEntry ohne DOM-Referenz. Die QS-Felder sind optional — Sitzungen
 *  vor v0.0.10 kennen sie nicht und muessen trotzdem laden. */
interface StoredMessage {
  role: 'user' | 'assistant' | 'error';
  text: string;
  isGreeting?: boolean;
  retryText?: string;
  qsId?: string;
  ts?: number;
  latencyMs?: number;
  art?: string;
  rating?: 1 | -1;
  comment?: string;
}

interface StoredSession {
  open: boolean;
  messages: StoredMessage[];
  stage: 'greeting' | 'endkunde' | 'fachkunde';
  awaitingPlz: boolean;
  /** Slot-Filling: wurde die einmalige Zielgruppen-Nachfrage schon gestellt? */
  zielgruppeGefragt?: boolean;
  /** QS-Sitzungs-ID fuer /api/qs/* — bleibt ueber Seitenwechsel stabil. */
  sitzungId?: string;
  draft: string;
  /** Cursor-/Auswahlposition — sonst springt der Cursor ans Ende. */
  cursor?: { start: number; end: number };
  /** Lag der Schreibfokus im Eingabefeld? Nur dann wird er zurueckgeholt. */
  focused?: boolean;
}
const REQUEST_TIMEOUT_MS = 120_000;
const MAX_MESSAGE_CHARS = 2000;
const PRIVACY_URL = 'https://www.godelmann.de/de/datenschutz';

/** Origin der Script-URL — Default fuer `api-base` (Widget + API vom selben Host). */
const SCRIPT_ORIGIN: string = (() => {
  try {
    const origin = new URL(import.meta.url).origin;
    if (origin && origin !== 'null') return origin;
  } catch {
    /* import.meta.url nicht verfuegbar (z. B. inline) */
  }
  return window.location.origin;
})();

// ---------------------------------------------------------------------------
// Texte (deutsch-first; en-Fallback fuer lang="en")
// ---------------------------------------------------------------------------

interface Texts {
  bubbleOpen: string;
  bubbleClose: string;
  headerTitle: string;
  greeting: string;
  inputPlaceholder: string;
  send: string;
  newConversation: string;
  privacy: string;
  privacyLink: string;
  close: string;
  expand: string;
  collapse: string;
  errRateLimit: string;
  errCaptcha: string;
  errNetwork: string;
  errTimeout: string;
  errInvalidMessage: string;
  errGeneric: string;
  retry: string;
  /** QS-Feedback-Leiste an Assistent-Antworten */
  fbUp: string;
  fbDown: string;
  fbComment: string;
  fbCancel: string;
  fbYourComment: string;
}

const TEXTS: Record<'de' | 'en', Texts> = {
  de: {
    bubbleOpen: 'Godelmann-Assistent oeffnen',
    bubbleClose: 'Godelmann-Assistent schliessen',
    headerTitle: 'Godelmann-Assistent',
    greeting:
      'Willkommen bei GODELMANN. Ich berate Sie rund um unsere Produkte, ' +
      'Flächen und Ideen für Garten, Haus und Objekt. Damit ich Sie gezielt ' +
      'beraten kann: Sind Sie Fachkunde oder Endkunde? Wählen Sie einfach ' +
      'unten aus — oder schreiben Sie mir direkt Ihre Frage.',
    inputPlaceholder: 'Ihre Frage …',
    send: 'Senden',
    newConversation: 'Neue Unterhaltung',
    privacy: 'Anonymer Chat — bitte keine personenbezogenen Daten eingeben.',
    privacyLink: 'Datenschutz',
    close: 'Chat schliessen',
    expand: 'Als eigene Seite oeffnen',
    collapse: 'Verkleinern',
    errRateLimit:
      'Gerade sind zu viele Anfragen eingegangen. Bitte versuchen Sie es in ' +
      'ein paar Minuten erneut (maximal 10 Nachrichten in 10 Minuten).',
    errCaptcha:
      'Die Sicherheitspruefung ist fehlgeschlagen. Bitte senden Sie Ihre ' +
      'Nachricht noch einmal.',
    errNetwork: 'Verbindung fehlgeschlagen. Bitte pruefen Sie Ihre Internetverbindung.',
    errTimeout: 'Die Antwort hat zu lange gedauert. Bitte versuchen Sie es erneut.',
    errInvalidMessage: 'Die Nachricht ist leer oder zu lang (maximal 2000 Zeichen).',
    errGeneric: 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
    retry: 'Erneut versuchen',
    fbUp: 'Antwort war hilfreich',
    fbDown: 'Antwort war nicht hilfreich',
    fbComment: 'Kommentar zu dieser Antwort',
    fbCancel: 'Abbrechen',
    fbYourComment: 'Ihr Kommentar',
  },
  en: {
    bubbleOpen: 'Open Godelmann assistant',
    bubbleClose: 'Close Godelmann assistant',
    headerTitle: 'Godelmann Assistant',
    greeting:
      'Welcome to GODELMANN. I can advise you on our products, surfaces and ' +
      'ideas for garden, home and commercial projects. To give you targeted ' +
      'advice: are you a trade professional or a private customer? Simply ' +
      'choose below — or type your question right away.',
    inputPlaceholder: 'Your question …',
    send: 'Send',
    newConversation: 'New conversation',
    privacy: 'Anonymous chat — please do not enter personal data.',
    privacyLink: 'Privacy policy',
    close: 'Close chat',
    expand: 'Open as full page',
    collapse: 'Collapse',
    errRateLimit:
      'Too many requests right now. Please try again in a few minutes ' +
      '(at most 10 messages per 10 minutes).',
    errCaptcha: 'The security check failed. Please send your message again.',
    errNetwork: 'Connection failed. Please check your internet connection.',
    errTimeout: 'The answer took too long. Please try again.',
    errInvalidMessage: 'The message is empty or too long (2000 characters max).',
    errGeneric: 'Something went wrong. Please try again.',
    retry: 'Retry',
    fbUp: 'Answer was helpful',
    fbDown: 'Answer was not helpful',
    fbComment: 'Comment on this answer',
    fbCancel: 'Cancel',
    fbYourComment: 'Your comment',
  },
};

// ---------------------------------------------------------------------------
// Guided Selling / Zielgruppen-Weiche (Ablaufplan Heike, 20.07.)
// docs/ABLAUFPLAN-HEIKE-2026-07-20.md. Die Button-Menues laufen IM Widget vor
// dem KI-Modell; die meisten Aktionen stellen eine geerdete Frage an den Bot
// (echte godelmann.de-Quellen aus der Wissensbasis, keine hartkodierten Links).
// ---------------------------------------------------------------------------

type Branch = 'endkunde' | 'fachkunde';
// linkKey -> wenn in /api/webchat-config eine URL hinterlegt ist, oeffnet der
// Button diese (administrierbar); sonst Fallback auf die geerdete Frage `ask`.
// `frage` = die ausformulierte Ich-/W-Frage, die beim Klick als Nutzer-Echo im
// Verlauf erscheint (das Label bleibt der kurze Chip-Text).
interface QuickAction { label: string; frage: string; ask?: string; special?: 'plz'; linkKey?: string }

const BRANCH_INTRO: Record<'de' | 'en', Record<Branch, string>> = {
  de: {
    endkunde:
      'Schön, dass Sie da sind. Ich zeige Ihnen gerne unsere Produkte für ' +
      'Garten, Terrasse und Einfahrt, Inspirationen und Gestaltungsideen, das ' +
      'aktuelle Gartenbuch, unsere Neuheiten oder einen Ideengarten in Ihrer ' +
      'Nähe — und helfe Ihnen beim Produktvergleich, bei der Händlersuche ' +
      'oder mit dem Kontakt zur Service-Hotline. Wählen Sie unten ein Thema — ' +
      'oder schreiben Sie mir einfach Ihre Frage.',
    fachkunde:
      'Willkommen im Fachkundenbereich. Ich unterstütze Sie gerne bei ' +
      'Produkten und Themen zur Objektplanung, in der Mediathek mit ' +
      'Ausschreibungstexten, Datenblättern und BIM/CAD-Daten, mit ' +
      'Referenzprojekten, beim Produktvergleich oder bei der Suche nach Ihrem ' +
      'Ansprechpartner vor Ort. Wählen Sie unten ein Thema — oder schreiben ' +
      'Sie mir einfach Ihre Frage.',
  },
  en: {
    endkunde:
      'Great to have you here. I am happy to show you our products for ' +
      'garden, terrace and driveway, inspiration and design ideas, the ' +
      'current garden book, our latest products or an idea garden near you — ' +
      'and to help you find a dealer or reach our service hotline. Pick a ' +
      'topic below — or simply type your question.',
    fachkunde:
      'Welcome to the trade area. I can support you with products and topics ' +
      'for object planning, the media library with tender texts, datasheets ' +
      'and BIM/CAD data, reference projects or finding your local contact ' +
      'person. Pick a topic below — or simply type your question.',
  },
};

const BRANCH_ACTIONS: Record<'de' | 'en', Record<Branch, QuickAction[]>> = {
  de: {
    endkunde: [
      {
        label: 'Produkte entdecken',
        frage: 'Welche Produkte gibt es?',
        ask: 'Welche Produkte bietet Godelmann fuer Garten, Terrasse und Einfahrt?',
      },
      {
        label: 'Inspirationen fuer Garten & Terrasse',
        frage: 'Wo finde ich Inspirationen für Garten und Terrasse?',
        linkKey: 'inspirationen',
        ask: 'Zeigen Sie mir Inspirationen und Gestaltungsideen fuer Garten und Terrasse von Godelmann.',
      },
      {
        label: 'Gartenbuch',
        frage: 'Wo finde ich das aktuelle Gartenbuch?',
        linkKey: 'gartenbuch',
        ask: 'Wo finde ich das aktuelle Godelmann-Gartenbuch zum Herunterladen?',
      },
      {
        label: 'Neuheiten',
        frage: 'Was gibt es Neues bei GODELMANN?',
        linkKey: 'neuheiten',
        ask: 'Was sind die aktuellen Neuheiten von Godelmann?',
      },
      {
        label: 'Ideengarten besuchen',
        frage: 'Wo kann ich einen Ideengarten besuchen?',
        linkKey: 'ideengarten',
        ask: 'Wo gibt es einen Godelmann-Ideengarten, den ich besuchen kann?',
      },
      {
        label: 'Produkte vergleichen',
        frage: 'Können Sie zwei Produkte für mich vergleichen?',
        ask: 'Vergleichen Sie zwei passende Godelmann-Produkte uebersichtlich als Tabelle (Material, Format, Oberflaeche/Farbe, Einsatzbereich, Eigenschaften).',
      },
      {
        label: 'Haendlersuche',
        frage: 'Wie finde ich einen Händler in meiner Nähe?',
        linkKey: 'haendlersuche',
        ask: 'Wie finde ich einen Godelmann-Haendler in meiner Naehe?',
      },
      {
        label: 'Service-Hotline',
        frage: 'Wie erreiche ich die Service-Hotline?',
        ask: 'Wie erreiche ich die GODELMANN-Beratung bzw. Service-Hotline?',
      },
    ],
    fachkunde: [
      {
        label: 'Produkte',
        frage: 'Welche Produkte gibt es für die Objektplanung?',
        ask: 'Welche Produkte bietet Godelmann fuer die Objektplanung?',
      },
      {
        label: 'Themen zur Objektplanung',
        frage: 'Welche Themen und Lösungen gibt es zur Objektplanung?',
        linkKey: 'objektplanung',
        ask: 'Welche Themen und Loesungen bietet Godelmann fuer die Objektplanung?',
      },
      {
        label: 'Mediathek (Downloads, Ausschreibung, BIM/CAD)',
        frage: 'Wo finde ich Ausschreibungstexte, Datenblätter und BIM/CAD-Daten?',
        linkKey: 'mediathek',
        ask: 'Was finde ich in der Godelmann-Mediathek — Ausschreibungstexte, Datenblaetter, BIM- und CAD-Daten?',
      },
      {
        label: 'Referenzen',
        frage: 'Welche Referenzprojekte gibt es?',
        linkKey: 'referenzen',
        ask: 'Zeigen Sie mir Godelmann-Referenzprojekte, z. B. fuer oeffentliche Plaetze.',
      },
      {
        label: 'Produkte vergleichen',
        frage: 'Können Sie zwei Produkte für mich vergleichen?',
        ask: 'Vergleichen Sie zwei passende Godelmann-Produkte uebersichtlich als Tabelle (Material, Format, Oberflaeche/Farbe, Einsatzbereich, Eigenschaften).',
      },
      {
        label: 'Ansprechpartner finden',
        frage: 'Wer ist mein Ansprechpartner vor Ort?',
        special: 'plz',
      },
    ],
  },
  en: {
    endkunde: [
      {
        label: 'Discover products',
        frage: 'Which products are available?',
        ask: 'Which Godelmann products are available for garden, terrace and driveway?',
      },
      {
        label: 'Inspiration for garden & terrace',
        frage: 'Where can I find inspiration for garden and terrace?',
        ask: 'Show me inspiration and design ideas for garden and terrace by Godelmann.',
      },
      {
        label: 'Garden book',
        frage: 'Where can I find the current garden book?',
        ask: 'Where can I download the current Godelmann garden book?',
      },
      {
        label: 'New products',
        frage: 'What is new at GODELMANN?',
        ask: 'What are the latest Godelmann product news?',
      },
      {
        label: 'Visit an idea garden',
        frage: 'Where can I visit an idea garden?',
        ask: 'Where can I visit a Godelmann idea garden?',
      },
      {
        label: 'Find a dealer',
        frage: 'How do I find a dealer near me?',
        ask: 'How do I find a Godelmann dealer near me?',
      },
      {
        label: 'Service hotline',
        frage: 'How do I reach the service hotline?',
        ask: 'How do I reach the GODELMANN advisory / service hotline?',
      },
    ],
    fachkunde: [
      {
        label: 'Products',
        frage: 'Which products are available for object planning?',
        ask: 'Which Godelmann products are relevant for object planning?',
      },
      {
        label: 'Object planning topics',
        frage: 'Which topics and solutions are available for object planning?',
        ask: 'Which topics and solutions does Godelmann offer for object planning?',
      },
      {
        label: 'Media library (downloads, tender texts, BIM/CAD)',
        frage: 'Where do I find tender texts, datasheets and BIM/CAD data?',
        ask: 'What is in the Godelmann media library — tender texts, datasheets, BIM and CAD data?',
      },
      {
        label: 'References',
        frage: 'Which reference projects are there?',
        ask: 'Show me Godelmann reference projects, e.g. for public spaces.',
      },
      {
        label: 'Find a contact person',
        frage: 'Who is my local contact person?',
        special: 'plz',
      },
    ],
  },
};

const WEICHE_LABELS: Record<'de' | 'en', { fach: string; end: string }> = {
  de: { fach: 'Fachkunde', end: 'Endkunde' },
  en: { fach: 'Trade professional', end: 'Private customer' },
};

/** Nutzer-Echo beim Klick auf die Zielgruppen-Weiche (wie eine getippte Antwort). */
const BIN_LABELS: Record<'de' | 'en', Record<Branch, string>> = {
  de: { fachkunde: 'Ich bin Fachkunde', endkunde: 'Ich bin Endkunde' },
  en: { fachkunde: 'I am a trade professional', endkunde: 'I am a private customer' },
};

const PLZ_PROMPT: Record<'de' | 'en', string> = {
  de: 'Bitte geben Sie Ihre Postleitzahl ein, dann nenne ich Ihnen Ihren zustaendigen Ansprechpartner.',
  en: 'Please enter your postal code and I will name your responsible contact person.',
};

/** Slot-Filling: einmalige Nachfrage, wenn die Zielgruppe nach der ersten
 *  Freitext-Antwort noch unklar ist (stage bleibt 'greeting'). */
const ZIELGRUPPEN_NACHFRAGE: Record<'de' | 'en', string> = {
  de:
    'Übrigens: Damit ich Sie noch gezielter beraten kann — sind Sie Fachkunde ' +
    '(etwa Architektur, Planung oder GaLaBau) oder Endkunde? Wählen Sie unten ' +
    'aus oder fragen Sie einfach weiter.',
  en:
    'By the way: to give you even more targeted advice — are you a trade ' +
    'professional (e.g. architecture, planning or landscaping) or a private ' +
    'customer? Choose below or simply keep asking.',
};

// Heikes Stichwortlisten fuer die automatische Zielgruppen-Erkennung bei Freitext.
const FACHKUNDE_KW = ['ausschreibung', 'lv ', 'bim', 'cad', 'dwg', 'architekt', 'planer', 'objekt', 'projekt', 'ingenieur', 'datenblatt', 'fachkunde', 'gewerblich', 'ausschreibungstext'];
const ENDKUNDE_KW = ['terrasse', 'garten', 'einfahrt', 'gestaltung', 'ideen', 'hausbau', 'aussenanlage', 'aussenbereich', 'privat', 'endkunde', 'haus '];

function classifyBranch(text: string): Branch | null {
  const t = ` ${text.toLowerCase()} `;
  if (FACHKUNDE_KW.some((k) => t.includes(k))) return 'fachkunde';
  if (ENDKUNDE_KW.some((k) => t.includes(k))) return 'endkunde';
  return null;
}

// ---------------------------------------------------------------------------
// Markdown-Mini-Renderer (sanitized): erst HTML-escapen, dann **fett**,
// [Text](https://…)-Links (nur http/https), Listen und Absaetze.
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });
}

/** Inline-Markdown auf bereits HTML-escaptem Text. */
function renderInline(escaped: string): string {
  // Bilder ![alt](url) ZUERST (sonst faengt die Link-Regex den [alt](url)-Teil).
  let out = escaped.replace(
    /!\[([^\]]*)\]\((https?:\/\/[^\s()<>]+)\)/g,
    (_m, alt: string, url: string) =>
      `<img class="chatimg" src="${url}" alt="${alt}" loading="lazy" />`,
  );
  // Links: nur absolute http/https-URLs; Ziel escaped (Quotes sind bereits
  // Entities, koennen das href-Attribut also nicht verlassen).
  out = out.replace(
    /\[([^\]]+)\]\(((?:https?:\/\/|mailto:|tel:)[^\s()<>]+)\)/g,
    (_m, label: string, url: string) => {
      // Vorschau-Kette (v0.0.5): Link-gewrapptes Mini-Bild [![alt](thumb)](ziel)
      // — Bild wurde oben bereits zu <img class="chatimg"> ersetzt. PDF-Ziele
      // (Datenblaetter/Downloads) bekommen ein Badge via CSS ::after.
      if (label.includes('class="chatimg"')) {
        const pdf = /\.pdf(?:$|[?#])|\/content\/download\//i.test(url);
        return (
          `<a class="chatimg-link${pdf ? ' pdf' : ''}" href="${url}" ` +
          `target="_blank" rel="noopener noreferrer">${label}</a>`
        );
      }
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    },
  );
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return out;
}

/** Blockweiser Renderer: Absaetze, Listen, Tabellen (Produktvergleich). */
function renderMarkdown(src: string): string {
  const html: string[] = [];
  let para: string[] = [];
  let list: { tag: 'ul' | 'ol'; items: string[] } | null = null;
  let table: string[] | null = null;

  const flushPara = (): void => {
    if (para.length > 0) {
      html.push(`<p>${para.map((l) => renderInline(escapeHtml(l))).join('<br>')}</p>`);
      para = [];
    }
  };
  const flushList = (): void => {
    if (list) {
      html.push(`<${list.tag}>${list.items.map((i) => `<li>${i}</li>`).join('')}</${list.tag}>`);
      list = null;
    }
  };
  const flushTable = (): void => {
    if (!table || table.length === 0) { table = null; return; }
    const cell = (l: string): string[] => l.replace(/^\s*\||\|\s*$/g, '').split('|').map((c) => c.trim());
    const isSep = (r: string[]): boolean => r.length > 0 && r.every((c) => c === '' || /^:?-{2,}:?$/.test(c));
    const rows = table.map(cell).filter((r) => !isSep(r));
    table = null;
    if (rows.length === 0) return;
    const head = rows[0].map((c) => `<th>${renderInline(escapeHtml(c))}</th>`).join('');
    const body = rows.slice(1)
      .map((r) => `<tr>${r.map((c) => `<td>${renderInline(escapeHtml(c))}</td>`).join('')}</tr>`)
      .join('');
    html.push(`<div class="tablewrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`);
  };

  for (const rawLine of src.split('\n')) {
    const line = rawLine.trimEnd();
    if (/^\s*\|.*\|\s*$/.test(line)) {
      flushPara(); flushList();
      if (!table) table = [];
      table.push(line);
      continue;
    }
    flushTable();
    const ul = /^\s{0,3}[-*]\s+(.*)$/.exec(line);
    const ol = /^\s{0,3}\d+[.)]\s+(.*)$/.exec(line);
    if (ul) {
      flushPara();
      if (!list || list.tag !== 'ul') { flushList(); list = { tag: 'ul', items: [] }; }
      list.items.push(renderInline(escapeHtml(ul[1] ?? '')));
    } else if (ol) {
      flushPara();
      if (!list || list.tag !== 'ol') { flushList(); list = { tag: 'ol', items: [] }; }
      list.items.push(renderInline(escapeHtml(ol[1] ?? '')));
    } else if (line.trim() === '') {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  flushTable();
  return html.join('');
}

// ---------------------------------------------------------------------------
// ALTCHA (self-hosted, spass-captcha): Challenge holen + PoW im Browser loesen.
//
// Wire-Format (spass/crates/spass-captcha/src/lib.rs):
//   Challenge (Server→Widget): { algorithm:"SHA-256", challenge, maxnumber,
//     salt, signature } — challenge = sha256_hex(salt + number).
//   Payload (Widget→Server):   Base64-JSON { algorithm, challenge, number,
//     salt, signature } als String-Feld `altcha`.
// Jede geloeste Challenge ist server-seitig nur EINMAL einloesbar
// (Replay-Schutz) → pro Nachricht wird eine frische Loesung verbraucht.
// ---------------------------------------------------------------------------

interface AltchaChallenge {
  algorithm: string;
  challenge: string;
  maxnumber: number;
  salt: string;
  signature: string;
}

interface AltchaSolution {
  /** Base64-JSON-Payload fuers `altcha`-Feld. */
  payload: string;
  /** Unix-Sekunden aus `salt?expires=` — Loesung davor verbrauchen. */
  expires: number;
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  let out = '';
  for (const b of new Uint8Array(digest)) out += b.toString(16).padStart(2, '0');
  return out;
}

function saltExpires(salt: string): number {
  const m = /\?expires=(\d+)/.exec(salt);
  return m ? Number(m[1]) : Math.floor(Date.now() / 1000) + 300;
}

/** Brute-force PoW wie das ALTCHA-Widget: number mit sha256(salt+number)==challenge. */
async function solveAltcha(c: AltchaChallenge): Promise<AltchaSolution | null> {
  if (c.algorithm !== 'SHA-256') return null;
  for (let n = 0; n <= c.maxnumber; n++) {
    // Alle 2500 Iterationen einen Macro-Task einschieben, damit der
    // Haupt-Thread fluessig bleibt (maxnumber=50k ⇒ max. 20 Yields).
    if (n > 0 && n % 2500 === 0) await new Promise((r) => setTimeout(r, 0));
    if ((await sha256Hex(c.salt + String(n))) === c.challenge) {
      const payload = btoa(JSON.stringify({
        algorithm: c.algorithm,
        challenge: c.challenge,
        number: n,
        salt: c.salt,
        signature: c.signature,
      }));
      return { payload, expires: saltExpires(c.salt) };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Chat-Fehlertyp fuer sauberes Mapping auf UI-Meldungen
// ---------------------------------------------------------------------------

type ChatErrorKind = 'rate_limit' | 'captcha' | 'invalid_message' | 'timeout' | 'network' | 'generic';

class ChatError extends Error {
  readonly kind: ChatErrorKind;
  constructor(kind: ChatErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

// ---------------------------------------------------------------------------
// Styles (Shadow DOM; Theming NUR ueber dokumentierte CSS-Custom-Properties)
// ---------------------------------------------------------------------------

const STYLE = /* css */ `
  :host {
    /* Dokumentierte Theming-Hooks */
    /* Godelmann-CI: Red 100 #E54F35, Red 90 (Hover) #B33E29,
       Anthracite 100/80/30/15/10. Palette: Godelmann/CLAUDE.md */
    --_accent: var(--gdm-chat-accent, #E54F35);
    --_z: var(--gdm-chat-z-index, 2147483000);
    --_font: var(--gdm-chat-font, inherit);
    /* Breite des Seiten-Drawers (mode="drawer"). Ueberschreibbar; Default 480px. */
    --_drawer-w: var(--gdm-chat-drawer-width, 480px);
  }
  /* Seiten-Modus: das Element fuellt seinen (hoehen-gebenden) Container. */
  :host([mode="page"]) { display: block; width: 100%; height: 100%; }
  *, *::before, *::after { box-sizing: border-box; }

  .root { font-family: var(--_font); font-size: 15px; line-height: 1.45; color: #3F4549; }

  /* --- Floating-Bubble --- */
  .bubble {
    position: fixed; bottom: 24px; z-index: var(--_z);
    width: 56px; height: 56px; border-radius: 50%;
    border: none; cursor: pointer; padding: 0;
    background: var(--_accent); color: #fff;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.28);
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.15s ease;
  }
  /* Die Autor-Regel .bubble{display:flex} schlaegt das UA-[hidden] (gleiche
     Spezifitaet, Autor gewinnt) — deshalb [hidden] hier explizit durchsetzen. */
  .bubble[hidden] { display: none; }
  .bubble:hover { transform: scale(1.06); }
  .bubble:focus-visible { outline: 3px solid #3F4549; outline-offset: 2px; }
  .bubble svg { width: 28px; height: 28px; }
  .root.pos-right .bubble { right: 24px; }
  .root.pos-left .bubble { left: 24px; }

  /* --- Panel --- */
  .panel {
    position: fixed; bottom: 96px; z-index: var(--_z);
    width: 380px; max-width: calc(100vw - 32px);
    height: 560px; max-height: calc(100vh - 120px);
    background: #fff; border-radius: 12px; overflow: hidden;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    display: flex; flex-direction: column;
  }
  .panel[hidden] { display: none; }
  .root.pos-right .panel { right: 24px; }
  .root.pos-left .panel { left: 24px; }

  .header {
    background: var(--_accent); color: #fff;
    padding: 12px 14px; display: flex; align-items: center; gap: 8px;
    flex-shrink: 0;
  }
  .header .title { font-weight: 700; flex: 1 1 auto; font-size: 16px; }
  .header button {
    background: rgba(255, 255, 255, 0.14); color: #fff; border: none;
    border-radius: 6px; cursor: pointer; font: inherit; font-size: 13px;
    padding: 5px 9px; white-space: nowrap;
  }
  .header button:hover { background: rgba(255, 255, 255, 0.28); }
  .header button:focus-visible { outline: 2px solid #fff; outline-offset: 1px; }
  .header .close { font-size: 16px; line-height: 1; padding: 5px 10px; }
  .header .punchout, .header .minimize { font-size: 15px; line-height: 1; padding: 5px 9px; }
  .header button[hidden] { display: none; }

  .messages {
    flex: 1 1 auto; overflow-y: auto; padding: 14px;
    display: flex; flex-direction: column; gap: 10px;
    background: #ECEDED;
  }
  .msg { max-width: 86%; padding: 8px 12px; border-radius: 10px; overflow-wrap: break-word; }
  .msg.user { align-self: flex-end; background: var(--_accent); color: #fff; border-bottom-right-radius: 3px; }
  .msg.assistant { align-self: flex-start; background: #fff; border: 1px solid #E2E3E3; border-bottom-left-radius: 3px; }
  .quickreplies { display: flex; flex-wrap: wrap; gap: 6px; align-self: flex-start; max-width: 92%; margin: 2px 0 2px; }
  .qr {
    border: 1px solid var(--_accent); color: var(--_accent); background: #fff;
    border-radius: 999px; padding: 6px 12px; font: inherit; font-size: 13px;
    line-height: 1.2; cursor: pointer; transition: background .12s, color .12s;
  }
  .qr:hover { background: var(--_accent); color: #fff; }
  .qr:focus-visible { outline: 2px solid var(--_accent); outline-offset: 2px; }
  .msg.error { align-self: flex-start; background: #F2A79A; border: 1px solid var(--_accent); color: #B33E29; }
  .msg p { margin: 0 0 8px; }
  .msg p:last-child { margin-bottom: 0; }
  .msg ul, .msg ol { margin: 4px 0; padding-left: 20px; }
  .msg a { color: var(--_accent); text-decoration: underline; }
  .msg img.chatimg { max-height: 120px; width: auto; max-width: 100%; border-radius: 6px; margin: 4px 6px 4px 0; display: inline-block; vertical-align: top; }
  .msg a.chatimg-link { position: relative; display: inline-block; line-height: 0; }
  .msg a.chatimg-link.pdf::after { content: "PDF"; position: absolute; right: 6px; bottom: 10px; background: #E54F35; color: #fff; font: 600 9px/1.4 sans-serif; padding: 1px 5px; border-radius: 3px; pointer-events: none; }
  .msg .tablewrap { overflow-x: auto; margin: 4px 0; }
  .msg table { border-collapse: collapse; width: 100%; font-size: 12px; }
  .msg th, .msg td { border: 1px solid #E2E3E3; padding: 4px 7px; text-align: left; vertical-align: top; }
  .msg th { background: #ECEDED; font-weight: 600; }
  .msg.user a { color: #fff; }
  .msg .retry {
    display: block; margin-top: 8px; border: 1px solid var(--_accent);
    background: #fff; color: var(--_accent); border-radius: 6px;
    padding: 5px 10px; cursor: pointer; font: inherit; font-size: 13px;
  }
  .msg .retry:hover { background: var(--_accent); color: #fff; }

  /* --- Feedback-Leiste (QS): kleine, dezente Daumen-/Kommentar-Knoepfe
     unter jeder fertigen Assistent-Antwort (Vorbild .msg .retry). --- */
  .fb { display: flex; gap: 4px; margin-top: 8px; }
  .fb button {
    display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid #E2E3E3; background: #fff; color: #656A6D;
    border-radius: 6px; padding: 3px 7px; cursor: pointer; font: inherit;
    line-height: 1;
  }
  .fb button svg { width: 14px; height: 14px; }
  .fb button:hover { border-color: var(--_accent); color: var(--_accent); }
  .fb button.active { background: var(--_accent); border-color: var(--_accent); color: #fff; }
  .fb button:focus-visible { outline: 2px solid var(--_accent); outline-offset: 1px; }
  .fb-note { margin-top: 6px; font-size: 12px; color: #656A6D; }
  .fb-note[hidden] { display: none; }
  /* Inline-Kommentar-Formular (per Kommentar-Knopf auf-/zuklappbar) */
  .fb-form { margin-top: 6px; display: flex; flex-direction: column; gap: 6px; }
  /* display:flex schlaegt das UA-[hidden] — wie bei .bubble explizit durchsetzen. */
  .fb-form[hidden] { display: none; }
  .fb-form textarea {
    resize: none; border: 1px solid #C5C7C8; border-radius: 6px;
    padding: 6px 8px; font: inherit; font-size: 13px; min-height: 48px;
    background: #fff; color: #3F4549;
  }
  .fb-form textarea:focus-visible { outline: 2px solid var(--_accent); outline-offset: -1px; }
  .fb-actions { display: flex; gap: 6px; }
  .fb-actions button {
    border: 1px solid var(--_accent); background: #fff; color: var(--_accent);
    border-radius: 6px; padding: 5px 10px; cursor: pointer; font: inherit; font-size: 13px;
  }
  .fb-actions button.fb-send { background: var(--_accent); color: #fff; }
  .fb-actions button:hover { background: #B33E29; border-color: #B33E29; color: #fff; }

  .msg.pending::after {
    content: ''; display: inline-block; width: 9px; height: 9px;
    margin-left: 6px; border-radius: 50%; background: var(--_accent);
    animation: gdm-pulse 1s ease-in-out infinite;
  }
  @keyframes gdm-pulse { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }

  .inputrow {
    display: flex; gap: 8px; padding: 10px 12px; background: #fff;
    border-top: 1px solid #E2E3E3; flex-shrink: 0;
  }
  .inputrow textarea {
    flex: 1 1 auto; resize: none; border: 1px solid #C5C7C8; border-radius: 8px;
    padding: 8px 10px; font: inherit; min-height: 38px; max-height: 110px;
    background: #fff; color: #3F4549;
  }
  .inputrow textarea:focus-visible { outline: 2px solid var(--_accent); outline-offset: -1px; }
  .inputrow .send {
    flex-shrink: 0; border: none; border-radius: 8px; padding: 8px 14px;
    background: var(--_accent); color: #fff; font: inherit; font-weight: 700;
    cursor: pointer;
  }
  .inputrow .send:disabled { opacity: 0.55; cursor: default; }
  .inputrow .send:focus-visible { outline: 2px solid #3F4549; outline-offset: 1px; }

  .privacy {
    padding: 6px 12px 10px; background: #fff; flex-shrink: 0;
    font-size: 12px; color: #656A6D;
  }
  .privacy a { color: var(--_accent); }

  /* Kleines Display: Panel vollflaechig */
  @media (max-width: 520px), (max-height: 560px) {
    .panel {
      inset: 0; width: 100%; max-width: none; height: 100%; max-height: none;
      border-radius: 0;
    }
    .root.pos-right .panel, .root.pos-left .panel { right: 0; left: 0; }
  }

  /* --- Launcher aus (Rail-Einbindung stellt einen eigenen Ausloeser) --- */
  .root.launcher-none .bubble { display: none; }

  /* --- Drawer-Modus: rechte Vollhoehen-Spalte ("Skyscraper") --- */
  /* Ab Desktop schiebt der Wirt (html) seinen Inhalt schmaler (JS setzt die
     Klasse gdm-chat-drawer-open + margin-right). Das Panel selbst sitzt fest
     rechts und schiebt sanft herein. Auf kleinen Displays greift die
     Vollflaechen-Media-Query oben (kein Schieben). */
  .root.mode-drawer .panel {
    position: fixed; top: 0; right: 0; bottom: 0; left: auto;
    width: var(--_drawer-w); max-width: 100vw;
    height: 100vh; max-height: none;
    border-radius: 0;
    box-shadow: -8px 0 40px rgba(0, 0, 0, 0.18);
  }
  .root.mode-drawer .panel:not([hidden]) {
    animation: gdm-drawer-in 0.8s ease both;
  }
  @keyframes gdm-drawer-in {
    from { transform: translateX(100%); }
    to   { transform: translateX(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .root.mode-drawer .panel:not([hidden]) { animation: none; }
  }

  /* --- Seiten-Modus: Panel liegt in-flow und fuellt den Container --- */
  .root.mode-page { height: 100%; }
  .root.mode-page .panel {
    position: static; inset: auto; transform: none;
    width: 100%; max-width: none; height: 100%; max-height: none;
    border-radius: 0; box-shadow: none; animation: none;
  }
`;

const BUBBLE_ICON = `
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H9.4L5.6 19.6c-.66.53-1.6.06-1.6-.78V5.5Z"
      fill="currentColor"/>
    <circle cx="8.6" cy="9.6" r="1.15" fill="#E54F35" class="dot"/>
    <circle cx="12" cy="9.6" r="1.15" fill="#E54F35" class="dot"/>
    <circle cx="15.4" cy="9.6" r="1.15" fill="#E54F35" class="dot"/>
  </svg>`;

/** Feedback-Icons (Inline-SVG, kein neues Asset): Daumen hoch/runter +
 *  Kommentar. Gefuellt via currentColor — der aktive Zustand invertiert
 *  ueber die CSS-Klasse .active (Accent-Hintergrund, weisses Icon). */
const FB_ICON_UP = `
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M2 21h4V9H2v12Zm20-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L13.17 1 6.58 7.59C6.22 7.95 6 8.45 6 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2Z"/>
  </svg>`;
const FB_ICON_DOWN = `
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path transform="rotate(180 12 12)" d="M2 21h4V9H2v12Zm20-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L13.17 1 6.58 7.59C6.22 7.95 6 8.45 6 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2Z"/>
  </svg>`;
const FB_ICON_COMMENT = `
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2Z"/>
  </svg>`;

// ---------------------------------------------------------------------------
// Custom Element
// ---------------------------------------------------------------------------

interface MessageEntry {
  role: 'user' | 'assistant' | 'error';
  text: string;
  isGreeting?: boolean;
  el?: HTMLDivElement;
  retryText?: string;
  /** QS: stabile Nachrichten-ID (uuid beim Anlegen, appendMessage zentral). */
  qsId?: string;
  /** QS: Anlegezeit (Date.now) — Basis fuer ts_client + Latenzmessung. */
  ts?: number;
  /** QS: Antwortlatenz in ms (Modell: startChat-Beginn bis fertig gerendert;
   *  kuratiert: die simulierte Denkzeit). */
  latencyMs?: number;
  /** QS: Nachrichtenart — begruessung|zielgruppe|frage|kuratiert|antwort|nachfrage|fehler. */
  art?: string;
  /** QS-Feedback: Daumen hoch (1) / runter (-1); fehlt = keine Wertung. */
  rating?: 1 | -1;
  /** QS-Feedback: Freitext-Kommentar des Besuchers. */
  comment?: string;
  /** Nur Laufzeit (bewusst NICHT serialisiert): schon an /api/qs/transcript
   *  gemeldet? Nach restoreSession wieder false — Nachsenden ist idempotent
   *  (Server dedupliziert je (sitzung_id, message_id)) = self-healing. */
  qsSent?: boolean;
}

/** Klick-Handler je verdrahtetem Rail-Ausloeser (fuer sauberes Abmelden). */
const railHandlers = new WeakMap<HTMLElement, (e: Event) => void>();

export class GodelmannChatbot extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['lang', 'position', 'api-base', 'greeting', 'mode', 'launcher', 'page-url'];
  }

  private readonly root: ShadowRoot;
  private rootDiv!: HTMLDivElement;
  private bubbleBtn!: HTMLButtonElement;
  private panel!: HTMLDivElement;
  private titleEl!: HTMLSpanElement;
  private newBtn!: HTMLButtonElement;
  private punchoutBtn!: HTMLButtonElement;
  private minimizeBtn!: HTMLButtonElement;
  private closeBtn!: HTMLButtonElement;
  private messagesEl!: HTMLDivElement;
  private form!: HTMLFormElement;
  private input!: HTMLTextAreaElement;
  private sendBtn!: HTMLButtonElement;
  private privacyEl!: HTMLDivElement;

  private messages: MessageEntry[] = [];
  private isOpen = false;
  private busy = false;
  private abortCtrl: AbortController | null = null;
  private altchaPending: Promise<AltchaSolution | null> | null = null;
  private captchaDisabled = false;

  // Guided-Selling-Flow (Ablaufplan Heike): Zielgruppen-Weiche vor dem KI-Chat.
  private stage: 'greeting' | Branch = 'greeting';
  private awaitingPlz = false;
  /** Die EINE aktuelle Vorschlags-Chip-Reihe (Server-Followups + Zweig-Menue). */
  private suggestRow: HTMLElement | null = null;
  /** Denkzeit-Timer der kuratierten Antworten — resetConversation und
   *  disconnectedCallback raeumen ihn auf (sonst schriebe er nach dem
   *  Aufraeumen noch in eine verworfene Blase). */
  private curatedTimer: number | null = null;
  /** Slot-Filling: wurde bei unklarer Zielgruppe schon EINMAL nachgefasst? */
  private zielgruppeGefragt = false;
  /** `spass_followups` der laufenden/letzten Modell-Antwort (Zusatz-Event des
   *  Servers vor `[DONE]`): 2-3 vom Modell erzeugte Fortsetzungsfragen. */
  private lastFollowups: string[] = [];
  // Administrierbare Link-Ziele (GET /api/webchat-config): linkKey -> URL.
  private links: Record<string, string> = {};
  private configLoaded = false;
  /** Waehrend des Wiederherstellens NICHT zurueckspeichern (sonst schreibt
   *  das Aufbauen des Verlaufs den gerade gelesenen Stand halbfertig um). */
  private restoring = false;
  /** Sitzung nur EINMAL je Element-Instanz zurueckholen: connectedCallback
   *  feuert auch, wenn das Element im DOM verschoben wird - sonst stuenden
   *  Verlauf und Zielgruppen-Weiche doppelt da. */
  private sessionRestored = false;
  /** Zaehlt Unterhaltungen. Ein per "Neue Unterhaltung" abgebrochener Lauf
   *  darf seine Fehlermeldung NICHT in die frische Unterhaltung schreiben. */
  private convGen = 0;
  /** Liegt der Schreibfokus im Eingabefeld? Wird von focus/blur gesetzt und
   *  NICHT aus `activeElement` abgeleitet: beim blur-Ereignis zeigt
   *  `ShadowRoot.activeElement` noch auf das Feld, der Zustand waere dann
   *  faelschlich "fokussiert" (live beobachtet 01.08.). */
  private inputFocused = false;
  /** Host-Elemente mit `data-gdm-chat-launcher` (Rail-Einbindung), die das
   *  Widget auf Klick verdrahtet — kein Inline-JS im Agentur-Snippet noetig. */
  private railLaunchers: HTMLElement[] = [];
  /** Verdrahtete Dokument-Ereignisse (gdm-chat:open|close|toggle) — imperative
   *  Steuerung von aussen. Referenzen zum sauberen Abmelden. */
  private docHandlers: { open: () => void; close: () => void; toggle: () => void } | null = null;
  /** Ist der Wirt gerade geschoben (Drawer offen, Desktop)? Fuer Zuruecknahme. */
  private hostPushed = false;
  /** Vorheriger inline `overflow-x` von <html> — beim Schliessen wiederhergestellt. */
  private prevHtmlOverflowX: string | null = null;
  /** QS-Sitzungs-ID fuer /api/qs/* — je Unterhaltung; "Neue Unterhaltung"
   *  vergibt eine frische, restoreSession holt die alte zurueck. */
  private sitzungId = '';
  /** Transcript-Melder: fertige, noch nicht gemeldete Nachrichten (Debounce 2 s). */
  private qsQueue: MessageEntry[] = [];
  private qsTimer: number | null = null;
  /** Feedback-Debounce je Nachricht (300 ms gegen Schnellklick-Races). */
  private readonly fbTimers = new Map<MessageEntry, number>();
  /** Labels der aktuell gezeigten Vorschlags-Chips (fuer `vorschlaege` im Transcript). */
  private suggestLabels: string[] = [];
  /** pagehide-Flush (sendBeacon) — Referenz zum sauberen Abmelden. */
  private pagehideHandler: (() => void) | null = null;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
  }

  // --- Attribute / Konfiguration -----------------------------------------

  private get langKey(): 'de' | 'en' {
    return (this.getAttribute('lang') ?? 'de').toLowerCase().startsWith('en') ? 'en' : 'de';
  }

  private get texts(): Texts {
    return TEXTS[this.langKey];
  }

  private get apiBase(): string {
    const attr = this.getAttribute('api-base');
    const base = attr && attr.trim() !== '' ? attr.trim() : SCRIPT_ORIGIN;
    return base.replace(/\/+$/, '');
  }

  private get greetingText(): string {
    const attr = this.getAttribute('greeting');
    return attr && attr.trim() !== '' ? attr.trim() : this.texts.greeting;
  }

  /** Darstellungsmodus: schwebende Blase (Default), Seiten-Drawer, Vollseite. */
  private get mode(): 'floating' | 'drawer' | 'page' {
    const m = (this.getAttribute('mode') ?? 'floating').toLowerCase();
    return m === 'drawer' || m === 'page' ? m : 'floating';
  }

  /** Eigener Ausloeser (`bubble`, Default) oder keiner (`none`, Rail-Einbindung). */
  private get launcherKind(): 'bubble' | 'none' {
    return (this.getAttribute('launcher') ?? 'bubble').toLowerCase() === 'none' ? 'none' : 'bubble';
  }

  /** Ziel des Vollbild-Wechsels (Drawer -> Seite). Default `/chat`. */
  private get pageUrl(): string {
    const attr = this.getAttribute('page-url');
    return attr && attr.trim() !== '' ? attr.trim() : '/chat';
  }

  /** Kleines Display (gleiche Grenze wie die Vollflaechen-Media-Query): dort
   *  wird der Drawer zum Vollbild-Panel und schiebt den Wirt NICHT. */
  private get isCompact(): boolean {
    return window.matchMedia('(max-width: 520px), (max-height: 560px)').matches;
  }

  connectedCallback(): void {
    // Ausgelieferte Fassung von aussen ablesbar machen (Abgleich test/prod).
    this.setAttribute('data-version', __WIDGET_VERSION__)
    if (!this.rootDiv) this.buildDom();
    this.applyPosition();
    this.applyTexts();
    if (!this.sessionRestored) {
      this.sessionRestored = true;
      this.restoreSession();
    }
    // Modus (floating|drawer|page) + Launcher-Verdrahtung NACH dem Restore:
    // im Seiten-Modus erzwingt applyMode "offen", unabhaengig vom Speicher.
    this.applyMode();
    this.wireRailLaunchers();
    this.bindDocumentEvents();
    // QS-Flush beim Verlassen der Seite: sendBeacon (text/plain-Blob =
    // preflight-frei cross-origin), damit die letzten Nachrichten/Feedbacks
    // den Server noch erreichen, obwohl godelmann.de bei jedem Klick neu laedt.
    if (!this.pagehideHandler) {
      this.pagehideHandler = (): void => { this.flushAllQs(true); };
      window.addEventListener('pagehide', this.pagehideHandler);
    }
  }

  /** Wird beim Entfernen aus dem DOM aufgerufen (godelmann.de laedt bei jeder
   *  Navigation neu). Nimmt ALLE Mutationen am Wirt zurueck: laufende Antwort,
   *  Seiten-Schub (html-Klasse + margin + overflow), Dokument-Ereignisse und
   *  die Rail-Verdrahtung. Ohne diese Reinigung bliebe z. B. der margin-right
   *  am <html> haengen, wenn das Element zur Laufzeit ersetzt wird. */
  disconnectedCallback(): void {
    this.abortCtrl?.abort();
    if (this.curatedTimer !== null) {
      window.clearTimeout(this.curatedTimer);
      this.curatedTimer = null;
      this.busy = false;
      this.sendBtn.disabled = false;
    }
    this.applyHostPush(false);
    if (this.docHandlers) {
      document.removeEventListener('gdm-chat:open', this.docHandlers.open);
      document.removeEventListener('gdm-chat:close', this.docHandlers.close);
      document.removeEventListener('gdm-chat:toggle', this.docHandlers.toggle);
      this.docHandlers = null;
    }
    // Offene QS-Meldungen noch rausschicken (Element wird zur Laufzeit
    // ersetzt/entfernt), dann den pagehide-Listener abmelden.
    this.flushAllQs(true);
    if (this.pagehideHandler) {
      window.removeEventListener('pagehide', this.pagehideHandler);
      this.pagehideHandler = null;
    }
    this.unwireRailLaunchers();
  }

  // --- Sitzungs-Gedaechtnis (Seitenwechsel + Neuladen) ---------------------

  /** Sichert den Gespraechszustand. Wird bei jeder Aenderung aufgerufen —
   *  auch bei jedem getippten Zeichen. */
  private saveSession(): void {
    if (this.restoring) return;
    const el = this.input;
    const data: StoredSession = {
      open: this.isOpen,
      // `el` (das DOM-Element) darf NICHT mit — es ist nicht serialisierbar
      // und wird beim Wiederherstellen ohnehin neu erzeugt.
      messages: this.messages.map((m) => ({
        role: m.role,
        // Assistenz-Text IMMER gestrippt sichern: waehrend des Streams steht in
        // `text` noch der rohe Modell-Output samt <think>-Block. Ungestrippt
        // gespeichert wuerde er beim Wiederherstellen im Kundenfenster landen.
        text: m.role === 'assistant' ? visibleAnswer(m.text) : m.text,
        ...(m.isGreeting ? { isGreeting: true } : {}),
        ...(m.retryText ? { retryText: m.retryText } : {}),
        // QS-Metadaten konditional (Muster retryText) — Speicher schlank halten.
        ...(m.qsId ? { qsId: m.qsId } : {}),
        ...(m.ts ? { ts: m.ts } : {}),
        ...(m.latencyMs ? { latencyMs: m.latencyMs } : {}),
        ...(m.art ? { art: m.art } : {}),
        ...(m.rating ? { rating: m.rating } : {}),
        ...(m.comment ? { comment: m.comment } : {}),
      })),
      stage: this.stage,
      awaitingPlz: this.awaitingPlz,
      ...(this.zielgruppeGefragt ? { zielgruppeGefragt: true } : {}),
      ...(this.sitzungId ? { sitzungId: this.sitzungId } : {}),
      draft: el?.value ?? '',
      ...(el ? { cursor: { start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 } } : {}),
      ...(this.inputFocused ? { focused: true } : {}),
    };
    ssSet(SS_SESSION_KEY, JSON.stringify(data));
  }

  /** Holt das Gespraech zurueck: Panel-Zustand, Verlauf, Stand der
   *  Zielgruppen-Weiche, Eingabe samt Cursor. */
  private restoreSession(): void {
    const raw = ssGet(SS_SESSION_KEY);
    if (!raw) return;
    let s: StoredSession;
    try {
      s = JSON.parse(raw) as StoredSession;
    } catch {
      ssRemove(SS_SESSION_KEY);
      return;
    }
    const verlauf = Array.isArray(s.messages) ? s.messages : [];
    // Eine leere Bot-Blase bedeutet: beim Neuladen lief gerade eine Antwort.
    // Ohne laufende Anfrage wuerde sie ewig leer stehen bleiben.
    while (verlauf.length && verlauf[verlauf.length - 1]?.role === 'assistant'
           && !verlauf[verlauf.length - 1]?.text?.trim()) {
      verlauf.pop();
    }
    if (verlauf.length === 0 && !s.draft) return;

    // QS-Sitzungs-ID zurueckholen; Alt-Sitzungen ohne Feld bekommen eine
    // frische (der Verlauf wird unten ohnehin einmal nachgesendet).
    if (typeof s.sitzungId === 'string' && s.sitzungId !== '') this.sitzungId = s.sitzungId;
    else if (this.sitzungId === '') this.sitzungId = uuid();

    this.restoring = true;
    try {
      for (const m of verlauf) {
        if (!m || typeof m.text !== 'string') continue;
        if (m.role !== 'user' && m.role !== 'assistant' && m.role !== 'error') continue;
        // QS-Metadaten mitnehmen; fehlen sie (Alt-Sitzung vor v0.0.10),
        // vergibt appendMessage frische — der Server dedupliziert ohnehin.
        const qs = {
          ...(typeof m.qsId === 'string' && m.qsId !== '' ? { qsId: m.qsId } : {}),
          ...(typeof m.ts === 'number' ? { ts: m.ts } : {}),
          ...(typeof m.latencyMs === 'number' ? { latencyMs: m.latencyMs } : {}),
          ...(typeof m.art === 'string' && m.art !== '' ? { art: m.art } : {}),
          ...(m.rating === 1 || m.rating === -1 ? { rating: m.rating } : {}),
          ...(typeof m.comment === 'string' && m.comment !== '' ? { comment: m.comment } : {}),
        };
        if (m.role === 'error') {
          // ueber appendErrorMessage, damit der "Erneut versuchen"-Knopf mitkommt
          this.appendErrorMessage(m.text, m.retryText, qs);
          continue;
        }
        this.appendMessage({ role: m.role, text: m.text, ...(m.isGreeting ? { isGreeting: true } : {}), ...qs });
      }
      this.stage = s.stage === 'endkunde' || s.stage === 'fachkunde' ? s.stage : 'greeting';
      this.awaitingPlz = s.awaitingPlz === true;
      // Alte Sitzungen (vor v0.0.9) kennen das Feld nicht -> false.
      this.zielgruppeGefragt = s.zielgruppeGefragt === true;
      // Passende Auswahl-Schaltflaechen wieder anbieten, sonst haengt das
      // Gespraech ohne Weiterweg fest.
      if (!this.awaitingPlz) this.showSuggestions([]);
      if (typeof s.draft === 'string') this.input.value = s.draft;
      // Feedback-Leisten wieder anbauen + Verlauf einmal nachsenden
      // (self-healing: `qsSent` wird nicht serialisiert, das Nachsenden ist
      // serverseitig idempotent).
      for (const m of this.messages) {
        if (m.role === 'assistant' && m.text.trim() !== '') this.attachFeedbackBar(m);
        this.queueQs(m);
      }
    } finally {
      this.restoring = false;
    }
    // Einmal zuruecksichern: Alt-Sitzungen haben soeben frische qsIds/
    // sitzungId bekommen — ungesichert bekaeme JEDER Reload neue IDs und
    // der Server saehe denselben Verlauf mehrfach.
    this.saveSession();

    if (s.open) {
      this.open(false, false);
      const pos = s.cursor;
      if (s.focused) {
        this.inputFocused = true;
        this.input.focus();
        if (pos) {
          const max = this.input.value.length;
          this.input.setSelectionRange(Math.min(pos.start, max), Math.min(pos.end, max));
        }
      }
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (!this.rootDiv || oldValue === newValue) return;
    switch (name) {
      case 'position':
        this.applyPosition();
        break;
      case 'lang':
      case 'greeting':
        this.applyTexts();
        break;
      case 'api-base':
        // Neuer Host ⇒ vorgeloestes ALTCHA ist wertlos.
        this.altchaPending = null;
        this.captchaDisabled = false;
        break;
      case 'mode':
        this.applyMode();
        break;
      case 'launcher':
        // Wechsel bubble<->none: Bubble ein-/ausblenden und Rail neu verdrahten.
        this.applyMode();
        if (this.launcherKind === 'none') this.wireRailLaunchers();
        else this.unwireRailLaunchers();
        break;
      // 'page-url' wird bei Bedarf gelesen (kein Zustand).
    }
  }

  // --- DOM-Aufbau ----------------------------------------------------------

  private buildDom(): void {
    const style = document.createElement('style');
    style.textContent = STYLE;
    this.root.appendChild(style);

    this.rootDiv = document.createElement('div');
    this.rootDiv.className = 'root pos-right';

    // Bubble
    this.bubbleBtn = document.createElement('button');
    this.bubbleBtn.className = 'bubble';
    this.bubbleBtn.type = 'button';
    this.bubbleBtn.setAttribute('aria-haspopup', 'dialog');
    this.bubbleBtn.setAttribute('aria-expanded', 'false');
    this.bubbleBtn.innerHTML = BUBBLE_ICON;
    this.bubbleBtn.addEventListener('click', () => this.toggle());

    // Panel
    this.panel = document.createElement('div');
    this.panel.className = 'panel';
    this.panel.setAttribute('role', 'dialog');
    // Startwert 'false': ein wiederhergestelltes Panel ohne Fokus darf die
    // uebrige Seite nicht fuer Screenreader ausblenden. Beim Oeffnen und beim
    // Hineinfokussieren wird auf 'true' gehoben.
    this.panel.setAttribute('aria-modal', 'false');
    this.panel.hidden = true;
    this.panel.addEventListener('keydown', (e) => this.onPanelKeydown(e));

    const header = document.createElement('div');
    header.className = 'header';
    this.titleEl = document.createElement('span');
    this.titleEl.className = 'title';
    this.titleEl.id = 'gdm-title';
    this.panel.setAttribute('aria-labelledby', 'gdm-title');
    this.newBtn = document.createElement('button');
    this.newBtn.type = 'button';
    this.newBtn.className = 'new';
    this.newBtn.addEventListener('click', () => this.resetConversation());
    // Punchout (nur Drawer): auf die Vollseite wechseln.
    this.punchoutBtn = document.createElement('button');
    this.punchoutBtn.type = 'button';
    this.punchoutBtn.className = 'punchout';
    this.punchoutBtn.textContent = '↗'; // ↗
    this.punchoutBtn.hidden = true;
    this.punchoutBtn.addEventListener('click', () => this.punchout());
    // Verkleinern (nur Seite): zurueck in den Drawer der vorigen Seite.
    this.minimizeBtn = document.createElement('button');
    this.minimizeBtn.type = 'button';
    this.minimizeBtn.className = 'minimize';
    this.minimizeBtn.textContent = '↙'; // ↙
    this.minimizeBtn.hidden = true;
    this.minimizeBtn.addEventListener('click', () => this.minimizeToDrawer());
    this.closeBtn = document.createElement('button');
    this.closeBtn.type = 'button';
    this.closeBtn.className = 'close';
    this.closeBtn.textContent = '×';
    this.closeBtn.addEventListener('click', () => this.close());
    header.append(this.titleEl, this.newBtn, this.punchoutBtn, this.minimizeBtn, this.closeBtn);

    this.messagesEl = document.createElement('div');
    this.messagesEl.className = 'messages';
    this.messagesEl.setAttribute('aria-live', 'polite');

    this.form = document.createElement('form');
    this.form.className = 'inputrow';
    this.input = document.createElement('textarea');
    this.input.rows = 1;
    this.input.maxLength = MAX_MESSAGE_CHARS;
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.form.requestSubmit();
      }
    });
    // Nach JEDEM Zeichen sichern (nicht erst beim Absenden) und dazu die
    // Cursorposition, damit man nach einem Seitenwechsel mitten im Wort
    // weiterschreiben kann.
    for (const ev of ['input', 'select', 'click', 'keyup']) {
      this.input.addEventListener(ev, () => this.saveSession());
    }
    this.input.addEventListener('focus', () => {
      this.inputFocused = true;
      // Nur die schwebende Bubble ist ein modaler Dialog. Im Drawer/auf der
      // Seite bleibt der Wirt bedienbar -> aria-modal false lassen.
      if (this.mode === 'floating') this.panel.setAttribute('aria-modal', 'true');
      this.saveSession();
    });
    this.input.addEventListener('blur', () => { this.inputFocused = false; this.saveSession(); });
    this.sendBtn = document.createElement('button');
    this.sendBtn.type = 'submit';
    this.sendBtn.className = 'send';
    this.form.append(this.input, this.sendBtn);
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      void this.submitInput();
    });

    this.privacyEl = document.createElement('div');
    this.privacyEl.className = 'privacy';

    this.panel.append(header, this.messagesEl, this.form, this.privacyEl);
    this.rootDiv.append(this.bubbleBtn, this.panel);
    this.root.appendChild(this.rootDiv);
  }

  private applyPosition(): void {
    const left = (this.getAttribute('position') ?? 'bottom-right') === 'bottom-left';
    this.rootDiv.classList.toggle('pos-left', left);
    this.rootDiv.classList.toggle('pos-right', !left);
  }

  private applyTexts(): void {
    const t = this.texts;
    this.bubbleBtn.setAttribute('aria-label', this.isOpen ? t.bubbleClose : t.bubbleOpen);
    this.titleEl.textContent = t.headerTitle;
    this.newBtn.textContent = t.newConversation;
    this.punchoutBtn.setAttribute('aria-label', t.expand);
    this.punchoutBtn.setAttribute('title', t.expand);
    this.minimizeBtn.setAttribute('aria-label', t.collapse);
    this.minimizeBtn.setAttribute('title', t.collapse);
    this.closeBtn.setAttribute('aria-label', t.close);
    this.input.placeholder = t.inputPlaceholder;
    this.input.setAttribute('aria-label', t.inputPlaceholder);
    this.sendBtn.textContent = t.send;
    this.privacyEl.innerHTML =
      `${escapeHtml(t.privacy)} <a href="${PRIVACY_URL}" target="_blank" ` +
      `rel="noopener noreferrer">${escapeHtml(t.privacyLink)}</a>`;
    // Greeting-Nachrichten sprachreaktiv halten
    for (const m of this.messages) {
      if (m.isGreeting) {
        m.text = this.greetingText;
        if (m.el) {
          m.el.innerHTML = renderMarkdown(m.text);
          // innerHTML hat eine vorhandene Feedback-Leiste mit entfernt ->
          // neu anbauen (nicht an der noch tippenden pending-Blase).
          if (!m.el.classList.contains('pending')) this.attachFeedbackBar(m);
        }
      }
    }
  }

  // --- Oeffnen / Schliessen ------------------------------------------------

  /** Oeffentliche API (dokumentiert in docs/EINBINDUNG.md): von aussen per
   *  Element-Referenz (`el.toggle()`) oder Dokument-Ereignis (`gdm-chat:toggle`). */
  toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
  }

  /** `fokussieren=false` beim Wiederherstellen: dort entscheidet der
   *  gespeicherte Zustand, ob der Schreibfokus zurueck ins Feld darf. Sonst
   *  wuerde ein Seitenwechsel den Fokus IMMER an den Chat reissen. */
  open(fokussieren = true, alsBenutzeraktion = true): void {
    if (this.isOpen) return;
    this.isOpen = true;
    // QS-Sitzung sicherstellen (persistiert via saveSession; "Neue
    // Unterhaltung" vergibt in resetConversation eine frische).
    if (this.sitzungId === '') this.sitzungId = uuid();
    this.panel.hidden = false;
    this.bubbleBtn.setAttribute('aria-expanded', 'true');
    this.bubbleBtn.setAttribute('aria-label', this.texts.bubbleClose);
    this.syncLauncherState();
    if (this.messages.length === 0) {
      // Begruessung wie eine echte Modell-Antwort ausspielen (simulierte
      // Denkzeit), danach die Zielgruppen-Chips.
      this.appendCuratedMessage(
        { role: 'assistant', text: this.greetingText, isGreeting: true },
        () => this.showSuggestions([]),
      );
    }
    // Administrierbare Link-Ziele laden (fire-and-forget; Fallback = AI-Frage).
    void this.loadConfig();
    // ALTCHA vorloesen, damit die erste Nachricht ohne Wartezeit rausgeht.
    // Nur bei echter Benutzeraktion: sonst rechnet jede Folgeseite ungefragt.
    if (alsBenutzeraktion) this.ensureAltcha();
    // Drawer schiebt den Wirt schmaler (nur Desktop); Seite/floating nicht.
    if (this.mode === 'drawer' && !this.isCompact) this.applyHostPush(true);
    // Fokus: floating ist ein modaler Dialog; der Drawer fokussiert das Feld
    // OHNE Modal/Trap (Seite bleibt bedienbar); die Vollseite laesst den Fokus.
    if (fokussieren && this.mode !== 'page') {
      if (this.mode === 'floating') this.panel.setAttribute('aria-modal', 'true');
      this.input.focus();
    }
    this.saveSession();
    // Beim Wiederherstellen hat der Besucher nichts geoeffnet - weder ein
    // Ereignis melden noch ungefragt Rechenarbeit anwerfen.
    if (alsBenutzeraktion) this.emit('gdm-chat:opened');
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.panel.hidden = true;
    this.bubbleBtn.setAttribute('aria-expanded', 'false');
    this.bubbleBtn.setAttribute('aria-label', this.texts.bubbleOpen);
    this.syncLauncherState();
    this.applyHostPush(false);
    // Fokus nur auf einen sichtbaren eigenen Ausloeser zuruecklegen (floating);
    // bei Rail-Einbindung (Launcher im Wirt) gibt es hier nichts zu fokussieren.
    if (this.launcherKind === 'bubble' && !this.bubbleBtn.hidden) this.bubbleBtn.focus();
    this.saveSession();
    this.emit('gdm-chat:closed');
  }

  // --- Modus / Wirt-Schub / Rail-Launcher / Dokument-Ereignisse ------------

  /** Modus-Klassen setzen + Kopf-Schaltflaechen passend ein-/ausblenden.
   *  Im Seiten-Modus wird der Chat erzwungen geoeffnet (er IST die Seite). */
  private applyMode(): void {
    const m = this.mode;
    this.rootDiv.classList.toggle('mode-floating', m === 'floating');
    this.rootDiv.classList.toggle('mode-drawer', m === 'drawer');
    this.rootDiv.classList.toggle('mode-page', m === 'page');
    this.rootDiv.classList.toggle('launcher-none', this.launcherKind === 'none');
    // Punchout nur im Drawer, Verkleinern nur auf der Seite, Schliessen nicht
    // auf der Seite, Bubble nur bei launcher="bubble" und nicht im Seiten-Modus.
    this.punchoutBtn.hidden = m !== 'drawer';
    this.minimizeBtn.hidden = m !== 'page';
    this.closeBtn.hidden = m === 'page';
    this.bubbleBtn.hidden = this.launcherKind === 'none' || m === 'page';
    if (m === 'page') this.open(false, false);
  }

  /** Wirt (godelmann.de) schmaler schieben, solange der Drawer offen ist.
   *  Setzt margin-right + weiche Animation am <html> und eine Marker-Klasse,
   *  an die EINE dokumentierte Agentur-CSS-Regel die festen Elemente
   *  (Header, Rail) mitzieht. Alles reversibel (close + disconnect). */
  private applyHostPush(on: boolean): void {
    if (on === this.hostPushed) return;
    const root = document.documentElement;
    if (on) {
      const w = getComputedStyle(this).getPropertyValue('--gdm-chat-drawer-width').trim() || '480px';
      // Waehrend der Drawer offen ist, horizontales Scrollen des Wirts
      // unterdruecken (der herein schiebende Panel-Rand darf keine
      // Scrollleiste ausloesen). Vorwert merken und beim Schliessen zurueck.
      this.prevHtmlOverflowX = root.style.overflowX || '';
      root.style.overflowX = 'hidden';
      root.style.marginRight = w;
      root.style.transition = 'margin-right 0.8s ease';
      root.classList.add('gdm-chat-drawer-open');
      this.hostPushed = true;
    } else {
      root.style.marginRight = '';
      root.classList.remove('gdm-chat-drawer-open');
      if (this.prevHtmlOverflowX !== null) {
        root.style.overflowX = this.prevHtmlOverflowX;
        this.prevHtmlOverflowX = null;
      }
      // transition am Ende der Ruecknahme wieder entfernen (kein Dauerzustand).
      root.style.transition = '';
      this.hostPushed = false;
    }
  }

  /** Host-Elemente mit `data-gdm-chat-launcher` verdrahten (click -> toggle,
   *  aria-expanded spiegeln). Nur bei launcher="none" — sonst gibt es die
   *  eigene Bubble. Idempotent. */
  private wireRailLaunchers(): void {
    if (this.launcherKind !== 'none') return;
    const found = Array.from(document.querySelectorAll<HTMLElement>('[data-gdm-chat-launcher]'));
    for (const el of found) {
      if (this.railLaunchers.includes(el)) continue;
      const handler = (e: Event): void => { e.preventDefault(); this.toggle(); };
      el.addEventListener('click', handler);
      railHandlers.set(el, handler);
      el.setAttribute('aria-expanded', String(this.isOpen));
      this.railLaunchers.push(el);
    }
  }

  private unwireRailLaunchers(): void {
    for (const el of this.railLaunchers) {
      const h = railHandlers.get(el);
      if (h) { el.removeEventListener('click', h); railHandlers.delete(el); }
      el.removeAttribute('aria-expanded');
    }
    this.railLaunchers = [];
  }

  /** `aria-expanded` an eigener Bubble UND allen Rail-Ausloesern spiegeln. */
  private syncLauncherState(): void {
    for (const el of this.railLaunchers) el.setAttribute('aria-expanded', String(this.isOpen));
  }

  /** Imperative Steuerung von aussen ohne Element-Referenz: Ereignisse am
   *  `document` (gdm-chat:open|close|toggle). Gegenstueck zu den vom Widget
   *  GEMELDETEN Ereignissen (gdm-chat:opened|closed, andere Namen -> keine
   *  Rueckkopplung). */
  private bindDocumentEvents(): void {
    if (this.docHandlers) return;
    this.docHandlers = {
      open: () => this.open(),
      close: () => this.close(),
      toggle: () => this.toggle(),
    };
    document.addEventListener('gdm-chat:open', this.docHandlers.open);
    document.addEventListener('gdm-chat:close', this.docHandlers.close);
    document.addEventListener('gdm-chat:toggle', this.docHandlers.toggle);
  }

  /** Punchout (Drawer -> Vollseite): Sitzung sichern, dann zur Seite wechseln.
   *  Gleiche Origin -> gleiches sessionStorage -> nahtlose Unterhaltung. */
  private punchout(): void {
    this.saveSession();
    window.location.assign(this.pageUrl);
  }

  /** Verkleinern (Vollseite -> Drawer der vorigen Seite). Gab es eine
   *  same-origin-Vorseite, dorthin zurueck (der Drawer oeffnet dort via
   *  restoreSession wieder); sonst sauber auf die Startseite. */
  private minimizeToDrawer(): void {
    this.saveSession();
    let sameOrigin = false;
    try {
      sameOrigin = !!document.referrer && new URL(document.referrer).origin === window.location.origin;
    } catch { /* ungueltiger Referrer */ }
    if (sameOrigin && window.history.length > 1) window.history.back();
    else window.location.assign('/');
  }

  private resetConversation(): void {
    // Offene QS-Meldungen der ALTEN Unterhaltung noch rausschicken (Beacon:
    // synchron gebaut, fire-and-forget), bevor Verlauf + Sitzung wechseln.
    this.flushAllQs(true);
    this.abortCtrl?.abort();
    this.abortCtrl = null;
    if (this.curatedTimer !== null) {
      window.clearTimeout(this.curatedTimer);
      this.curatedTimer = null;
    }
    this.convGen++;
    this.busy = false;
    this.sendBtn.disabled = false;
    lsRemove(LS_CONVERSATION_KEY);
    ssRemove(SS_SESSION_KEY);
    // Auch den Entwurf verwerfen: sonst schreibt der naechste saveSession()
    // den alten Text sofort wieder in den Speicher - "Neue Unterhaltung"
    // waere dann keine.
    if (this.input) this.input.value = '';
    this.messages = [];
    this.messagesEl.replaceChildren();
    this.stage = 'greeting';
    this.awaitingPlz = false;
    this.suggestRow = null;
    this.zielgruppeGefragt = false;
    this.lastFollowups = [];
    this.qsQueue = [];
    this.suggestLabels = [];
    this.sitzungId = uuid();
    this.appendCuratedMessage(
      { role: 'assistant', text: this.greetingText, isGreeting: true },
      () => this.showSuggestions([]),
    );
    this.input.focus();
  }

  // --- Barrierefreiheit: Fokus-Trap + ESC ---------------------------------

  private onPanelKeydown(e: KeyboardEvent): void {
    // ESC schliesst floating + Drawer; auf der Vollseite gibt es nichts zu
    // schliessen (das Panel IST die Seite).
    if (e.key === 'Escape' && this.mode !== 'page') {
      e.preventDefault();
      this.close();
      return;
    }
    // Fokus-Trap NUR fuer die schwebende Bubble (modaler Dialog). Im Drawer/auf
    // der Seite bleibt Tab frei, damit man die uebrige Seite erreichen kann.
    if (e.key !== 'Tab' || this.mode !== 'floating') return;
    const focusables = Array.from(
      this.panel.querySelectorAll<HTMLElement>('button, textarea, a[href]'),
    ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
    if (focusables.length === 0) return;
    const first = focusables[0] as HTMLElement;
    const last = focusables[focusables.length - 1] as HTMLElement;
    const active = this.root.activeElement;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // --- Nachrichten-Rendering ----------------------------------------------

  private appendMessage(entry: MessageEntry): MessageEntry {
    // QS-Metadaten zentral vergeben: stabile ID + Anlegezeit je Nachricht.
    // Die Art faellt auf Rollen-Defaults zurueck, wenn der Aufrufer nichts
    // Spezielleres setzt (z. B. 'zielgruppe', 'kuratiert', 'nachfrage').
    if (!entry.qsId) entry.qsId = uuid();
    if (!entry.ts) entry.ts = Date.now();
    if (!entry.art) entry.art = entry.role === 'error' ? 'fehler' : entry.role === 'user' ? 'frage' : 'antwort';
    const el = document.createElement('div');
    el.className = `msg ${entry.role}`;
    el.innerHTML = renderMarkdown(entry.text);
    entry.el = el;
    this.messages.push(entry);
    this.messagesEl.appendChild(el);
    this.scrollToEnd();
    this.saveSession();
    // Transcript-Melder: User-Echos + Fehlermeldungen sind sofort fertig.
    // Assistent-Blasen meldet erst finishRender/appendCuratedMessage —
    // NIE die leere pending-Blase.
    if (entry.role !== 'assistant') this.queueQs(entry);
    return entry;
  }

  /**
   * Kuratierte (hartkodierte) Antwort mit simulierter Denkzeit ausspielen,
   * damit sie sich wie eine echte Modell-Antwort anfuehlt: erst eine leere
   * pending-Blase (Tipp-Indikator), nach 1000-1500 ms der Text in DERSELBEN
   * Blase. Waehrend der Denkzeit ist das Widget busy (Senden gesperrt,
   * Chip-Klicks werden ignoriert). `after` laeuft nach dem Ausspielen —
   * z. B. um die naechsten Chips zu zeigen. Bricht ein Neuladen die Denkzeit
   * ab, verwirft restoreSession die leere Blase (Wegwerf-Logik dort).
   */
  private appendCuratedMessage(entry: MessageEntry, after?: () => void): void {
    const pending = this.appendMessage({
      role: 'assistant',
      text: '',
      ...(entry.isGreeting ? { isGreeting: true } : {}),
      // QS-Art: Begruessung eigenstaendig, sonst 'kuratiert' — Spezielleres
      // (z. B. 'nachfrage') gibt der Aufrufer im entry vor.
      art: entry.art ?? (entry.isGreeting ? 'begruessung' : 'kuratiert'),
    });
    pending.el?.classList.add('pending');
    this.busy = true;
    this.sendBtn.disabled = true;
    this.curatedTimer = window.setTimeout(() => {
      this.curatedTimer = null;
      // Begruessung zur Ausspielzeit aufloesen: falls `lang`/`greeting`
      // waehrend der Denkzeit wechselte, gewinnt der aktuelle Text.
      pending.text = pending.isGreeting ? this.greetingText : entry.text;
      // QS: die simulierte Denkzeit ist die Latenz der kuratierten Antwort.
      pending.latencyMs = Date.now() - (pending.ts ?? Date.now());
      if (pending.el) {
        pending.el.classList.remove('pending');
        pending.el.innerHTML = renderMarkdown(pending.text);
      }
      this.attachFeedbackBar(pending);
      this.busy = false;
      this.sendBtn.disabled = false;
      this.scrollToEnd();
      this.saveSession();
      this.queueQs(pending);
      after?.();
    }, 1000 + Math.random() * 500);
  }

  // --- Guided Selling / Zielgruppen-Weiche (Ablaufplan Heike, 20.07.) -------

  private appendQuickReplies(items: { label: string; onClick: () => void }[]): HTMLElement {
    const row = document.createElement('div');
    row.className = 'quickreplies';
    for (const it of items) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'qr';
      b.textContent = it.label;
      b.addEventListener('click', () => it.onClick());
      row.appendChild(b);
    }
    this.messagesEl.appendChild(row);
    this.scrollToEnd();
    return row;
  }

  /** Vorherige Vorschlags-Reihe entfernen — es existiert immer nur EINE. */
  private clearSuggestions(): void {
    this.suggestRow?.remove();
    this.suggestRow = null;
    this.suggestLabels = [];
  }

  /**
   * Die EINE aktuelle Vorschlags-Reihe rendern: erst die Server-Followups
   * (Klick -> die Frage geht 1:1 an den Bot, Label = Frage), dann als
   * Auffuellung das Menue des aktuellen Zweigs (max. 6 Chips gesamt, nach
   * Label dedupliziert) bzw. in der Begruessungs-Stufe die Zielgruppen-Chips.
   * Ohne Followups (leeres Array) = reines Zweig-Menue wie bisher (ungekappt).
   */
  private showSuggestions(followups: string[]): void {
    this.clearSuggestions();
    const items: { label: string; onClick: () => void }[] = [];
    const seen = new Set<string>();
    for (const f of followups) {
      const frage = f.trim();
      if (frage === '' || seen.has(frage) || items.length >= 6) continue;
      seen.add(frage);
      items.push({ label: frage, onClick: () => { void this.startChat(frage); } });
    }
    if (this.stage === 'greeting') {
      // Zielgruppen-Chips IMMER anhaengen (Schritt 1 bzw. Slot-Filling).
      const l = WEICHE_LABELS[this.langKey];
      if (!seen.has(l.fach)) items.push({ label: l.fach, onClick: () => this.chooseBranch('fachkunde') });
      if (!seen.has(l.end)) items.push({ label: l.end, onClick: () => this.chooseBranch('endkunde') });
    } else {
      // Ohne Followups das volle Menue (wie bisher), sonst auf 6 auffuellen.
      const max = followups.length > 0 ? 6 : Number.POSITIVE_INFINITY;
      for (const a of BRANCH_ACTIONS[this.langKey][this.stage]) {
        if (items.length >= max) break;
        if (seen.has(a.label)) continue;
        seen.add(a.label);
        items.push({ label: a.label, onClick: () => this.runQuickAction(a) });
      }
    }
    // Fuer den Transcript-Melder: die aktuell gezeigten Chip-Labels gehoeren
    // als `vorschlaege` zur LETZTEN Assistent-Nachricht.
    this.suggestLabels = items.map((i) => i.label);
    if (items.length === 0) return;
    this.suggestRow = this.appendQuickReplies(items);
  }

  /** Zielgruppe gewaehlt -> Nutzer-Echo + kuratierte Zweig-Begruessung (mit
   *  Denkzeit), danach das Guided-Selling-Menue (Schritt 2/3). */
  private chooseBranch(branch: Branch): void {
    if (this.busy) return;
    this.clearSuggestions();
    this.stage = branch;
    this.appendMessage({ role: 'user', text: BIN_LABELS[this.langKey][branch], art: 'zielgruppe' });
    this.appendCuratedMessage(
      { role: 'assistant', text: BRANCH_INTRO[this.langKey][branch] },
      () => this.showSuggestions([]),
    );
  }

  private runQuickAction(a: QuickAction): void {
    if (this.busy) return;
    this.clearSuggestions();
    if (a.special === 'plz') {
      // Fachkunde-Ansprechpartner: PLZ erfragen -> /api/contact (deterministisch).
      // awaitingPlz erst NACH der Denkzeit setzen: bricht ein Neuladen die
      // pending-Aufforderung ab, erwartet die Sitzung dann auch keine PLZ.
      this.appendMessage({ role: 'user', text: a.frage });
      this.appendCuratedMessage({ role: 'assistant', text: PLZ_PROMPT[this.langKey] }, () => {
        this.awaitingPlz = true;
        this.saveSession();
        this.input.focus();
      });
      return;
    }
    // Administrierbares Link-Ziel (falls hinterlegt) -> als klickbaren Link ausspielen.
    const url = a.linkKey ? this.links[a.linkKey] : undefined;
    if (url) {
      this.appendMessage({ role: 'user', text: a.frage });
      const lead = this.langKey === 'en' ? 'Here you go' : 'Gerne — hier entlang';
      this.appendCuratedMessage(
        { role: 'assistant', text: `${lead}: [${a.label}](${url})` },
        () => this.showSuggestions([]),
      );
      return;
    }
    if (a.ask) void this.startChat(a.ask, a.frage);
  }

  /** Administrierbare Link-Ziele laden (GET /api/webchat-config), einmalig. */
  private async loadConfig(): Promise<void> {
    if (this.configLoaded) return;
    this.configLoaded = true;
    try {
      const res = await fetch(`${this.apiBase}/api/webchat-config`);
      if (!res.ok) return;
      const data = (await res.json()) as { links?: { link_key?: string; url?: string }[] };
      for (const l of data.links ?? []) {
        if (l.link_key && l.url) this.links[l.link_key] = l.url;
      }
    } catch {
      /* Config optional — Buttons fallen auf die geerdete AI-Frage zurueck. */
    }
  }

  /** Fachkunde-PLZ -> Ansprechpartner (GET /api/contact), deterministisch. */
  private async lookupContact(plz: string): Promise<void> {
    const clean = plz.replace(/\D/g, '').slice(0, 5);
    const de = this.langKey !== 'en';
    const pending = this.appendMessage({
      role: 'assistant',
      text: de ? 'Einen Moment, ich suche Ihren Ansprechpartner …' : 'One moment, looking up your contact …',
      art: 'kuratiert',
    });
    try {
      const res = await fetch(`${this.apiBase}/api/contact?plz=${encodeURIComponent(clean)}`);
      const data = res.ok ? ((await res.json()) as { contacts?: Array<Record<string, string>> }) : { contacts: [] };
      const c = (data.contacts ?? [])[0];
      if (c && c.name) {
        const lines: string[] = [`**${c.name}**${c.role_title ? ` — ${c.role_title}` : ''}`];
        if (c.region) lines.push(`${de ? 'Region' : 'Region'}: ${c.region}`);
        if (c.phone) lines.push(`${de ? 'Telefon' : 'Phone'}: [${c.phone}](tel:${c.phone.replace(/[^+\d]/g, '')})`);
        if (c.email) lines.push(`E-Mail: [${c.email}](mailto:${c.email})`);
        pending.text = `${de ? 'Ihr zustaendiger Ansprechpartner' : 'Your responsible contact'}:\n\n${lines.join('\n')}`;
      } else {
        pending.text = de
          ? 'Zu dieser Postleitzahl habe ich aktuell keinen direkten Ansprechpartner hinterlegt. Die GODELMANN-Beratung hilft Ihnen gerne weiter — oder stellen Sie mir Ihre fachliche Frage direkt hier.'
          : 'I do not have a direct contact for this postal code yet. The GODELMANN advisory will be happy to help — or just ask me your technical question here.';
      }
    } catch {
      pending.text = de
        ? 'Die Ansprechpartner-Suche ist gerade nicht erreichbar. Bitte versuchen Sie es spaeter erneut.'
        : 'The contact lookup is currently unavailable. Please try again later.';
    }
    // QS: Dauer der Ansprechpartner-Suche als Latenz.
    pending.latencyMs = Date.now() - (pending.ts ?? Date.now());
    if (pending.el) pending.el.innerHTML = renderMarkdown(pending.text);
    this.attachFeedbackBar(pending);
    this.scrollToEnd();
    // Sonst haengt nach einem Seitenwechsel dauerhaft "Einen Moment, ich
    // suche ..." im Verlauf - die Antwort selbst waere nie gespeichert worden.
    this.saveSession();
    this.queueQs(pending);
    // Weiterweg anbieten: die Chip-Reihe wurde beim Klick entfernt.
    this.showSuggestions([]);
  }

  /** `meta`: QS-Metadaten beim Wiederherstellen (qsId/ts/art) — sonst
   *  bekaeme dieselbe Fehlermeldung nach jedem Reload eine NEUE ID und
   *  stuende beim Server mehrfach im Transcript. */
  private appendErrorMessage(text: string, retryText?: string, meta?: Partial<MessageEntry>): void {
    const entry = this.appendMessage({ ...meta, role: 'error', text, ...(retryText ? { retryText } : {}) });
    if (retryText && entry.el) {
      entry.retryText = retryText;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'retry';
      btn.textContent = this.texts.retry;
      btn.addEventListener('click', () => {
        entry.el?.remove();
        this.messages = this.messages.filter((m) => m !== entry);
        void this.startChat(retryText);
      });
      entry.el.appendChild(btn);
    }
    this.emit('gdm-chat:error', { message: text });
  }

  private scrollToEnd(): void {
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  // --- ALTCHA-Verwaltung ----------------------------------------------------

  /** Startet (falls noetig) das Vorloesen einer frischen Challenge. */
  private ensureAltcha(): void {
    if (this.captchaDisabled || this.altchaPending) return;
    this.altchaPending = this.fetchAndSolve();
  }

  private async fetchAndSolve(): Promise<AltchaSolution | null> {
    try {
      const res = await fetch(`${this.apiBase}/altcha/challenge`, { method: 'GET' });
      if (res.status === 404) {
        // Server ohne ALTCHA_HMAC_SECRET ⇒ Route existiert nicht, Captcha aus.
        this.captchaDisabled = true;
        return null;
      }
      if (!res.ok) return null;
      const challenge = (await res.json()) as AltchaChallenge;
      return await solveAltcha(challenge);
    } catch {
      return null;
    }
  }

  /**
   * Konsumiert die vorgeloeste Loesung (Replay-Schutz: einmalig!) und stoesst
   * sofort das Vorloesen fuer die naechste Nachricht an. Abgelaufene
   * Loesungen (TTL 300 s) werden verworfen und frisch geloest.
   */
  private async takeAltcha(): Promise<string | null> {
    if (this.captchaDisabled) return null;
    this.ensureAltcha();
    const pending = this.altchaPending;
    this.altchaPending = null;
    let solution = pending ? await pending : null;
    if (solution && solution.expires <= Math.floor(Date.now() / 1000) + 5) {
      solution = await this.fetchAndSolve();
    }
    if (!this.captchaDisabled) this.ensureAltcha();
    return solution?.payload ?? null;
  }

  // --- Chat-Request (POST /api/chat, SSE) -----------------------------------

  private async submitInput(): Promise<void> {
    const text = this.input.value.trim();
    if (text === '' || this.busy) return;
    this.input.value = '';

    // Fachkunde-Ansprechpartner: erwartete PLZ-Eingabe -> Platzhalter (bis
    // die Vertriebs-Adressliste vorliegt), kein KI-Call.
    if (this.awaitingPlz) {
      this.awaitingPlz = false;
      this.appendMessage({ role: 'user', text });
      void this.lookupContact(text);
      return;
    }

    // Begruessung: Freitext -> Zielgruppe automatisch erkennen (Heikes
    // Stichwortlisten). Ohne Treffer bleibt die Stufe 'greeting' — nach der
    // Antwort fasst der Assistent EINMAL gezielt nach (Slot-Filling,
    // afterModelAnswer), statt stumm 'endkunde' anzunehmen.
    if (this.stage === 'greeting') {
      const erkannt = classifyBranch(text);
      if (erkannt) this.stage = erkannt;
    }

    await this.startChat(text);
  }

  /** `anzeige` (optional): Text der User-Bubble, falls er von der an den
   *  Server gehenden Frage abweicht (Chip-Klick: kurze frage statt langem
   *  ask). Die User-Bubble entsteht NUR hier — Aufrufer posten kein eigenes
   *  Echo, damit sie nie doppelt erscheint. */
  private async startChat(text: string, anzeige?: string): Promise<void> {
    if (this.busy) return;
    // Merken, zu welcher Unterhaltung dieser Lauf gehoert: bricht ihn
    // "Neue Unterhaltung" ab, darf seine Fehlermeldung nicht mehr in die
    // frische Unterhaltung geschrieben werden.
    const gen = this.convGen;
    this.busy = true;
    this.sendBtn.disabled = true;
    this.clearSuggestions();
    this.lastFollowups = [];

    this.appendMessage({ role: 'user', text: anzeige ?? text });
    this.emit('gdm-chat:message-sent', { message: text });
    const assistant = this.appendMessage({ role: 'assistant', text: '' });
    assistant.el?.classList.add('pending');

    let ok = false;
    try {
      await this.requestChat(text, assistant, true);
      this.emit('gdm-chat:response-received', { message: assistant.text });
      ok = true;
    } catch (err) {
      // Lauf gehoert zu einer inzwischen verworfenen Unterhaltung: still enden.
      if (gen !== this.convGen) return;
      const t = this.texts;
      const kind: ChatErrorKind = err instanceof ChatError ? err.kind : 'generic';
      // Leere Assistent-Blase entfernen; Teilantworten bleiben stehen.
      if (assistant.text === '' && assistant.el) {
        assistant.el.remove();
        this.messages = this.messages.filter((m) => m !== assistant);
      }
      const msg =
        kind === 'rate_limit' ? t.errRateLimit
        : kind === 'captcha' ? t.errCaptcha
        : kind === 'invalid_message' ? t.errInvalidMessage
        : kind === 'timeout' ? t.errTimeout
        : kind === 'network' ? t.errNetwork
        : t.errGeneric;
      const retryable = kind === 'network' || kind === 'timeout' || kind === 'generic' || kind === 'captcha';
      this.appendErrorMessage(msg, retryable ? text : undefined);
    } finally {
      assistant.el?.classList.remove('pending');
      this.busy = false;
      this.sendBtn.disabled = false;
      if (this.isOpen) this.input.focus();
    }
    // NACH dem finally (busy wieder frei): Followup-Chips bzw. einmalige
    // Zielgruppen-Nachfrage — die kuratierte Denkzeit braucht ihr eigenes
    // busy-Fenster.
    if (ok && gen === this.convGen) this.afterModelAnswer();
  }

  /** Nach jeder erfolgreichen Modell-Antwort: Vorschlags-Chips zeigen und —
   *  falls die Zielgruppe noch offen ist — EINMAL nachfassen (Slot-Filling). */
  private afterModelAnswer(): void {
    const followups = this.lastFollowups;
    this.lastFollowups = [];
    if (this.stage === 'greeting' && !this.zielgruppeGefragt) {
      this.zielgruppeGefragt = true;
      this.appendCuratedMessage(
        { role: 'assistant', text: ZIELGRUPPEN_NACHFRAGE[this.langKey], art: 'nachfrage' },
        () => this.showSuggestions(followups),
      );
      return;
    }
    this.showSuggestions(followups);
  }

  private async requestChat(
    message: string,
    assistant: MessageEntry,
    allowCaptchaRetry: boolean,
  ): Promise<void> {
    const body: Record<string, unknown> = { message, hp_website: '' };
    const conversationId = lsGet(LS_CONVERSATION_KEY);
    if (conversationId) body.conversation_id = conversationId;
    const altcha = await this.takeAltcha();
    if (altcha) body.altcha = altcha;

    const ctrl = new AbortController();
    this.abortCtrl = ctrl;
    let timedOut = false;
    const timer = window.setTimeout(() => {
      timedOut = true;
      ctrl.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      let res: Response;
      try {
        res = await fetch(`${this.apiBase}/api/chat`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
      } catch {
        throw new ChatError(timedOut ? 'timeout' : 'network', 'fetch failed');
      }

      if (res.status === 429) throw new ChatError('rate_limit', 'rate limited');
      if (res.status === 400) {
        const data: unknown = await res.json().catch(() => null);
        const code =
          data && typeof data === 'object' && 'error' in data ? String(data.error) : '';
        if (code === 'captcha_required') {
          if (allowCaptchaRetry) {
            // Loesung war ungueltig/abgelaufen/replayed → frisch loesen, 1 Retry.
            window.clearTimeout(timer);
            this.altchaPending = null;
            this.captchaDisabled = false;
            return await this.requestChat(message, assistant, false);
          }
          throw new ChatError('captcha', 'captcha rejected');
        }
        if (code === 'invalid_message') throw new ChatError('invalid_message', 'invalid message');
        throw new ChatError('generic', `HTTP 400 ${code}`);
      }
      if (!res.ok) throw new ChatError('generic', `HTTP ${res.status}`);

      const newConversationId = res.headers.get('x-conversation-id');
      if (newConversationId) lsSet(LS_CONVERSATION_KEY, newConversationId);

      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('text/event-stream')) {
        // z. B. Honeypot-FakeOk — fuer echte Nutzer nicht erreichbar.
        throw new ChatError('generic', 'unexpected non-SSE response');
      }

      await this.consumeSse(res, assistant, () => timedOut);
    } catch (err) {
      if (err instanceof ChatError) throw err;
      throw new ChatError(timedOut ? 'timeout' : 'network', String(err));
    } finally {
      window.clearTimeout(timer);
      if (this.abortCtrl === ctrl) this.abortCtrl = null;
    }
  }

  /**
   * SSE-Stream lesen (fetch + ReadableStream, kein EventSource):
   * `data:`-Zeilen im OpenAI-Delta-Format (`choices[0].delta.content`),
   * Blocktrennung `\n\n`, Ende via `data: [DONE]`.
   * (Parser-Muster: GoCreate src/lib/dgx.ts, abgespeckt.)
   */
  private async consumeSse(
    res: Response,
    assistant: MessageEntry,
    isTimedOut: () => boolean,
  ): Promise<void> {
    const reader = res.body?.getReader();
    if (!reader) throw new ChatError('generic', 'missing response body');
    const decoder = new TextDecoder();
    let buffer = '';
    // Thinking-Modell: streamt erst sein Reasoning (endet mit </think>), dann die
    // Antwort. Bis </think> gesehen ist, wird nichts gerendert (kein Leak).
    let sawThinkClose = false;

    for (;;) {
      let chunk: ReadableStreamReadResult<Uint8Array>;
      try {
        chunk = await reader.read();
      } catch {
        throw new ChatError(isTimedOut() ? 'timeout' : 'network', 'stream aborted');
      }
      if (chunk.done) {
        this.finishRender(assistant);
        return;
      }
      buffer += decoder.decode(chunk.value, { stream: true });

      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';
      for (const eventBlock of events) {
        let dataPayload: string | null = null;
        for (const line of eventBlock.split('\n')) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) dataPayload = trimmed.slice(6).trim();
          else if (trimmed === 'data:') dataPayload = '';
        }
        if (dataPayload === null) continue;
        if (dataPayload === '[DONE]') {
          this.finishRender(assistant);
          return;
        }
        try {
          const parsed: unknown = JSON.parse(dataPayload);
          // Zusatz-Event des Servers vor [DONE]: vom Modell erzeugte
          // Fortsetzungsfragen fuer die Vorschlags-Chips (afterModelAnswer).
          const followups = extractFollowups(parsed);
          if (followups) this.lastFollowups = followups;
          const content = extractDeltaContent(parsed);
          if (content) {
            assistant.text += content;
            if (!sawThinkClose && /<\/think>/i.test(assistant.text)) sawThinkClose = true;
            // Erst rendern, wenn das Reasoning durch ist -> bis dahin bleibt der
            // Tipp-Indikator stehen. Danach nur die gestrippte Antwort live rendern.
            if (sawThinkClose && assistant.el) {
              assistant.el.innerHTML = renderMarkdown(visibleAnswer(assistant.text));
              this.scrollToEnd();
            }
          }
        } catch {
          // Nicht-JSON-Events (z. B. Kommentar-Pings) ignorieren.
        }
      }
    }
  }

  /** Stream-Ende: Reasoning entfernen, saubere Antwort rendern + als Verlauf sichern. */
  private finishRender(assistant: MessageEntry): void {
    assistant.text = visibleAnswer(assistant.text);
    // QS: Latenz = Anlegen der Blase (startChat-Beginn) bis fertig gerendert.
    assistant.latencyMs = Date.now() - (assistant.ts ?? Date.now());
    if (assistant.el) {
      assistant.el.innerHTML = renderMarkdown(assistant.text);
      this.scrollToEnd();
    }
    // Feedback + Transcript nur fuer echte Antworten — eine leer gebliebene
    // Blase (Stream ohne Inhalt) bekommt weder Leiste noch Meldung.
    if (assistant.text.trim() !== '') {
      this.attachFeedbackBar(assistant);
      this.queueQs(assistant);
    }
    // Ohne dieses Sichern verschwindet die fertige Antwort beim naechsten
    // Seitenwechsel: die Blase wurde beim Anlegen noch LEER gespeichert und
    // beim Wiederherstellen als "abgebrochen" verworfen.
    this.saveSession();
  }

  // --- Webchat-QS: Feedback + Transcript-Melder (/api/qs/*) ------------------
  // Beide Endpunkte sind idempotente Upserts (Server dedupliziert je
  // (sitzung_id, message_id)) — naives Nachsenden ist erlaubt und erwuenscht.
  // QS ist best effort: kein Fehlerpfad darf den Chat selbst stoeren.

  /**
   * Feedback-Leiste (Daumen hoch/runter + Kommentar) an eine FERTIGE
   * Assistent-Blase haengen (role assistant, nie error). Idempotent:
   * existiert schon eine .fb-Leiste (z. B. nach restoreSession), wird nur
   * der Zustand nachgezogen — sonst stuenden doppelte Leisten in der Blase.
   */
  private attachFeedbackBar(entry: MessageEntry): void {
    if (entry.role !== 'assistant' || !entry.el) return;
    if (entry.el.querySelector('.fb')) {
      this.syncFeedbackBar(entry);
      return;
    }
    const t = this.texts;
    const mkBtn = (cls: string, label: string, icon: string): HTMLButtonElement => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = cls;
      b.setAttribute('aria-label', label);
      b.setAttribute('title', label);
      b.innerHTML = icon;
      return b;
    };
    const bar = document.createElement('div');
    bar.className = 'fb';
    const up = mkBtn('fb-up', t.fbUp, FB_ICON_UP);
    const down = mkBtn('fb-down', t.fbDown, FB_ICON_DOWN);
    const cmt = mkBtn('fb-comment', t.fbComment, FB_ICON_COMMENT);
    bar.append(up, down, cmt);

    // Kommentar-Anzeige unter der Leiste. Befuellung ausschliesslich per
    // textContent (syncFeedbackBar) — Nutzertext wird nie als HTML geparst
    // (gleiches Sicherheitsniveau wie escapeHtml, ohne HTML-Parser).
    const note = document.createElement('div');
    note.className = 'fb-note';
    note.hidden = true;

    // Inline-Kommentar-Formular (zugeklappt; 'Senden' uebernimmt, 'Abbrechen'
    // verwirft). Bewusst ein div, kein <form> — kein implizites Submit.
    const form = document.createElement('div');
    form.className = 'fb-form';
    form.hidden = true;
    const ta = document.createElement('textarea');
    ta.maxLength = MAX_MESSAGE_CHARS;
    ta.setAttribute('aria-label', t.fbComment);
    const actions = document.createElement('div');
    actions.className = 'fb-actions';
    const sendB = document.createElement('button');
    sendB.type = 'button';
    sendB.className = 'fb-send';
    sendB.textContent = t.send;
    const cancelB = document.createElement('button');
    cancelB.type = 'button';
    cancelB.className = 'fb-cancel';
    cancelB.textContent = t.fbCancel;
    actions.append(sendB, cancelB);
    form.append(ta, actions);

    const vote = (v: 1 | -1): void => {
      // Klick auf den bereits aktiven Daumen = Wertung zuruecknehmen (vote 0).
      if (entry.rating === v) delete entry.rating;
      else entry.rating = v;
      this.syncFeedbackBar(entry);
      this.saveSession();
      this.sendFeedback(entry);
    };
    up.addEventListener('click', () => vote(1));
    down.addEventListener('click', () => vote(-1));
    cmt.addEventListener('click', () => {
      form.hidden = !form.hidden;
      cmt.setAttribute('aria-expanded', String(!form.hidden));
      if (!form.hidden) {
        // Bestehenden Kommentar zum erneuten Bearbeiten vorbelegen.
        ta.value = entry.comment ?? '';
        ta.focus();
      }
    });
    sendB.addEventListener('click', () => {
      const text = ta.value.trim();
      if (text === '') delete entry.comment;
      else entry.comment = text;
      form.hidden = true;
      cmt.setAttribute('aria-expanded', 'false');
      this.syncFeedbackBar(entry);
      this.saveSession();
      this.sendFeedback(entry);
    });
    cancelB.addEventListener('click', () => {
      form.hidden = true;
      cmt.setAttribute('aria-expanded', 'false');
    });

    entry.el.append(bar, note, form);
    this.syncFeedbackBar(entry);
  }

  /** Zustand (aktiver Daumen, Kommentar-Text) in die bestehende Leiste spiegeln. */
  private syncFeedbackBar(entry: MessageEntry): void {
    const el = entry.el;
    if (!el) return;
    const up = el.querySelector('.fb-up');
    const down = el.querySelector('.fb-down');
    up?.classList.toggle('active', entry.rating === 1);
    up?.setAttribute('aria-pressed', String(entry.rating === 1));
    down?.classList.toggle('active', entry.rating === -1);
    down?.setAttribute('aria-pressed', String(entry.rating === -1));
    const note = el.querySelector<HTMLElement>('.fb-note');
    if (note) {
      if (entry.comment) {
        // textContent statt innerHTML: Nutzertext darf NIE als Markup enden.
        note.textContent = `${this.texts.fbYourComment}: ${entry.comment}`;
        note.hidden = false;
      } else {
        note.textContent = '';
        note.hidden = true;
      }
    }
  }

  /** Feedback-Upsert mit 300-ms-Debounce je Nachricht: Schnellklicks
   *  (hoch->runter->hoch) wuerden sonst mehrere POSTs racen, deren
   *  Reihenfolge der Server nicht kennt. Gesendet wird IMMER der volle
   *  aktuelle Zustand (vote + kommentar); vote 0 = zurueckgenommen. */
  private sendFeedback(entry: MessageEntry): void {
    const prev = this.fbTimers.get(entry);
    if (prev !== undefined) window.clearTimeout(prev);
    this.fbTimers.set(entry, window.setTimeout(() => {
      this.fbTimers.delete(entry);
      this.postFeedback(entry, false);
    }, 300));
  }

  /** POST /api/qs/feedback — fire-and-forget. */
  private postFeedback(entry: MessageEntry, beacon: boolean): void {
    if (!entry.qsId) return;
    if (this.sitzungId === '') this.sitzungId = uuid();
    this.postQs('feedback', JSON.stringify({
      sitzung_id: this.sitzungId,
      message_id: entry.qsId,
      vote: entry.rating ?? 0,
      kommentar: entry.comment ?? null,
      ts: new Date().toISOString(),
      hp_website: '',
    }), beacon);
  }

  /** Nachricht fuer den Transcript-Melder vormerken (Debounce 2 s). Nur fuer
   *  FERTIGE Nachrichten aufrufen — nie fuer die leere pending-Blase. */
  private queueQs(entry: MessageEntry): void {
    if (entry.qsSent || this.qsQueue.includes(entry)) return;
    this.qsQueue.push(entry);
    if (this.qsTimer !== null) window.clearTimeout(this.qsTimer);
    this.qsTimer = window.setTimeout(() => {
      this.qsTimer = null;
      this.flushQs(false);
    }, 2000);
  }

  /** Queue als Batch(es) an POST /api/qs/transcript melden (max 40/Batch). */
  private flushQs(beacon: boolean): void {
    if (this.qsTimer !== null) {
      window.clearTimeout(this.qsTimer);
      this.qsTimer = null;
    }
    // Zurueckgezogene Eintraege (z. B. per "Erneut versuchen" entfernte
    // Fehlerblasen) nicht mehr melden.
    this.qsQueue = this.qsQueue.filter((m) => this.messages.includes(m));
    while (this.qsQueue.length > 0) {
      const batch = this.qsQueue.splice(0, 40);
      if (this.sitzungId === '') this.sitzungId = uuid();
      const letzte = [...this.messages].reverse().find((m) => m.role === 'assistant');
      const nachrichten = batch.map((m) => ({
        message_id: m.qsId ?? uuid(),
        idx: this.messages.indexOf(m),
        rolle: m.role === 'user' ? 'user' : 'assistant',
        art: m.art ?? (m.role === 'user' ? 'frage' : 'antwort'),
        markdown: m.text,
        ts_client: new Date(m.ts ?? Date.now()).toISOString(),
        ...(typeof m.latencyMs === 'number' ? { latenz_ms: m.latencyMs } : {}),
        // Die aktuell gezeigten Chips gehoeren zur LETZTEN Assistent-Nachricht.
        ...(m === letzte && this.suggestLabels.length > 0 ? { vorschlaege: this.suggestLabels } : {}),
      }));
      const body: Record<string, unknown> = {
        sitzung_id: this.sitzungId,
        locale: this.lang || this.langKey,
        hp_website: '',
        nachrichten,
      };
      const conversationId = lsGet(LS_CONVERSATION_KEY);
      if (conversationId) body.conversation_id = conversationId;
      // Optimistisch als gesendet markieren (spart Traffic); schlaegt der
      // fetch fehl, kommt der Batch fuer den naechsten Flush zurueck.
      for (const m of batch) m.qsSent = true;
      this.postQs('transcript', JSON.stringify(body), beacon, () => this.requeueQs(batch));
    }
  }

  /** Fehlgeschlagenen Batch fuer den naechsten Flush vormerken (kein eigener
   *  Retry-Timer — der naechste natuerliche Flush bzw. pagehide nimmt ihn mit). */
  private requeueQs(batch: MessageEntry[]): void {
    for (const m of batch) {
      m.qsSent = false;
      if (!this.qsQueue.includes(m)) this.qsQueue.push(m);
    }
  }

  /** Alles Offene rausschicken (pagehide/disconnect/reset): erst faellige
   *  Feedback-Debounces, dann die Transcript-Queue. */
  private flushAllQs(beacon: boolean): void {
    for (const [entry, timer] of this.fbTimers) {
      window.clearTimeout(timer);
      this.postFeedback(entry, beacon);
    }
    this.fbTimers.clear();
    this.flushQs(beacon);
  }

  /** Transport fuer POST /api/qs/<pfad>: fetch (normal) bzw. sendBeacon
   *  (pagehide). Der text/plain-Blob beim Beacon ist Absicht — preflight-frei
   *  cross-origin, der Server parst tolerant. */
  private postQs(pfad: string, json: string, beacon: boolean, onFail?: () => void): void {
    const url = `${this.apiBase}/api/qs/${pfad}`;
    if (beacon && typeof navigator.sendBeacon === 'function') {
      try {
        navigator.sendBeacon(url, new Blob([json], { type: 'text/plain' }));
      } catch {
        /* best effort beim Verlassen der Seite */
      }
      return;
    }
    void fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: json,
    })
      .then((res) => { if (!res.ok) onFail?.(); })
      .catch(() => onFail?.());
  }

  // --- Events ----------------------------------------------------------------

  private emit(name: string, detail?: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }
}

/** `spass_followups` (Server-Zusatz-Event vor `[DONE]`) aus einem SSE-Event
 *  ziehen: Array von Fortsetzungsfragen. `null` = Feld nicht vorhanden. */
function extractFollowups(parsed: unknown): string[] | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const raw = (parsed as { spass_followups?: unknown }).spass_followups;
  if (!Array.isArray(raw)) return null;
  return raw.filter((f): f is string => typeof f === 'string' && f.trim() !== '');
}

/** `choices[0].delta.content` aus einem OpenAI-chat.completion.chunk ziehen. */
function extractDeltaContent(parsed: unknown): string {
  if (!parsed || typeof parsed !== 'object') return '';
  const choices = (parsed as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return '';
  const delta = (choices[0] as { delta?: unknown }).delta;
  if (!delta || typeof delta !== 'object') return '';
  const content = (delta as { content?: unknown }).content;
  return typeof content === 'string' ? content : '';
}

/**
 * Reasoning aus dem Antworttext entfernen (GoCreate src/lib/dgx.ts-Muster).
 * Die DGX-Streaming-Antwort liefert das Chain-of-Thought der Thinking-Modelle
 * im `delta.content` (Reasoning ... `</think>` ... eigentliche Antwort), waehrend
 * der Non-Stream-Pfad es sauber in `provider_specific_fields.reasoning` trennt.
 * Ohne dieses Stripping wuerde der interne Denk-Block im Kundenfenster erscheinen.
 * Regeln: (1) vollstaendige `<think>...</think>`-Paare raus; (2) geleaktes
 * Reasoning ohne oeffnendes Tag = alles bis zum letzten `</think>` ist Reasoning;
 * (3) noch offenes `<think>` (Stream mitten im Denken) = ab dem Tag abschneiden.
 */
function visibleAnswer(raw: string): string {
  let t = raw.replace(/<think>[\s\S]*?<\/think>/gi, '');
  const lower = t.toLowerCase();
  const closeIdx = lower.lastIndexOf('</think>');
  if (closeIdx !== -1) {
    t = t.slice(closeIdx + '</think>'.length);
  } else if (lower.includes('<think>')) {
    t = t.slice(0, lower.indexOf('<think>'));
  }
  return t.replace(/^[\s\n]+/, '');
}

/** UUID v4 fuer QS-IDs. crypto.randomUUID braucht einen Secure Context —
 *  Fallback fuer exotische Einbindungen, damit die QS nie den Chat bricht. */
function uuid(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* weiter zum Fallback */
  }
  let out = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) out += '-';
    else if (i === 14) out += '4';
    else {
      const r = Math.floor(Math.random() * 16);
      out += (i === 19 ? ((r & 3) | 8) : r).toString(16);
    }
  }
  return out;
}

// sessionStorage kann — wie localStorage — in Privacy-Modi werfen.
function ssGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function ssSet(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}
function ssRemove(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

// localStorage kann in Privacy-Modi werfen — defensiv kapseln.
function lsGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function lsSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}
function lsRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

if (!customElements.get(TAG_NAME)) {
  customElements.define(TAG_NAME, GodelmannChatbot);
}
