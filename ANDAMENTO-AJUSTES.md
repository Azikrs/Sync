# Retomada dos ajustes — menu, logo e celular

## Galeria de paisagens com montagem 3D, ficha e lente de tinta — CONCLUÍDO

Entregue no bloco Do nosso chão / NASCEM PAISAGENS: doze fotos reais chegam de profundidades/rotações diferentes e formam a grade 4×3 atrás do título fixo, com retorno pelo scroll. A sequência real Impressions / Heritage do Lumen foi observada no navegador; capturas `lumen-gallery-000.png` a `lumen-gallery-100.png` em `%TEMP%/aflora-mobile-pintura/`. No celular, a grade usa 3×4. As fichas abrem por hover, toque e teclado; têm cerdas de tinta verde/azul/dourada, fonte Caveat e CTA Quero ir sem ação até preencher `href`. A lente abre espaço transparente no texto e faz a transição dos pigmentos até o branco. Fotos reais e créditos em `IMG/paisagens/`, somando 973.720 bytes. Caveat WOFF2 local: 51.220 bytes.

Arquivos: `CSS/paisagens-galeria.css`, `JS/paisagens-galeria.js`, `JS/paisagens-dados.js`, `JS/paisagens-lente.js`, hooks no `Index.html`; guia `COMO-AJUSTAR-GALERIA.md`. Mantidas as alterações do usuário, inclusive logo Brasis e `.natureza`/rodapé. Uma contenção na largura da logo do rodapé em `CSS/style.css` resolve o alargamento do viewport de 390 para 644 px no modo de movimento reduzido.

Validação concluída em Chrome desktop e celular emulado: 320×640, 390×844, 844×390 e 1440×900; 12 fotos/nomes/botões de fechar, hover das fotos centrais e passagem para ficha, toque, Tab/Enter/Escape com retorno do foco, rolagem reversa, transição à próxima seção, redimensionamento, movimento reduzido/retomada e alternativa sem canvas. Confirmados título fixo, ausência de overflow, link ativado ao preencher href e CTA vazio sem navegação. Amostra de pixels: 2.232 pixels de texto removidos pela abertura do cursor. Sem redraw/exportação no repouso, pausa fora da tela e fotos não solicitadas na hero. Nenhum erro JavaScript. Resultados em `%TEMP%/aflora-mobile-pintura/verification-gallery-integration.json`, capturas `galeria-*.png`; revisão independente e revalidação das fichas baixas/movimento reduzido em `%TEMP%/aflora-gallery-review/revalidation.json`. Não equivale a medir desempenho em um celular físico. Nada pendente deste pedido.

## Fonte do título Do nosso chão / nascem paisagens — CONCLUÍDO

Identificada no navegador a fonte real do título Impressions / Heritage do Lumen: IvyPresto Display Thin, peso 100, tracking -0.03em e entrelinha 1.2. Aplicada somente a `.paisagens-conteudo h1` em `CSS/style.css`, com arquivo local `fonts/ivypresto-display-thin.woff2` (64 KB) e origem documentada em `fonts/ivypresto-origem.md`. Corrigido o negrito sintético padrão do h1. Duas linhas em spans de bloco, preservando tamanhos 12vw/8vw e o conteúdo. Conferidos 1920, 1440, 390 e 320 px, sem overflow ou erros. Chrome confirmou que todos os 30 glifos, incluindo ã, usam IvyPrestoDisplay-Thin, sem fallback. Relatório `%TEMP%/aflora-mobile-pintura/verification-paisagens-font.json` e capturas `paisagens-ivy-*.png`.

## Atmosfera escura e revelação difusa na hero — CONCLUÍDO

Pedido: reduzir a presença global do jardim, concentrar luz/textura/profundidade perto do cursor com revelação orgânica, conectar a composição com uma atmosfera central sutil e manter o centro preparado para receber conteúdo futuro. Implementado em `JS/hero-jardim.js` e `CSS/hero-jardim.css`: penumbra no repouso, revelação difusa deformada por dois campos lentos, rastro amortecido e corrente sutil de névoa pela composição inteira. Paleta harmonizada com Brasis. Relevo CSS ajustado de 20 (que era limitado a 2) para 1.25. Nenhuma planta ou mapa de altura novo.

