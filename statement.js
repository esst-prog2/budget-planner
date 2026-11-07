// Reads a bank statement (.xlsx) in the browser and sorts its transactions
// into the planner's categories. No libraries: an .xlsx file is a zip of
// XML files, unpacked here with the browser's own DecompressionStream.
// Loaded before app.js; the tests load it with require().

// The deposit statement's amounts are in tögrög; the app converts them to HUF.
const STATEMENT_CURRENCY = 'MNT';

// Column headers of the deposit statement (Mongolian): date, money in,
// money out, description.
const STATEMENT_HEADERS = {
  time: 'Огноо',
  moneyIn: 'Орлого',
  moneyOut: 'Зарлага',
  description: 'Гүйлгээний утга',
};

// Money sent to people or to your own accounts: listed, but not spending.
const TRANSFER_PATTERN = /илгээв|шилжүүлэв|Transfer/iu;

// Bank fees and charges: spending, always in "other".
const FEE_PATTERN = /шимтгэл|Charge - Capitalise/iu;

// Shop names, matched at the start of a word. A purchase with no known shop,
// such as one that only says "POS Normal Purchase", is "unknown".
const CATEGORY_KEYWORDS = {
  food: ['CBA', 'SPAR', 'LIDL', 'ALDI', 'TESCO', 'PENNY', 'AUCHAN', 'MANNA ABC', 'ELELMISZER', 'COCACOLA', 'BELLO', 'BUFE'],
  clothes: ['DECATHLON', 'H&M', 'ZARA', 'PRIMARK', 'UNIQLO', 'PEPCO', 'DEICHMANN'],
  gym: ['GYM', 'FITNESS'],
  subscriptions: ['NETFLIX', 'SPOTIFY', 'YOUTUBE', 'APPLE.COM', 'GOOGLE'],
  goingOut: ['BURGER KING', 'PIZZ', 'MCDONALD', 'KFC', 'CINEMA', "SZE'CHENYI", 'STEAMGAMES'],
};

function categoryFor(description) {
  const text = description.toUpperCase();
  const found = Object.keys(CATEGORY_KEYWORDS).find((category) =>
    CATEGORY_KEYWORDS[category].some((word) => {
      const at = text.indexOf(word);
      // A letter or apostrophe just before means the word is inside another
      // one, e.g. GYM in LA'GYMA'NYOS.
      return at !== -1 && (at === 0 || !/[A-Z']/.test(text[at - 1]));
    }));
  return found || 'unknown';
}

function sortTransaction(tx) {
  if (tx.moneyIn > 0) return { kind: 'in' };
  if (TRANSFER_PATTERN.test(tx.description)) return { kind: 'transfer' };
  if (FEE_PATTERN.test(tx.description)) return { kind: 'spending', category: 'other' };
  return { kind: 'spending', category: categoryFor(tx.description) };
}

// --- Reading the .xlsx file ---

async function inflateRaw(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// Returns { name: text } for the files in the zip that `wanted(name)` accepts.
// Sizes come from the central directory at the end of the zip, because Excel
// may leave them out of the headers in front of each file.
async function readZip(buffer, wanted) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = bytes.length - 22;
  while (end >= 0 && view.getUint32(end, true) !== 0x06054b50) end -= 1;
  if (end < 0) throw new Error('not a zip file');

  const files = {};
  let at = view.getUint32(end + 16, true);
  for (let i = view.getUint16(end + 10, true); i > 0; i -= 1) {
    const method = view.getUint16(at + 10, true);
    const size = view.getUint32(at + 20, true);
    const nameLength = view.getUint16(at + 28, true);
    const skip = nameLength + view.getUint16(at + 30, true) + view.getUint16(at + 32, true);
    const name = new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + nameLength));
    if (wanted(name)) {
      const local = view.getUint32(at + 42, true);
      const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
      const data = bytes.subarray(start, start + size);
      files[name] = new TextDecoder().decode(method === 8 ? await inflateRaw(data) : data);
    }
    at += 46 + skip;
  }
  return files;
}

function decodeXml(text) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, code) => {
    if (code[0] !== '#') return named[code.toLowerCase()];
    return String.fromCodePoint(code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1)));
  });
}

// The text of every <t> inside a piece of XML, joined (rich text has several).
function textOf(xml) {
  return [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => decodeXml(m[1])).join('');
}

function parseSharedStrings(xml) {
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1]));
}

// One { A: '...', B: '...' } object per row, keyed by column letter.
function parseSheetRows(xml, shared) {
  return [...xml.matchAll(/<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)].map((row) => {
    const cells = {};
    for (const c of (row[1] || '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const column = /\br="([A-Z]+)\d+"/.exec(c[1]);
      if (!column) continue;
      const type = (/\bt="(\w+)"/.exec(c[1]) || [])[1];
      const body = c[2] || '';
      const value = (/<v>([\s\S]*?)<\/v>/.exec(body) || [])[1];
      if (type === 's') cells[column[1]] = shared[Number(value)] || '';
      else if (type === 'inlineStr') cells[column[1]] = textOf(body);
      else cells[column[1]] = value === undefined ? '' : decodeXml(value);
    }
    return cells;
  });
}

function amountFrom(text) {
  const value = Number(text);
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : 0;
}

// Finds the header row, then turns each dated row below it into a transaction
// with its kind ('in', 'transfer' or 'spending') and, for spending, a category.
function findTransactions(rows) {
  const columnOf = {};
  const headerIndex = rows.findIndex((row) => Object.entries(STATEMENT_HEADERS).every(([key, header]) => {
    const column = Object.keys(row).find((c) => row[c].trim() === header);
    columnOf[key] = column;
    return column !== undefined;
  }));
  if (headerIndex === -1) throw new Error('no statement header row');

  return rows.slice(headerIndex + 1)
    .filter((row) => /^\d{4}-\d\d-\d\d/.test(row[columnOf.time] || ''))
    .map((row) => {
      const tx = {
        time: row[columnOf.time].trim(),
        month: row[columnOf.time].slice(0, 7),
        moneyIn: amountFrom(row[columnOf.moneyIn]),
        moneyOut: amountFrom(row[columnOf.moneyOut]),
        description: row[columnOf.description] || '',
      };
      return { ...tx, ...sortTransaction(tx) };
    })
    .filter((tx) => tx.moneyIn > 0 || tx.moneyOut > 0);
}

async function readStatement(buffer) {
  const files = await readZip(buffer, (name) =>
    name === 'xl/sharedStrings.xml' || /^xl\/worksheets\/sheet\d*\.xml$/.test(name));
  const sheet = Object.keys(files).filter((name) => name.startsWith('xl/worksheets/')).sort()[0];
  if (!sheet) throw new Error('no worksheet');
  const shared = files['xl/sharedStrings.xml'] ? parseSharedStrings(files['xl/sharedStrings.xml']) : [];
  return findTransactions(parseSheetRows(files[sheet], shared));
}

// Same time and amount means the same transaction, so importing a statement
// twice does not save it twice. Money in is marked with "+" so it cannot clash
// with a payment of the same amount in the same second.
function transactionId(tx) {
  return tx.moneyIn > 0 ? `${tx.time}|+${tx.moneyIn}` : `${tx.time}|${tx.moneyOut}`;
}

if (typeof module !== 'undefined') {
  module.exports = {
    STATEMENT_CURRENCY, readStatement, findTransactions, parseSheetRows, categoryFor, sortTransaction, transactionId,
  };
}
