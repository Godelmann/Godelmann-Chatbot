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
  errRateLimit: string;
  errCaptcha: string;
  errNetwork: string;
  errTimeout: string;
  errInvalidMessage: string;
  errGeneric: string;
  retry: string;
}

const TEXTS: Record<'de' | 'en', Texts> = {
  de: {
    bubbleOpen: 'Godelmann-Assistent oeffnen',
    bubbleClose: 'Godelmann-Assistent schliessen',
    headerTitle: 'Godelmann-Assistent',
    greeting:
      'Willkommen bei GODELMANN! Sind Sie Fachkunde oder Endkunde? ' +
      'Waehlen Sie einfach eine Option oder schreiben Sie mir direkt Ihre Frage.',
    inputPlaceholder: 'Ihre Frage …',
    send: 'Senden',
    newConversation: 'Neue Unterhaltung',
    privacy: 'Anonymer Chat — bitte keine personenbezogenen Daten eingeben.',
    privacyLink: 'Datenschutz',
    close: 'Chat schliessen',
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
  },
  en: {
    bubbleOpen: 'Open Godelmann assistant',
    bubbleClose: 'Close Godelmann assistant',
    headerTitle: 'Godelmann Assistant',
    greeting:
      'Welcome to GODELMANN! Are you a trade professional or a private customer? ' +
      'Pick an option or just type your question.',
    inputPlaceholder: 'Your question …',
    send: 'Send',
    newConversation: 'New conversation',
    privacy: 'Anonymous chat — please do not enter personal data.',
    privacyLink: 'Privacy policy',
    close: 'Close chat',
    errRateLimit:
      'Too many requests right now. Please try again in a few minutes ' +
      '(at most 10 messages per 10 minutes).',
    errCaptcha: 'The security check failed. Please send your message again.',
    errNetwork: 'Connection failed. Please check your internet connection.',
    errTimeout: 'The answer took too long. Please try again.',
    errInvalidMessage: 'The message is empty or too long (2000 characters max).',
    errGeneric: 'Something went wrong. Please try again.',
    retry: 'Retry',
  },
};

// ---------------------------------------------------------------------------
// Guided Selling / Zielgruppen-Weiche (Ablaufplan Heike, 20.07.)
// docs/ABLAUFPLAN-HEIKE-2026-07-20.md. Die Button-Menues laufen IM Widget vor
// dem KI-Modell; die meisten Aktionen stellen eine geerdete Frage an den Bot
// (echte godelmann.de-Quellen aus der Wissensbasis, keine hartkodierten Links).
// ---------------------------------------------------------------------------

type Branch = 'endkunde' | 'fachkunde';
interface QuickAction { label: string; ask?: string; special?: 'plz' }

const BRANCH_INTRO: Record<'de' | 'en', Record<Branch, string>> = {
  de: {
    endkunde: 'Schoen, dass Sie da sind. Wobei koennen wir Sie unterstuetzen?',
    fachkunde: 'Willkommen im Fachkundenbereich. Wobei koennen wir Sie unterstuetzen?',
  },
  en: {
    endkunde: 'Great to have you here. How can we help you?',
    fachkunde: 'Welcome to the trade area. How can we help you?',
  },
};

