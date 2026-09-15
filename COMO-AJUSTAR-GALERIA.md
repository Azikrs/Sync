# Galeria: Do nosso chão / nascem paisagens

A seção `#paisagens`, no `Index.html`, mantém o título parado enquanto as fotografias se aproximam em perspectiva. No computador, o resultado é uma grade de **4 colunas × 3 linhas**. Até 700 px, a composição se adapta para **3 colunas × 4 linhas**.

## Fotografias, textos e botões

Edite `JS/paisagens-dados.js`. Cada objeto representa uma fotografia; a ordem dos objetos é a ordem na grade, da esquerda para a direita.

```js
{
  id: 'lencois-maranhenses',
  nome: 'Lençóis Maranhenses',
  regiao: 'Maranhão · Nordeste',
  descricao: 'Dunas brancas e lagoas de chuva desenham uma paisagem que muda com as estações.',
  imagem: 'IMG/paisagens/lencois-maranhenses.webp',
  alt: 'Dunas claras entre lagoas verdes e azuis nos Lençóis Maranhenses.',
  href: ''
  // Mantenha também os campos de autoria e licença do objeto original.
}
```

O **Quero ir** fica sem ação enquanto `href` estiver vazio. Para ativá-lo, basta preencher o endereço da página, por exemplo `href: 'destinos/lencois-maranhenses.html'`. O componente cria o link automaticamente; não é necessário alterar o HTML da ficha.

As imagens ficam em `IMG/paisagens/`. São fotos reais, com recorte quadrado e créditos em `IMG/paisagens/CREDITOS.md`. Ao trocar uma foto, atualize também `alt`, `credito`, `fonte`, `licenca` e `licencaUrl`. A coleção atual usa 12 fotos; os trajetos foram compostos para essa quantidade.

## Velocidade e tamanho

Em `CSS/paisagens-galeria.css`:

```css
.paisagens-conteudo.paisagens-galeria {
    --galeria-percurso: 220svh;
}
```

Um percurso maior torna a montagem mais demorada, exigindo mais scroll. O celular usa `180svh`, na regra de até 700 px. A altura total inclui mais uma tela para o palco fixo. A seção seguinte continua depois desse percurso.

O tamanho final fica em `.paisagens-grade`; `gap` controla a distância entre as fotos. Os tamanhos e a fonte do título continuam em `CSS/style.css`, em `.paisagens-top-text` e `.paisagens-bottom-text`.

Em `JS/paisagens-galeria.js`, `depth` determina a profundidade inicial de cada fotografia; `offsets` determina seu atraso. Valores diferentes produzem a montagem assimétrica. A chegada termina em 76% do percurso; o restante permite explorar a grade pronta.

## Ficha pintada e lente do cursor

- Passe o cursor sobre uma foto: após 150 ms, sua ficha se abre. Ela permanece acessível ao mover o cursor até o conteúdo.
- Clique/toque para manter a ficha aberta; feche no X, tocando fora ou apertando Escape.
- Com teclado, Tab percorre as fotos. Enter entra na ficha; Escape retorna à foto. A lente abre espaço também para o item selecionado por toque ou teclado.
- As fichas longas podem rolar internamente em telas baixas; o X continua acessível.

A ficha usa uma camada de tinta com cerdas independentes e pequenas falhas. As cores estão nas classes `.paisagens-ficha__gesto--azul`, `--verde` e `--ouro`; os trajetos, na função `prepareInk`. O pigmento reutiliza `JS/pigmento.js`. A fonte manuscrita é **Caveat SemiBold**, local e licenciada sob SIL OFL 1.1 (`fonts/caveat-OFL.txt`). Origem do WOFF2: https://fonts.gstatic.com/s/caveat/v23/WnznHAc5bAfYB2QRah7pcpNvOx-pjSx6eIWpYQ.woff2.

A lente está em `JS/paisagens-lente.js`. `makePigments` define o azul, verde, dourado e as bordas irregulares. A abertura remove o texto no centro, com uma transição de pigmentos até o branco. Somente as letras recebem as cores: as fotografias permanecem visíveis e clicáveis.

## Carregamento e acessibilidade

As 12 imagens WebP somam **973.720 bytes**. Seus endereços são atribuídos quando o visitante se aproxima da seção; a galeria não pede essas fotos na entrada da hero. Caveat acrescenta 51.220 bytes e não depende de uma conexão com Google Fonts durante a visita.

A montagem usa transformações CSS 3D, sem biblioteca nova. O título é armazenado em um canvas e só redesenhado durante a interação; a resolução é limitada. O efeito pausa fora da tela e quando o documento fica oculto. As cerdas são construídas uma vez e a máscara é exportada apenas na primeira abertura, nunca por quadro.

Com **reduzir movimento**, a seção vira uma coleção estática, sem o percurso longo e sem a lente animada. O título original continua no HTML para tecnologias assistivas e também aparece quando canvas não está disponível. O conteúdo da ficha é HTML, não parte da imagem.
