'use strict';
const $ = id => document.getElementById(id);

function renderApps(apps) {
  const grid = $('grid');
  grid.textContent = '';
  $('empty').hidden = apps.length > 0;
  for (const a of apps) {
    const b = document.createElement('button');
    b.className = 'card';
    for (const [cls, text] of [['icon', a.icon || '🧰'], ['name', a.name], ['desc', a.desc || '']]) {
      const d = document.createElement('div'); d.className = cls; d.textContent = text; b.appendChild(d);
    }
    b.onclick = () => galeria.open(a.id);
    grid.appendChild(b);
  }
}

// app aberto: mostra o botão de voltar e o nome dele
function renderNav(a) {
  $('back').hidden = !a;
  $('home').hidden = !!a;
  $('title').textContent = a ? a.name : 'Galeria de Ferramentas';
}

function renderStatus(s) {
  const t = $('upText');
  t.className = 'up-text';
  t.title = '';
  $('upInstall').hidden = s.state !== 'ready';
  $('upCheck').disabled = ['checking', 'downloading', 'ready'].includes(s.state);
  $('upProgress').hidden = s.state !== 'downloading';
  $('upProgress').firstElementChild.style.width = (s.percent || 0) + '%';
  switch (s.state) {
    case 'checking': t.textContent = 'Verificando atualizações…'; break;
    case 'uptodate':
      t.textContent = s.apps && s.apps.length ? `Atualizado: ${s.apps.join(', ')}.` : 'Tudo em dia.';
      t.classList.add('ok'); break;
    case 'downloading': t.textContent = `Baixando a galeria ${s.version || ''}… ${s.percent || 0}%`; break;
    case 'ready': t.textContent = `Versão ${s.version} pronta. A galeria reinicia para instalar.`; t.classList.add('ok'); break;
    case 'dev': t.textContent = 'Modo desenvolvimento: atualização só no app instalado.'; t.classList.add('warn'); break;
    case 'error': t.textContent = 'Não foi possível verificar agora. Tente de novo.'; t.title = s.message || ''; t.classList.add('err'); break;
    default: t.textContent = '';
  }
}

$('back').onclick = () => galeria.home();
$('upCheck').onclick = () => galeria.check();
$('upInstall').onclick = () => galeria.install();
galeria.on('apps', renderApps);
galeria.on('nav', renderNav);
galeria.on('status', renderStatus);

(async () => {
  $('ver').textContent = 'v' + await galeria.version();
  renderApps(await galeria.apps());
  renderStatus(await galeria.status());
})();
