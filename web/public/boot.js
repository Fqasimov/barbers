// Loaded before first paint (no inline scripts, so the site can run under a strict CSP).
// The opening plays once per visit and never with reduced motion; decided before first paint so nothing flashes.
try {
  if (sessionStorage.getItem('yazilnow-intro') || matchMedia('(prefers-reduced-motion: reduce)').matches)
    document.documentElement.classList.add('no-intro');
  else document.documentElement.classList.add('intro-on');
} catch (e) {
  document.documentElement.classList.add('no-intro');
}
