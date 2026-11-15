# GAME.md — visão do jogo

> Árbitro das decisões de design: em dúvida, siga o que está aqui. Mantenha curto.

## O projeto (não é um jogo)
- Galeria de Ferramentas: app de PC (Electron) com 10 a 20 mini-apps funcionais (imagem, som, conversores…).
- Usuários: André, Viking e Jonatas (possivelmente). Tudo em português.

## Como funciona
- Cada app é uma pasta `apps/<nome>/` com `app.json` (name, icon, desc, order, backend), `index.html` e, se precisar de arquivos/ffmpeg/janelas do Windows, um `backend.js`.
- O app chama o backend com `galeria.call("funcao", ...args)` (ver `apps/conversor-wav/` como modelo). Dentro do `backend.js`: `module.exports = ({ dialog, shell, win, ffmpegPath, appDir }) => ({ funcao })`.
- "Upar" (só o André faz): `node publicar.js "msg"`. Mudou só apps/ → todos recebem em segundos. Mudou a casca (main.js, ui/, preload.js, sync.js, package.json) → ele sobe a versão sozinho, o GitHub gera o instalador e a galeria se reinstala sozinha. Link fixo de download: github.com/Andreunicos/galeria-de-ferramentas/releases/latest
- A galeria é um APLICATIVO instalado (Electron), não um site. O index.html da raiz é só o preview do GameForge (preview.js finge o app no navegador).
- Dev local: `npm install` e `npm start` (use uma CÓPIA fora da sala: node_modules não deve ficar aqui).

## Decisões já tomadas
- Repo: github.com/Andreunicos/galeria-de-ferramentas (branch main).
- Conversor WAV foi o primeiro app (portado do app instalado dele).
