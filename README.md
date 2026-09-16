# Painel do Comercial — apresentação para a equipe

Deck web da apresentação do painel de vendas do grupo (Plano A, Top Prime, redeCORR e DNIA Sales) para a
equipe comercial (16/09/2026). Explica, número a número, o que a parede mostra,
de onde cada número vem e o que fazer com ele.

**Ao vivo:** https://cauelimsia.github.io/painel-comercial-apresentacao/

## Como apresentar

- `←` `→` navegam; `Esc` abre o índice; `P` abre o modo apresentador (roteiro de
  fala, cronômetro e próximo slide — só na tela de quem conduz).
- Passar o mouse num item da legenda acende o pino correspondente no print.
- No slide da conta (26), com o foco num controle, as setas ajustam o valor.
- Abrir o painel de verdade numa aba ao lado: https://plano-a-painel.vercel.app/tv/comercial

## Estrutura

- `index.html` — os 28 slides (roteiro em `data-notes`, cena em `data-fx`).
- `styles.css` — direção visual "sala de controle": Bricolage Grotesque,
  Instrument Sans e JetBrains Mono; laranja Plano A como sinal, ciano para ao vivo.
- `app.js` — navegação, animações GSAP, pinos ↔ legenda, simulador, modo apresentador.
- `fx.js` — parede de azulejos luminosos em WebGL (three.js) que muda de forma
  por capítulo: dispersa, fila, parede, funil, relógio, barras, explosão.
- `assets/telas/` — prints reais do painel capturados em 16/09/2026, com nomes
  de clientes trocados por nomes fictícios.
- `vendor/` — GSAP e three.js servidos do próprio repositório (roda sem internet).

Sem WebGL o deck segue inteiro em HTML; com `prefers-reduced-motion` a cena
congela e as animações são suprimidas.
