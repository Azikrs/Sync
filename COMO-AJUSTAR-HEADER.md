# Ajustes da header

## Quando o menu compacto aparece

Em `CSS/header.css`, altere apenas o número desta media query:

```css
@media (max-width: 1200px) {
```

O estado `--header-compacto: 1` dentro dela avisa o JavaScript que o menu compacto está ativo. Mantenha essa variável dentro da media query; não é preciso repetir o limite em `JS/header.js`.

## Bolinha da página atual

A bolinha usa `--header-ouro`, a mesma cor dos antigos números. Ela é exibida no link com `aria-current="page"`.

O script compara os endereços dos links com a página aberta. Ao criar outras páginas, configure os endereços reais no menu, por exemplo `destinos.html` e `sobre.html`: a marcação acompanha a página automaticamente. Links de seção como `#destinos` não mudam a página atual. Por isso a bolinha permanece em **Início** durante a rolagem desta página.

## Trocar a logo e manter a pincelada

No `Index.html`, troque o `src` desta imagem dentro de `.header-marca__imagem`:

```html
<span class="header-marca__imagem">
  <img src="IMG/minha-nova-logo.png" alt="Minha nova marca" width="100">
</span>
```

Use PNG ou SVG com fundo transparente. A tinta usa o recorte da própria imagem, então não é preciso criar outra versão da logo nem alterar o JavaScript. O efeito também acompanha `srcset`.

Se mudar o nome, atualize o `alt` da imagem e o `aria-label` do link `.header-marca`. O tamanho visual continua sendo controlado por `.header-marca img` em `CSS/header.css`.

Para ajustar a duração, mude `--marca-pintura-duracao: 1200ms` em `.header-marca__imagem`. A textura reaproveita `IMG/brasil-pintado.svg`. A pincelada funciona no hover e no foco de teclado; com movimento reduzido, a cor aparece sem animação.
