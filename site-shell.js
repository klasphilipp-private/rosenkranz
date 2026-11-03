// Shared model registry drives both the model menu and test-drive selector.
const shellBase=new URL('.',document.currentScript.src);
fetch(new URL('models.json?v=20261103-model-registry',shellBase)).then(response=>response.ok?response.json():Promise.reject()).then(models=>{
  const menu=document.querySelector('[data-model-links]');
  const groups=new Map();
  for(const model of models){if(!model.page||!model.brand)continue;const brand=model.brand;groups.set(brand,[...(groups.get(brand)||[]),model]);}
  if(menu){menu.replaceChildren();for(const [brand,items] of groups){const label=document.createElement('div');label.className='dropdown-model-group';label.textContent=brand;menu.append(label);for(const model of items){const link=document.createElement('a');link.className='dropdown-model-link';link.href=new URL(model.page,shellBase).href;link.textContent=model.name;menu.append(link);}}}
  const select=document.querySelector('#vehicle');
  if(select){const selected=select.value;select.replaceChildren(new Option('Fahrzeug auswählen',''));for(const [brand,items] of groups){const group=document.createElement('optgroup');group.label=brand;for(const model of items){if(!model.formOption)continue;const option=new Option(model.formOption,model.formOption);group.append(option);}select.append(group);}const commercial=select.querySelector('optgroup[label="Citroën"]');if(commercial&&models.some(model=>model.commercial)){const option=new Option('Nutzfahrzeug – Beratung','Gewerbeberatung');const group=document.createElement('optgroup');group.label='Gewerbe';group.append(option);select.append(group);}const modelQuery=new URLSearchParams(location.search).get('modell');const requested=models.find(model=>model.slug===modelQuery)?.formOption;if(requested)select.value=requested;else if(selected)select.value=selected;}
}).catch(()=>{});

document.querySelectorAll('.menu-toggle').forEach(menu=>{const nav=menu.parentElement.querySelector('.navlinks');if(!nav)return;const close=()=>{nav.classList.remove('open');menu.classList.remove('is-open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Navigation öffnen')};menu.addEventListener('click',()=>{const open=!nav.classList.contains('open');nav.classList.toggle('open',open);menu.classList.toggle('is-open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Navigation schließen':'Navigation öffnen')});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));document.addEventListener('keydown',e=>{if(e.key==='Escape')close()})});

const quickRail=document.querySelector('.side-rail');
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