const BRANCH_ACTIONS: Record<'de' | 'en', Record<Branch, QuickAction[]>> = {
  de: {
    endkunde: [
      { label: 'Produkte entdecken', ask: 'Welche Produkte bietet Godelmann fuer Garten, Terrasse und Einfahrt?' },
      { label: 'Inspirationen fuer Garten & Terrasse', ask: 'Zeigen Sie mir Inspirationen und Gestaltungsideen fuer Garten und Terrasse von Godelmann.' },
      { label: 'Gartenbuch', ask: 'Wo finde ich das aktuelle Godelmann-Gartenbuch zum Herunterladen?' },
      { label: 'Neuheiten', ask: 'Was sind die aktuellen Neuheiten von Godelmann?' },
      { label: 'Ideengarten besuchen', ask: 'Wo gibt es einen Godelmann-Ideengarten, den ich besuchen kann?' },
      { label: 'Haendlersuche', ask: 'Wie finde ich einen Godelmann-Haendler in meiner Naehe?' },
      { label: 'Service-Hotline', ask: 'Wie erreiche ich die GODELMANN-Beratung bzw. Service-Hotline?' },
    ],
    fachkunde: [
      { label: 'Produkte', ask: 'Welche Produkte bietet Godelmann fuer die Objektplanung?' },
      { label: 'Themen zur Objektplanung', ask: 'Welche Themen und Loesungen bietet Godelmann fuer die Objektplanung?' },
      { label: 'Mediathek (Downloads, Ausschreibung, BIM/CAD)', ask: 'Was finde ich in der Godelmann-Mediathek — Ausschreibungstexte, Datenblaetter, BIM- und CAD-Daten?' },
      { label: 'Referenzen', ask: 'Zeigen Sie mir Godelmann-Referenzprojekte, z. B. fuer oeffentliche Plaetze.' },
      { label: 'Ansprechpartner finden', special: 'plz' },
    ],
  },
  en: {
    endkunde: [
      { label: 'Discover products', ask: 'Which Godelmann products are available for garden, terrace and driveway?' },
      { label: 'Inspiration for garden & terrace', ask: 'Show me inspiration and design ideas for garden and terrace by Godelmann.' },
      { label: 'Garden book', ask: 'Where can I download the current Godelmann garden book?' },
      { label: 'New products', ask: 'What are the latest Godelmann product news?' },
      { label: 'Visit an idea garden', ask: 'Where can I visit a Godelmann idea garden?' },
      { label: 'Find a dealer', ask: 'How do I find a Godelmann dealer near me?' },
      { label: 'Service hotline', ask: 'How do I reach the GODELMANN advisory / service hotline?' },
    ],
    fachkunde: [
      { label: 'Products', ask: 'Which Godelmann products are relevant for object planning?' },
      { label: 'Object planning topics', ask: 'Which topics and solutions does Godelmann offer for object planning?' },
      { label: 'Media library (downloads, tender texts, BIM/CAD)', ask: 'What is in the Godelmann media library — tender texts, datasheets, BIM and CAD data?' },
      { label: 'References', ask: 'Show me Godelmann reference projects, e.g. for public spaces.' },
      { label: 'Find a contact person', special: 'plz' },
    ],
  },
};

const WEICHE_LABELS: Record<'de' | 'en', { fach: string; end: string }> = {
  de: { fach: 'Fachkunde', end: 'Endkunde' },
  en: { fach: 'Trade professional', end: 'Private customer' },
};

const PLZ_PROMPT: Record<'de' | 'en', string> = {
  de: 'Bitte geben Sie Ihre Postleitzahl ein, dann nenne ich Ihnen Ihren zustaendigen Ansprechpartner.',
  en: 'Please enter your postal code and I will name your responsible contact person.',
};

