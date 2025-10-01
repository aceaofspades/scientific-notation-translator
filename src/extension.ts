import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const toggleCmd = vscode.commands.registerCommand(
    'scientific-notation-translator.convertSelection',
    async () => runConvert({ mode: 'toggle' })
  );

  const backCmd = vscode.commands.registerCommand(
    'scientific-notation-translator.convertSciToPlain',
    async () => runConvert({ mode: 'sciToPlainOnly' })
  );

  context.subscriptions.push(toggleCmd, backCmd);
}
export function deactivate() {}

type Mode = 'toggle' | 'sciToPlainOnly';

async function runConvert({ mode }: { mode: Mode }) {
  const ed = vscode.window.activeTextEditor;
  if (!ed) return;

  const cfg = vscode.workspace.getConfiguration();
  const sig = clamp(cfg.get<number>('scientific-notation-translator.significantDigits') ?? 5, 1, 21);
  const lower = Number(cfg.get<number>('scientific-notation-translator.lowerThreshold') ?? 0.01);
  const upper = Number(cfg.get<number>('scientific-notation-translator.upperThreshold') ?? 999);
  const alwaysAll = Boolean(cfg.get<boolean>('scientific-notation-translator.alwaysConvertAllNumbers') ?? false);
  const capital = Boolean(cfg.get<boolean>('scientific-notation-translator.capitalE') ?? false);

  const sels = ed.selections.some(s => !s.isEmpty)
    ? ed.selections
    : [new vscode.Selection(0, 0, ed.document.lineCount, 0)];

  await ed.edit(b => {
    for (const sel of sels) {
      const text = ed.document.getText(sel);

      // Decide operation:
      const hasQualifyingPlain = mode !== 'sciToPlainOnly' && containsQualifyingPlainNumber(text, lower, upper, alwaysAll);
      const hasSci = containsSciNumber(text);

      let out = text;
      if (hasQualifyingPlain) {
        out = convertPlainToSci(text, sig, lower, upper, alwaysAll, capital);
      } else if (hasSci) {
        out = convertSciToPlain(text);
      }
      b.replace(sel, out);
    }
  });
}

/* ---------- Matching rules ---------- */

// Standalone plain numbers (no adjacent word char or '.'); optional sign; disallow exponent part.
const PLAIN_STANDALONE = /(?<![\w.])[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?![\w.])/g;
// Standalone scientific notation
const SCI_STANDALONE   = /(?<![\w.])[-+]?(?:\d+(?:\.\d*)?|\.\d+)[eE][-+]?\d+(?![\w.])/g;

function containsQualifyingPlainNumber(s: string, lower: number, upper: number, all: boolean): boolean {
  PLAIN_STANDALONE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PLAIN_STANDALONE.exec(s))) {
    const num = Number(m[0]);
    if (!Number.isFinite(num)) continue;
    if (all || qualifiesForSci(num, lower, upper)) return true;
  }
  return false;
}

function containsSciNumber(s: string): boolean {
  SCI_STANDALONE.lastIndex = 0;
  return SCI_STANDALONE.test(s);
}

/* ---------- Converters ---------- */

function convertPlainToSci(input: string, sig: number, lower: number, upper: number, all: boolean, capital: boolean): string {
  return input.replace(PLAIN_STANDALONE, (raw) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return raw;
    if (!all && !qualifiesForSci(n, lower, upper)) return raw;

    // JS uses digits = total significant figures; then trim zeros.
    const exp = n.toExponential(sig - 1);
    return normalizeSci(exp, capital);
  });
}

function convertSciToPlain(input: string): string {
  return input.replace(SCI_STANDALONE, (raw) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return raw;
    return toPlainNoExp(n);
  });
}

/* ---------- Policies ---------- */

function qualifiesForSci(n: number, lower: number, upper: number): boolean {
  if (n === 0) return false; // by rule: 0 is inside [0, lower] and should NOT convert
  const a = Math.abs(n);
  return a > upper || a < lower;
}

/* ---------- Formatting helpers ---------- */

// Normalize sci: insert e/E, trim trailing zeros/dot on mantissa (no silly 1.000000E+00).
function normalizeSci(expLower: string, capital: boolean): string {
  // expLower like "1.234500e+03"
  let [mant, epart] = expLower.split('e');
  mant = trimTrailingZeros(mant);
  const E = epart.startsWith('+') || epart.startsWith('-') ? epart : `+${epart}`;
  return `${mant}${capital ? 'E' : 'e'}${E}`;
}

// Convert number to a plain-decimal string with no exponent and no trailing zeros.
function toPlainNoExp(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);

  // If JS already gives non-exponential, just tidy it.
  const s = String(abs);
  if (!/[eE]/.test(s)) return sign + trimTrailingZeros(s);

  // Expand manually from exponential form to plain.
  const [mantRaw, eRaw] = abs.toExponential().split('e');
  const e = parseInt(eRaw, 10);
  const mant = mantRaw.replace('.', '');      // digits only
  const decLen = (mantRaw.split('.')[1]?.length ?? 0);

  if (e >= 0) {
    // shift decimal right
    const zeros = Math.max(0, e - decLen);
    const intPart = mant + '0'.repeat(zeros);
    const cut = mant.length + e - decLen;
    const whole = intPart.slice(0, cut) || '0';
    const frac  = intPart.slice(cut);
    const joined = frac ? `${whole}.${frac}` : whole;
    return sign + trimTrailingZeros(joined);
  } else {
    // shift decimal left
    const zeros = '0'.repeat(Math.max(0, (-e - 1)));
    const joined = `0.${zeros}${mant}`;
    return sign + trimTrailingZeros(joined);
  }
}

// Remove trailing zeros in fraction and any dangling dot.
function trimTrailingZeros(x: string): string {
  if (!x.includes('.')) return x;
  x = x.replace(/(?:\.0+|(\.\d*?[1-9]))0+$/u, '$1');  // trim end zeros
  if (x.endsWith('.')) x = x.slice(0, -1);
  return x;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}
