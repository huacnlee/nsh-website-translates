---
title: "Guias de Design"
description: "Orientações de design de produto e de interação para apps criados com Native Shell: hierarquia, cores e tokens, espaçamento, densidade, componentes, estados de interação, sobreposições, movimento, visualizações com muitos dados, textos de interface e adequação à plataforma."
order: 29
group: ui
source_hash: 4296bdbce6ed3911
---


# Guias de Design

Use este guia antes de escolher componentes ou escrever código de layout para um app criado com Native Shell. Ele registra o
julgamento de produto que o GPUI Kit acumulou em anos de trabalho com desktop, levado para o NSH: uma interface deve parecer
nativa, discreta, precisa e compreensível sem adivinhação.

Este é um guia normativo. **Deve** indica uma restrição de correção ou de ecossistema, **deveria** é o padrão que
precisa de um motivo concreto para ser substituído, e **pode** é uma técnica opcional. As páginas [Elementos](../elements/index.md) e
[API](../modules/index.md) continuam sendo a referência para props e métodos individuais.

As regras se baseiam no comportamento de `nsh/base` (`nsh_base` em Rust), no tema e em seus tokens, e na interação que os usuários de
cada plataforma já conhecem. O NSH renderiza com a interface própria de cada plataforma e deixa a aparência a cargo do app: os
componentes de `nsh/base` trazem comportamento, estado, foco e acessibilidade, e toda cor, tamanho, raio e espaçamento vem dos
componentes do próprio app, de modo que estas regras orientam o design system do app. <a href="https://ui.shadcn.com/docs" target="_blank" rel="noopener noreferrer">shadcn/ui</a>
contribui com métodos úteis (código aberto, composição e padrões confiáveis), mas não determina a aparência de um app NSH.
Quando as influências entram em conflito, preserve o comportamento da plataforma e a interação que as pessoas já entendem.

<a id="design-thesis"></a>

## Tese de design

Construa interfaces que pareçam nativas, discretas e precisas. Deixe o conteúdo, a hierarquia e a interação conduzirem a experiência;
a decoração deve apoiá-los, não competir com eles.

1. **Clareza antes de personalidade.** Deixe clara a tarefa principal e a próxima ação antes de acrescentar expressão de marca.
2. **Composição antes de invenção.** Comece com componentes estabelecidos e componha-os em fluxos de trabalho específicos do
   produto. Crie uma nova primitiva somente quando o comportamento dela for realmente novo.
