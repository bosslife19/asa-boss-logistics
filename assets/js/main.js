/* ASA BOSS LOGISTICS — site interactions */
(function () {
  const WA = '2349019924374'; // WhatsApp line from the flyer
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* Loader */
  window.addEventListener('load', () => setTimeout(() => $('.loader')?.classList.add('done'), 350));
  setTimeout(() => $('.loader')?.classList.add('done'), 3500); // safety

  /* Image fallback: a failed stock photo becomes a branded panel */
  const markBroken = img => { img.classList.add('broken'); img.parentElement?.classList.add('img-fallback'); };
  $$('img').forEach(img => {
    if (img.complete && img.naturalWidth === 0 && img.src) markBroken(img);
    img.addEventListener('error', () => markBroken(img));
  });

  /* Sticky nav, progress bar, back-to-top */
  const nav = $('.nav'), prog = $('.progress'), top = $('.to-top');
  const onScroll = () => {
    const y = window.scrollY;
    nav?.classList.toggle('scrolled', y > 40);
    top?.classList.toggle('show', y > 600);
    const h = document.documentElement.scrollHeight - innerHeight;
    if (prog) prog.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    $$('[data-parallax]').forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      const speed = parseFloat(el.dataset.parallax) || 0.15;
      el.style.transform = `translateY(${(r.top) * -speed}px)`;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  top?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  /* Mobile menu */
  const burger = $('.burger'), menu = $('.mobile-menu');
  burger?.addEventListener('click', () => {
    burger.classList.toggle('open');
    menu.classList.toggle('open');
    document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
    $$('a', menu).forEach((a, i) => (a.style.transitionDelay = menu.classList.contains('open') ? 0.15 + i * 0.06 + 's' : '0s'));
  });
  $$('.mobile-menu a').forEach(a => a.addEventListener('click', () => { burger.click(); }));

  /* Reveal on scroll + counters */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      setTimeout(() => el.classList.add('in'), parseInt(el.dataset.delay || 0));
      if (el.dataset.count !== undefined) countUp(el);
      io.unobserve(el);
    });
  }, { threshold: 0.15 });
  $$('[data-reveal],[data-count]').forEach(el => io.observe(el));

  function countUp(el) {
    const end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
    const dur = 1800, t0 = performance.now();
    const step = t => {
      const p = Math.min((t - t0) / dur, 1), v = end * (1 - Math.pow(1 - p, 3));
      el.textContent = v.toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* 3D tilt on hero card */
  $$('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    });
    card.addEventListener('mouseleave', () => (card.style.transform = ''));
  });

  /* Helpers */
  const sendWA = msg => window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank');
  const val = (f, n) => (f.elements[n]?.value || '').trim();

  /* Quick-quote form (homepage hero) */
  $('#quickForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    sendWA(`Hello Asa Boss Logistics 👋\nI'd like to book a delivery.\n\n• Service: ${val(f, 'service')}\n• Pickup: ${val(f, 'pickup')}\n• Drop-off: ${val(f, 'dropoff')}\n• Phone: ${val(f, 'phone')}`);
  });

  /* Contact form */
  $('#contactForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    sendWA(`Hello Asa Boss Logistics,\n\nName: ${val(f, 'name')}\nPhone: ${val(f, 'phone')}\nSubject: ${val(f, 'subject')}\n\n${val(f, 'message')}`);
  });

  /* Booking wizard */
  const wiz = $('#wizard');
  if (wiz) {
    let cur = 0;
    const panels = $$('.wpanel', wiz), dots = $$('.wsteps li', wiz);
    const err = $('.err', wiz);
    const show = i => {
      cur = i;
      panels.forEach((p, k) => p.classList.toggle('on', k === i));
      dots.forEach((d, k) => { d.classList.toggle('on', k === i); d.classList.toggle('done', k < i); });
      err.style.display = 'none';
      if (i === 3) buildSummary();
      if (innerWidth < 1080) wiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    // preselect via ?service=
    const pre = new URLSearchParams(location.search).get('service');
    $$('.opt', wiz).forEach(o => {
      const input = $('input', o);
      if (pre && input.value.toLowerCase().startsWith(pre.toLowerCase())) input.checked = true;
      if (input.checked) o.classList.add('sel');
      o.addEventListener('click', () => {
        $$('.opt', wiz).forEach(x => x.classList.remove('sel'));
        o.classList.add('sel'); input.checked = true;
      });
    });
    const valid = i => {
      const p = panels[i];
      if (i === 0) return !!$('input[name="svc"]:checked', wiz);
      return $$('[required]', p).every(inp => inp.value.trim());
    };
    $$('[data-next]', wiz).forEach(b => b.addEventListener('click', () => {
      if (!valid(cur)) { err.textContent = 'Please complete the highlighted fields to continue.'; err.style.display = 'block'; panels[cur].prepend(err); return; }
      show(cur + 1);
    }));
    $$('[data-prev]', wiz).forEach(b => b.addEventListener('click', () => show(cur - 1)));

    const get = n => ($(`[name="${n}"]`, wiz)?.value || '').trim();
    function buildSummary() {
      const svc = $('input[name="svc"]:checked', wiz)?.value || '';
      const rows = [
        ['Service', svc], ['Pickup', get('from')], ['Drop-off', get('to')],
        ['Item', get('item')], ['When', `${get('date') || 'Today'} · ${get('time')}`],
        ['Sender', `${get('name')} (${get('phone')})`], ['Receiver', `${get('rname') || '—'} ${get('rphone') ? '(' + get('rphone') + ')' : ''}`],
        ['Payment', get('pay')]
      ];
      $('.summary', wiz).innerHTML = rows.map(([k, v]) => `<div><span>${k}</span><b>${v.replace(/</g, '&lt;')}</b></div>`).join('');
    }
    $('#sendBooking')?.addEventListener('click', () => {
      const svc = $('input[name="svc"]:checked', wiz)?.value || '';
      sendWA(`🛵 NEW BOOKING — Asa Boss Logistics\n\nService: ${svc}\nPickup: ${get('from')}\nDrop-off: ${get('to')}\nItem: ${get('item')}\nSize: ${get('size')}\nWhen: ${get('date') || 'Today'} · ${get('time')}\n\nSender: ${get('name')} — ${get('phone')}\nReceiver: ${get('rname')} — ${get('rphone')}\nPayment: ${get('pay')}\nNotes: ${get('notes') || '—'}`);
    });
    show(0);
  }

  /* Year */
  $$('[data-year]').forEach(el => (el.textContent = new Date().getFullYear()));
})();
