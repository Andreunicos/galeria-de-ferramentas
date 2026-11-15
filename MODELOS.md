# MODELOS.md — qual modelo usa em cada tarefa

> Leia ANTES de toda tarefa neste projeto. Objetivo: gastar menos token sem perder qualidade.

Você não troca o modelo da sessão sozinho, mas troca DELEGANDO: use a ferramenta Agent com o campo `model`
("opus" ou "haiku") e passe o pedido completo (arquivos, o que quer, regras do CLAUDE.md). Peça de volta só um resumo curto.

## Classifique a tarefa e escolha
- **Normal → Sonnet (padrão).** Faça você mesmo. Bug comum, feature pequena ou média, ajuste de tela, refatoração local, lógica de jogo em geral.
- **Complexa e difícil → Opus.** Delegue com `model: "opus"`. Só quando for MESMO pesada: arquitetura nova, bug que resiste a tentativas,
  mexe em vários sistemas ao mesmo tempo, algoritmo ou balanceamento difícil, redesign grande. Opus não economiza token: ele entra pela qualidade.
- **Boba → Haiku.** Delegue com `model: "haiku"` só para troca simples e sem lógica: renomear, trocar texto, cor ou número, corrigir typo,
  ou mudança mecânica repetida em vários arquivos. Nunca use Haiku para lógica, nem para algo que exija entender o jogo.

## Regras
- Em dúvida: Sonnet. Suba para Opus se o Sonnet já falhou 2 vezes na mesma coisa.
- Delegar tem custo de partida (o subagente começa sem contexto). Se você já leu o arquivo e a troca é uma edição só, faça você mesmo, mesmo sendo boba.
- Se a sessão já roda no modelo certo (ex.: já está em Opus), não delegue. Se o usuário pediu um modelo, siga o pedido dele.
- Diga ao usuário em UMA linha o que escolheu, ex.: "Modelo: Sonnet (tarefa normal)".
