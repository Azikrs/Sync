# Fundo escultórico da hero

A referência observada foi o [fundo do Immersive Garden](https://immersive-g.com/): uma superfície fosca com formas botânicas esculpidas que emergem perto do cursor. A versão do Aflora usa esculturas próprias, em verde mata, petróleo, azul e dourado, com espaço central para os textos. O fundo topográfico anterior foi removido.

## Ajustes rápidos

Em `CSS/hero-jardim.css`:

```css
--jardim-luz: 1;     /* Exposição: 0.8 mais escuro, 1.2 mais claro. */
--jardim-relevo: 1;  /* Altura dos volumes e força da emergência. */
--jardim-ritmo: 1;   /* Ritmo do movimento ambiente; 0 pausa o tempo. */
```

Os controles aceitam valores entre 0 e 2. Recarregue a página após alterar. As cores ficam nas variáveis `base`, `forest`, `ocean` e `gold` do shader em `JS/hero-jardim.js`.

## Construção

- `scripts/gerar-jardim.cjs`: modela pétalas dobradas, folhas com nervuras, hastes e uma samambaia; rasteriza os volumes em mapas de altura. Para recriar: `node scripts/gerar-jardim.cjs`.
- `IMG/jardim-altura-desktop.png` e `jardim-altura-mobile.png`: alturas de 16 bits codificadas nos canais R/G. Não recolorir esses arquivos; são geometria, não fotografias.
- `JS/hero-jardim.js`: calcula luz, sombra e relevo. A proximidade do mouse faz os volumes emergirem; o rastro amortecido prolonga a retirada. No toque, uma passagem ambiente alterna a presença das formas.
- `IMG/jardim-desktop.webp` e `jardim-mobile.webp`: imagens do renderer para a entrada e para navegadores sem WebGL. Regenere essas imagens se mudar as esculturas ou as cores.
- `CSS/hero-jardim.css`: camada decorativa de largura total, recorte só do fundo e dissolução inferior em preto.

A pintura de Brasis, a header e os destinos continuam independentes. O renderer pausa fora da tela e com a aba oculta; com movimento reduzido mostra uma composição parada. Limites: 30 quadros/s e cerca de 1,25 milhão de pixels no desktop; 24 quadros/s e 440 mil pixels no toque. A recuperação do contexto WebGL recarrega o mapa necessário.
