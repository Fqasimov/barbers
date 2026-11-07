// The payment provider sends salons here after checkout; hand them back to the app (docs/api.md → Payments).
// The app's link scheme is still usta:// until the app itself is renamed.
location.replace('usta://billing/return' + location.search);
