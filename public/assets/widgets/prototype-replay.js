const pages=[['首页首屏','Homepage hero'],['链接下载入口','Link download'],['客户端入口','Platform tools'],['产品功能','Product features'],['功能对比','Product comparison'],['使用场景','Use cases'],['常见问题','FAQ'],['移动端入口','Mobile link download']];
const $=id=>document.getElementById(id),screen=$('screen'),image=$('image');
let index=0,lang='zh',active=parent===window,elapsed=0,last=0,raf=0,manual=false,chosen=false;
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
function text(){
 document.documentElement.lang=lang==='en'?'en':'zh-CN';
 $('pages').innerHTML=pages.map((p,i)=>`<button role="tab" aria-selected="${index===i}" data-page="${i}">${p[lang==='en'?1:0]}</button>`).join('');
 image.alt=pages[index][lang==='en'?1:0];$('counter').textContent=String(index+1).padStart(2,'0')+' / 08';
 $('previous').setAttribute('aria-label',lang==='en'?'Previous page':'上一页');$('next').setAttribute('aria-label',lang==='en'?'Next page':'下一页');
}
function pick(n,keep=false){chosen=keep;index=(n+pages.length)%pages.length;elapsed=0;manual=false;screen.scrollTop=0;image.src=`showcase-${index}.webp`;screen.classList.remove('change');void screen.offsetWidth;screen.classList.add('change');text();}
function tick(now){
 if(!active||document.hidden||reduced){raf=0;return;}
 const dt=last?Math.min(now-last,80):0;last=now;elapsed+=dt;
 const max=screen.scrollHeight-screen.clientHeight;
 if(!manual&&max>0){const p=Math.max(0,Math.min(1,(elapsed-2200)/8500));screen.scrollTop=max*(p*p*(3-2*p));}
 if(elapsed>14000&&!manual&&!chosen)pick(index+1);
 raf=requestAnimationFrame(tick);
}
function sync(){if(raf)cancelAnimationFrame(raf);raf=0;last=0;if(active&&!document.hidden&&!reduced)raf=requestAnimationFrame(tick);}
$('pages').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b)pick(Number(b.dataset.page),true);});
$('previous').addEventListener('click',()=>pick(index-1,true));$('next').addEventListener('click',()=>pick(index+1,true));
for(const event of ['wheel','touchstart','pointerdown','keydown'])screen.addEventListener(event,()=>{manual=true;},{passive:true});
addEventListener('message',e=>{if(e.source!==parent||e.origin!==location.origin)return;if(e.data?.type==='portfolio-language'){lang=e.data.lang==='en'?'en':'zh';text();}if(e.data?.type==='replay-visible'){active=!!e.data.active;sync();}});
document.addEventListener('visibilitychange',sync);text();sync();
