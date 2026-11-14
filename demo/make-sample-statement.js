// Writes demo/sample-statement.xlsx: a made-up deposit statement in the bank's
// real layout (title block, header row, one row per transaction, total row),
// with tögrög amounts from August to November 2026. No real person, account
// or shop visit is in it, so it can be committed and used in the demo.
//
//   node demo/make-sample-statement.js

const fs = require('fs');
const path = require('path');
const { makeXlsx } = require('../test-support/make-xlsx');

const OPENING_BALANCE = 50000;
const OWN = { account: '0000000000', name: 'ДЕМО ОЮУТАН' };
const FRIEND = { account: 'MN000000000000000001', name: 'ДЕМО НАЙЗ' };

// [time, money in, money out, description, counterparty]
const TRANSACTIONS = [
  ['2026-08-08 09:00:00', 1500000, 0, 'tsalin', OWN],
  ['2026-08-10 12:30:15', 0, 42000, 'CB - POS Purchase CBA Prima.Budapest', null],
  ['2026-08-12 19:45:02', 0, 28500, 'P10 - Purchase 1 Нэр/Хаана: 1 - BURGER KING EMKE / BUDAPEST', null],
  ['2026-08-15 10:05:40', 0, 19900, '13148888:POS Normal Purchase', null],
  ['2026-08-18 17:20:11', 0, 55300, 'CB - POS Purchase SPAR Market.Budapest', null],
  ['2026-08-21 21:10:09', 0, 36000, 'P10 - Purchase 2 Нэр/Хаана: 2 - CINEMA CITY ALLEE / BUDAPEST', null],
  ['2026-08-24 11:00:00', 0, 300000, 'EB -Демо найз-д илгээв', FRIEND],
  ['2026-08-24 11:00:00', 0, 100, 'EB -И-БАНК ГҮЙЛГЭЭНИЙ ШИМТГЭЛ', null],
  ['2026-08-28 14:14:14', 0, 24000, 'EB -qpay 100000000000001, DEMO0001, 001 00000000', null],

  ['2026-09-05 09:00:00', 1500000, 0, 'tsalin', OWN],
  ['2026-09-06 13:02:33', 0, 61200, 'CB - POS Purchase LIDL Arena.Budapest', null],
  ['2026-09-09 20:31:47', 0, 33800, 'P10 - Purchase 3 Нэр/Хаана: 3 - PIZZA ME / BUDAPEST', null],
  ['2026-09-13 16:48:05', 0, 47350, 'CB - POS Purchase TESCO Expressz.Budapest', null],
  ['2026-09-17 10:22:19', 0, 16850, '13174303:POS Normal Purchase', null],
  ['2026-09-20 22:05:56', 0, 41500, 'P10 - Purchase 4 Нэр/Хаана: 4 - MCDONALDS NYUGATI / BUDAPEST', null],
  ['2026-09-26 18:40:00', 0, 58900, 'CB - POS Purchase ALDI Corvin.Budapest', null],

  ['2026-10-03 09:00:00', 1500000, 0, 'tsalin', OWN],
  ['2026-10-04 12:12:12', 0, 39750, 'CB - POS Purchase CBA Prima.Budapest', null],
  ['2026-10-08 19:30:44', 0, 27000, 'P10 - Purchase 5 Нэр/Хаана: 5 - KFC BLAHA / BUDAPEST', null],
  ['2026-10-11 15:55:21', 0, 42950, '13174244:POS Normal Purchase', null],
  ['2026-10-15 11:11:11', 0, 200000, 'EB -Демо найз-д илгээв', FRIEND],
  ['2026-10-15 11:11:11', 0, 100, 'EB -И-БАНК ГҮЙЛГЭЭНИЙ ШИМТГЭЛ', null],
  ['2026-10-19 17:03:08', 0, 52600, 'CB - POS Purchase SPAR Market.Budapest', null],
  ['2026-10-25 21:47:30', 0, 30000, 'P10 - Purchase 6 Нэр/Хаана: 6 - CINEMA CITY MOM PARK / BUDAPEST', null],
  ['2026-10-30 10:00:00', 0, 30250, 'EB -qpay 100000000000002, DEMO0002, ONLINE, online', null],

  ['2026-11-02 09:00:00', 1500000, 0, 'tsalin', OWN],
  ['2026-11-03 13:20:00', 0, 45800, 'CB - POS Purchase LIDL Arena.Budapest', null],
  ['2026-11-05 20:15:37', 0, 35500, 'P10 - Purchase 7 Нэр/Хаана: 7 - BURGER KING EMKE / BUDAPEST', null],
  ['2026-11-06 10:40:00', 50000, 0, 'Демо найз-с шилжүүлэв', FRIEND],
  ['2026-11-07 16:25:49', 0, 59700, '70046167:POS Normal Purchase', null],
];

function makeRows() {
  const blank = Array(9).fill('');
  const header = ['Огноо', 'Теллер', 'Орлого', 'Зарлага', 'Ханш', 'Харьцсан данс', '', 'Үлдэгдэл', 'Гүйлгээний утга'];
  let balance = OPENING_BALANCE;
  const body = TRANSACTIONS.map(([time, moneyIn, moneyOut, description, who]) => {
    balance = Math.round((balance + moneyIn - moneyOut) * 100) / 100;
    const teller = moneyIn > 0 ? 'INPUTTER' : '50';
    return [time, teller, moneyIn, moneyOut, 1, who ? who.account : '', who ? who.name : '', balance, description];
  });
  const totalIn = TRANSACTIONS.reduce((sum, t) => sum + t[1], 0);
  const totalOut = TRANSACTIONS.reduce((sum, t) => sum + t[2], 0);
  return [
    blank,
    ['', '', '', '', '', 'Хэвлэсэн огноо: 2026/11/08', '', '', ''],
    ['', '', '', 'Депозит дансны хуулга', '', '', '', '', ''],
    blank,
    ['Харилцагч:', 'ДЕМО', 'ОЮУТАН', OWN.account, '', '', '', '', ''],
    ['Дансны дугаар:', OWN.account, '', '', 'Эхний үлдэгдэл:', OPENING_BALANCE, '', '', ''],
    ['', '', '', '', 'Эцсийн үлдэгдэл:', balance, '', '', ''],
    blank,
    ['Хамрах хугацаа:', '2026-08-01', '2026-11-08', '', '', '', '', '', ''],
    blank,
    blank,
    header,
    ...body,
    ['Нийт:', '', totalIn, totalOut, '', '', ''],
  ].map((row) => row.map((cell) => (cell === '' ? null : cell)));
}

if (require.main === module) {
  const file = path.join(__dirname, 'sample-statement.xlsx');
  fs.writeFileSync(file, makeXlsx(makeRows()));
  console.log(`Wrote ${file} (${TRANSACTIONS.length} transactions)`);
}

module.exports = { TRANSACTIONS, makeRows };
