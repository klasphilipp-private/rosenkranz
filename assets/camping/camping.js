document.querySelectorAll('[data-interest]').forEach(link=>link.addEventListener('click',()=>{
  const field=document.querySelector('#interest');
  if(field) field.value=link.dataset.interest;
}));

const moduleTabs=[...document.querySelectorAll('[data-module]')];
function chooseModule(tab){
  moduleTabs.forEach(button=>{
    const selected=button===tab;
    button.setAttribute('aria-selected',String(selected));
    button.tabIndex=selected?0:-1;
    document.getElementById(button.getAttribute('aria-controls')).hidden=!selected;
  });
}
moduleTabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>chooseModule(tab));
  tab.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const target=event.key==='Home'?0:event.key==='End'?moduleTabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+moduleTabs.length)%moduleTabs.length;
    chooseModule(moduleTabs[target]); moduleTabs[target].focus();
  });
});

const imageDialog=document.querySelector('.image-dialog');
document.querySelectorAll('[data-photo]').forEach(button=>button.addEventListener('click',()=>{
  imageDialog.querySelector('img').src=button.dataset.photo;
  imageDialog.querySelector('img').alt=button.querySelector('img').alt;
  imageDialog.querySelector('.dialog-caption').textContent=button.dataset.caption;
  imageDialog.showModal();
}));
imageDialog?.querySelector('.dialog-close').addEventListener('click',()=>imageDialog.close());
imageDialog?.addEventListener('click',event=>{if(event.target===imageDialog)imageDialog.close()});

document.querySelectorAll('.project-form').forEach(form=>form.addEventListener('submit',event=>{
  event.preventDefault();
  const topic=form.querySelector('[name=interest]').value;
  const name=form.querySelector('[name=name]').value.trim();
  form.querySelector('.form-result').textContent=`${name}, Ihre Anfrage zum Thema „${topic}“ ist in der Vorschau vorbereitet. Es wurde nichts versendet. Für eine echte Anfrage erreichen Sie uns über die angegebenen Kontaktdaten.`;
}));

const campingCarousel=document.querySelector('.camping-carousel');
if(campingCarousel){
  const images=[...campingCarousel.querySelectorAll('img')];
  const toggle=campingCarousel.querySelector('.camping-carousel-toggle');
  const count=campingCarousel.querySelector('.camping-carousel-count');
  const dots=campingCarousel.querySelector('.camping-carousel-dots');
  let current=0,timer,paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function schedule(){clearTimeout(timer);if(!paused&&!document.hidden&&images.length>1)timer=setTimeout(()=>show(current+1),6500)}
  function show(index){current=(index+images.length)%images.length;images.forEach((image,i)=>{image.classList.toggle('active',i===current);image.setAttribute('aria-hidden',String(i!==current))});[...dots.children].forEach((dot,i)=>{dot.classList.toggle('active',i===current);dot.setAttribute('aria-current',String(i===current))});count.textContent=`${String(current+1).padStart(2,'0')} / ${String(images.length).padStart(2,'0')}`;schedule()}
  dots.replaceChildren(...images.map((_,index)=>{const button=document.createElement('button');button.type='button';button.className='hero-dot';button.setAttribute('aria-label',`Bild ${index+1} von ${images.length} anzeigen`);button.addEventListener('click',()=>show(index));return button}));
  function update(){toggle.innerHTML=paused?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" fill="none" stroke="currentColor" stroke-width="2"/></svg>';toggle.setAttribute('aria-pressed',String(paused));toggle.setAttribute('aria-label',paused?'Diashow abspielen':'Diashow pausieren');schedule()}
  toggle.addEventListener('click',()=>{paused=!paused;update()});campingCarousel.querySelector('.camping-carousel-prev').addEventListener('click',()=>show(current-1));campingCarousel.querySelector('.camping-carousel-next').addEventListener('click',()=>show(current+1));document.addEventListener('visibilitychange',schedule);show(0);update();
}
