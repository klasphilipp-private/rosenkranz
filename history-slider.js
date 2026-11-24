(() => {
  const gallery = document.querySelector('.about-history-images');
  if (!gallery) return;
  const images = [...gallery.querySelectorAll('img')];
  const controls = gallery.querySelector('.history-controls');
  const count = gallery.querySelector('.history-count');
  if (images.length < 2 || !controls || !count) return;
  let current = 0;
  function show(index) {
    current = (index + images.length) % images.length;
    images.forEach((image, i) => { image.hidden = i !== current; });
    count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(images.length).padStart(2, '0')}`;
  }
  gallery.querySelector('.history-previous').addEventListener('click', () => show(current - 1));
  gallery.querySelector('.history-next').addEventListener('click', () => show(current + 1));
  gallery.classList.add('is-slider');
  controls.hidden = false;
  show(0);
})();