3. **Tokens antes de valores.** Cores, raios, tipografia e espaçamento devem formar um sistema. Evite literais isolados que
   não respondem a temas. Veja [Estilização](./styling.md), [Tailwind](./tailwind.md) e [o tema](./rust.md#theme).
4. **Plataforma antes de convenção da web.** Preserve acesso por teclado, o chrome da janela, menus, visualizações de dados densas, regiões
   redimensionáveis e navegação persistente nos desktops, e os cabeçalhos do sistema, o gesto de voltar, os alertas e as áreas
   de toque nos celulares e tablets, onde a tarefa se beneficiar deles.
5. **O estado deve ser visível.** Hover, pressionado, foco, seleção, desabilitado, carregando, validação e estados destrutivos
   precisam de tratamento distinto e consistente.
6. **A geometria explica a contenção.** Raios, recuos e limites devem descrever uma hierarquia coerente, mesmo quando as
   superfícies se sobrepõem.
7. **O feedback reflete a realidade.** Carregamento, tooltips e movimento devem esclarecer um estado ou uma transição reais, não acrescentar
   cerimônia a uma ação imediata.

<a id="learning-from-shadcn"></a>

## Aprendendo com o Shadcn

A contribuição mais útil do Shadcn não é uma cor de borda específica. É uma forma de construir um sistema:

- ser dono da camada superior da interface em vez de lutar contra uma abstração fechada;
- compor partes pequenas e previsíveis em componentes específicos do produto;
- fornecer padrões que já formem uma única linguagem visual;
- manter o código e a composição legíveis tanto para pessoas quanto para IA;
- separar as primitivas de comportamento da camada estilizada.

O NSH aplica essas ideias por meio da divisão entre as primitivas de `nsh`, os componentes-base sem estilo de
`nsh/base` e a camada estilizada, que pertence ao app ([Três camadas](./architecture.md#three-layers)).
Os aplicativos constroem seus componentes sobre `nsh/base`, em TSX ou no crate Rust do app; o comportamento reutilizável pertence a
`nsh/base`, e a política visual fica acima dele.

Não copie estas suposições da web às cegas:

| Hábito da web | Padrão no NSH |
| --- | --- |
| Cursor de mão apontando em todo botão | Cursor padrão; mão apontando (`cursor-pointer`) para links |
| Navegação por páginas como estrutura principal | Janelas, painéis, barras laterais, abas e menus persistentes nos desktops; um `NavStack` com o botão de voltar do sistema nos celulares |
| Foco e rolagem do navegador como alternativa | Posse explícita do foco e rolagem controlada pela região (`Scroll`, `List`) |
| Coluna única, mobile-first | Uma coluna nos celulares, um shell redimensionável com tamanho mínimo de janela definido nos desktops |
| Ações críticas reveladas no hover | Ações acessíveis por teclado, toque e ponteiro que não dependam de hover |
| Uma fileira de botões de ícone visíveis só no hover | Uma ação primária visível mais `Menu` ou `ContextMenu` para comandos secundários |
| Texto com estilo de link para comandos do aplicativo | Um `Button` no estilo padrão, outline ou ghost do app; estilo de link apenas para URLs, recursos da web ou endereços de e-mail |
| Grande densidade de toque em todo lugar | Alvos com tamanho de toque em telas sensíveis ao toque; densidade média com ponteiro, compacta somente onde o trabalho com informação se beneficiar |
| Um cabeçalho desenhado e um card de alerta em todas as plataformas | O cabeçalho e o `AlertDialog` do sistema no iOS e no Android; o slot `header` da página nos desktops e na web |
| Sobrescritas de CSS em todos os descendentes | Os componentes do app, suas partes e os tokens do tema |

<a id="start-from-the-task"></a>

## Comece pela tarefa

Antes de desenhar uma tela, escreva:

- a tarefa principal do usuário;
- o objeto sendo visualizado ou alterado;
- as ações que devem permanecer imediatamente disponíveis;
- as informações necessárias para tomar uma decisão;
- os estados vazio, carregando, erro, offline, somente leitura e permissão negada;
- o caminho por teclado, toque e leitor de tela ao longo do fluxo de trabalho;
- onde o app é exibido: sozinho ou dentro de um app host.

Organize a tela em torno dessas respostas. Não comece com uma grade de dashboard ou um catálogo de componentes. Uma boa interface
expõe o modelo mental do usuário: documentos, contas, projetos, mensagens, configurações ou outro objeto estável, e não a
arquitetura interna dos serviços.

Projete a tarefa principal antes de distribuir os controles. Seu peso visual, sua localização e sua profundidade de informação devem corresponder
à importância dela para o produto. Um resultado central não deve ser reduzido a uma pequena contagem, um ícone no canto ou uma ação
fraca no rodapé enquanto o conteúdo secundário consome a página. Quando um conjunto de resultados é o principal valor do produto, considere uma
região de resumo ou um card que exponha a contagem, resultados representativos, o estado relevante e uma próxima ação clara.

Para cada ação proposta, nomeie seu objeto visível, estado atual, escopo e resultado. Se a interface não mostrar
nem sugerir claramente essas coisas, a ação é prematura. Não exponha uma capacidade só porque o backend a possui;
primeiro projete como o objeto entra no modelo mental do usuário.

<a id="visual-language"></a>

## Linguagem visual

<a id="hierarchy"></a>

### Hierarquia

Prefira um pequeno número de níveis claros:

- o **título da janela ou da página** identifica o objeto ou espaço de trabalho atual;
- o **título de seção** separa regiões significativas (`role="header"`, para que os leitores de tela possam saltar entre elas);
- o **texto do corpo** carrega o trabalho;
- o **texto esmaecido** fornece metadados secundários e ajuda;
- os **rótulos** identificam controles e valores.

Use tamanho, peso, espaçamento e separadores antes de acrescentar cor ou contêineres. Evite aninhar cards dentro de cards: a maioria das
regiões precisa apenas de um fundo, um limite de linha fina e um espaçamento intencional.

Avalie a hierarquia na funcionalidade como um todo, não componente por componente. Oculte a cor de destaque e a decoração durante
a revisão: a tarefa principal, a seleção atual, o resumo do resultado e a próxima ação ainda devem ser óbvios pela estrutura.
Uma tela que contém controles individualmente plausíveis ainda pode falhar quando eles não formam uma única ordem de leitura e um único
caminho de decisão.

Trate a ênfase como um orçamento limitado. Uma superfície local precisa de um ponto focal claro, não de um campo de destaques concorrentes.
Se tudo é colorido, com badge, em negrito, em caixa ou promovido a alerta, nada parece importante. Estabeleça prioridade
primeiro com estrutura e proximidade; gaste cor e componentes mais fortes somente onde uma distinção mudar o que o
usuário percebe ou faz.

<a id="color-and-themes"></a>

### Cor e temas

Leia as cores do tema (`theme()` em Rust, classes de token em TSX) e use-as por papel semântico:

- `background` e `foreground` para a superfície e o texto principais;
- `card`, `popover`, `sidebar` e seus tokens de foreground para as superfícies correspondentes;
- `muted` e `muted-foreground` para informações de apoio;
- `primary` para a ação principal ou a ênfase de seleção, `secondary` e `accent` para ênfase mais discreta e
  linhas com hover ou foco;
- `destructive` apenas para ações destrutivas e erros, e as cores de status que o app acrescenta ao seu tema (`success`,
  `warning`) apenas para os significados que representam;
- `chart-1` a `chart-5` para séries de dados;
- `border`, `input` e `ring` para estrutura e interação.

```rust tabs
use nsh_base::theme;

view()
    .rounded(move || theme().radius)
    .border_1()
    .border_color(move || theme().border)
    .bg(move || theme().background)
    .p_4()
    .gap_1()
    .child(text("Balance").text_color(move || theme().foreground))
    .child(text("Updated just now").text_sm().text_color(move || theme().muted_foreground))
```

```tsx tabs
<View class="gap-1 rounded-(--radius) border border-border bg-background p-4">
  <Text class="text-foreground">Balance</Text>
  <Text class="text-sm text-muted-foreground">Updated just now</Text>
</View>
```

Não use uma cor semântica de status como decoração. Não codifique significado apenas pela cor. Verifique cada superfície personalizada em
temas claro e escuro e com valores de tema personalizados, incluindo o tema de um app host que incorpore o seu; nunca presuma
que o foreground é preto ou que o background é branco.

Use um badge para um estado curto, uma contagem ou uma classificação que se beneficie de uma leitura rápida, e não para todo rótulo,
valor de metadado, filtro ou título de seção. Mantenha a maioria dos badges neutros; reserve as cores semânticas para estados que realmente
transmitam sucesso, aviso, ação destrutiva ou informação. Uma fileira de badges multicoloridos geralmente indica uma decisão de hierarquia ou
de agrupamento que faltou.

A interface do aplicativo não deve conter hex bruto, cores `rgb()`/`rgba()` ou `hsl()`, nem classes de paleta como
`bg-zinc-100`. Resolva as cores a partir do tema por papel semântico. Se o papel necessário não existir, defina-o no
arquivo de tema do app ([Tokens de tema](./tailwind.md#theme-tokens): `"up": "#16a34a"` em seu `light` e `dark` gera
`text-up`, `bg-up/30`, `token("up")` em TSX e `theme().color("up")` em Rust) em vez de embutir um valor de paleta
no ponto de chamada. Cores brutas pertencem apenas às definições de tema ou a conteúdo de dados/raster auditado cuja cor é, ela mesma, o dado.

<a id="radius-spacing-and-density"></a>

### Raio, espaçamento e densidade

Use uma escala finita de raios, assim como para tipografia e tamanhos de controle. Escolha entre o `radius` do tema (para controles e
superfícies igualmente, `rounded-(--radius)`), os raios que o app acrescenta ao seu tema e o `rounded-sm` … `rounded-2xl` do Tailwind entre eles) em vez de inventar um
raio para cada elemento. Contêineres grandes podem usar um nível mais suave que o dos controles que contêm; controles compactos e
overlays usam níveis mais apertados. Para um retângulo comum, o raio deve permanecer visivelmente menor que a metade do seu lado menor. Use `rounded-full` (`.rounded_full()`) apenas para círculos e pílulas intencionais; um tooltip não deve virar
uma cápsula por acidente.

Superfícies aninhadas devem ser lidas como formas concêntricas. Use `inner radius ≈ max(0, outer radius − gap)` para escolher o
raio adequado mais próximo; a faixa visível deve permanecer uniforme ao longo da curva. Acrescente um token nomeado ao tema
(`"radius-inset": "0.375rem"`, `rounded-(--radius-inset)`) se uma composição repetida precisar de um valor intermediário. Um controle
segmentado é uma única silhueta: seus segmentos das pontas seguem os cantos internos do contêiner, seus segmentos do meio permanecem retos
e cada limite tem um único divisor de espessura consistente.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/radius-hierarchy-light.svg" alt="Light theme chat composer: the inset surface, both buttons, and placeholder spacing change together; red guide circles show their shared corner center.">
<img class="diagram diagram-dark" src="/diagrams/radius-hierarchy-dark.svg" alt="Dark theme chat composer: the inset surface, both buttons, and placeholder spacing change together; red guide circles show their shared corner center.">
</div>

Um raio deve governar toda a superfície visível, não apenas a borda. Os cantos expostos permanecem transparentes em relação à
superfície atrás deles; fundos de filhos, preenchimentos de seleção e conteúdo rolável também devem seguir o limite. Dê às
superfícies internas o próprio raio, ou recorte o contêiner com `overflow-hidden` (`.overflow_hidden()`), e então inspecione
a composição contra um fundo contrastante nos dois temas. Preserve os anéis de foco externos ao escolher um recorte.

Use uma escala de espaçamento compacta e repita-a. Pares rótulo/controle relacionados devem ficar mais próximos que grupos distintos; grupos
distintos devem ficar mais próximos que seções distintas. Prefira os tamanhos dos componentes do app (pequeno, médio como padrão,
grande) a alturas avulsas. Use variantes compactas para barras de ferramentas e telas densas em dados, não para espremer um layout confuso
em menos espaço.

A escala semântica compartilhada é intencionalmente pequena: o espaçamento progride por aproximadamente 2, 4, 8, 12, 16, 24 e 32
pontos, enquanto a tipografia fica perto de 12, 14, 16, 18 e 20 pontos. Trate esses valores como relações, não como permissão
para espalhar seus valores atuais pelo código das funcionalidades. A escala de espaçamento do Tailwind os fornece: um passo equivale a 4 pontos
(`p-4` é 16pt), tanto em classes quanto em métodos tipados do Rust; `"spacing"` no `"tailwind"` de `nsh.json` altera o passo das
classes, e os métodos tipados mantêm a escala padrão do Tailwind. Um aplicativo que precise de uma escala diferente é dono dela em seus
próprios componentes ou tokens de tema (`p-(--gap-card)`) e a usa de forma consistente.
<a id="spatial-grammar"></a>

### Gramática espacial

O espaçamento expressa relação. Escolha um intervalo da escala semântica perguntando o que os dois elementos significam um para o outro:

| Relação | Classe típica | Escala atual | Exemplos |
| --- | --- | --- | --- |
| Correção óptica | `gap-0.5` | 2 pt | linha de base de ícone, separador compacto |
| Partes de um mesmo controle | `gap-1` | 4 pt | ícone/rótulo de menu, título/descrição |
| Controles intimamente relacionados | `gap-2` | 8 pt | ícone/rótulo de botão, ações de diálogo |
| Um grupo de conteúdo | `gap-3` | 12 pt | colunas de notificação, linhas de formulário compactas |
| Grupos separados em uma seção | `gap-4` | 16 pt | padding de painel, grupos de formulário |
| Seções separadas | `gap-6` | 24 pt | blocos principais em uma página ou inspetor |
| Limite de região principal | `gap-8` | 32 pt | respiro de estado vazio, faixas de página |

Esses valores descrevem a escala padrão, não literais a serem repetidos. Use as classes de espaçamento e os métodos tipados (`gap-2`,
`.gap_2()`, `p-4`, `.p_4()`) ou os tokens do tema. Uma escala própria do produto deve preservar a ordem e
as relações, e deve ser passada pelos componentes da própria aplicação, em vez de ser escrita em cada ponto de uso.

Use estas regras ao resolver o espaço horizontal e vertical:

1. **Dentro antes de fora.** O padding de um componente pertence ao componente; o intervalo entre componentes pertence
   ao pai deles.
2. **O ritmo vertical mostra o agrupamento.** O intervalo entre um título e sua descrição é menor que o intervalo entre
   essa descrição e a próxima seção. Intervalos iguais implicam relações iguais.
3. **O espaço horizontal apoia a leitura dinâmica.** Linhas repetidas mantêm ícones, rótulos, valores, badges e ações
   finais em colunas estáveis.
4. **Início e fim são semânticos.** Pense em bordas na ordem de leitura e escreva-as como início e fim (`ps-*`,
   `me-*`, `.ps_4()`), de modo que o layout seja espelhado da direita para a esquerda.
5. **Não duplique o padding.** Um card colocado em um painel que já tem padding não deve adicionar automaticamente outro
   recuo completo de painel.
6. **Use o alinhamento óptico com moderação.** Uma correção de um ou dois pontos é válida para a geometria de ícones ou
   glifos, mas documente por que ela difere da escala.

Composições comuns ilustram as relações:

- o conteúdo de botões usa 4 pt em tamanhos pequenos e 8 pt em tamanhos normais;
- cabeçalhos e rodapés de diálogo usam um intervalo interno de 8 pt;
- linhas compactas de listas e menus usam 4 pt de padding vertical e 8–12 pt de padding horizontal;
- cabeçalhos de sheet usam cerca de 16 pt de espaço inicial e 12 pt de espaço final, deixando espaço para um elemento de
  fechamento, enquanto os rodapés usam 16 pt de espaço horizontal e 12 pt de espaço vertical;
- notificações usam 16 pt de padding horizontal e 12 pt de intervalo entre colunas, porque ícone, mensagem e ação são
  grupos distintos.

Não trate isso como receitas para copiar e colar em todas as superfícies. Elas revelam o sistema: os controles são mais
compactos internamente, as linhas otimizam a leitura dinâmica e os contêineres gastam mais espaço em sua borda do que
entre seus conteúdos.

<a id="proportion-and-layer-hierarchy"></a>

### Proporção e hierarquia de camadas

Comece pelos requisitos de conteúdo e depois defina as proporções. Evite metades arbitrárias quando um painel tem um
papel claramente diferente.

- Uma barra lateral de navegação deve ser larga o suficiente para rótulos estáveis, mas visivelmente subordinada à área
  de trabalho. Dê a ela largura mínima, preferida e máxima (`min-w-*`, `w-*`, `max-w-*`), em vez de apenas uma porcentagem.
- Em layouts mestre–detalhe, deixe a coleção fácil de percorrer e dê o excedente ao painel de detalhe. Um ponto de
  partida de aproximadamente um terço/dois terços costuma ser útil, mas as restrições de conteúdo são a autoridade. Em
  um celular, os dois viram duas páginas de um `NavStack`.
- Inspetores e sheets auxiliares não devem cobrir o objeto principal por padrão. Eles devem ser redimensionáveis ou
  descartáveis quando o conteúdo crescer; um [`Sheet`](../elements/sheet.md) fecha com o backdrop, com Escape e com o botão de voltar.
- A largura do diálogo vem da decisão: um `AlertDialog` para uma confirmação curta, um formulário médio ou uma janela/página
  dedicada para trabalho complexo. Não aumente um diálogo apenas para criar espaço em branco.
- Reserve a elevação mais forte para a camada de decisão mais alta. Dentro de uma camada, use fundo e linhas finas, e não
  sombras sucessivamente maiores, para mostrar a hierarquia.

Defina três restrições de tamanho para cada região principal: o mínimo em que sua tarefa ainda funciona, um padrão
confortável e como ela consome o excedente. Persista divisões controladas pelo usuário quando representarem preferência
de fluxo de trabalho e limite os valores restaurados de acordo com a janela atual.

<a id="alignment-details"></a>

### Detalhes de alinhamento

O alinhamento é um sistema estrutural, não uma passada final de acabamento. Estabeleça um pequeno conjunto de eixos de
alinhamento para cada superfície: bordas iniciais e finais compartilhadas, linhas de base de texto, linhas centrais e
faixas funcionais fixas. Elementos do mesmo nível devem se prender ao mesmo eixo de cima para baixo ou do início ao fim,
mesmo quando são de tipos de componente diferentes.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/alignment-spines-light.svg" alt="Alignment spines across a content region">
<img class="diagram diagram-dark" src="/diagrams/alignment-spines-dark.svg" alt="Alignment spines across a content region">
</div>

Linhas vermelhas verticais ficam ao lado de bordas compartilhadas ou de centros de controles para conteúdo, status,
horário e ações finais. Linhas horizontais ficam sob as linhas de base do texto ou atravessam o centro de uma linha para
mostrar o alinhamento inferior e o vertical central. A comparação compacta isola um desvio de um pixel renderizado que
deve ser corrigido em seu responsável estrutural.

- Dê às regiões irmãs um recuo de conteúdo compartilhado. Um título, uma barra de ferramentas, uma linha de lista, um
  estado vazio e um rodapé que descrevem o mesmo nível não devem inventar, cada um, uma borda inicial ligeiramente
  diferente.
- Repita a geometria das colunas em toda a região. Cabeçalhos, linhas, resumos, estados de carregamento e editores
  inline devem reservar as mesmas faixas para identidade, metadados, status, números e ações.
- Alinhe controles relacionados entre linhas e seções. Rótulos, campos, descrições e mensagens de validação de
  formulários devem revelar uma grade vertical estável quando a página é percorrida de cima para baixo.
- Mantenha as faixas horizontais coerentes. Itens que compartilham uma barra de ferramentas, cabeçalho, barra de status
  ou linha devem usar uma única linha de base ou linha central, em vez de deslocamentos ajustados individualmente.
- Introduza recuo apenas para hierarquia, contenção ou divulgação reais. O recuo decorativo faz os irmãos parecerem
  subordinados e quebra a linha de leitura da superfície.
- Quando um nível aninhado termina, volte exatamente ao eixo do pai. Não deixe o padding acumulado derivar entre
  contêineres aninhados.
- Preserve o eixo diante de conteúdo opcional. A ausência de ícones, badges, descrições ou ações finais não deve mover os
  rótulos restantes; use slots ou faixas intencionais quando a comparação entre linhas for importante.
- Alinhe as regiões principais entre si quando sua hierarquia for equivalente. Cabeçalhos de barra lateral, títulos de
  conteúdo, painéis divididos, barras de ferramentas e barras inferiores não precisam compartilhar todas as
  coordenadas, mas níveis coincidentes devem formar linhas contínuas visíveis.

Nem toda borda deve se alinhar. Um filho pode ter recuo, um valor principal pode preceder seus metadados de apoio e uma
decisão destrutiva pode ganhar separação. Essas exceções devem comunicar hierarquia ou significado; não devem resultar
de paddings de componentes não coordenados. Comece pelo eixo compartilhado e só depois torne a exceção explícita.

Trate o alinhamento exato e os intervalos repetidos como invariantes de qualidade. Quando duas bordas ou dois espaços
devem ser iguais, uma diferença de um pixel renderizado é um defeito, não uma aproximação óptica aceitável. Inspecione
os limites resolvidos com uma ferramenta de medição em tamanhos de janela, tamanhos de texto e fatores de escala de tela
representativos. Compare coordenadas e distâncias; não aprove o alinhamento apenas com base em uma captura de tela
casual.

A tolerância de pixel renderizado é uma regra de verificação, não uma permissão para remendar o código com deslocamentos
brutos em pontos. Relações iguais devem ser resolvidas a partir da mesma classe ou método de espaçamento, token,
definição de grade ou recuo de componente compartilhado. Corrija o responsável comum quando eles diferirem. Considere o
layout fracionário e o arredondamento do dispositivo (celulares 2× e 3×, escalas fracionárias no desktop) para que os
eixos pretendidos caiam no mesmo pixel físico, em vez de derivar em determinadas escalas.

- Alinhe o texto pelas linhas de base, não pelos centros das caixas delimitadoras, quando tamanhos mistos compartilham
  uma linha.
- Centralize ícones em um slot fixo para que os rótulos não se movam quando os ícones têm larguras intrínsecas
  diferentes.
- Alinhe números comparáveis ao fim e use algarismos tabulares (`tabular-nums`); alinhe prosa e identificadores ao início, a menos
  que o idioma exija o contrário.
- Mantenha as ações finais das linhas e os indicadores de divulgação em faixas de largura fixa.
- Alinhe controles de formulário pelo seu quadro interativo, não pelo texto de ajuda abaixo deles.
- Use `justify-between` (`.justify_between()`) apenas quando os dois lados realmente possuírem bordas opostas; ele não deve disfarçar uma estrutura
  ausente no meio.
- As linhas finas pertencem ao responsável pela fronteira. Duas regiões adjacentes não devem desenhar, cada uma, o mesmo
  separador.
- Uma barra de rolagem pertence à região que rola e fica junto à borda final desse painel, editor ou janela. O padding do
  conteúdo pode recuar texto e linhas; ele não deve puxar a barra de rolagem para o meio da superfície. Aplique padding
  ao conteúdo da scroll view, não à scroll view.

<a id="density-tiers"></a>

### Níveis de densidade

Medium é o padrão. Mude a densidade para todo o contexto local, não para um único controle isolado:

- **confortável / large:** onboarding, formulários esparsos, decisões de destaque;
- **padrão / medium:** a maior parte do chrome e dos fluxos de trabalho do aplicativo, e todas as telas sensíveis ao
  toque;
- **compacta / small:** barras de ferramentas, menus, tabelas e dados profissionais repetidos no desktop;
- **extra compacta / xsmall:** utilitários excepcionais de alta densidade, nunca a escolha automática para um aplicativo
  inteiro.

Use uma escala limitada em vez de dimensionamento arbitrário. Em telas sensíveis ao toque, todo alvo pressionável tem
pelo menos 44 × 44 pontos ([Touch targets](./accessibility.md#touch-targets)). Com um ponteiro, os botões costumam percorrer quadros de
aproximadamente 24, 28 e 32 pt, os inputs chegam a cerca de 40 pt no tamanho large, e as linhas de tabela usam cerca de
28, 32 e 40 pt. Dê aos componentes do aplicativo um tamanho que altere tipografia, ícone, padding e alvo de toque em
conjunto; uma altura personalizada que altera apenas a caixa externa costuma estar incompleta.

<a id="text-size-base-font-and-points"></a>

### Tamanho do texto, fonte base e pontos

Uma escala bem projetada preserva a hierarquia enquanto o texto cresce. O texto maior é bem-sucedido quando a relação
entre título e corpo, controle e ícone, espaçamento interno e externo, e regiões primárias e secundárias continua com a
mesma sensação em todos os tamanhos, e não apenas quando todos os objetos ficam maiores.

Os comprimentos do NSH são em pontos, e o tamanho de texto do usuário (Dynamic Type no iOS, tamanho da fonte no Android,
a escala de texto dos desktops, uma configuração própria de um aplicativo host) dimensiona o texto: todo texto e input
que permite escala de fonte cresce, enquanto espaçamentos, raios, bordas e imagens mantêm seu tamanho
([Text size](./device-and-environment.md#text-size)). O tamanho de texto base do aplicativo (`text-base` do Tailwind, 16 pontos) é o tamanho do corpo em torno
do qual a escala tipográfica se organiza.

Projete em proporções:

- os passos tipográficos mantêm a mesma hierarquia em torno do tamanho base do corpo;
- os passos de espaçamento mantêm as mesmas relações de agrupamento em torno da tipografia;
- os quadros de controles e os alvos de toque crescem com seus rótulos: dimensione-os pelo conteúdo e por um mínimo
  (`min-h-11`), não por uma altura fixa;
- os mínimos de painéis e as larguras confortáveis levam em conta textos maiores;
- os raios de canto e o tratamento de foco permanecem opticamente consistentes com o quadro do controle.

Como o texto cresce por conta própria, um quadro fixo ao redor dele se quebra: um rótulo maior dentro de um botão de
altura fixa, um documento maior dentro de mínimos fixos de painel ou linhas maiores dentro de uma altura de linha fixa
destroem o ritmo original e podem cortar conteúdo. Deixe as linhas quebrarem ou mudarem para uma coluna quando o texto
ficar grande (`fontScale()`, `font_scale()`), e limite a escala de textos que já são grandes, como um título de 34pt (`maxFontSizeMultiplier`).

Como regra, o layout do aplicativo não deve escrever valores literais em pontos (`p-[13px]`, `px(13.0)`). Use a escala de
espaçamento (`p-2`, `gap-3`, `w-64`, `text-sm` e seus métodos tipados) ou os tamanhos de componente do aplicativo. Use pontos
literais apenas quando o valor representar um limite físico ou raster: uma linha fina, um recuo de janela da plataforma,
uma dimensão de bitmap, uma tolerância mínima de teste de toque ou uma geometria que precise coincidir com uma
superfície externa. Essas são exceções auditadas e documentadas. Espaçamento, tipografia, tamanho de ícone e geometria
comum de controles do produto permanecem na escala.

Teste em vários tamanhos de texto, não apenas no padrão. Verifique hierarquia, quebra de linha, truncamento, tamanho
mínimo da janela, redimensionamento de painéis, folga do anel de foco, posicionamento de popups e medição de linhas de
lista.
<a id="surfaces-and-elevation"></a>

### Superfícies e elevação

Use a elevação para explicar a sobreposição, não a importância. A superfície base é plana; separadores e contraste de fundo definem suas regiões. Popovers, menus, sheets, diálogos e notificações podem usar sombras progressivamente mais fortes porque ficam acima de outros conteúdos. Não coloque sombra em todo card.

Todas as superfícies do mesmo tipo devem compartilhar um único tratamento. Dê às famílias de popups uma única superfície com tema (os tokens `popover`, a borda, `radius` e uma sombra) para que `Popover`, `Menu`, `ContextMenu` e `Tooltip` não se distanciem uns dos outros. Quando um aplicativo criar outra superfície ancorada, reutilize esse tratamento em vez de aproximá-lo com valores literais de borda e sombra sem relação com ele.

<a id="typography-and-icons"></a>

### Tipografia e ícones

Use a fonte de UI da plataforma para o texto da interface e monoespaçada apenas para código, identificadores, atalhos e dados numéricos alinhados. Mantenha o texto do corpo legível e evite excesso de maiúsculas ou de espaçamento entre letras, especialmente em texto CJK.

Use uma única família de ícones em um produto. Ícones complementam rótulos; não devem substituir ações desconhecidas por tentativa e erro. Botões somente com ícone sempre precisam de um nome acessível (`accessibilityLabel`). Sua explicação visual segue a política de tooltips abaixo. Use ícones preenchidos ou coloridos para comunicar um estado, não apenas para deixar a barra de ferramentas mais animada.

<a id="layout-patterns"></a>

## Padrões de layout

<a id="choose-a-stable-shell"></a>

### Escolha um shell estável

A maioria dos aplicativos deve usar um destes shells:

- **área de trabalho única:** um cabeçalho ou barra de ferramentas acima de uma visualização principal;
- **pilha de navegação:** páginas empilhadas e desempilhadas (`NavStack`), com o gesto de voltar do sistema em celulares;
- **área de trabalho com barra lateral:** navegação persistente ao lado de uma visualização de detalhe que muda;
- **master–detail:** painéis redimensionáveis de coleção e detalhe, duas páginas em um celular;
- **área de trabalho de documentos:** abas para vários objetos de longa duração;
- **janela utilitária:** uma tarefa focada com um caminho de ação curto e fixo.

Mantenha a navegação global estável enquanto o conteúdo muda. Dê à área de trabalho principal o espaço restante com `flex-1` (`.flex_1()`) e `min-w-0` / `min-h-0` onde filhos que transbordam precisam encolher. Use `Scroll` e `List` para o comportamento a que se destinam, em vez de reconstruir rolagem ou virtualização a partir de views aninhadas.

Nos desktops, uma barra de título própria do aplicativo ([`nsh/desktop`](../modules/nsh-desktop.md)) é, antes de tudo, o chrome da janela. Preserve sua região de arrasto (`.window_drag(true)`) e evite associar cliques comuns no título a comandos de edição pouco frequentes. Renomear pertence a um comando explícito do objeto, com um caminho pelo teclado quando apropriado.

<a id="responsive-windows"></a>

### Janelas responsivas

Uma janela pode ter qualquer tamanho: quem decide é o usuário, uma split view ou o aplicativo host. Decida o que acontece à medida que a janela estreita:

1. preserve a tarefa principal;
2. permita que regiões redimensionáveis cheguem a um mínimo documentado;
3. recolha rótulos secundários ou inspetores;
4. mova ações de baixa frequência para um menu;
5. role apenas a região cujo conteúdo realmente transborda.

Não oculte uma ação sem oferecer outro caminho até ela. Evite fazer a janela inteira rolar quando apenas uma lista ou o corpo de um documento deve rolar. Breakpoints (`md:`, `lg:`) e `windowSize()` (`window()` em Rust) seguem a superfície em que o NSH renderiza.

O layout flex do NSH tem a mesma pressão de tamanho intrínseco encontrada em outros sistemas de layout: um filho `flex-1` ainda pode se recusar a encolher diante de conteúdo longo. Design e implementação devem concordar sobre quais painéis podem encolher, truncar, quebrar linha ou rolar. Uma região cortada também corta um anel de foco que se estende para fora; nunca abra mão da visibilidade do teclado apenas para simplificar o transbordamento.

<a id="forms-and-settings"></a>

### Formulários e configurações

Use um rótulo visível para cada campo e coloque a ajuda ou a validação ao lado do campo que ela descreve. Alinhe campos relacionados, mas não force rótulos longos em uma coluna fixa estreita. Use o controle apropriado: `Checkbox` para escolhas independentes, um [`RadioGroup`](../elements/radio.md) de `Radio`s para um conjunto pequeno e visível, um `Menu` de opções para um conjunto maior e [`Switch`](../elements/switch.md) para uma configuração que tem efeito imediato. Suas partes (a trilha e o thumb do switch, o indicador do checkbox) ficam a cargo do aplicativo para estilização, com classes `checked:`, `indeterminate:` e `disabled:` que acompanham o controle:

```rust tabs
use nsh_base::{switch, theme};

fn setting_switch(label: &'static str, on: Signal<bool>) -> impl IntoElement {
    switch()
        .checked(on)
        .on_change(move |next: &bool| on.set(*next))
        .flex_row()
        .items_center()
        .gap_3()
        .track_style(|s| {
            s.w(px(44.0))
                .p(px(2.0))
                .rounded_full()
                .bg(move || theme().muted)
                .transition_colors()
                .checked(|s| s.bg(move || theme().primary))
        })
        .thumb_style(|s| {
            s.size(px(20.0))
                .rounded_full()
                .bg(move || theme().background)
                .shadow_sm()
                .transition_transform()
                .checked(|s| s.translate_x(px(20.0)))
        })
        .child(text(label).text_color(move || theme().foreground))
}
```

```tsx tabs
import { Text } from "nsh";
import { Switch } from "nsh/base";

function SettingSwitch(props: { label: string; on: boolean; onChange: (e: { checked: boolean }) => void }) {
  return (
    <Switch
      checked={props.on}
      onChange={props.onChange}
      class="flex-row items-center gap-3"
      trackClass="w-11 rounded-full bg-muted p-0.5 transition-colors checked:bg-primary"
      thumbClass="size-5 rounded-full bg-background shadow-sm transition-transform checked:translate-x-5"
    >
      <Text class="text-foreground">{props.label}</Text>
    </Switch>
  );
}
```

Um checkbox "selecionar tudo" mostra uma seleção parcial com seu estado indeterminado:

```rust tabs
use nsh_base::{checkbox, theme};

fn select_all(selected: Signal<usize>, total: usize) -> impl IntoElement {
    checkbox()
        .checked(move || selected.get() == total)
        .indeterminate(move || selected.get() > 0 && selected.get() < total)
        .on_change(move |all: &bool| selected.set(if *all { total } else { 0 }))
        .flex_row()
        .items_center()
        .gap_2()
        .indicator_style(|s| {
            s.size(px(20.0))
                .items_center()
                .justify_center()
                .rounded(move || theme().radius)
                .border_2()
                .border_color(move || theme().border)
                .checked(|s| s.bg(move || theme().primary).border_color(move || theme().primary))
                .indeterminate(|s| s.bg(move || theme().primary).border_color(move || theme().primary))
        })
        .indicator(text(move || mark(selected.get(), total)).text_color(move || theme().primary_foreground))
        .child(text("Select all").text_color(move || theme().foreground))
}

fn mark(selected: usize, total: usize) -> &'static str {
    if selected == total { "✓" } else if selected > 0 { "–" } else { "" }
}
```

```tsx tabs
import { Text } from "nsh";
import { Checkbox } from "nsh/base";

function SelectAll(props: { selected: number; total: number; onChange: (e: { checked: boolean }) => void }) {
  return (
    <Checkbox
      checked={props.selected === props.total}
      indeterminate={props.selected > 0 && props.selected < props.total}
      onChange={props.onChange}
      class="flex-row items-center gap-2"
      indicatorClass="size-5 items-center justify-center rounded-(--radius) border-2 border-border checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary"
      indicator={
        <Text class="text-primary-foreground">
          {props.selected === props.total ? "✓" : props.selected > 0 ? "–" : ""}
        </Text>
      }
    >
      <Text class="text-foreground">Select all</Text>
    </Checkbox>
  );
}
```

Desabilite o envio enquanto uma operação estiver em andamento, preserve a entrada do usuário e mostre o resultado perto da ação. Mantenha os campos acima do teclado virtual (`env(keyboard-inset-height)`). Reserve diálogos para decisões curtas e focadas; use uma página inteira ou uma sheet para fluxos que exigem exploração ou muitos campos.

Um indicador de carregamento deve representar uma espera real. A troca entre painéis de configurações cujo conteúdo já está disponível deve ser imediata; um skeleton só é apropriado enquanto o conteúdo realmente está carregando e sua forma é conhecida.

<a id="components-and-composition"></a>

## Componentes e composição

Siga o princípio do Shadcn de que componentes são material de construção, e não um sistema de design fechado. `nsh/base` fornece o comportamento; o aplicativo fornece padrões coerentes em seus próprios componentes e é dono da composição e da semântica do produto.

- Use variantes de componente de acordo com o significado. Primary é reservado para a confirmação padrão explícita em uma área de decisão, normalmente a ação invocada por Return nos desktops. Uma ação isolada, frequente ou desejável não é automaticamente primary. Um comando `Add` em uma barra de ferramentas de gerenciamento normalmente usa um botão default; a confirmação padrão `Create` de um formulário pode usar primary. Use destructive para confirmações destrutivas e ghost para ações discretas da barra de ferramentas.
- Prefira partes e slots explícitos a estilizar descendentes arbitrários.
- Mantenha um padrão repetido consistente em todo o produto. Encapsule-o em um componente do aplicativo quando ele carregar linguagem ou política de domínio.
- Use o componente padrão para o seu papel semântico. `Menu`, `ContextMenu`, `Popover`, `Sheet`, `Dialog` e `AlertDialog` não são caixas intercambiáveis; cada um possui contratos próprios de seleção, foco, teclado, dispensa e layout, e assume sua própria forma em cada dispositivo.
- Preserve a geometria da família do componente. Linhas de menu compartilham padding vertical e horizontal, altura, slots de ícone e de checkmark, separadores, raio e tratamento de estados. Não imite um menu com um popup personalizado cujo espaçamento apenas se aproxima do sistema.
- Não encapsule um componente apenas para renomear todas as suas props ou congelar todas as suas capacidades.
- Mova comportamento reutilizável sem estilo de produto para `nsh/base`, ou para um crate que os produtos do aplicativo compartilham; mantenha a apresentação com tema e opinativa nos componentes do aplicativo.

```rust tabs
use nsh_base::{button, theme};

/// The footer of a form: a default Cancel and the primary commit.
fn form_actions(cancel: impl Fn() + 'static, create: impl Fn() + 'static) -> impl IntoElement {
    view()
        .flex_row()
        .justify_end()
        .gap_2()
        .child(
            button()
                .on_press(cancel)
                .rounded(move || theme().radius)
                .border_1()
                .border_color(move || theme().border)
                .px_4()
                .py_2()
                .active(|s| s.bg(move || theme().muted))
                .child(text("Cancel").text_color(move || theme().foreground)),
        )
        .child(
            button()
                .on_press(create)
                .rounded(move || theme().radius)
                .bg(move || theme().primary)
                .px_4()
                .py_2()
                .active(|s| s.bg(move || theme().primary.opacity(0.9)))
                .child(text("Create").text_color(move || theme().primary_foreground)),
        )
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Button } from "nsh/base";

// The footer of a form: a default Cancel and the primary commit.
function FormActions(props: { onCancel: () => void; onCreate: () => void }) {
  return (
    <View class="flex-row justify-end gap-2">
      <Button onPress={props.onCancel} class="rounded-(--radius) border border-border px-4 py-2 active:bg-muted">
        <Text class="text-foreground">Cancel</Text>
      </Button>
      <Button onPress={props.onCreate} class="rounded-(--radius) bg-primary px-4 py-2 active:bg-primary/90">
        <Text class="text-primary-foreground">Create</Text>
      </Button>
    </View>
  );
}
```

<a id="interaction-states"></a>

## Estados de interação

<a id="make-the-result-understandable-before-the-click"></a>

### Torne o resultado compreensível antes do clique

Um controle deve antecipar seu resultado. Use controles e posicionamento familiares da plataforma para que as pessoas possam agir sem aprender a interface primeiro. Seu rótulo nomeia a ação e o objeto, seu estado mostra a disponibilidade e seu feedback confirma o mesmo resultado.

Não rotule um Button como `Save` se ele abre um fluxo de configuração, nem como `Delete` se apenas remove um item de um grupo. Nomeie o escopo quando o contexto não o deixar claro. Responda imediatamente à ativação, impeça envios duplicados durante trabalhos mais longos e mostre o resultado perto do objeto que mudou. Adicione uma mensagem de sucesso apenas quando o próprio resultado não estiver visível.

Todo controle interativo deve ser projetado para:

| Estado | NSH | Requisito de design |
| --- | --- | --- |
| Repouso | | Affordance clara sem ruído visual |
| Hover | `hover:` | Feedback sutil do ponteiro, nunca a única indicação |
| Pressionado | `active:` | Feedback imediato ao pressionar, estilizado pelo aplicativo |
| Aberto / pressionado | `open` do popup | Feedback persistente enquanto um popup anexado estiver aberto |
| Foco visível | `focus-visible:` | Anel de foco de teclado com alto contraste |
| Selecionado / marcado | `selected:`, `checked:` | Estado persistente distinto do hover |
| Desabilitado | `disabled:` | Menor ênfase e nenhuma resposta enganosa de hover/pressionado |
| Carregando | | Preserve o contexto, impeça ação duplicada, explique esperas longas |
| Erro | | Diga o que aconteceu e como se recuperar |

Associe comandos que devem funcionar pelo teclado com [`keymap`](../modules/nsh.md#keymap) nos desktops e na web. Use atalhos de plataforma familiares (`"mod+k"` é Command no macOS e Control nos demais), exponha atalhos em menus ou tooltips e mantenha o foco em um lugar lógico depois de abrir ou dispensar um overlay.

A seleção faz parte do modelo de informação, não é um polimento opcional. Abas, escolhas segmentadas, linhas selecionáveis, filtros e destinos de navegação devem mostrar um estado selecionado persistente (`selected`, que os leitores de tela anunciam). Um botão que possui um menu deve permanecer visivelmente pressionado ou aberto até o popup fechar; o hover sozinho não explica a relação entre o gatilho e a superfície.

```rust tabs
use nsh_base::{tab, theme};

fn section_tab(label: &'static str, id: Section, current: Signal<Section>) -> impl IntoElement {
    let selected = move || current.get() == id;
    tab()
        .selected(selected)
        .on_press(move || current.set(id))
        .rounded(move || theme().radius)
        .px_3()
        .py_2()
        .selected_style(|s| s.bg(move || theme().muted))
        .child(text(label).text_color(move || {
            if selected() { theme().foreground } else { theme().muted_foreground }
        }))
}
```

```tsx tabs
import { Text } from "nsh";
import { Tab } from "nsh/base";

function SectionTab(props: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Tab
      selected={props.selected}
      onPress={props.onPress}
      class="group rounded-(--radius) px-3 py-2 selected:bg-muted"
    >
      <Text class="text-muted-foreground group-selected:text-foreground">{props.label}</Text>
    </Tab>
  );
}
```

Em um controle segmentado, o preenchimento selecionado e a superfície não selecionada devem compartilhar a silhueta do contêiner. Nenhum dos dois pode deixar um canto de extremidade quadrado nem fazer uma fronteira parecer mais pesada que as demais.

Mostre um item de navegação, uma linha de lista ou uma aba selecionados por meio da própria superfície do item: um preenchimento selecionado, um primeiro plano mais forte ou um peso maior. Não adicione uma barra na borda inicial nem uma borda de um só lado como marcador de seleção. Isso é um hábito de templates web, não uma convenção nativa; quebra a silhueta arredondada do item e adiciona uma segunda borda concorrente a uma coluna que já se alinha pelo texto.

Para ações destrutivas, distinga entre trabalho reversível e irreversível. Prefira desfazer ou uma notificação temporária para mudanças reversíveis. Use um [`AlertDialog`](../elements/alert-dialog.md) quando a consequência for séria e não puder ser desfeita; nomeie o objeto e a consequência específicos no texto da confirmação.

<a id="pointer-conventions"></a>

### Convenções de ponteiro

Use o cursor padrão para botões, checkboxes, itens de menu, abas e outros controles. Use uma mão apontando (`cursor-pointer`) para links e conteúdo que se comporta como link. Use cursores de texto, redimensionamento, agarrar e proibido somente quando descreverem a manipulação ativa. Um cursor reforça uma affordance; ele não substitui o estado visível nem o papel acessível do controle.

Mantenha os efeitos de hover modestos, porque a interação por toque, teclado e acessibilidade não tem hover. Não revele no hover a única cópia de uma ação destrutiva ou essencial. Ações contextuais de linha podem ficar mais discretas em repouso se os mesmos comandos continuarem disponíveis por seleção, teclado ou menu de contexto.

<a id="prefer-command-surfaces-over-hover-toolbars"></a>

### Prefira superfícies de comando a barras de ferramentas reveladas no hover

Use a frequência e o escopo do comando para escolher onde uma ação fica:

- mantenha a ação principal ou frequente visível como um botão com rótulo ou um controle familiar de barra de ferramentas;
- coloque ações secundárias da região atual atrás de um gatilho [`Menu`](../elements/menu.md) visível;
- coloque comandos que agem sobre o objeto sob o ponteiro ou o dedo em um `ContextMenu`: um clique direito nos desktops, um dedo mantido pressionado em telas sensíveis ao toque;
- exponha o mesmo comando importante por um atalho de teclado ([`keymap`](../modules/nsh.md#keymap)) quando ele tiver uma forma natural pelo teclado, e no menu do aplicativo (`Menu.setApplicationMenu` a partir de [`nsh/desktop`](../modules/nsh-desktop.md));
- use um ícone revelado no hover somente como atalho para um comando que continue acessível em outro lugar.

Isso é mais do que uma preferência visual. Os menus de `nsh/base` já cuidam do posicionamento no gatilho, de submenus em cascata nos desktops e de uma sheet com submenus no lugar em celulares, da dispensa ao escolher um item, ao pressionar fora, com Escape ou ao voltar, e dos papéis de menu e de item de menu para leitores de tela. Uma faixa personalizada de botões no hover precisa reconstruir esses comportamentos e fica invisível para fluxos de toque, somente teclado e muitas tecnologias assistivas.

```rust tabs
use nsh_base::{menu, menu_item, menu_separator, theme};
use nsh_core::{color::black, element::StyleRefinement};

/// The app's popup surface, shared by its menus, popovers and tooltips.
fn popup(s: StyleRefinement) -> StyleRefinement {
    s.min_w(px(192.0))
        .p_1()
        .rounded(move || theme().radius)
        .border_1()
        .border_color(move || theme().border)
        .bg(move || theme().popover)
        .shadow_lg()
}

fn item(label: &'static str, on_select: impl Fn() + 'static) -> impl IntoElement {
    menu_item()
        .on_select(on_select)
        .px_3()
        .py_2()
        .rounded(move || theme().radius)
        .hover(|s| s.bg(move || theme().muted))
        .active(|s| s.bg(move || theme().muted))
        .child(text(label).text_color(move || theme().foreground))
}

fn more_menu(rename: impl Fn() + 'static, duplicate: impl Fn() + 'static, delete: impl Fn() + 'static) -> impl IntoElement {
    menu()
        .offset(px(4.0))
        .popup_style(popup)
        .backdrop_style(|s| s.bg(black().opacity(0.5)))
        .trigger(
            view()
                .label("More actions")
                .size(px(44.0))
                .items_center()
                .justify_center()
                .rounded_full()
                .active(|s| s.bg(move || theme().muted))
                .child(text("⋯").text_color(move || theme().foreground)),
        )
        .child(item("Rename…", rename))
        .child(item("Duplicate", duplicate))
        .child(menu_separator().h(px(1.0)).my_1().bg(move || theme().border))
        .child(item("Delete…", delete))
}
```

```tsx tabs
import { Text, View } from "nsh";
import { Menu, MenuItem, MenuSeparator } from "nsh/base";

/** The app's popup surface, shared by its menus, popovers and tooltips. */
export const popup = "min-w-48 rounded-(--radius) border border-border bg-popover p-1 shadow-lg";
const item = "rounded-(--radius) px-3 py-2 hover:bg-muted active:bg-muted";

function MoreMenu(props: { onRename: () => void; onDuplicate: () => void; onDelete: () => void }) {
  return (
    <Menu
      offset={4}
      popupClass={popup}
      backdropClass="bg-black/50"
      trigger={
        <View accessibilityLabel="More actions" class="size-11 items-center justify-center rounded-full active:bg-muted">
          <Text class="text-foreground">⋯</Text>
        </View>
      }
    >
      <MenuItem onSelect={props.onRename} class={item}><Text class="text-foreground">Rename…</Text></MenuItem>
      <MenuItem onSelect={props.onDuplicate} class={item}><Text class="text-foreground">Duplicate</Text></MenuItem>
      <MenuSeparator class="my-1 h-px bg-border" />
      <MenuItem onSelect={props.onDelete} class={item}><Text class="text-foreground">Delete…</Text></MenuItem>
    </Menu>
  );
}
```

Escolha `Menu` quando os usuários precisarem de uma indicação visível de que existem mais comandos, por exemplo um overflow da barra de ferramentas, ações de documento ou um menu de conta. Escolha `ContextMenu` para comandos com escopo de seleção ou objeto, como renomear, duplicar, revelar ou remover. O menu de contexto não deve ser a única forma de executar um comando essencial; ofereça um caminho pela barra de menus, barra de ferramentas, teclado ou visualização de detalhe, conforme apropriado.

Não coloque toda ação em um menu para fazer uma tela parecer minimalista. Descoberta e velocidade importam: a ação principal permanece visível, itens perigosos continuam claramente rotulados e separados, e um item de menu deve usar o mesmo verbo, ícone, atalho, estado de habilitação e resultado em todos os lugares onde aparecer.
<a id="button-means-application-action-link-means-external-resource"></a>

### Button é ação do aplicativo; Link é recurso externo

Use um `Button` quando a ativação altera o estado do aplicativo, confirma uma decisão, abre uma ferramenta, envia dados ou executa um comando. Escolha o tratamento pela hierarquia local:

- botão primary para o único compromisso enfatizado em uma área de decisão;
- botão default para ações visíveis comuns;
- botão outline quando uma ação precisa de um limite claro com menos ênfase;
- botão ghost para ações conhecidas e de baixa ênfase em barras de ferramentas e em linha;
- botão de ícone apenas para um símbolo bem conhecido, com nome acessível e um tooltip quando o significado ou o escopo não forem claros.

Não atribua primary só porque um botão é a única ação na tela, porque está no canto superior direito ou porque a equipe quer mais cliques. Primary comunica o compromisso padrão e o comportamento de teclado. Se a ativação é apenas um comando comum, como adicionar um item, abrir uma ferramenta ou atualizar uma visualização, use um botão default, outline ou ghost conforme sua hierarquia local.

Use um link sublinhado (`role="link"`) somente para um destino que seja um recurso externo: uma URL, uma página web, documentação online ou um endereço de e-mail. Ele usa o cursor de mão com o dedo apontando porque seu contrato é sair do contexto atual do aplicativo rumo a esse recurso. Não use a estilização de link para fazer um comando funcional parecer discreto. Uma ação de Excluir, Salvar, Atualizar, Adicionar, Abrir menu ou navegação interna com formato de link esconde a affordance do controle e expõe o papel de acessibilidade errado.

“Ver” não transforma um destino interno em link. Um relatório completo, uma análise, um painel de detalhes ou um registro local continuam sendo abertos por um botão, uma linha, um card, uma aba ou um controle de disclosure. Use rótulos concisos e contextuais, como `Full analysis`, quando o card que os contém já estabelece o que será aberto; reserve o sublinhado para um recurso que de fato abre em um navegador ou em um cliente de e-mail.

Toda navegação interna — linhas da barra lateral, abas, breadcrumbs, itens de lista, abertura de uma visualização local ou troca de espaços de trabalho — deve usar a pilha de navegação, um `Button` ou o componente correspondente. A ênfase visual é escolhida pela variante do botão ou pelo estado selecionado do componente de navegação, nunca falseando a semântica.

<a id="feedback-and-overlays"></a>

## Feedback e sobreposições

Escolha a menor superfície que atenda à decisão:

- tooltip: uma explicação curta ou um atalho ([`Tooltip`](../elements/tooltip.md), ou o `tooltip` de qualquer elemento);
- popover: controles contextuais que não interrompem a tarefa ([`Popover`](../elements/popover.md));
- menu: uma lista compacta de ações ([`Menu`](../elements/menu.md));
- notificação: status assíncrono que não exige uma decisão;
- dialog: uma decisão focada ou um formulário curto ([`Dialog`](../elements/dialog.md));
- alert dialog: confirmação explícita de uma ação com consequências ([`AlertDialog`](../elements/alert-dialog.md));
- sheet: trabalho complementar que se beneficia de um espaço mais persistente ([`Sheet`](../elements/sheet.md)).

Cada um assume a forma que o dispositivo espera, a partir de uma única estrutura que o app estiliza (`popupClass`, `backdropClass`):

| | Desktops | Celulares e tablets |
| --- | --- | --- |
| `Tooltip` | depois que o ponteiro permanece sobre o elemento | somente quando o app o abre |
| `Popover` | ancorado; um clique fora o fecha e segue adiante | ancorado; um toque fora apenas o fecha |
| `Menu` | um popup no gatilho, com submenus em cascata | uma sheet na parte inferior; um submenu substitui os itens dele |
| `ContextMenu` | o botão secundário, no ponteiro | um dedo mantido pressionado abre a sheet |
| `Sheet` | um painel de borda sobre um backdrop | o mesmo |
| `AlertDialog` | um alerta no estilo de dialog da plataforma | o alerta ou action sheet do sistema |

Um tooltip fornece o significado que falta; ele não repete uma ação óbvia. Reserve-o para um símbolo desconhecido, um escopo ambíguo ou um atalho útil que de outra forma ficaria oculto. Comandos recorrentes e reconhecíveis, como Copiar e Baixar no rodapé de uma mensagem, precisam de nomes acessíveis e acesso por teclado, mas seus rótulos ao passar o mouse acrescentam interrupção em vez de clareza. Celulares só mostram um tooltip quando o app o abre, portanto um tooltip nunca deve conter o que um usuário de toque precisa.

Um alerta interrompe a hierarquia visual mesmo quando não abre um modal. Use-o para informações importantes e excepcionais que exigem atenção na tarefa atual, não como um contêiner decorado para descrições comuns, dicas ou espaço vazio. Prefira ajuda em linha, texto atenuado ou uma seção normal quando o conteúdo não exigir aviso ou ação imediata.

Evite empilhar sobreposições. Escape e o botão Voltar do Android dispensam a camada dispensável mais ao topo; mantenha o estado do app sincronizado a partir de `onOpenChange` e devolva o foco ao gatilho ou ao próximo destino lógico.

Uma ação de sobreposição deve se referir a um objeto ou estado que a sobreposição de fato mostra. Por exemplo, exponha `Clear history` somente quando uma seção distinta de histórico recente estiver visível e contiver entradas. Resultados de busca, itens recentes e favoritos são coleções diferentes; rotule-os e separe-os em vez de misturá-los em uma lista sem explicação. Oculte uma ação inaplicável ou desabilite-a com um motivo útil — não deixe um ícone de lixeira ambíguo largado em um rodapé.

O espaço do rodapé não é um depósito para recursos que não encontraram lugar no design. Um rodapé pode apresentar atalhos, status ou ações que se aplicam à superfície inteira, mas cada item deve responder: qual é o seu objeto, por que está disponível agora, qual escopo ele afeta e qual estado visível muda após a ativação?

<a id="motion"></a>

## Movimento

O movimento explica a mudança; não é decoração ambiente. Use transições curtas para aparecimento, dispensa, expansão e continuidade espacial. Evite animar grandes mudanças de layout quando opacidade ou transformação comunicam a mesma relação. Respeite as preferências de movimento reduzido (`motion-reduce:`, `reduceMotion()`), nunca exija animação para entender um estado e não adicione uma animação padrão a todo componente.

```rust tabs
view()
    .on_press(open)
    .transition_transform()
    .duration(150.0)
    .when(!reduce_motion(), |v| v.active(|s| s.scale(0.97)))
```

```tsx tabs
<View onPress={open} class="transition-transform duration-150 active:scale-[0.97] motion-reduce:active:scale-100" />
```

A política de movimento pertence à camada do aplicativo. `nsh/base` é responsável pelo mecanismo de ciclo de vida ou pela geometria necessária a uma transição, mas não decide que todo produto usa fade ou slide. Dê identidade estável a valores animados de forma independente e faça a interrupção reverter suavemente a partir do valor amostrado no momento, em vez de reiniciar a partir de um ponto final antigo.

O movimento acompanha a continuidade da interação. Enquanto um ponteiro ou a posição de rolagem se move entre alvos relacionados, mantenha estável a superfície de pré-visualização e atualize seu conteúdo ou posição no lugar. Dispense-a somente depois que a interação terminar; repetir fade-out e nova entrada a cada atualização é percebido como cintilação.

<a id="designing-data-heavy-interfaces"></a>

## Projetando interfaces com muitos dados

Denso não significa apertado. Em tabelas, árvores, listas longas e editores:

- mantenha cabeçalhos e a identidade principal das linhas visualmente estáveis;
- alinhe valores comparáveis e use numerais tabulares quando apropriado;
- distinga foco, hover, linha ativa e seleção múltipla;
- mantenha ordenação e filtragem visíveis e reversíveis;
- preserve a seleção pela identidade de domínio durante filtragem e reordenação;
- virtualize coleções grandes (`List`) sem alterar a semântica de teclado;
- use divulgação progressiva para colunas e inspetores secundários;
- ofereça um estado vazio útil que explique a próxima ação.

Escolha uma tabela para comparação entre campos consistentes, uma lista para varrer itens heterogêneos e uma árvore para hierarquia real. Não use um layout de dados complexo como estilo visual.

<a id="interface-language"></a>

## Linguagem da interface

As palavras fazem parte da arquitetura da interface. Escreva o vocabulário de um recurso como um sistema — destinos, objetos, comandos, estados e resultados — e não como traduções isoladas de recursos de implementação. Prefira a redação mais curta que continue precisa em seu contexto real.

<a id="let-context-carry-context"></a>

### Deixe o contexto carregar o contexto

Não repita informações que a superfície ao redor já estabelece. Um destino da barra lateral costuma ser o próprio objeto ou domínio: use `Users`, não `User Management`; `Shortcuts`, não `Shortcut Configuration Management`. Uma coluna cujas linhas já contêm ações pode omitir um título genérico `Operation`. Um dialog intitulado `Delete “Roadmap”?` não precisa de um texto no corpo que refaça a mesma pergunta.

Isso é economia de contexto, não remoção por remoção. Acrescente texto quando ele mudar a decisão: identificar o escopo afetado, uma consequência irreversível, um pré-requisito incomum ou uma forma de recuperação. Cada palavra extra deve responder a uma pergunta que o layout atual ainda não responde.

Use substantivos para destinos e objetos (`Users`, `Appearance`, `Orders`), verbos para comandos (`Save`, `Duplicate`, `Export`) e adjetivos ou frases curtas para estados (`Offline`, `Up to date`, `Pending review`). Evite wrappers como `Management`, `Module`, `Page`, `Function`, `Operation` e `System`, a menos que a palavra distinga um conceito real do domínio.

<a id="write-each-language-do-not-translate-its-shape"></a>

### Escreva cada idioma, não traduza a forma dele

Parta da intenção, da hierarquia e da terminologia compartilhadas e componha cada locale como linguagem de interface natural. Não preserve a ordem das palavras, o número de palavras, o excesso de cortesia nem a categoria gramatical do idioma de origem. O `Users` em inglês pode expressar um conceito de recurso em chinês que, literalmente, se expandiria para “gerenciamento de usuários”; fidelidade significa preservar o propósito, não preservar os tokens.

Remova as palavras fornecidas pela arquitetura de informação que as envolve. Dentro de uma superfície `Settings`, um destino costuma ser simplesmente `Account`, não `Account Settings`, e nunca o singular artificial `Account Setting`. O rótulo correto em inglês é escolhido a partir do seu papel e dos vizinhos, não da expressão isolada de origem.

Mantenha um pequeno léxico do produto para objetos, comandos e estados recorrentes. Use o mesmo termo na barra de ferramentas, no menu, no menu de contexto, no dialog, na busca de atalhos e na documentação, a menos que o contexto realmente mude seu significado. Revise o texto na superfície renderizada: rótulos vizinhos costumam revelar repetição ou escopo inconsistente que um arquivo de locale não mostra.

Na escrita técnica localizada, preserve um termo de framework já estabelecido quando uma tradução fosse menos precisa. Mantenha identificadores de API na forma original e formate-os como código. Não conserve palavras estrangeiras comuns só para soar técnico. Explique um termo mantido no primeiro uso, quando necessário, e depois use a mesma forma em toda a interface, na documentação e nos exemplos de API.

Na documentação, use o nome exato em inglês de uma API, componente, arquivo-fonte ou guia nomeado no texto do link, inclusive em páginas localizadas. Por exemplo, escreva `View`, `Button`, `Menu` e `Text` em vez de traduzir os nomes ou acrescentar um prefixo `NSH` redundante. Mantenha as explicações ao redor no idioma da página. Crie link apenas para o alvo nomeado; coloque palavras como “código-fonte” fora do link quando elas descreverem por que ele é citado.

Em uma tabela técnica de comparação compartilhada entre locales, mantenha os nomes de capacidades, frameworks, APIs e modelos na forma consagrada em inglês. Traduza a explicação ao redor da tabela, não os rótulos técnicos. Palavras comuns de interface com nome local estabelecido ainda podem ser localizadas fora desse contexto de comparação.
<a id="buttons-and-confirmation-dialogs"></a>

### Botões e diálogos de confirmação

Os rótulos de botão são curtos por padrão, geralmente uma ou duas palavras, e descrevem o resultado, não o gesto nem o componente.
Prefira `Save`, `Move` ou `Delete` a `Click to save`, `Perform move` ou `Confirm deletion`. Use `Cancel` de forma consistente
para a ação que sai sem confirmar. Reserve `OK` para reconhecer conteúdo puramente informativo.

Curto é um padrão, não um limite de caracteres. Um rótulo deliberadamente mais longo é melhor quando suas palavras expõem uma consequência
ou distinguem opções que os usuários poderiam confundir, por exemplo `Delete from this group` versus `Delete everywhere`, or `Restart without saving`. O comprimento deve comprar informação decisiva para a escolha; ele não deve repetir o
título ou o corpo do diálogo.

Use, sempre que possível, o resultado conciso mais específico como rótulo de confirmação:

| Contexto | Fraco | Preferir |
| --- | --- | --- |
| Diálogo de exclusão | `Yes`, `Sure`, `Confirm deletion` | `Delete` |
| Alterações não salvas | `Confirm`, `Yes` | `Discard changes` |
| Reconhecimento puro | `Confirm operation` | `OK` ou `Done` |
| Consentimento complexo cujo resultado não tem um verbo claro | `Yes` | `Confirm` |

`Confirm` é uma alternativa útil quando o diálogo ao redor nomeia por completo um compromisso complexo e nenhum verbo de resultado mais curto
é preciso. Ele não deve substituir um comando claro. `Sure` é coloquial, não um comando estável em inglês, e
é ambíguo demais para o vocabulário padrão.

Um diálogo de confirmação deve formar uma decisão compacta:

- título: a decisão ou a condição, como `Delete “Roadmap”?`;
- corpo: apenas escopo, consequência ou informação de recuperação que sejam novos;
- ações: `Cancel` e o resultado, como `Delete`;
- estilo destrutivo: aplicado ao resultado destrutivo (uma ação `AlertDialog` com o papel `destructive`), sem
  substituir a redação precisa.

Evite títulos genéricos como `Notice`, `Warning`, `Error` e `Confirmation` quando a condição real puder ser nomeada.
Evite frases de ritual como “Tem certeza de que deseja…”, “Você gostaria de…”, “Observe que…” e
“com sucesso” quando a estrutura ou o estado já as comunicam. A cortesia deve vir de um tom calmo e respeitoso,
não de `please` repetido.

<a id="capitalization-punctuation-and-symbols"></a>

### Capitalização, pontuação e símbolos

Use sentence case (apenas a primeira letra maiúscula) na UI em inglês por padrão: `Reset layout`, não `Reset Layout` ou `RESET LAYOUT`. Preserve nomes
próprios e siglas estabelecidas. Siga uma convenção de plataforma, como title case para comandos de menu nativos, somente quando a
integração com a plataforma se beneficiar dela, e aplique essa convenção de forma consistente dentro da classe de componente.

TUDO EM MAIÚSCULAS pode dar ênfase tipográfica contida a rótulos de seção muito curtos, eyebrows, status, siglas estabelecidas e
identificadores semelhantes a código. Sua forma compacta e o espaçamento entre letras medido podem formar um nível semelhante ao negrito, mas
ele não pertence a botões, títulos longos, frases ou listas densas. Não combine maiúsculas, cor forte e
peso em negrito na mesma região, e não transforme todas as strings automaticamente: nomes de produtos, siglas e
conteúdo localizado devem preservar a capitalização pretendida.

Rótulos, botões, itens de menu, abas, títulos, placeholders e estados curtos não levam ponto final. Frases completas de
explicação, aviso e erro levam. Evite pontos de exclamação em mensagens rotineiras de sucesso e falha. Em
chinês, use pontuação de largura total nas frases e omita a pontuação final dos rótulos curtos de controle seguindo a mesma
regra semântica.

Use o caractere único de reticências (`…`), não três pontos. Acrescente-o a todo botão ou item de menu que abre um diálogo,
uma sheet ou uma janela separada, e a todo comando que exige mais dados ou escolhas antes de ser concluído, como
`Settings…` ou `Export…`. Um comando executado imediatamente não leva reticências. Use um indicador de progresso
indeterminado, não pontos decorativos, para comunicar trabalho em andamento.

Os erros devem dizer o que aconteceu e, quando útil, a próxima ação de recuperação. O feedback de sucesso deve nomear o estado resultante
apenas quando esse estado ainda não estiver visível. Prefira `Couldn’t save. Check your connection and try again.` a
um código técnico ou a um pedido de desculpas longo; omita um toast `Saved successfully` quando o documento visivelmente passa a estar salvo.

<a id="internationalization-and-platform-fit"></a>

## Internacionalização e adequação à plataforma

Os nomes e rótulos de acessibilidade (A11y) podem permanecer em inglês; a localização não é obrigatória para essas strings. Mantenha o
rótulo do próprio item ao nomear um controle que atua sobre ele, mesmo quando esse rótulo estiver localizado. Essa exceção não
se aplica ao texto visível da UI.

O texto deve sobreviver à expansão, à tipografia CJK, a escritas da direita para a esquerda e a diferentes notações de atalho. Não dimensione um
controle a partir de um único rótulo em inglês. Mantenha o texto fora de imagens raster, evite concatenar fragmentos traduzidos e deixe os
rótulos quebrarem linha ou serem truncados apenas onde o produto define um caminho de recuperação, como um tooltip.

Respeite as diferenças de plataforma que carregam significado: Command versus Control, decorações nativas de janela, aparência
do sistema, comportamento da barra de rolagem, menus, recursos de notificação e, em celulares, o cabeçalho do sistema, o gesto de voltar e os
alertas. Mantenha estável a arquitetura de informação do produto entre plataformas, mas não apague o comportamento
familiar de cada plataforma em nome de uma igualdade superficial de pixels.

Os apps NSH rodam em celulares, tablets, desktops e na web, e muitas vezes dentro de um app host. Projete para cada um:

- **A UI do sistema mantém a aparência da plataforma.** No iOS e no Android, o cabeçalho de uma página é o do sistema (o `title` de `NavPage` e as
  opções de cabeçalho); os desktops e a web mostram o slot `header` da página, que o app desenha. Forneça os dois para toda página
  ([Navegação](./navigation.md#navpage-and-the-header)). As confirmações usam `AlertDialog`; a barra de status acompanha a
  página ou o diálogo que está no topo (`statusBar`).
- **O tema do host.** Um app incorporado pode receber o tema do seu host; as classes e os bindings Rust que leem tokens
  o acompanham de forma nativa ([Tokens de tema](./tailwind.md#theme-tokens)).
- **Áreas seguras e o teclado.** Mantenha o conteúdo dentro da área segura (`env(safe-area-inset-*)`, `safeAreaInsets()`) e os campos de entrada
  acima do teclado virtual (`env(keyboard-inset-height)`) ([Dispositivo e ambiente](./device-and-environment.md)).
- **Aparência, tamanho do texto e movimento.** Toda superfície funciona nos modos claro e escuro (`dark:`, `colorScheme()`), no
  tamanho de texto do usuário e com movimento reduzido (`motion-reduce:`, `reduceMotion()`).
- **Da direita para a esquerda.** A direção do layout segue a localidade, e o estilo `direction` a define para uma view e sua
  subárvore; as propriedades de início e fim são espelhadas ([Da direita para a esquerda](./layout.md#right-to-left)).
- **Toque e ponteiro.** Os alvos de toque têm pelo menos 44 × 44 pontos; hover e tooltips existem apenas com um ponteiro.

```rust tabs
use nsh_base::nav_page;

nav_page()
    .title("Inbox")
    .header(page_header("Inbox"))
    .child(inbox())
```

```tsx tabs
import { NavPage } from "nsh/base";

<NavPage title="Inbox" header={<PageHeader title="Inbox" />}>
  <Inbox />
</NavPage>
```

<a id="guidance-for-ai-generated-interfaces"></a>

## Orientações para interfaces geradas por IA

Uma IA que altera uma interface NSH deve primeiro inspecionar o recurso mais próximo, os componentes e os tokens de tema do app, e
a documentação e as declarações dos componentes (`.nsh/types`). Ela deve declarar a tarefa principal, o dono do estado, a composição
dos componentes e os caminhos de teclado e toque antes de gerar código. Ela não deve inferir uma API a partir de exemplos de React, React Native
ou Shadcn nem inventar uma prop ou um método do NSH só porque o nome parece plausível; `nsh check` e a verificação de classes do build informam o que não existe.

A saída da IA está incompleta até que uma pessoa consiga explicar por que a hierarquia, a densidade, a escolha de componentes e os valores
literais excepcionais pertencem a este produto. Uma captura de tela visualmente plausível não é prova: o comportamento de teclado e toque,
o foco, o conteúdo dinâmico, os temas, o redimensionamento, o tamanho do texto e os estados de falha fazem parte do design.

<a id="accessibility-checklist"></a>

## Checklist de acessibilidade

Antes de considerar uma tela concluída, verifique se:

- toda ação pode ser alcançada e operada por teclado, toque e leitor de tela;
- a ordem do foco segue a ordem visual e a ordem da tarefa;
- o foco permanece visível e é restaurado após overlays;
- os controles têm nomes acessíveis; controles apenas com ícone usam tooltips quando seu significado, escopo ou atalho precisa de
  explicação;
- o texto e os limites significativos têm contraste suficiente;
- o status não é comunicado apenas por cor;
- os estados desabilitado e somente leitura são distinguíveis;
- rótulos, erros e descrições permanecem próximos de seus controles;
- o conteúdo continua utilizável com traduções mais longas, da direita para a esquerda e com texto maior;
- os alvos de toque têm pelo menos 44 × 44 pontos, e os alvos de ponteiro têm tamanho confortável mesmo em um layout denso.

<a id="design-review-checklist"></a>

## Checklist de revisão de design

Uma revisão não faz inventário de componentes; ela avalia se a interface tomou as decisões certas. Pergunte, nesta ordem:

1. **A tarefa está clara?** Um novo usuário consegue reconhecer a finalidade, a ação principal e o próximo passo sem aprender,
   adivinhar ou experimentar?
2. **Cada ação cumpre o que promete?** O rótulo, o controle, o estado, o escopo, o feedback e o resultado descrevem um único
   desfecho consistente?
3. **A hierarquia é decisiva e contida?** O recurso principal recebe o espaço que merece, enquanto cor forte,
   texto em negrito, badges, alertas e botões primários continuam escassos?
4. **A interface poderia fazer menos, e melhor?** Algum ponto de entrada, opção ou estado pode ser removido, combinado ou adiado
   sem enfraquecer a tarefa completa?
5. **A estrutura é exata?** Elementos pares compartilham eixos de alinhamento, espaçamentos iguais continuam iguais até o pixel renderizado e
   as barras de rolagem ficam na borda da região que realmente rola?
6. **Ela segue o sistema de componentes?** Os controles padrão mantêm sua geometria, estados, comportamento de teclado e
   modelo de dispensa, com a aparência fornecida por tokens de tema e de escala?
7. **Ela continua utilizável em todos os estados e restrições?** Verifique o comportamento de teclado, toque e foco,
   os estados vazio/carregando/falha/permissão, traduções mais longas, texto maior, da direita para a esquerda, as duas aparências,
   o tamanho mínimo de janela e o movimento reduzido.
8. **Foi testada em plataformas reais?** Conclua a tarefa com componentes reais, texto real e conteúdo representativo
   em cada plataforma para a qual será publicada (`nsh run --target …`, `nsh test --target …`), e não apenas em uma captura de tela ideal.
