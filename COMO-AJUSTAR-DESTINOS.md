# Ajustes dos destinos

Cristo Redentor, Cataratas do Iguaçu e Lençóis Maranhenses compartilham o modelo de `CSS/destinos.css` e `JS/destinos.js`. Os fundos continuam em `CSS/brasil-pintura.css` e `JS/brasil-pintura.js`.

## Velocidade dos textos

No início de `CSS/destinos.css`:

```css
.destino {
    --destino-texto-velocidade: 0.52;
    --destino-vista-entrada: 0.55;
    --destino-vista-saida: 0.55;
}
```

`0.52` significa que o texto percorre 52px a cada 100px de scroll. Diminua para `0.4` para ficar mais lento; aumente para `0.7` para ficar mais rápido. O intervalo aceito é de `0.25` a `1`. No celular, a regra no fim do arquivo usa `0.6`.

As variáveis de vista reservam pausas com a paisagem limpa, antes da entrada e depois da saída dos textos. O valor é uma fração da altura da tela: `1` reserva uma tela inteira de scroll. A altura de cada seção se ajusta automaticamente à quantidade de texto e à velocidade. A entrada do Cristo é uma exceção: ela se sobrepõe ao final da bandeira, sem pausa de vista antes da leitura.

Para ajustar só um destino, use as variáveis no próprio elemento:

```html
<section class="destino ..." data-destino="cristo"
         style="--destino-texto-velocidade: 0.45">
```

Esses ajustes não alteram a configuração `--parallax-velocidade` das fotografias.

## Luz e entrada dos textos

A camada `.brasil-pintura__luz` mistura sombras verdes e azuladas com uma faixa quente suave. A luz diminui progressivamente durante a leitura e retorna quando o texto sai. A fotografia permanece nítida, sem desfoque nem redução de sua própria opacidade.

Os elementos com `data-destino-revelar` aparecem por opacidade e uma pequena subida, conforme chegam à área de leitura. A animação acompanha a rolagem nos dois sentidos. Use esse atributo nos elementos dentro de `.destino__conteudo`, sem acumular `data-surgir` ou `data-revelar` no mesmo elemento.

Sem JavaScript ou com movimento reduzido, os três destinos exibem o conteúdo no fluxo normal, sobre suas próprias fotografias com contraste constante.

## Botões “Quero ir”

No `Index.html`, troque o `href="#"` do link `.destino__link` pelo endereço definitivo:

```html
<a class="destino__link" href="destinos/cristo-redentor.html"
   aria-label="Quero ir ao Cristo Redentor">
```

Enquanto o endereço for `#`, o clique não muda a posição do scroll. Qualquer endereço real passa a funcionar normalmente, sem mudanças no JavaScript. O contorno desenhado funciona tanto com hover quanto com foco pelo teclado.

## Transições de aquarela

Em `CSS/brasil-pintura.css`, as variáveis no início de `.brasil-pintura` controlam o tempo das passagens:

```css
--transicao-antes: 1.15;
--transicao-depois: 0.38;
--bandeira-sopro: 0.9;
```

As fotos começam a se misturar `1.15` telas antes do início do próximo destino e terminam `0.38` tela depois. O intervalo atual fica entre os conteúdos, preservando a vista livre. Aumentar esses valores prolonga a transição; mantenha `--transicao-depois` abaixo de `--destino-vista-entrada` para terminar antes da leitura.

`--bandeira-sopro` prolonga a despedida da pintura durante o espaço já disponível, sem aumentar a página. Use entre `0` e `1`; `0.9` mantém a bandeira acompanhando a tela enquanto se dissolve em pigmentos e pequenos gestos de tinta.

A iluminação e os textos do Cristo começam nos últimos 28% desse percurso de dissolução. `JS/destinos.js` calcula a sobreposição a partir do tempo real da bandeira, inclusive no celular. A entrada usa opacidade e uma pequena subida; em seguida, o texto retoma a velocidade de leitura configurada. As pausas dos demais destinos não mudam.

`JS/pigmento.js` cria as bordas orgânicas: uma corrente diagonal para Iguaçu e curvas de dunas para Lençóis. Apenas as máscaras usam canvas; as fotografias continuam sendo os fundos originais, com o mesmo parallax. As formas são fixas e reversíveis, sem partículas aleatórias a cada frame. Sem suporte a máscaras, a troca simples de opacidade continua disponível; com movimento reduzido, as seções permanecem estáticas.
