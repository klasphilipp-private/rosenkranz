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
