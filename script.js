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

    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.style.animationDelay = (index * 0.06) + 's';
    tile.innerHTML = `
      <div class="tile-glow"></div>
      <div class="tile-top">
        <div class="tile-icon">${ext.slice(0,4)}</div>
        <div class="tile-size">${fmtSize(item.size)}</div>
      </div>
      <div class="tile-name">${item.name}</div>
      <a class="tile-dl" href="${item.download_url}" download="${item.name}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        baixar
      </a>
    `;
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
