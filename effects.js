/* effects.js — só efeitos visuais (cursor glow, parallax, tilt 3D).
   Não mexe em dados; script.js cuida de buscar os arquivos. */
(function(){
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;
  if(!isFinePointer) return; // pula tudo isso em touch/mobile

  /* ---------- bolinha de glow seguindo o mouse ---------- */
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);

  const orb1 = document.querySelector('.orb-1');
  const orb2 = document.querySelector('.orb-2');

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let curX = mouseX;
  let curY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // parallax leve nos glows de fundo
    const nx = (e.clientX / window.innerWidth - 0.5);
    const ny = (e.clientY / window.innerHeight - 0.5);
    if(orb1) orb1.style.transform = `translate(calc(-50% + ${nx * 30}px), ${ny * 20}px)`;
    if(orb2) orb2.style.transform = `translate(${nx * -40}px, ${ny * -25}px)`;
  });

  function animateGlow(){
    curX += (mouseX - curX) * 0.14;
    curY += (mouseY - curY) * 0.14;
    glow.style.transform = `translate(${curX}px, ${curY}px)`;
    requestAnimationFrame(animateGlow);
  }
  animateGlow();

  /* ---------- tilt 3D nos cards (delegado, funciona pra cards criados depois) ---------- */
  const cardsList = document.getElementById('cardsList');
  if(!cardsList) return;

  cardsList.addEventListener('mousemove', (e) => {
    const tile = e.target.closest('.tile');
    if(!tile) return;
    const rect = tile.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -7;
    const rotateY = ((x - cx) / cx) * 7;
    tile.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });

  cardsList.addEventListener('mouseout', (e) => {
    const tile = e.target.closest('.tile');
    if(!tile) return;
    // só reseta se o mouse realmente saiu do tile (não foi pra um filho)
    if(tile.contains(e.relatedTarget)) return;
    tile.style.transform = '';
  });
})();
