# Animações de texto

Os arquivos `CSS/efeitos-texto.css` e `JS/efeitos-texto.js` já estão incluídos no `Index.html`.

## Subida suave com opacidade

Adicione `data-surgir` para o texto subir enquanto aparece. Ele espera chegar a 80% da altura da tela (contados de cima), faz uma pausa curta e anima uma vez, sem precisar continuar rolando. A descrição da abertura usa esse efeito; os capítulos dos destinos usam a animação contínua descrita em `COMO-AJUSTAR-DESTINOS.md`.

```html
<h2 data-surgir>Seu próximo destino.</h2>
<p data-surgir>Um novo olhar sobre o Brasil.</p>
```

O padrão é uma subida de 36px em 700ms, depois de uma pausa de 150ms. Personalize no elemento ou em sua classe CSS:

```html
<p data-surgir
   style="--surgir-inicio: 65; --surgir-distancia: 40px; --surgir-duracao: 1400ms; --surgir-atraso: 300ms">
  Entre a cidade e o céu.
</p>
```

`--surgir-inicio` controla onde a entrada começa: `65` espera o texto chegar mais perto do centro; `85` começa mais cedo. Use um número entre 10 e 100, sem `%`. No fim da página, textos visíveis aparecem mesmo que não possam alcançar essa posição.

Para uma sequência, use `--surgir-atraso: 340ms` no segundo texto e `460ms` no terceiro. Adicione `data-surgir-repetir` junto de `data-surgir` para repetir quando o texto sair e entrar na tela. Se você passar rapidamente e sair antes de a animação terminar, ela é preparada novamente, mesmo sem esse atributo.

Escolha `data-surgir` **ou** `data-revelar` para cada elemento. Se ele já usa sua própria animação, opacidade ou a propriedade CSS `translate`, coloque o efeito em um `span` dedicado dentro dele. Links e palavras em destaque continuam funcionando. A animação é dispensada com movimento reduzido ativado ou ao receber foco pelo teclado.

## Barra que revela a escrita

Adicione `data-revelar` à tag do texto. A barra entra pela esquerda e sai pela direita quando o texto entra na tela. A animação acontece uma vez.

```html
<h2 data-revelar>Seu próximo destino.</h2>
<p data-revelar>Uma nova forma de conhecer o Brasil.</p>
```

Você pode manter `<em>`, `<strong>` e links dentro do texto. Em parágrafos que quebram em várias linhas, a barra cobre o bloco inteiro. Para barras separadas por linha, marque cada linha:

```html
<h2>
  <span data-revelar style="display: block">Um país.</span>
  <span data-revelar style="display: block; --revelar-atraso: 180ms">Muitos Brasis.</span>
</h2>
```

Personalize a cor, a duração e o atraso no elemento ou em sua classe CSS:

```html
<h2 data-revelar
    style="--revelar-cor: #e0b837; --revelar-duracao: 1600ms; --revelar-atraso: 200ms">
  Fernando de Noronha
</h2>
```

Use `data-revelar-repetir` junto de `data-revelar` se quiser repetir toda vez que o texto sair e entrar novamente na área de ativação.

A barra está aplicada nas linhas de “Um país. Muitos Brasis.”. A revelação usa `::after`: se o texto já tem decoração nesse pseudo-elemento ou sua própria animação CSS, aplique o atributo em um `span` dedicado dentro dele.

## Pinceladas nas letras

Use `data-pintar-brasil` em cada linha para pintar as letras em verde, amarelo e azul. Voltar o scroll desfaz a pintura. O efeito continua disponível para outros textos; os títulos dos destinos usam agora `data-destino-revelar`. A pintura de letras não muda a velocidade da animação da bandeira nem do parallax.

```html
<h2>
  <span data-pintar-brasil style="display: block">Cristo</span>
  <span data-pintar-brasil style="display: block">Redentor</span>
</h2>
```

Use a pintura em linhas de texto simples, sem outras tags internas. Uma camada decorativa, ignorada pelos leitores de tela, é criada sobre o texto original. A cor original permanece sob a tinta. A imagem e as cores da pintura ficam em `.texto-brasil__tinta` no CSS.

Se inserir novos elementos por JavaScript, execute `window.EfeitosTexto.atualizar()` depois da inserção. Textos escritos diretamente no HTML são preparados automaticamente ao abrir a página.

Sem JavaScript, os textos continuam visíveis. Com movimento reduzido ativado no sistema, as entradas aparecem imediatamente e a pintura aparece pronta.
