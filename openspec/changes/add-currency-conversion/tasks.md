## 1. Rates

- [x] 1.1 Exchange rates section for MNT, EUR and USD; rates keep their decimals and are saved
- [x] 1.2 A rate change re-converts every month

## 2. Conversion

- [x] 2.1 Currency choice for typed expenses; refuse one without a rate, with a message
- [x] 2.2 Entries keep amount and currency; actual spending is their HUF value at today's rate
- [x] 2.3 Statement purchases, transfers and money in converted from MNT; warning while the MNT rate is missing
- [x] 2.4 Saved data from before: statement entries read as MNT, the rest as HUF

## 3. Verification

- [x] 3.1 Tests in `test/currency.test.js`; statement tests use 1 MNT = 1 HUF to keep their numbers
- [x] 3.2 Check in Chrome on a separate local address
