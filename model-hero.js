const frame=document.querySelector('#model-hero-slides');
const dots=document.querySelector('#model-hero-dots');

if(frame&&dots)fetch('models.json?v=20261019-5').then(r=>r.json()).then(models=>{
  const params=new URLSearchParams(location.search);
  const brand=params.get('marke');
  const slug=params.get('modell');
  const detailModel=slug?models.find(model=>model.slug===slug):null;
  const isDetailPage=Boolean(detailModel);
  if(slug&&!detailModel){frame.innerHTML='<div class="model-not-found"><h1>Modell nicht gefunden</h1><p>Dieses Modell ist derzeit nicht verfügbar.</p><a class="btn" href="modelle.html">Zur Modellübersicht</a></div>';document.querySelector('.hero-controls')?.setAttribute('hidden','');return;}
  let modelsToShow=models;

  if(brand==='citroen')modelsToShow=models.filter(model=>model.brand==='Citroën'&&!model.commercial);
  else if(brand==='subaru')modelsToShow=models.filter(model=>model.brand==='Subaru');
  else if(brand==='gewerbe')modelsToShow=models.filter(model=>model.commercial);
  if(isDetailPage)modelsToShow=[detailModel];

  const slidesData=isDetailPage
    ? (detailModel.gallery?.length?detailModel.gallery:[detailModel.image]).slice(0,8).map(image=>({model:detailModel,image}))
    : modelsToShow.slice(0,12).map(model=>({model,image:model.image}));
  if(!slidesData.length)return;

  frame.innerHTML=slidesData.map(({model,image},index)=>{
    const caption=`<div class="hero-caption"><span class="eyebrow">${model.brand}${model.commercial?' · Gewerbe':' · Modellwelt'}</span><h1>${model.name}</h1><p>${model.description}</p>${isDetailPage?'':`<a class="btn" href="${model.page||`modell.html?modell=${encodeURIComponent(model.slug)}`}">Modell entdecken <span aria-hidden="true">↗</span></a>`}</div>`;
    const imageLink=isDetailPage?'':`<a class="hero-slide-link" href="${model.page||`modell.html?modell=${encodeURIComponent(model.slug)}`}" aria-label="${model.name} entdecken"></a>`;
    return `<article class="hero-slide${index===0?' active':''}"><img src="${image}" alt="${model.name} · Ansicht ${index+1}" fetchpriority="${index?'low':'high'}">${caption}${imageLink}</article>`;
  }).join('');

  const slides=[...frame.querySelectorAll('.hero-slide')];
  const controls=document.querySelector('.hero-controls');
  if(controls)controls.hidden=slides.length<2;
  if(slides.length<2)return;

  let current=0,timer;
  dots.replaceChildren(...slides.map((_,index)=>{
    const button=document.createElement('button');
    button.className=`hero-dot${index===0?' active':''}`;
    button.setAttribute('aria-label',`Bild ${index+1} von ${slides.length} anzeigen`);
    button.addEventListener('click',()=>show(index));
    return button;
  }));

  function show(index){
    current=(index+slides.length)%slides.length;
    slides.forEach((slide,slideIndex)=>slide.classList.toggle('active',slideIndex===current));
    [...dots.children].forEach((dot,dotIndex)=>dot.classList.toggle('active',dotIndex===current));
    clearInterval(timer);
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)timer=setInterval(()=>show(current+1),6500);
  }

  document.querySelector('.previous')?.addEventListener('click',()=>show(current-1));
  document.querySelector('.next')?.addEventListener('click',()=>show(current+1));
  show(0);
}).catch(()=>{});
