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
