// Shared model registry drives both the model menu and test-drive selector.
const shellBase=new URL('.',document.currentScript.src);
fetch(new URL('models.json?v=20261105-model-order',shellBase)).then(response=>response.ok?response.json():Promise.reject()).then(models=>{
  const select=document.querySelector('#vehicle');
  if(select){
    const selected=select.value;
    select.replaceChildren(new Option('Fahrzeug auswählen',''));
    const addGroup=(label,items)=>{if(!items.length)return;const group=document.createElement('optgroup');group.label=label;for(const model of items){if(model.formOption)group.append(new Option(model.formOption,model.formOption));}if(group.children.length)select.append(group);};
    addGroup('Citroën',models.filter(model=>model.brand==='Citroën'&&!model.commercial));
    addGroup('Subaru',models.filter(model=>model.brand==='Subaru'));
    addGroup('Gewerbe',models.filter(model=>model.commercial));
    const camperGroup=document.createElement('optgroup');camperGroup.label='Camping';camperGroup.append(new Option('VANDERER One','VANDERER One'),new Option('VANDERER Two','VANDERER Two'));select.append(camperGroup);
    const modelQuery=new URLSearchParams(location.search).get('modell');
    const requested=models.find(model=>model.slug===modelQuery)?.formOption||({'vanderer-one':'VANDERER One','vanderer-two':'VANDERER Two'}[modelQuery]);
    if(requested)select.value=requested;else if(selected)select.value=selected;
  }
}).catch(()=>{});

const currentFile=location.pathname.split('/').filter(Boolean).pop()||'index.html';
const currentBrand=new URLSearchParams(location.search).get('marke');
const navAnchors=[...document.querySelectorAll('.site-navlinks a')];
const modelFiles=['modelle.html','modell.html','citroen-ami.html','citroen-berlingo-kastenwagen.html','citroen-berlingo.html','citroen-c3-aircross.html','citroen-c3.html','citroen-c4-x.html','citroen-c4.html','citroen-c5-aircross.html','citroen-e-c3-van.html','citroen-holidays.html','citroen-jumper.html','citroen-jumpy.html','citroen-spacetourer.html','subaru-crosstrek.html','subaru-e-outback.html','subaru-forester.html','subaru-impreza.html','subaru-outback.html','subaru-solterra.html','subaru-uncharted.html','vanderer.html','vanderer-one.html','vanderer-two.html'];
const activeFile=modelFiles.includes(currentFile)?'modelle.html':currentFile;
for(const link of navAnchors){
  const target=new URL(link.href,location.href);
  const routeMatch=target.pathname.split('/').pop()===activeFile;
  const hashMatch=!target.hash || location.hash===target.hash;
  const brandMatch=!target.searchParams.has('marke') || target.searchParams.get('marke')===currentBrand;
  const matches=routeMatch&&hashMatch&&brandMatch;
  if(matches){link.classList.add('is-active');link.setAttribute('aria-current','page');}
}

document.querySelectorAll('.menu-toggle').forEach(menu=>{const nav=menu.parentElement.querySelector('.site-navlinks');if(!nav)return;const close=()=>{nav.classList.remove('open');menu.classList.remove('is-open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Navigation öffnen')};menu.addEventListener('click',()=>{const open=!nav.classList.contains('open');nav.classList.toggle('open',open);menu.classList.toggle('is-open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Navigation schließen':'Navigation öffnen')});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));document.addEventListener('keydown',e=>{if(e.key==='Escape')close()})});

const quickRail=document.querySelector('.site-quick-rail');
if(quickRail){
  const mobile=matchMedia('(max-width:720px)');
  const tabs=[...quickRail.querySelectorAll('a')];
  const collapse=()=>tabs.forEach(tab=>{tab.classList.remove('expanded');tab.setAttribute('aria-expanded','false')});
  tabs.forEach(tab=>{
    tab.setAttribute('aria-expanded','false');
    tab.addEventListener('click',event=>{
      if(!mobile.matches)return;
      if(!tab.classList.contains('expanded')){
        event.preventDefault();
        collapse();
        tab.classList.add('expanded');
        tab.setAttribute('aria-expanded','true');
      }else collapse();
    });
  });
  document.addEventListener('click',event=>{if(mobile.matches&&!quickRail.contains(event.target))collapse()});
  mobile.addEventListener?.('change',collapse);
}
