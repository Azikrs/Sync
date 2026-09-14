# Retomada dos ajustes — menu, logo e celular

## Mais flora e interação de água na hero — EM ANDAMENTO

Pedido atual: ampliar o jardim existente com árvores, folhagens e flores, refinar o relevo e adicionar o rastro de água do cursor inspirado na seção Reflection Of Art do Lumen. Preservar conteúdo, layout e pintura de Brasis. Não restaurar fundos topográficos rejeitados. Implementação parte de `scripts/gerar-jardim.cjs`, `JS/hero-jardim.js` e `CSS/hero-jardim.css`. Próximos passos: observar Lumen no navegador, ampliar geometria, simular ondulações amortecidas sobre a superfície, exportar alternativas estáticas e validar mobile/ciclo de vida WebGL. Atualizar este bloco ao concluir.

## Fundo baseado no baixo-relevo do Immersive Garden — CONCLUÍDO

Usuário rejeitou e removeu o shader topográfico anterior. Não restaurar aquele fundo. Restam somente as imagens antigas `IMG/hero-relevo-*.webp`, ainda sem uso. Agora foi possível abrir a referência real no Chrome: é uma superfície fosca texturizada com volumes botânicos em baixo-relevo que emergem junto ao mouse e somem suavemente, com sombra lateral; NÃO são anéis topográficos. Capturas reais em `%TEMP%/aflora-mobile-pintura/garden-01.png` a `garden-04.png`, script `reference-garden.cjs`. Manter centro livre, paleta verde/petróleo/azul/ouro e conteúdo atual intacto.

Estado: nova implementação feita e primeira revisão visual concluída. `scripts/gerar-jardim.cjs` gera esculturas originais parametrizadas (pétalas, folhas, samambaia, hastes) em mapas de altura RG de 16 bits: `IMG/jardim-altura-desktop.png` e `jardim-altura-mobile.png`. `JS/hero-jardim.js` usa esses volumes para calcular normais/sombras e emergência perto do mouse, com rastro amortecido. `CSS/hero-jardim.css` e hooks no `Index.html` preservam o conteúdo. Exposição verde/petróleo/azul/ouro em superfície fosca. Capturas iniciais `jardim-1440.png`, `jardim-390.png` no diretório TEMP acima.

Concluído: exportadas alternativas estáticas `IMG/jardim-desktop.webp` e `jardim-mobile.webp` do próprio renderer; removidas as duas imagens antigas rejeitadas; controles documentados em `COMO-AJUSTAR-JARDIM.md`. Validação final aprovada em 320×640, 390×844, 844×390 e 1440×900: mesma geometria do conteúdo com/sem a camada, sem overflow, links alcançáveis, pausa fora da tela, cursor, movimento reduzido/retomada, recuperação WebGL e troca do mapa na mudança de orientação. Alternativa sem WebGL também verificada. Sem erros JavaScript ou recursos do projeto faltando. Relatório `%TEMP%/aflora-mobile-pintura/verification-jardim.json`, script `verify-jardim.cjs`, capturas `jardim-final-*.png` e `jardim-fallback.png`. Nada pendente deste pedido. Revisão e validação final feitas localmente pela raiz após o agente atingir limite de uso.

Último pedido: adicionar três pinceladas iniciais aleatórias em Brasis. Implementado em `JS/texto-pincelado.js`: abertura única de 1350ms, sincronizada com o fim da barra de revelação, três pigmentos e variação dos trajetos por carregamento. Depois de 200ms segue o ciclo existente sobre a mesma camada, sem apagar a tinta. Preservadas as cores e a duração/pausa de 2000ms/700ms ajustadas pelo usuário. Controle `--pincel-entrada` em `CSS/style.css`.

Estado do último pedido: CONCLUÍDO. Na retomada, confirmado que a validação final já havia terminado após a última alteração: desktop de 1440px e celular emulado de 390px, três cores iniciando após a revelação (primeira em cerca de 43ms), continuidade sem apagar, pausa fora da tela e movimento reduzido. Sem erros JavaScript. Relatório `%TEMP%/aflora-mobile-pintura/verification-abertura.json` e capturas `abertura-390.png` / `abertura-1440.png`. Nada pendente nessa abertura.

Atualização posterior: a pedido do usuário, a pintura saiu da logo e passou para **Brasis** na hero, em ciclos contínuos de cerdas sobrepostas. Implementação em `JS/texto-pincelado.js`; `JS/marca-pintura.js` foi removido. Adicionado o convite **Siga o curso**, com margens de rio e pigmento dourado, sincronizado com o escurecimento e a leitura dos três destinos. Controles em `COMO-AJUSTAR-PINCELADAS.md`.

Validação desta atualização: 320×640, 390×844, 768×1024 e 1440×900, sem overflow ou erros JavaScript. Confirmados ciclos de pintura sem hover e sem exportar PNG, pausa fora da tela/retomada e composição estática com movimento reduzido. Convite conferido nos três destinos em celular e desktop, incluindo entrada, saída e rolagem inversa. Capturas e relatório em `%TEMP%/aflora-mobile-pintura/verification-brasis.json` (script `verify-brasis.cjs`).

Pedido ativo: preservar o desktop; bolinha apenas no menu expandido, item atual amarelo e sublinhado branco no hover. Substituir a logo com bandeira/revelação lateral por pinceladas reais, em verde escuro, bege e petróleo, mantendo troca pelo src. Corrigir faixa clara ao recolher a barra do navegador móvel, travamentos/blur na saída da bandeira, composição da hero móvel, centralização da logo e suavidade do botão Quero ir.

Estado: CONCLUÍDO e verificado no navegador em 9 tamanhos (320 a 1440 px, incluindo paisagem).

Entregue:
- Bolinha somente no menu expandido; página atual amarela e sublinhado branco no hover/foco.
- Pintura de seis gestos entregue inicialmente na logo, depois transferida para Brasis conforme a atualização acima. A logo atual é estática.
- Logo centralizada no menu compacto; ajuste do botão da header nas telas estreitas.
- Hero móvel com um alinhamento, espaçamentos definidos e altura baseada no conteúdo.
- Fundo com 100lvh e raiz preta: cobre a altura liberada pela barra móvel sem redimensionar a foto durante o gesto.
- Saída da bandeira no toque usa uma cópia nítida rasterizada uma vez e dissolve diretamente no canvas, sem PNGs gerados a cada frame e sem blur. Desktop preserva o efeito anterior.
- Quero ir com gesto contínuo, volta suave e contorno desacoplado do progresso do scroll.

Validação: menu/teclado e ausência de overflow em 9 tamanhos; ida/volta da dissolução com CPU 4x mais lenta; zero exportações PNG na saída; cobertura do fundo em 4 alturas; pintura da logo, reset, foco, movimento reduzido e substituição do src; foco/retorno dos botões. Sem erros JavaScript. Resultados e capturas: %TEMP%/aflora-mobile-pintura/verification.json e verify.cjs. A barra do navegador de um aparelho físico não é reproduzida integralmente pela emulação; eventual retorno do usuário sobre isso deve ser conferido no mesmo aparelho.

Achados:
- Menu já usa limite de 1200 px definido no CSS; o JS lê --header-compacto.
- Diagnóstico inicial resolvido: imagem de bandeira na logo, fundo preso a 100svh, exportações PNG/filtros na saída e colunas assimétricas na header.

Não substituir as alterações de estilo feitas pelo usuário. Verificar os arquivos atuais antes de retomar. Atualizar este registro ao concluir cada bloco.
