// Today's rates on the visa page, from the same free service the app uses
// (only the code HUF is sent), and the Copy button on the commands.
// Without JavaScript or without a connection, the rates written in the page stay.

(function () {
  var RATES_URL = 'https://open.er-api.com/v6/latest/HUF';
  var DECIMALS = { MNT: 4, EUR: 2, USD: 2 };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function dayText(date) {
    return date.getUTCDate() + ' ' + MONTHS[date.getUTCMonth()] + ' ' + date.getUTCFullYear();
  }

  function showRates(data) {
    var codes = Object.keys(DECIMALS);
    var ok = codes.every(function (code) { return data.rates && data.rates[code] > 0; });
    if (data.result !== 'success' || !ok) return;
    codes.forEach(function (code) {
      var huf = 1 / data.rates[code];
      document.querySelector('[data-rate="' + code + '"]').textContent = huf.toFixed(DECIMALS[code]);
    });
    var day = dayText(new Date(data.time_last_update_unix * 1000));
    document.querySelectorAll('[data-rate-date]').forEach(function (el) { el.textContent = day; });
    document.getElementById('rates-note').textContent =
      "Today's rates, " + day + '. The app fetches them the same way every time it opens.';
    var stamps = document.getElementById('stamps');
    stamps.dataset.state = 'live';
    stamps.classList.add('is-pressing');
  }

  if (window.fetch) {
    fetch(RATES_URL)
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (data) { if (data) showRates(data); })
      .catch(function () { /* keep the rates written in the page */ });
  }

  var button = document.getElementById('copy');
  var status = document.getElementById('copy-status');
  var command = document.getElementById('command');

  function selectCommand() {
    var range = document.createRange();
    range.selectNodeContents(command);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  button.addEventListener('click', function () {
    var text = command.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        status.textContent = 'Copied. Paste it into a terminal.';
      }, function () {
        selectCommand();
        status.textContent = 'Copying was blocked; the commands are selected, press Ctrl+C.';
      });
    } else {
      selectCommand();
      status.textContent = 'The commands are selected; press Ctrl+C to copy.';
    }
  });
}());
