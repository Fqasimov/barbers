// QR codes and shared links point at this site (/r/<code>, /s/<salon>, /salon/<salon>, /panel).
// The server normally redirects them to the app in a browser; on hosts that only serve this
// 404 page for unknown paths, this does the same in the browser.
(function () {
  var app = ((window.USTA_CONFIG || {}).appUrl || '').replace(/\/+$/, '');
  if (app && /^\/(r|s|salon)\/[A-Za-z0-9_-]+\/?$|^\/panel\/?$/.test(location.pathname)) {
    location.replace(app + location.pathname.replace(/\/$/, '') + location.search);
  }
})();