// Platzhalter bis die Vertriebs-Adressliste (PLZ -> Ansprechpartner) vorliegt.
const PLZ_PLACEHOLDER: Record<'de' | 'en', string> = {
  de: 'Danke! Die persoenliche Ansprechpartner-Zuordnung nach Postleitzahl wird gerade eingerichtet — die Vertriebs-Adressliste folgt in Kuerze. Bis dahin beantworte ich Ihre fachliche Frage gerne direkt hier, oder Sie fragen mich nach den allgemeinen Kontaktmoeglichkeiten von GODELMANN.',
  en: 'Thank you! The personal contact assignment by postal code is being set up — the sales address list will follow shortly. In the meantime I am happy to answer your technical question directly here, or ask me for GODELMANN\'s general contact options.',
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
  // Links: nur absolute http/https-URLs; Ziel escaped (Quotes sind bereits
  // Entities, koennen das href-Attribut also nicht verlassen).
  let out = escaped.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s()<>]+)\)/g,
    (_m, label: string, url: string) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`,
  );
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return out;
}

/** Blockweiser Renderer: Absaetze, ungeordnete/geordnete Listen. */
function renderMarkdown(src: string): string {
  const html: string[] = [];
  let para: string[] = [];
  let list: { tag: 'ul' | 'ol'; items: string[] } | null = null;

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

  for (const rawLine of src.split('\n')) {
    const line = rawLine.trimEnd();
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
    --_accent: var(--gdm-chat-accent, #E52D12);
    --_z: var(--gdm-chat-z-index, 2147483000);
    --_font: var(--gdm-chat-font, inherit);
  }
  *, *::before, *::after { box-sizing: border-box; }

  .root { font-family: var(--_font); font-size: 15px; line-height: 1.45; color: #1c1c1c; }

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
  .bubble:hover { transform: scale(1.06); }
  .bubble:focus-visible { outline: 3px solid #1c1c1c; outline-offset: 2px; }
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

  .messages {
    flex: 1 1 auto; overflow-y: auto; padding: 14px;
    display: flex; flex-direction: column; gap: 10px;
    background: #f7f7f7;
  }
  .msg { max-width: 86%; padding: 8px 12px; border-radius: 10px; overflow-wrap: break-word; }
  .msg.user { align-self: flex-end; background: var(--_accent); color: #fff; border-bottom-right-radius: 3px; }
  .msg.assistant { align-self: flex-start; background: #fff; border: 1px solid #e3e3e3; border-bottom-left-radius: 3px; }
  .quickreplies { display: flex; flex-wrap: wrap; gap: 6px; align-self: flex-start; max-width: 92%; margin: 2px 0 2px; }
  .qr {
    border: 1px solid var(--_accent); color: var(--_accent); background: #fff;
    border-radius: 999px; padding: 6px 12px; font: inherit; font-size: 13px;
    line-height: 1.2; cursor: pointer; transition: background .12s, color .12s;
  }
  .qr:hover { background: var(--_accent); color: #fff; }
  .qr:focus-visible { outline: 2px solid var(--_accent); outline-offset: 2px; }
  .msg.error { align-self: flex-start; background: #fdf0ee; border: 1px solid var(--_accent); color: #8c1c0b; }
  .msg p { margin: 0 0 8px; }
  .msg p:last-child { margin-bottom: 0; }
  .msg ul, .msg ol { margin: 4px 0; padding-left: 20px; }
  .msg a { color: var(--_accent); text-decoration: underline; }
  .msg.user a { color: #fff; }
  .msg .retry {
    display: block; margin-top: 8px; border: 1px solid var(--_accent);
    background: #fff; color: var(--_accent); border-radius: 6px;
    padding: 5px 10px; cursor: pointer; font: inherit; font-size: 13px;
  }
  .msg .retry:hover { background: var(--_accent); color: #fff; }
  .msg.pending::after {
    content: ''; display: inline-block; width: 9px; height: 9px;
    margin-left: 6px; border-radius: 50%; background: var(--_accent);
    animation: gdm-pulse 1s ease-in-out infinite;
  }
  @keyframes gdm-pulse { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }

  .inputrow {
    display: flex; gap: 8px; padding: 10px 12px; background: #fff;
    border-top: 1px solid #e3e3e3; flex-shrink: 0;
  }
  .inputrow textarea {
    flex: 1 1 auto; resize: none; border: 1px solid #c9c9c9; border-radius: 8px;
    padding: 8px 10px; font: inherit; min-height: 38px; max-height: 110px;
    background: #fff; color: #1c1c1c;
  }
  .inputrow textarea:focus-visible { outline: 2px solid var(--_accent); outline-offset: -1px; }
  .inputrow .send {
    flex-shrink: 0; border: none; border-radius: 8px; padding: 8px 14px;
    background: var(--_accent); color: #fff; font: inherit; font-weight: 700;
    cursor: pointer;
  }
  .inputrow .send:disabled { opacity: 0.55; cursor: default; }
  .inputrow .send:focus-visible { outline: 2px solid #1c1c1c; outline-offset: 1px; }

  .privacy {
    padding: 6px 12px 10px; background: #fff; flex-shrink: 0;
    font-size: 12px; color: #6b6b6b;
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
`;

