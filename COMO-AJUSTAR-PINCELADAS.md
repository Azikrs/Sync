# Pintura da hero e convite ao scroll

## Brasis

O texto continua no HTML, dentro de `<span class="texto-pincelado" data-pincelado>Brasis</span>`. Pode trocar a palavra; o recorte acompanha sua fonte e tamanho. A logo não tem mais pintura.

Em `.texto-pincelado`, no `CSS/style.css`, ajuste:

- `--pincel-entrada: 1350ms`: duração das três pinceladas iniciais, verde, azul e amarelo. Começam quando a barra revela a palavra, com trajetos levemente aleatórios a cada carregamento.
- `--pincel-duracao: 2000ms`: duração de cada mão de tinta depois da abertura (valor atual ajustado pelo usuário).
- `--pincel-pausa: 700ms`: intervalo para apreciar a composição (valor atual ajustado pelo usuário).
- `--pincel-verde`, `--pincel-bege` e `--pincel-petroleo`: as três cores.

`JS/texto-pincelado.js` deposita seis pinceladas de cerdas com pressão e falhas de tinta. Cada ciclo alterna as cores e a direção dos gestos sobre a pintura anterior. Não há limpeza visível entre ciclos nem exportação de imagens durante a animação. Ela pausa fora da tela e com a aba oculta; com movimento reduzido, a composição fica estática.

## Siga o curso

O desenho de rio e a legenda ficam em `.destino-corrente`, no `Index.html`. É um convite visual à rolagem, não um botão.

No `CSS/destinos.css`, as cores e a duração de `4200ms` controlam o fluxo. `JS/destinos.js` sincroniza sua presença com a luz de leitura dos três destinos: entra com o escurecimento e desaparece entre 22% e 40% do percurso dos textos. As animações do traço ficam pausadas enquanto o convite não está visível. O posicionamento usa a altura segura da tela móvel.
