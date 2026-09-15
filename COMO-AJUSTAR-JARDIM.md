# Fundo escultórico da hero

A composição combina a referência escultórica do [Immersive Garden](https://immersive-g.com/) com a interação de água da seção **Reflection Of Art** do [Lumen Artspace](https://lumen-artspace.webflow.io/). A versão do Aflora usa geometria própria: ramos de ipê, palmeira, bromélia, samambaias, folhas e flores. O estado padrão é uma penumbra discreta. Cor, textura e relevo ganham presença localmente com o cursor, em harmonia com a pintura de Brasis.

O mouse faz o relevo emergir e perturba uma camada de água. A revelação tem contorno irregular, alcance difuso e um rastro que desaparece gradualmente; não há abertura clara de toda a composição. As ondas se propagam pela superfície, refratam as formas e mudam o reflexo da luz. Uma corrente larga de névoa conecta o fundo inclusive nas áreas sem plantas. Água, atmosfera e luz atuam apenas no fundo; a tipografia continua nítida.

## Ajustes rápidos

Em `CSS/hero-jardim.css`:

```css
--jardim-luz: 1;     /* Exposição: 0.8 mais escuro, 1.2 mais claro. */
--jardim-relevo: 1.25; /* Altura dos volumes, independente da luz ambiente. */
--jardim-ritmo: 1;   /* Ritmo do movimento ambiente; 0 pausa o tempo. */
--jardim-agua: 1;    /* Força da refração e dos reflexos; 0 desliga a água. */
--jardim-revelacao: 1; /* Presença local ao redor do cursor; 0 desliga a revelação. */
--jardim-alcance: 1;   /* Extensão da área difusa, sem aumentar o brilho global. */
--jardim-atmosfera: 1; /* Presença da corrente de névoa; 0 remove essa camada. */
--jardim-protecao: .55; /* Discrição atrás dos blocos marcados: de 0 a 1. */
```

Os controles aceitam valores entre 0 e 2, exceto a proteção, limitada a 1. O alcance tem mínimo visual de 0.12; para desligar a revelação use seu controle próprio. Para água mais delicada, use `0.6`; mais marcada, `1.3`. Recarregue a página após alterar. As cores ficam nas variáveis `base`, `forest`, `ocean`, `gold` e `haze` do shader em `JS/hero-jardim.js`. O relevo antes configurado como `20` já era limitado pelo renderer a `2`; a nova calibração explícita é `1.25`.

## Adicionar conteúdo no centro

A camada `.hero-jardim` é absoluta, fica atrás do conteúdo e não captura cliques. A névoa existe por toda a superfície, sem depender de um recorte central vazio. Novos elementos podem ocupar o fluxo normal ou as camadas da hero sem mudar o renderer.

Para reservar uma área mais escura atrás de um novo bloco, marque seu contêiner estável:

```html
<div data-jardim-resguardar>
  <!-- Futuro conteúdo da hero: texto, card, botão ou outra interação. -->
</div>
```

São aceitos até quatro contêineres visíveis; dois já estão usados pelo título e pelo bloco descritivo. As reservas acompanham tamanho, fontes e resolução, com bordas difusas. Prefira marcar o contêiner estável de um conteúdo animado, para que a entrada dos filhos não desloque a reserva. A marcação não muda o layout nem o comportamento dos elementos.

Se inserir, remover ou reposicionar um bloco dinamicamente, atualize as reservas:

```js
document.querySelector('#inicio').dispatchEvent(new Event('jardim:atualizar'));
```

Esse evento também relê os controles CSS. As medições de conteúdo acontecem ao redimensionar ou atualizar a composição; não são repetidas em cada quadro.

## Construção

- `scripts/gerar-jardim.cjs`: modela pétalas dobradas, folhas com nervuras, hastes, flores menores, ipê ramificado, palmeira arqueada, bromélia e samambaias. As composições desktop e móvel são independentes. Para recriar os mapas de altura: `node scripts/gerar-jardim.cjs`.
- `IMG/jardim-altura-desktop.png` e `jardim-altura-mobile.png`: alturas de 16 bits codificadas nos canais R/G. Não recolorir esses arquivos; são geometria, não fotografias.
- `JS/hero-jardim.js`: calcula luz, sombra, relevo, névoa e água em uma única passagem de desenho. A simulação usa uma malha pequena com passos fixos de 1/60 s, bordas absorventes e gradientes de 16 bits para evitar degraus visuais. Eventos do mouse são consolidados por quadro. No toque, permanece uma respiração ambiente discreta, sem capturar gestos de rolagem nem simular uma lanterna automática.
- `IMG/jardim-desktop.webp` e `jardim-mobile.webp`: imagens do renderer para a entrada e para navegadores sem WebGL. Regenere essas imagens se mudar as esculturas ou as cores.
- `CSS/hero-jardim.css`: camada decorativa de largura total, recorte só do fundo e dissolução inferior em preto.

A pintura de Brasis, a header e os destinos continuam independentes. O renderer pausa fora da tela e com a aba oculta; com movimento reduzido mostra a penumbra parada. Limites: 30 quadros/s e cerca de 1,25 milhão de pixels no desktop; 24 quadros/s e 440 mil pixels no toque. A recuperação do contexto WebGL recarrega o mapa necessário. Este refinamento não adicionou bibliotecas, mapas de altura ou passes de renderização.
