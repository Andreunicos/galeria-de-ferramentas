# Sala do GameForge Sync — regras para o Claude

Esta pasta é uma sala compartilhada: outras pessoas e os Claudes delas editam este jogo AO MESMO TEMPO.
Com o app GameForge Sync aberto, a pasta sincroniza sozinha: o que você salva aparece para todos em segundos,
e o que os outros mudam aparece aqui. Não precisa rodar nenhum comando.

## Primeiro passo (OBRIGATÓRIO)
- Antes de QUALQUER tarefa, leia MODELOS.md e siga: ele diz se você faz sozinho (Sonnet) ou delega a Opus/Haiku. É assim que a sala economiza token.

## Ideias e bugs (OBRIGATÓRIO)
- No começo de TODA tarefa, leia IDEIAS_E_BUGS.md (lista que os testadores mandam pelo app). Se tiver itens, trate-os junto com o pedido.
- Quando um item estiver feito e conferido, APAGUE a linha dele do arquivo (não marque, apague). O que não resolveu fica.
- Item com `🖼 .gfs/bugs/x.jpg`: veja a imagem (Read) como referência; ela some sozinha quando você apagar o item.

## Como trabalhar
- Mexa só no necessário. Ache o trecho com busca e leia só ele (não leia arquivos inteiros à toa).
- Antes de abrir um arquivo, consulte .gfs/MAPA.md (funções com nome@linha): ache o nome e leia só aquelas linhas.
- Se uma edição falhar porque o arquivo mudou, leia de novo só aquele trecho: foi alguém da sala.
- Achou marcadores <<<<<<< ======= >>>>>>> num arquivo: é conflito. Junte as duas versões e apague os marcadores.
- Algo falhou no jogo (erro, tela preta, travou)? Leia .gfs/CONSOLE.md: os últimos erros do preview do app (só com o app aberto).

## Nunca
- Desfazer ou reescrever código de outra pessoa sem perguntar.
- Apagar arquivos (peça ao dono da sala).
- Mexer em arquivos fora do que foi pedido.

## Esta sala é a Galeria de Ferramentas
- Novo app = nova pasta em `apps/` (modelo: `apps/conversor-wav/`). Detalhes de como funciona e de como publicar: GAME.md.
- NUNCA rode `npm install` aqui dentro (node_modules iria para todos pelo sync). Teste numa cópia em outra pasta.

## Saber mais
- Visão do jogo e decisões: GAME.md (leia só quando a tarefa depender de design).
- Imagens e sons NÃO ficam na sala: estão no repositório do jogo no GitHub.
- App fechado? Use `gfs pull` antes e `gfs push "o que fez"` depois.
