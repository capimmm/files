/* ============================================================
   CONFIGURAÇÃO — edite estas 4 linhas com os dados do seu repo
   ============================================================
   GITHUB_USER : seu usuário/organização no GitHub
   GITHUB_REPO : nome do repositório (o mesmo que tem este index.html)
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
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const cardsList = document.getElementById('cardsList');
  const localCardsList = document.getElementById('localCardsList');
  const emptyState = document.getElementById('emptyState');
  const countPill = document.getElementById('countPill');
  const statusBadge = document.getElementById('statusBadge');

  let fileCount = 0;
  let localCount = 0;

  function fmtSize(bytes){
    if(bytes === 0) return '0 B';
    const units = ['B','KB','MB','GB'];
    const i = Math.floor(Math.log(bytes)/Math.log(1024));
    return (bytes/Math.pow(1024,i)).toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
  }

  function fmtTime(){
    const d = new Date();
    return d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
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
    statusBadge.textContent = fileCount === 0 ? 'pronto' : fileCount + ' no vault';
  }

  function buildCardHTML(ext, name, subLine, downloadUrl){
    return `
      <div class="ftype">${ext.slice(0,4)}</div>
      <div class="meta">
        <div class="fname">${name}</div>
        <div class="fsub">${subLine}</div>
      </div>
      <div class="actions">
        <a class="btn-dl" href="${downloadUrl}" download="${name}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          baixar
        </a>
      </div>
      <div class="bar"></div>
    `;
  }

  /* ---------- cards vindos do repositório (compartilhados) ---------- */

  function renderRepoCard(item){
    const ext = getExt(item.name);
    const sub = `<span>${fmtSize(item.size)}</span><span class="dot">·</span><span>do repositório</span>`;
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = buildCardHTML(ext, item.name, sub, item.download_url);
    cardsList.appendChild(card);
    fileCount++;
  }

  async function loadRepoFiles(){
    if(GITHUB_USER === "SEU_USUARIO_AQUI" || GITHUB_REPO === "SEU_REPOSITORIO_AQUI"){
      emptyState.textContent = 'configure GITHUB_USER e GITHUB_REPO no início do <script> para ativar a lista compartilhada';
      statusBadge.textContent = 'não configurado';
      return;
    }

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
        .forEach(renderRepoCard);

      emptyState.style.display = 'none';
      updateStatus();
    }catch(err){
      emptyState.textContent = 'erro de rede ao consultar o GitHub';
      statusBadge.textContent = 'offline?';
    }
  }

  /* ---------- cards locais (só nesta aba, via drag & drop) ---------- */

  function addLocalCard(file){
    const ext = getExt(file.name);
    const url = URL.createObjectURL(file);
    const sub = `<span>${fmtSize(file.size)}</span><span class="dot">·</span><span>adicionado às ${fmtTime()}</span>`;

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = buildCardHTML(ext, file.name, sub, url);

    const btnX = document.createElement('button');
    btnX.className = 'btn-x';
    btnX.title = 'remover';
    btnX.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    card.querySelector('.actions').appendChild(btnX);

    btnX.addEventListener('click', () => {
      URL.revokeObjectURL(url);
      card.style.transition = 'opacity .25s ease, transform .25s ease';
      card.style.opacity = '0';
      card.style.transform = 'translateX(-8px) scale(0.97)';
      setTimeout(() => {
        card.remove();
        localCount--;
      }, 220);
    });

    localCardsList.prepend(card);
    localCount++;
  }

  function handleFiles(fileListLike){
    const files = Array.from(fileListLike);
    let rejected = 0;
    files.forEach(f => {
      if(isValid(f.name)) addLocalCard(f);
      else rejected++;
    });
    if(rejected > 0){
      statusBadge.textContent = rejected + ' ignorado(s)';
      setTimeout(updateStatus, 2200);
    }
  }

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => {
    handleFiles(e.target.files);
    fileInput.value = '';
  });

  ['dragenter','dragover'].forEach(evt => {
    dropzone.addEventListener(evt, e => {
      e.preventDefault(); e.stopPropagation();
      dropzone.classList.add('drag');
    });
  });
  ['dragleave','drop'].forEach(evt => {
    dropzone.addEventListener(evt, e => {
      e.preventDefault(); e.stopPropagation();
      dropzone.classList.remove('drag');
    });
  });
  dropzone.addEventListener('drop', e => {
    handleFiles(e.dataTransfer.files);
  });

  loadRepoFiles();
})();
