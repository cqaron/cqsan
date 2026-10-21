/* Viewport bridge, author-supplied Skills interactions, and the original n8n replay. */
(() => {
  const $=s=>document.querySelector(s), cover=$('.workflow-cover'), details=$('#workflow-details'), replay=$('.workflow-replay');
  let lang='zh',opened=false,expansion,raf=0,viewTop=0,viewBottom=innerHeight;
  const sendHeight=()=>parent.postMessage({type:'portfolio-embed-height',height:Math.ceil(document.body.getBoundingClientRect().height)},location.origin);
  function syncReplay(){
    const r=replay.getBoundingClientRect();
    replay.contentWindow?.postMessage({type:'portfolio-language',lang},location.origin);
    replay.contentWindow?.postMessage({type:'replay-visible',active:opened&&r.bottom>viewTop&&r.top<viewBottom},location.origin);
  }
  function label(){
    cover.setAttribute('aria-label',opened?(lang==='en'?'Collapse workflow':'收起工作流'):(lang==='en'?'Expand workflow':'展开工作流'));
    $('.workflow-cover-action').innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${opened?'m6 14 6-6 6 6':'m6 10 6 6 6-6'}"/></svg>`;
  }
  new ResizeObserver(()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(sendHeight)}).observe(document.body);
  function viewport(top,bottom){
    viewTop=top;viewBottom=bottom;window.__suiteActive=bottom>0&&top<document.body.scrollHeight;
    const arch=$('.architecture-stage').getBoundingClientRect();$('.architecture-stage').classList.toggle('suite-paused',arch.bottom<top||arch.top>bottom);
    document.querySelectorAll('.tile,.workflow-tile').forEach(tile=>{
      const r=tile.getBoundingClientRect(),show=r.bottom>top-120&&r.top<bottom+120;
      const img=tile.querySelector('.scene img,.workflow-cover img');if(!img)return;
      if(!img.dataset.motionSrc)img.dataset.motionSrc=img.getAttribute('src');
      const src=show&&!matchMedia('(prefers-reduced-motion:reduce)').matches?img.dataset.motionSrc:img.dataset.motionSrc.replace('.webp','.png');
      if(img.getAttribute('src')!==src)img.setAttribute('src',src);
    });syncReplay();
  }
  addEventListener('message',e=>{
    if(e.source!==parent||e.origin!==location.origin)return;
    if(e.data?.type==='portfolio-language'){lang=e.data.lang==='en'?'en':'zh';document.documentElement.lang=lang;label();syncReplay()}
    if(e.data?.type==='portfolio-viewport')viewport(e.data.top,e.data.bottom);
  });
  replay.addEventListener('load',syncReplay);
  cover.addEventListener('click',()=>{
    const start=details.getBoundingClientRect().height;
    expansion?.cancel();opened=!opened;cover.setAttribute('aria-expanded',String(opened));
    details.hidden=false;details.style.height='auto';
    if(opened&&!replay.getAttribute('src'))replay.src=replay.dataset.src;
    const end=opened?details.scrollHeight:0;
    if(matchMedia('(prefers-reduced-motion:reduce)').matches){details.hidden=!opened;sendHeight();label();syncReplay();return}
    expansion=details.animate([{height:`${start}px`,opacity:opened?0:1},{height:`${end}px`,opacity:opened?1:0}],{duration:650,easing:'cubic-bezier(.22,1,.36,1)'});
    expansion.onfinish=()=>{details.hidden=!opened;details.style.height='';sendHeight();syncReplay()};
    label();syncReplay();
  });
  const collapse=document.createElement('button');collapse.className='workflow-collapse';collapse.setAttribute('aria-label','收起工作流');collapse.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg>';details.appendChild(collapse);collapse.addEventListener('click',()=>{if(opened)cover.click()});
  label();document.fonts.ready.then(sendHeight);sendHeight();
})();
