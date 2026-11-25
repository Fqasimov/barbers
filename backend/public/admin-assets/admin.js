// Ask before destructive admin actions: <form data-confirm="…">.
document.addEventListener('submit', (e) => {
  const msg = e.target.getAttribute('data-confirm');
  if (msg && !window.confirm(msg)) e.preventDefault();
});

// Add salon: Fərdi is one person, so the salon name hides and isn't required.
(() => {
  const select = document.querySelector('[data-plan-select]');
  if (!select) return;
  const sync = () => {
    const plan = select.value;
    document.querySelectorAll('[data-hide-for-plan]').forEach((el) => {
      el.hidden = el.getAttribute('data-hide-for-plan') === plan;
    });
    document.querySelectorAll('[data-show-for-plan]').forEach((el) => {
      el.hidden = el.getAttribute('data-show-for-plan') !== plan;
    });
    document.querySelectorAll('[data-required-unless-plan]').forEach((el) => {
      el.required = el.getAttribute('data-required-unless-plan') !== plan;
    });
  };
  select.addEventListener('change', sync);
  sync();
})();
