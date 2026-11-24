(() => {
  const hero = document.querySelector('.home-hero');
  if (!hero) return;
  const container = hero.querySelector('.hero-slides');
  const dots = hero.querySelector('.hero-dots');
  const count = hero.querySelector('.home-slide-count');
  const pause = hero.querySelector('.hero-pause');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let slides = [...container.children];
  let current = 0;
  let paused = reducedMotion.matches;
  let timer;

  const motions = ['home-motion-in', 'home-motion-out', 'home-motion-side'];
  const randomMotion = () => motions[Math.floor(Math.random() * motions.length)];

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === current);
      slide.setAttribute('aria-hidden', String(i !== current));
      slide.querySelectorAll('a').forEach(link => link.tabIndex = i === current ? 0 : -1);
    });
    [...dots.children].forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
      dot.setAttribute('aria-current', i === current ? 'true' : 'false');
    });
    count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    schedule();
  }

  function schedule() {
    clearTimeout(timer);
    if (!paused && slides.length > 1 && !document.hidden) timer = setTimeout(() => show(current + 1), 6500);
  }

  function updatePause() {
    pause.textContent = paused ? '▶︎' : 'Ⅱ';
    pause.setAttribute('aria-label', paused ? 'Diashow abspielen' : 'Diashow pausieren');
    pause.setAttribute('aria-pressed', String(paused));
    hero.classList.toggle('home-paused', paused);
    schedule();
  }

  function addSlide({name, image, alt, eyebrow, text, link, label}, motion = true) {
    const slide = document.createElement('article');
    slide.className = `hero-slide${motion ? ` ${randomMotion()}` : ''}`;
    const img = document.createElement('img');
    img.src = image;
    img.alt = alt || name;
    img.loading = 'lazy';
    const caption = document.createElement('div');
    caption.className = 'hero-caption';
    const subheading = document.createElement('span');
    subheading.className = 'eyebrow';
    subheading.textContent = eyebrow;
    const title = document.createElement('h2');
    title.textContent = name;
    const description = document.createElement('p');
    description.textContent = text;
    const anchor = document.createElement('a');
    anchor.className = 'btn';
    anchor.href = link;
    anchor.textContent = `${label} ↗`;
    caption.append(subheading, title, description, anchor);
    slide.append(img, caption);
    container.append(slide);
  }

  function initialise(models) {
    addSlide({name: 'Persönlich in Recklinghausen.', image: 'assets/home-luftaufnahme.webp', alt: 'Luftaufnahme von Automobile Rosenkranz in Recklinghausen', eyebrow: 'Ihr Autohaus vor Ort', text: 'Seit 1992 begleiten wir Sie mit Erfahrung und persönlicher Beratung.', link: 'ueber-uns.html', label: 'Unser Autohaus kennenlernen'});
    const candidates = models.filter(model => model.name && model.image && model.page);
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    candidates.slice(0, 5).forEach(model => addSlide({name: model.name, image: model.image, eyebrow: `${model.brand} · Modellwelt`, text: model.description?.length > 150 ? `${model.description.slice(0, 150).replace(/\s+\S*$/, '')}…` : (model.description || ''), link: model.page, label: 'Modell entdecken'}));
    slides = [...container.children];
    dots.replaceChildren(...slides.map((slide, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'hero-dot';
      dot.setAttribute('aria-label', `Bild ${i + 1} von ${slides.length} anzeigen`);
      dot.addEventListener('click', () => show(i));
      return dot;
    }));
    show(0);
    updatePause();
  }

  hero.querySelector('.previous').addEventListener('click', () => show(current - 1));
  hero.querySelector('.next').addEventListener('click', () => show(current + 1));
  pause.addEventListener('click', () => { paused = !paused; updatePause(); });
  document.addEventListener('visibilitychange', schedule);
  fetch('models.json?v=20261105-commercial-gallery')
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(initialise)
    .catch(() => initialise([]));
})();
