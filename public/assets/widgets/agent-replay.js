/* Fixed-view, inspectable replay of the original retail support case. */
const $ = id => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let lang = 'zh', index = 0, playing = !reduced, visible = parent === window;
let elapsed = 0, last = 0, timer = 0;
const steps = [
  {
    label:['客户请求','Request'], actor:'CUSTOMER', title:['想把行李箱换成外套','A request to change the item'], status:['收到请求','Request received'], duration:6500,
    content:()=>`<blockquote class="quote">I'd like to swap the suitcase in my order for the wool coat.</blockquote><p>${L('客户希望更换订单中的商品。','The customer wants to swap an item in the order.')}</p><p class="note">${L('Agent 先核对订单与可选规格。','The agent checks the order and available item options first.')}</p>`
  },
  {
    label:['规则校验','Rule check'], actor:'AGENT / RULE GATE', title:['跨商品替换被拦截','A different item cannot be swapped in'], status:['同款检查 · 拦截','Same-item check · blocked'], duration:10000,
    content:()=>`<p>Sure. Let me check the order and the item options first.</p><div class="rule"><strong>${L('同款商品检查','Same-item rule')}</strong><span>${L('原商品与目标商品标识一致才允许替换。','An exchange requires the original and target item to have the same product identity.')}</span></div><p class="note" style="margin-top:12px">A different product can't be swapped in directly. I can only change the size or color of the same item.</p>`
  },
  {
    label:['提出方案','Plan'], actor:'AGENT / PLAN', title:['取消订单，原路退款','Cancel the order and refund the card'], status:['等待确认','Awaiting confirmation'], duration:9000,
    content:()=>`<blockquote class="quote">Then cancel it and refund to my original card.</blockquote><div class="rule"><strong>${L('取消订单','Cancel the order')}</strong><span>${L('未发货商品不再寄出。','Unshipped items will not be sent.')}</span></div><div class="rule"><strong>${L('退款 $86.00','Refund $86.00')}</strong><span>${L('至原支付方式：信用卡末四位 4417。','To the original payment method: card ending in 4417.')}</span></div>`
  },
  {
    label:['用户确认','Confirm'], actor:'CUSTOMER / CONSENT', title:['明确同意后再执行','Get explicit confirmation before acting'], status:['已确认','Confirmed'], duration:6500,
    content:()=>`<blockquote class="quote">Yes, go ahead.</blockquote><p>${L('展示方案并取得明确同意后，才进入写入操作。','A concrete plan is shown and explicitly approved before any write operation.')}</p><p class="note">${L('确认取消订单及 $86.00 原路退款。','The confirmation covers order cancellation and the $86.00 refund to the original card.')}</p>`
  },
  {
    label:['取消订单','Cancel'], actor:'TOOL / 01', title:['先取消订单，等待结果','Cancel first, then wait for the result'], status:['逐次调用','One tool at a time'], duration:6500,
    content:()=>`<div class="tool">cancel_order</div><p>${L('取消订单，逐次调用。','Cancel the order, one tool call at a time.')}</p><p class="note">${L('等待取消操作完成后，再进入退款步骤。工具调用与用户答复分离。','Wait for cancellation to complete before the refund step. Tool calls and user-facing replies remain separate.')}</p>`
  },
  {
    label:['执行退款','Refund'], actor:'TOOL / 02', title:['退款至原支付方式','Refund to the original payment method'], status:['退款方式检查 · 通过','Payment-method check · passed'], duration:8000,
    content:()=>`<div class="tool">refund</div><div class="rule"><strong>${L('退款方式检查','Refund-method rule')}</strong><span>${L('只退回原支付方式或已有礼品卡。','Refunds go only to the original payment method or an existing gift card.')}</span></div><p style="margin-top:12px">${L('本次退款：$86.00，信用卡末四位 4417。','This refund: $86.00 to the card ending in 4417.')}</p>`
  },
  {
    label:['复核答复','Review'], actor:'AGENT / FINAL REPLY', title:['逐项复核，告知处理结果','Review the outcome and reply'], status:['处理完成','Complete'], duration:10000,
    content:()=>`<blockquote class="quote">Done. The order is cancelled and $86.00 will return to your card.</blockquote><p>${L('复核取消与退款结果，再向客户答复。','Review the cancellation and refund results before replying to the customer.')}</p><p class="note">${L('结果：同一批任务中，混合输出由 100% 降到 0%。','Result: mixed outputs fell from 100% to 0% across the same task set.')}</p>`
  }
];
function L(zh,en) { return lang === 'en' ? en : zh; }
function stabilizeDetail() {
  const detail = document.querySelector('.detail');
  const clone = detail.cloneNode(true);
  clone.classList.remove('enter');
  clone.style.cssText = `position:fixed;left:-10000px;top:0;width:${detail.getBoundingClientRect().width}px;height:auto;min-height:0;visibility:hidden;transform:none;`;
  document.body.appendChild(clone);
  let height = 0;
  for (const step of steps) {
    clone.querySelector('#detail-title').textContent = step.title[lang==='en'?1:0];
    clone.querySelector('#detail-content').innerHTML = step.content();
    clone.querySelector('#status').textContent = step.status[lang==='en'?1:0];
    height = Math.max(height, clone.scrollHeight + 2);
  }
  clone.remove();
  detail.style.height = `${Math.max(340, height)}px`;
}
function sendHeight() {
  parent.postMessage({type:'portfolio-embed-height',height:Math.ceil(document.querySelector('.replay').getBoundingClientRect().height)+2},location.origin);
}
function controls() {
  $('previous').setAttribute('aria-label',L('上一步','Previous'));
  $('next').setAttribute('aria-label',L('下一步','Next'));
  $('previous').disabled = index === 0;
  $('next').disabled = index === steps.length-1;
}
function render() {
  const s = steps[index];
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  $('replay-title').textContent = L('订单处理回放','Order handling');
  $('step-count').textContent = `${String(index+1).padStart(2,'0')} / 07`;
  $('steps').innerHTML = steps.map((step,i)=>`<li><button class="step ${i<index?'past':''}" data-step="${i}" ${i===index?'aria-current="step"':''} aria-label="${i+1}. ${step.label[lang==='en'?1:0]}"><span class="step-dot">${String(i+1).padStart(2,'0')}</span><span class="step-label">${step.label[lang==='en'?1:0]}</span></button></li>`).join('');
  $('step-progress').style.transform = `${matchMedia('(max-width:519px)').matches?'scaleX':'scaleY'}(${index/(steps.length-1)})`;
  $('status').textContent = s.status[lang==='en'?1:0];
  $('detail-title').textContent = s.title[lang==='en'?1:0];
  $('detail-content').innerHTML = s.content();
  const node = index <= 0 ? 0 : index <= 3 ? 1 : 2;
  $('cam').style.transform = reduced ? 'none' : `translate(${(node-1)*2}px, ${node===1?-2:0}px)`;
  document.querySelector('.detail').style.setProperty('--flow-position', `${12+node*38}%`);
  document.querySelectorAll('.rail span').forEach(el => {
    const n = Number(el.dataset.node);
    el.classList.toggle('lit', n < node);
    el.classList.toggle('now', n === node);
  });
  $('rail-path').classList.toggle('on', index > 0);
  const detail = document.querySelector('.detail');
  detail.classList.remove('enter'); void detail.offsetWidth; detail.classList.add('enter');
  $('metric-pass').textContent = L('相同任务通过率','Same-task pass rate');
  $('metric-mixed').textContent = L('混合输出','Mixed outputs');
  $('metric-review').textContent = L('完整复核','Full review');
  controls(); stabilizeDetail(); sendHeight();
}
function running() { return playing && visible && !document.hidden; }
function sync() {
  document.body.classList.toggle('agent-paused', !visible || document.hidden);
  if (timer) clearInterval(timer);
  timer = 0; last = performance.now();
  if (running()) timer = setInterval(tick,150);
}
function tick() {
  const now=performance.now(); elapsed+=now-last; last=now;
  if (elapsed < steps[index].duration) return;
  elapsed=0;
  if (index === steps.length-1) { playing=false; controls(); sync(); return; }
  index++; render();
}
function pick(next) { index=next; elapsed=0; playing=false; render(); sync(); }
$('steps').addEventListener('click',e=>{const b=e.target.closest('[data-step]'); if(b)pick(Number(b.dataset.step));});
$('previous').addEventListener('click',()=>pick(Math.max(0,index-1)));
$('next').addEventListener('click',()=>pick(Math.min(steps.length-1,index+1)));
addEventListener('message',e=>{
  if(e.source!==parent||e.origin!==location.origin)return;
  if(e.data?.type==='portfolio-language'){lang=e.data.lang==='en'?'en':'zh';render();}
  if(e.data?.type==='replay-visible'){visible=!!e.data.active;sync();}
});
document.addEventListener('visibilitychange',sync);
const resize = new ResizeObserver(()=>{ $('step-progress').style.transform=`${matchMedia('(max-width:519px)').matches?'scaleX':'scaleY'}(${index/(steps.length-1)})`; sendHeight(); });
resize.observe(document.querySelector('.replay'));
render();sync();

document.fonts.ready.then(() => { stabilizeDetail(); sendHeight(); });

addEventListener('resize', () => { stabilizeDetail(); sendHeight(); });
