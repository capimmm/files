/* ============================================================
   CONFIGURAÇÃO — edite estas 4 linhas com os dados do seu repo
   ============================================================
   GITHUB_USER   : seu usuário/organização no GitHub
   GITHUB_REPO   : nome do repositório (o mesmo que tem este index.html)
   GITHUB_BRANCH : geralmente "main" (às vezes "master")
   GITHUB_FOLDER : pasta dentro do repo onde ficam os .zip/.rar

   Depois de preencher: crie a pasta indicada em GITHUB_FOLDER na raiz
   do repo, jogue os arquivos .zip/.rar dentro dela e dê push. Os
   cards aparecem sozinhos no próximo carregamento da página — não
   precisa editar mais nada aqui.
   ============================================================ */
const GITHUB_USER   = "capimmm";
const GITHUB_REPO   = "files";
const GITHUB_BRANCH = "main";
const GITHUB_FOLDER = "files";
/* ============================================================ */

(function(){
  const cardsList   = document.getElementById('cardsList');
  const emptyState  = document.getElementById('emptyState');
  const countPill   = document.getElementById('countPill');
  const totalSizeEl = document.getElementById('totalSize');
  const statusBadge = document.getElementById('statusBadge');

  let fileCount = 0;
  let totalBytes = 0;

  function fmtSize(bytes){
    if(bytes === 0) return '0 B';
    const units = ['B','KB','MB','GB'];
    const i = Math.floor(Math.log(bytes)/Math.log(1024));
    return (bytes/Math.pow(1024,i)).toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
  }

  function getExt(name){
    const parts = name.split('.');
    return parts.length > 1 ? parts.pop().toUpperCase() : '???';
  }

  function isValid(name){
    const lower = name.toLowerCase();
    return lower.endsWith('.zip') || lower.endsWith('.rar');
  }

  function updateStatus(){
    countPill.textContent = fileCount;
    totalSizeEl.textContent = fileCount === 0 ? '—' : fmtSize(totalBytes);
    statusBadge.textContent = fileCount === 0 ? 'sem arquivos' : 'ao vivo';
  }

  function renderCard(item, index){
    const ext = getExt(item.name);
    const githubUrl = item.html_url || `https://github.com/${GITHUB_USER}/${GITHUB_REPO}/blob/${GITHUB_BRANCH}/${GITHUB_FOLDER}/${encodeURIComponent(item.name)}`;

    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.style.animationDelay = (index * 0.06) + 's';
    tile.innerHTML = `
      <div class="tile-back tb-2"></div>
      <div class="tile-back tb-1"></div>
      <div class="tile-glow"></div>
      <div class="tile-top">
        <div class="tile-icon">${ext.slice(0,4)}</div>
        <div class="tile-size">${fmtSize(item.size)}</div>
      </div>
      <div class="tile-name">${item.name}</div>
      <div class="tile-actions">
        <button class="tile-dl-trigger" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          baixar
          <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <div class="dl-menu">
          <a class="dl-item primary" href="${item.download_url}" download="${item.name}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Baixar agora
          </a>
          <button class="dl-item" data-action="copy" data-url="${item.download_url}" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            <span class="dl-item-label">Copiar link direto</span>
          </button>
          <a class="dl-item" href="${githubUrl}" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/></svg>
            Ver no GitHub
          </a>
        </div>
      </div>
    `;

    const actions = tile.querySelector('.tile-actions');
    const trigger = tile.querySelector('.tile-dl-trigger');
    const copyBtn = tile.querySelector('[data-action="copy"]');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasOpen = actions.classList.contains('open');
      document.querySelectorAll('.tile-actions.open').forEach(el => el.classList.remove('open'));
      if(!wasOpen) actions.classList.add('open');
    });

    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const label = copyBtn.querySelector('.dl-item-label');
      try{
        await navigator.clipboard.writeText(copyBtn.dataset.url);
        copyBtn.classList.add('copied');
        if(label) label.textContent = 'Link copiado!';
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          if(label) label.textContent = 'Copiar link direto';
        }, 1500);
      }catch(err){ /* clipboard indisponível, ignora */ }
    });

    cardsList.appendChild(tile);
    fileCount++;
    totalBytes += item.size;
  }

  async function loadRepoFiles(){
    const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${GITHUB_FOLDER}?ref=${GITHUB_BRANCH}`;

    try{
      const res = await fetch(apiUrl);

      if(res.status === 404){
        emptyState.textContent = `pasta "${GITHUB_FOLDER}" não encontrada no repositório — crie ela e adicione um .zip ou .rar`;
        statusBadge.textContent = 'pasta vazia';
        return;
      }
      if(!res.ok){
        emptyState.textContent = 'não deu pra carregar a lista do GitHub agora (tente recarregar em instantes)';
        statusBadge.textContent = 'erro ' + res.status;
        return;
      }

      const items = await res.json();
      const valid = (Array.isArray(items) ? items : []).filter(i => i.type === 'file' && isValid(i.name));

      if(valid.length === 0){
        emptyState.textContent = `nenhum .zip ou .rar em "${GITHUB_FOLDER}" ainda`;
        updateStatus();
        return;
      }

      valid
        .sort((a,b) => a.name.localeCompare(b.name))
        .forEach(renderCard);

      emptyState.style.display = 'none';
      updateStatus();
    }catch(err){
      emptyState.textContent = 'erro de rede ao consultar o GitHub';
      statusBadge.textContent = 'offline?';
    }
  }

  loadRepoFiles();
})();