Expansão futura: `data-jardim-resguardar` reserva áreas suaves atrás de até quatro contêineres; marcado no título e descrição em `Index.html`. Medições fora do loop, evento `jardim:atualizar` para blocos novos/reorganizados. Camada decorativa permanece independente e sem capturar interação. Controles de revelação, alcance, atmosfera e proteção documentados em `COMO-AJUSTAR-JARDIM.md`. WebPs de repouso regenerados, também escuros (11.4 KB desktop / 4.9 KB mobile). Regressão da água aprovada após o ajuste de luz: propagação, refração, dissipação, movimento reduzido e controle zero, em `verification-agua.json`. Verificação sintática e `git diff --check` concluídos sem problemas.

Validação: 320×640, 390×844, 844×390 e 1440×900 com layout preservado, sem overflow, CTA acessível, pausa fora da tela, movimento reduzido, contexto WebGL restaurado, mudança de orientação e alternativa sem WebGL. Teste de pixels confirma que a área do cursor ficou cerca de 3.2× mais visível enquanto a borda oposta permaneceu praticamente igual; saída volta à penumbra em ~2.5 s. Centro iluminado permanece discreto. Inserção real de bloco temporário, reserva e clique testados. Sem erros JavaScript/WebGL. Relatórios `%TEMP%/aflora-mobile-pintura/verification-atmosfera.json` e `verification-jardim.json`, capturas `atmosfera-final-*.png`. Comparação de cadência neste Chrome: mediana desktop ~36.4 ms antes / ~36.3 ms depois; toque emulado ~42.4 ms em ambos. Não equivale a medir GPU/bateria de um celular físico. Nenhuma biblioteca ou passagem de desenho adicional.

## Mais flora e interação de água na hero — CONCLUÍDO

Pedido: ampliar o jardim existente com árvores, folhagens e flores, refinar o relevo e adicionar o rastro de água do cursor inspirado na seção Reflection Of Art do Lumen. Referência observada no navegador, capturas `lumen-01.png` a `lumen-04.png` em `%TEMP%/aflora-mobile-pintura/`. Não restaurar fundos topográficos rejeitados.

Entregue: `scripts/gerar-jardim.cjs` ampliado com ipê ramificado, palmeira, bromélia, flores menores e novas samambaias; pontas, bordas e nervuras suavizadas. Mapas de altura desktop/mobile regenerados. `JS/hero-jardim.js` distribui luz ambiente pelas bordas e simula ondas físicas amortecidas em uma malha pequena, com refração e reflexo integrado ao relevo. Mouse consolidado por quadro, sem interceptar toque. Controle `--jardim-agua` em `CSS/hero-jardim.css`; guia atualizado em `COMO-AJUSTAR-JARDIM.md`. Alternativas WebP exportadas do renderer atualizado.

Validação: 320×640, 390×844, 844×390 e 1440×900 sem overflow, conteúdo/layout preservados, CTA acessível, pausa fora da tela, cursor, movimento reduzido, recuperação WebGL e mudança de orientação. Simulação conferida: propagação espacial, refração visível, dissipação da energia em mais de 98% após 4,5 s no trajeto de teste, limpeza ao ativar movimento reduzido e controle zero desligando a água. Sem erros JavaScript. Relatórios `%TEMP%/aflora-mobile-pintura/verification-jardim.json` e `verification-agua.json`; scripts `verify-jardim.cjs` e `verify-agua.cjs`; captura final `agua-final-hero.png`. Revisão independente do agente flora_expansion incorporada. Retomada de 14/09/2026 concluiu documentação e conferência das alternativas estáticas.

## Fundo baseado no baixo-relevo do Immersive Garden — CONCLUÍDO

Usuário rejeitou e removeu o shader topográfico anterior. Não restaurar aquele fundo; as imagens antigas `IMG/hero-relevo-*.webp` também foram removidas. Foi possível abrir a referência real no Chrome: é uma superfície fosca texturizada com volumes botânicos em baixo-relevo que emergem junto ao mouse e somem suavemente, com sombra lateral; NÃO são anéis topográficos. Capturas reais em `%TEMP%/aflora-mobile-pintura/garden-01.png` a `garden-04.png`, script `reference-garden.cjs`. Manter centro livre, paleta verde/petróleo/azul/ouro e conteúdo atual intacto.

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
