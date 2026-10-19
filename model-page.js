const slides=[...document.querySelectorAll('.model-page-hero .hero-slide')];
const controls=document.querySelector('.model-page-hero .hero-controls');
const dots=[...document.querySelectorAll('.model-page-hero .hero-dot')];
if(controls)controls.hidden=slides.length<2;
let current=0;
function show(index){
  current=(index+slides.length)%slides.length;
  slides.forEach((slide,i)=>slide.classList.toggle('active',i===current));
  dots.forEach((dot,i)=>dot.classList.toggle('active',i===current));
}
dots.forEach((dot,index)=>dot.addEventListener('click',()=>show(index)));
document.querySelector('.model-page-hero .previous')?.addEventListener('click',()=>show(current-1));
document.querySelector('.model-page-hero .next')?.addEventListener('click',()=>show(current+1));
