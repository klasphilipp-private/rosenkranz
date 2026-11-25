(() => {
  // A single list keeps both history galleries identical.
  const sources = {
    historie: [
      ['assets/galerien/historie/01.webp', 'Rennfahrzeug auf der Rennstrecke'],
      ['assets/galerien/historie/02.webp', 'Rennwagen vor einer Werkstatt'],
      ['assets/galerien/historie/03.webp', 'Historisches Rennfahrzeug auf der Strecke'],
      ['assets/galerien/historie/04.webp', 'Rennfahrzeuge während eines Rennens'],
      ['assets/galerien/historie/05.webp', 'Rennfahrzeuge und Hubschrauber auf dem Veranstaltungsgelände'],
      ['assets/galerien/historie/06.webp', 'Das Rennteam arbeitet am Fahrzeug'],
      ['assets/galerien/historie/07.webp', 'Historische Aufnahme eines Rennwagens'],
      ['assets/galerien/historie/08.webp', 'Rennfahrzeug auf der Strecke']
    ],
    rracing: [
      ['assets/galerien/rracing/01.webp', 'Rennfahrzeuge bei einer Veranstaltung'],
      ['assets/galerien/rracing/02.webp', 'Sportwagen auf der Rennstrecke'],
      ['assets/galerien/rracing/03.webp', 'Fahrzeuge auf einem Rundkurs'],
      ['assets/galerien/rracing/04.webp', 'Teilnehmende Fahrzeuge aus der Luft'],
      ['assets/galerien/rracing/05.webp', 'Blauer Subaru bei einer Fahrzeugveranstaltung'],
      ['assets/galerien/rracing/06.webp', 'Roter Sportwagen auf der Strecke'],
      ['assets/galerien/rracing/07.webp', 'Fahrzeugtreffen auf dem Gelände'],
      ['assets/galerien/rracing/08.webp', 'Fahrzeuge bei einem Fotoshooting'],
      ['assets/galerien/rracing/09.webp', 'Fahrzeuge auf dem Veranstaltungsgelände'],
      ['assets/galerien/rracing/10.webp', 'Fahrzeugschau mit Sportwagen'],
      ['assets/galerien/rracing/11.webp', 'Automobilveranstaltung im Grünen']
    ],
    service: [
      ['assets/service-werkstatt-leistungen.webp', 'Fahrzeug bei der Wartung in der Werkstatt'],
      ['assets/galerien/service/03.webp', 'Blaues Fahrzeug in der Werkstatt'],
      ['assets/galerien/service/04.webp', 'Fahrzeug auf dem Prüfstand in der Werkstatt']
    ]
  };
  document.querySelectorAll('[data-gallery]').forEach(gallery => {
    const items = sources[gallery.dataset.gallery];
    if (!items || items.length < 2) return;
    let current = 0, timer;
    let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const images = items.map(([src, alt], i) => {
      const img = document.createElement('img');
      img.src = src; img.alt = alt; img.loading = 'lazy'; img.hidden = i !== 0;
      return img;
    });
    const controls = document.createElement('nav');
    controls.className = 'gallery-controls';
    controls.setAttribute('aria-label', 'Galerie steuern');
    const count = document.createElement('span'); count.className = 'gallery-count';
    const dots = document.createElement('span'); dots.className = 'gallery-dots';
    function button(label, text, className) {
      const b = document.createElement('button'); b.type = 'button'; b.className = className;
      b.setAttribute('aria-label', label); b.textContent = text; return b;
    }
    const toggle = button('Diashow pausieren', 'Ⅱ', 'gallery-arrow gallery-toggle');
    const prev = button('Vorheriges Bild', '‹', 'gallery-arrow');
    const next = button('Nächstes Bild', '›', 'gallery-arrow');
    const dotButtons = items.map((_, i) => {
      const dot = button(`Bild ${i + 1} von ${items.length} anzeigen`, '', 'gallery-dot');
      dot.addEventListener('click', () => show(i)); dots.append(dot); return dot;
    });
    controls.append(count, dots, toggle, prev, next);
    gallery.replaceChildren(...images, controls);
    gallery.classList.add('is-gallery');
    function schedule() {
      clearTimeout(timer);
      if (!paused && !document.hidden) timer = setTimeout(() => show(current + 1), 6500);
    }
    function show(index) {
      current = (index + images.length) % images.length;
      images.forEach((img, i) => { img.hidden = i !== current; });
      dotButtons.forEach((dot, i) => { dot.setAttribute('aria-current', String(i === current)); });
      count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(images.length).padStart(2, '0')}`;
      const active = dotButtons[current];
      if (dots.scrollWidth > dots.clientWidth) dots.scrollLeft = active.offsetLeft - dots.offsetLeft - (dots.clientWidth - active.offsetWidth) / 2;
      schedule();
    }
    function updateToggle() {
      toggle.innerHTML = paused
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
      toggle.setAttribute('aria-label', paused ? 'Diashow abspielen' : 'Diashow pausieren');
      toggle.setAttribute('aria-pressed', String(paused));
      schedule();
    }
    toggle.addEventListener('click', () => { paused = !paused; updateToggle(); });
    prev.addEventListener('click', () => show(current - 1));
    next.addEventListener('click', () => show(current + 1));
    document.addEventListener('visibilitychange', schedule);
    show(0); updateToggle();
  });
})();