const BUBBLE_ICON = `
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H9.4L5.6 19.6c-.66.53-1.6.06-1.6-.78V5.5Z"
      fill="currentColor"/>
    <circle cx="8.6" cy="9.6" r="1.15" fill="#E52D12" class="dot"/>
    <circle cx="12" cy="9.6" r="1.15" fill="#E52D12" class="dot"/>
    <circle cx="15.4" cy="9.6" r="1.15" fill="#E52D12" class="dot"/>
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
}

export class GodelmannChatbot extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['lang', 'position', 'api-base', 'greeting'];
  }

  private readonly root: ShadowRoot;
  private rootDiv!: HTMLDivElement;
  private bubbleBtn!: HTMLButtonElement;
  private panel!: HTMLDivElement;
  private titleEl!: HTMLSpanElement;
  private newBtn!: HTMLButtonElement;
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
  private weicheRow: HTMLElement | null = null;

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

  connectedCallback(): void {
    if (!this.rootDiv) this.buildDom();
    this.applyPosition();
    this.applyTexts();
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
    this.panel.setAttribute('aria-modal', 'true');
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
    this.closeBtn = document.createElement('button');
    this.closeBtn.type = 'button';
    this.closeBtn.className = 'close';
    this.closeBtn.textContent = '×';
    this.closeBtn.addEventListener('click', () => this.close());
    header.append(this.titleEl, this.newBtn, this.closeBtn);

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
        if (m.el) m.el.innerHTML = renderMarkdown(m.text);
      }
    }
  }

  // --- Oeffnen / Schliessen ------------------------------------------------

  private toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
  }

  private open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.panel.hidden = false;
    this.bubbleBtn.setAttribute('aria-expanded', 'true');
    this.bubbleBtn.setAttribute('aria-label', this.texts.bubbleClose);
    if (this.messages.length === 0) {
      this.appendMessage({ role: 'assistant', text: this.greetingText, isGreeting: true });
      this.showZielgruppenWeiche();
    }
    // ALTCHA vorloesen, damit die erste Nachricht ohne Wartezeit rausgeht.
    this.ensureAltcha();
    this.input.focus();
    this.emit('gdm-chat:opened');
  }

  private close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.panel.hidden = true;
    this.bubbleBtn.setAttribute('aria-expanded', 'false');
    this.bubbleBtn.setAttribute('aria-label', this.texts.bubbleOpen);
    this.bubbleBtn.focus();
    this.emit('gdm-chat:closed');
  }

  private resetConversation(): void {
    this.abortCtrl?.abort();
    this.abortCtrl = null;
    this.busy = false;
    this.sendBtn.disabled = false;
    lsRemove(LS_CONVERSATION_KEY);
    this.messages = [];
    this.messagesEl.replaceChildren();
    this.stage = 'greeting';
    this.awaitingPlz = false;
    this.weicheRow = null;
    this.appendMessage({ role: 'assistant', text: this.greetingText, isGreeting: true });
    this.showZielgruppenWeiche();
    this.input.focus();
  }

  // --- Barrierefreiheit: Fokus-Trap + ESC ---------------------------------

  private onPanelKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
      return;
    }
    if (e.key !== 'Tab') return;
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
    const el = document.createElement('div');
    el.className = `msg ${entry.role}`;
    el.innerHTML = renderMarkdown(entry.text);
    entry.el = el;
    this.messages.push(entry);
    this.messagesEl.appendChild(el);
    this.scrollToEnd();
    return entry;
  }

  // --- Guided Selling / Zielgruppen-Weiche (Ablaufplan Heike, 20.07.) -------

  private appendQuickReplies(items: { label: string; onClick: () => void }[], once = false): HTMLElement {
    const row = document.createElement('div');
    row.className = 'quickreplies';
    for (const it of items) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'qr';
      b.textContent = it.label;
      b.addEventListener('click', () => {
        if (once) row.remove();
        it.onClick();
      });
      row.appendChild(b);
    }
    this.messagesEl.appendChild(row);
    this.scrollToEnd();
    return row;
  }

  /** Begruessung -> Buttons "Fachkunde / Endkunde" (Schritt 1 des Ablaufplans). */
  private showZielgruppenWeiche(): void {
    const l = WEICHE_LABELS[this.langKey];
    this.weicheRow = this.appendQuickReplies(
      [
        { label: l.fach, onClick: () => this.chooseBranch('fachkunde') },
        { label: l.end, onClick: () => this.chooseBranch('endkunde') },
      ],
      true,
    );
  }

  /** Zielgruppe gewaehlt -> passendes Guided-Selling-Menue (Schritt 2/3). */
  private chooseBranch(branch: Branch): void {
    this.stage = branch;
    this.weicheRow = null;
    this.appendMessage({ role: 'assistant', text: BRANCH_INTRO[this.langKey][branch] });
    this.appendQuickReplies(
      BRANCH_ACTIONS[this.langKey][branch].map((a) => ({
        label: a.label,
        onClick: () => this.runQuickAction(a),
      })),
    );
  }

  private runQuickAction(a: QuickAction): void {
    if (a.special === 'plz') {
      // Fachkunde-Ansprechpartner: PLZ erfragen (Zuordnung folgt mit Adressliste).
      this.awaitingPlz = true;
      this.appendMessage({ role: 'assistant', text: PLZ_PROMPT[this.langKey] });
      this.input.focus();
      return;
    }
    if (a.ask) void this.startChat(a.ask);
  }

  private appendErrorMessage(text: string, retryText?: string): void {
    const entry = this.appendMessage({ role: 'error', text });
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
      this.appendMessage({ role: 'assistant', text: PLZ_PLACEHOLDER[this.langKey] });
      return;
    }

    // Begruessung: Freitext -> Zielgruppe automatisch erkennen (Heikes
    // Stichwortlisten) und stumm zuordnen; Weiche-Buttons entfernen.
    if (this.stage === 'greeting') {
      this.stage = classifyBranch(text) ?? 'endkunde';
      this.weicheRow?.remove();
      this.weicheRow = null;
    }

    await this.startChat(text);
  }

  private async startChat(text: string): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.sendBtn.disabled = true;

    this.appendMessage({ role: 'user', text });
    this.emit('gdm-chat:message-sent', { message: text });
    const assistant = this.appendMessage({ role: 'assistant', text: '' });
    assistant.el?.classList.add('pending');

    try {
      await this.requestChat(text, assistant, true);
      this.emit('gdm-chat:response-received', { message: assistant.text });
    } catch (err) {
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
    if (assistant.el) {
      assistant.el.innerHTML = renderMarkdown(assistant.text);
      this.scrollToEnd();
    }
  }

  // --- Events ----------------------------------------------------------------

  private emit(name: string, detail?: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }
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
