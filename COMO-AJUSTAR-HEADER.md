# Ajustes da header

## Quando o menu compacto aparece

Em `CSS/header.css`, altere apenas o número desta media query:

```css
@media (max-width: 1200px) {
```

O estado `--header-compacto: 1` dentro dela avisa o JavaScript que o menu compacto está ativo. Mantenha essa variável dentro da media query; não é preciso repetir o limite em `JS/header.js`.

## Bolinha da página atual

A bolinha aparece somente no menu expandido. Ela e o texto da página atual usam `--header-ouro`; no hover desse item o sublinhado fica branco. No desktop, a navegação mantém o estilo anterior, sem bolinha ou destaque permanente.

O script compara os endereços dos links com a página aberta. Ao criar outras páginas, configure os endereços reais no menu, por exemplo `destinos.html` e `sobre.html`: a marcação acompanha a página automaticamente. Links de seção como `#destinos` não mudam a página atual. Por isso a bolinha permanece em **Início** durante a rolagem desta página.

## Trocar a logo

No `Index.html`, troque o `src` desta imagem dentro de `.header-marca__imagem`:

```html
<span class="header-marca__imagem">
  <img src="IMG/minha-nova-logo.png" alt="Minha nova marca" width="100">
</span>
```

Use PNG ou SVG com fundo transparente. A logo está estática; a pintura foi transferida para a palavra **Brasis** na hero.

Se mudar o nome, atualize o `alt` da imagem e o `aria-label` do link `.header-marca`. O tamanho visual continua sendo controlado por `.header-marca img` em `CSS/header.css`.

Os controles da pintura e do convite ao scroll estão em [COMO-AJUSTAR-PINCELADAS.md](COMO-AJUSTAR-PINCELADAS.md).
