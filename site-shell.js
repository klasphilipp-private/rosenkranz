// Shared site chrome: header/navigation, quick access rail and model selector.
const shellScript = document.currentScript;
const shellBase = new URL('.', shellScript.src);

function initializeHeader() {
  const currentFile = location.pathname.split('/').filter(Boolean).pop() || 'index.html';
  const currentBrand = new URLSearchParams(location.search).get('marke');
  const modelFiles = [
    'modelle.html', 'modell.html', 'citroen-ami.html', 'citroen-berlingo-kastenwagen.html',
    'citroen-berlingo.html', 'citroen-c3-aircross.html', 'citroen-c3.html', 'citroen-c4-x.html',
    'citroen-c4.html', 'citroen-c5-aircross.html', 'citroen-e-c3-van.html', 'citroen-holidays.html',
    'citroen-jumper.html', 'citroen-jumpy.html', 'citroen-spacetourer.html', 'subaru-crosstrek.html',
    'subaru-e-outback.html', 'subaru-forester.html', 'subaru-impreza.html', 'subaru-outback.html',
    'subaru-solterra.html', 'subaru-uncharted.html', 'vanderer.html', 'vanderer-one.html', 'vanderer-two.html'
  ];
  const activeFile = modelFiles.includes(currentFile) ? 'modelle.html' : currentFile;

  document.querySelectorAll('.site-navlinks a').forEach(link => {
    const target = new URL(link.href, location.href);
    if (target.hash) return;
    const samePage = target.pathname.split('/').pop() === activeFile;
    const sameBrand = !target.searchParams.has('marke') || target.searchParams.get('marke') === currentBrand;
    if (samePage && sameBrand) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });

  document.querySelectorAll('.menu-toggle').forEach(menu => {
    const nav = menu.parentElement.querySelector('.site-navlinks');
    if (!nav) return;
    const close = () => {
      nav.classList.remove('open');
      menu.classList.remove('is-open');
      menu.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-label', 'Navigation öffnen');
    };
    menu.addEventListener('click', () => {
      const open = !nav.classList.contains('open');
      nav.classList.toggle('open', open);
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Navigation schließen' : 'Navigation öffnen');
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  });

  const quickRail = document.querySelector('.site-quick-rail');
  if (!quickRail) return;
  const mobile = matchMedia('(max-width:720px)');
  const tabs = [...quickRail.querySelectorAll('a')];
  const collapse = () => tabs.forEach(tab => {
    tab.classList.remove('expanded');
    tab.setAttribute('aria-expanded', 'false');
  });
  tabs.forEach(tab => {
    tab.setAttribute('aria-expanded', 'false');
    tab.addEventListener('click', event => {
      if (!mobile.matches) return;
      if (!tab.classList.contains('expanded')) {
        event.preventDefault();
        collapse();
        tab.classList.add('expanded');
        tab.setAttribute('aria-expanded', 'true');
      } else collapse();
    });
  });
  document.addEventListener('click', event => {
    if (mobile.matches && !quickRail.contains(event.target)) collapse();
  });
  mobile.addEventListener?.('change', collapse);
}

fetch(new URL('header.html?v=20261104-shared-1', shellBase))
  .then(response => response.ok ? response.text() : Promise.reject())
  .then(markup => {
    const holder = document.createElement('div');
    holder.innerHTML = markup;
    holder.querySelectorAll('[href], [src]').forEach(node => {
      for (const attribute of ['href', 'src']) {
        const value = node.getAttribute(attribute);
        if (!value || value.startsWith('#') || /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(value)) continue;
        node.setAttribute(attribute, new URL(value, shellBase).href);
      }
    });
    const mount = document.querySelector('#shared-header');
    if (!mount) return;
    mount.replaceChildren(...holder.childNodes);
    initializeHeader();
  })
  .catch(() => {});

fetch(new URL('models.json?v=20261105-model-order', shellBase))
  .then(response => response.ok ? response.json() : Promise.reject())
  .then(models => {
    const select = document.querySelector('#vehicle');
    if (!select) return;
    const selected = select.value;
    select.replaceChildren(new Option('Fahrzeug auswählen', ''));
    const addGroup = (label, items) => {
      if (!items.length) return;
      const group = document.createElement('optgroup');
      group.label = label;
      for (const model of items) if (model.formOption) group.append(new Option(model.formOption, model.formOption));
      if (group.children.length) select.append(group);
    };
    addGroup('Citroën', models.filter(model => model.brand === 'Citroën' && !model.commercial));
    addGroup('Subaru', models.filter(model => model.brand === 'Subaru'));
    addGroup('Gewerbe', models.filter(model => model.commercial));
    const camping = document.createElement('optgroup');
    camping.label = 'Camping';
    camping.append(new Option('VANDERER One', 'VANDERER One'), new Option('VANDERER Two', 'VANDERER Two'));
    select.append(camping);
    const modelQuery = new URLSearchParams(location.search).get('modell');
    const requested = models.find(model => model.slug === modelQuery)?.formOption
      || ({ 'vanderer-one': 'VANDERER One', 'vanderer-two': 'VANDERER Two' }[modelQuery]);
    if (requested) select.value = requested;
    else if (selected) select.value = selected;
  })
  .catch(() => {});


// Keep navigation and action arrows as vector icons on mobile, where system fonts
// can otherwise render arrow characters in emoji style.
const arrowPaths = {
  '↗': 'M7 17 17 7M8 7h9v9',
  '←': 'M17 12H7m0 0 6 6m-6-6 6-6',
  '‹': 'm15 18-6-6 6-6',
  '›': 'm9 18 6-6-6-6'
};
function replaceArrowGlyphs(root = document.body) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (/[↗←‹›]/u.test(node.nodeValue) && !node.parentElement?.closest('script,style,svg,textarea')) nodes.push(node);
  }
  for (const node of nodes) {
    const fragment = document.createDocumentFragment();
    const parts = node.nodeValue.split(/([↗←‹›])/u);
    for (const part of parts) {
      if (!arrowPaths[part]) {
        if (part) fragment.append(document.createTextNode(part));
        continue;
      }
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('viewBox', '0 0 24 24');
      icon.setAttribute('width', '1em');
      icon.setAttribute('height', '1em');
      icon.setAttribute('aria-hidden', 'true');
      icon.setAttribute('focusable', 'false');
      icon.style.cssText = 'display:inline-block;vertical-align:-.12em;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round';
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', arrowPaths[part]);
      icon.append(path);
      fragment.append(icon);
    }
    node.replaceWith(fragment);
  }
}
replaceArrowGlyphs();
new MutationObserver(records => {
  for (const record of records) for (const node of record.addedNodes) {
    if (node.nodeType === Node.TEXT_NODE) replaceArrowGlyphs(node.parentElement);
    else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'SVG') replaceArrowGlyphs(node);
  }
}).observe(document.body, { childList: true, subtree: true });
