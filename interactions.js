/* interactions.js — animação de entrada, campo de estrelas,
   fechamento do menu de download, e verificação por inatividade
   ou cliques suspeitos. Não mexe em dados (isso é o script.js). */
(function(){

  /* ================= 1) animação de "montagem" na entrada ================= */
  function triggerReveal(){
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.classList.add('is-ready');
      });
    });
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', triggerReveal);
  }else{
    triggerReveal();
  }

  /* ================= 2) campo de estrelas ================= */
  (function buildStars(){
    const container = document.getElementById('stars');
    if(!container) return;
    const isSmall = window.innerWidth < 700;
    const count = isSmall ? 35 : 70;
    const frag = document.createDocumentFragment();
    for(let i = 0; i < count; i++){
      const s = document.createElement('div');
      s.className = 'star';
      s.style.top = (Math.random() * 100) + '%';
      s.style.left = (Math.random() * 100) + '%';
      const size = (Math.random() * 1.6 + 1).toFixed(1);
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.animationDelay = (Math.random() * 3.5).toFixed(2) + 's';
      s.style.animationDuration = (2.5 + Math.random() * 3).toFixed(2) + 's';
      frag.appendChild(s);
    }
    container.appendChild(frag);
  })();

  /* ================= 3) fechar menu de download ao clicar fora / Esc ================= */
  document.addEventListener('click', () => {
    document.querySelectorAll('.tile-actions.open').forEach(el => el.classList.remove('open'));
  });
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){
      document.querySelectorAll('.tile-actions.open').forEach(el => el.classList.remove('open'));
    }
  });

  /* ================= 4) verificação por inatividade (AFK) ou cliques suspeitos ================= */
  const overlay      = document.getElementById('verifyOverlay');
  const verifyTitle  = document.getElementById('verifyTitle');
  const verifyText   = document.getElementById('verifyText');
  const holdBtn      = document.getElementById('verifyHold');
  const ring         = document.getElementById('verifyRing');
  const handLabel    = document.getElementById('verifyHand');

  if(!overlay || !holdBtn) return;

  const AFK_LIMIT_MS   = 90 * 1000;   // 90s sem nenhuma interação
  const HOLD_DURATION  = 1800;        // ms segurando pra passar
  const RING_LENGTH    = 263.9;       // 2 * pi * 42 (raio do círculo svg)

  let lastActivity = Date.now();
  let overlayShown = false;
  let downloadClicks = [];

  function markActivity(){
    lastActivity = Date.now();
  }
  ['mousemove','keydown','scroll','touchstart','click'].forEach(evt => {
    window.addEventListener(evt, markActivity, {passive:true});
  });

  function showOverlay(reason){
    if(overlayShown) return;
    overlayShown = true;
    if(reason === 'bot'){
      verifyTitle.textContent = 'Devagar aí';
      verifyText.textContent = 'Detectamos vários cliques em sequência rápida. Confirma que é humano segurando o botão.';
    }else{
      verifyTitle.textContent = 'Ainda por aí?';
      verifyText.textContent = 'Faz um tempo que não rola nenhuma interação. Segura o botão abaixo por 2 segundos pra continuar.';
    }
    overlay.classList.add('show');
  }

  function hideOverlay(){
    overlay.classList.remove('show');
    overlayShown = false;
    downloadClicks = [];
    markActivity();
  }

  // checa AFK periodicamente
  setInterval(() => {
    if(!overlayShown && Date.now() - lastActivity > AFK_LIMIT_MS){
      showOverlay('afk');
    }
  }, 4000);

  // detecta rajada de cliques em "baixar agora" (comportamento tipo bot)
  document.addEventListener('click', (e) => {
    const primaryDl = e.target.closest('.dl-item.primary');
    if(!primaryDl) return;
    const now = Date.now();
    downloadClicks.push(now);
    downloadClicks = downloadClicks.filter(t => now - t < 10000);
    if(downloadClicks.length > 4 && !overlayShown){
      showOverlay('bot');
    }
  });

  /* ---------- press-and-hold pra confirmar ---------- */
  let holdStart = null;
  let holdRAF = null;

  function updateRing(){
    if(holdStart === null) return;
    const elapsed = Date.now() - holdStart;
    const pct = Math.min(elapsed / HOLD_DURATION, 1);
    ring.style.strokeDashoffset = String(RING_LENGTH * (1 - pct));
    if(pct >= 1){
      holdBtn.classList.add('done');
      handLabel.innerHTML = 'verificado ✓';
      setTimeout(hideOverlay, 350);
      holdStart = null;
      return;
    }
    holdRAF = requestAnimationFrame(updateRing);
  }

  function startHold(e){
    e.preventDefault();
    if(holdBtn.classList.contains('done')) return;
    holdStart = Date.now();
    handLabel.textContent = 'segurando…';
    holdRAF = requestAnimationFrame(updateRing);
  }

  function cancelHold(){
    if(holdBtn.classList.contains('done')) return;
    holdStart = null;
    if(holdRAF) cancelAnimationFrame(holdRAF);
    ring.style.strokeDashoffset = String(RING_LENGTH);
    handLabel.innerHTML = 'segurar<br>pra verificar';
  }

  holdBtn.addEventListener('mousedown', startHold);
  holdBtn.addEventListener('touchstart', startHold, {passive:false});
  holdBtn.addEventListener('mouseup', cancelHold);
  holdBtn.addEventListener('mouseleave', cancelHold);
  holdBtn.addEventListener('touchend', cancelHold);
  holdBtn.addEventListener('touchcancel', cancelHold);

  // reseta o botão toda vez que o overlay reaparece
  const observer = new MutationObserver(() => {
    if(overlay.classList.contains('show')){
      holdBtn.classList.remove('done');
      ring.style.strokeDashoffset = String(RING_LENGTH);
      handLabel.innerHTML = 'segurar<br>pra verificar';
    }
  });
  observer.observe(overlay, {attributes:true, attributeFilter:['class']});

})();
