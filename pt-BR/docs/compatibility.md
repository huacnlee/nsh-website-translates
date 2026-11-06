---
title: "Compatibilidade retroativa"
description: "Como o Native Shell mantém os apps funcionando entre versões: o que uma versão compatível promete, o registro em nsh-compat que guarda todas as mudanças nela, o fluxo de lançamento e como adicionar, renomear ou alterar uma API."
order: 22
group: delivery
source_hash: 431c24b579dd57ba
---


# Compatibilidade retroativa

Apps host baixam apps NSH como [pacotes assinados](./signed-packages.md) e os executam como plugins, e um app que foi publicado talvez nunca mais seja compilado de novo: a equipe seguiu em frente, o código-fonte está preso em um processo de negócio e o app host atualizou o
NSH no próprio ritmo. Por isso o Native Shell mantém uma promessa a todo app: **um app construído para uma versão compatível roda
em todas as versões posteriores, sem alterações.** Um app que para de funcionar após uma atualização do NSH é um bug do NSH.

Esta página descreve a promessa, como ela é garantida e como mudar o NSH dentro dela.

<a id="what-an-app-can-rely-on"></a>

## No que um app pode confiar

A promessa cobre tudo o que um app já construído usa:

| Parte | Por que importa |
| --- | --- |
| Os exports de cada módulo (`nsh`, `nsh/*`, `nsh/base`, os módulos padrão) e seus membros | Um bundle os importa pelo nome: se um nome sumir, o app não inicia. |
| `nsh:rt`, as funções que o JSX compilado chama | Cada bundle carrega a saída do compilador que o construiu. |
| Os globais (timers, `fetch`, `console`, ...) e seus membros | Os apps os chamam pelo nome. |
| Props de elementos, eventos e seus payloads, chaves de estilo e seus valores | Os apps os passam pelo nome; uma prop renomeada é ignorada, e o app passa a se comportar de forma errada. |
| Utilitários e variantes do Tailwind | As classes são resolvidas em tempo de execução a partir das strings no bundle. |
| Comportamento: padrões, unidades, payloads, a ordem dos callbacks | Um app depende do que viu quando foi escrito. |
| As declarações TypeScript (`.nsh/types`) | O código-fonte de um app antigo continua passando na checagem de tipos quando a equipe corrige um bug. |
| O formato do pacote e suas assinaturas | Um pacote assinado para uma versão anterior continua sendo verificado. |

As regras que sustentam a promessa:

1. **O que uma versão publicou permanece.** Nenhum módulo, export, membro, prop, evento, chave de payload, chave ou valor de estilo,
   utilitário Tailwind, global ou função de `nsh:rt` é removido.
2. **Uma renomeação mantém o nome antigo** como alias da mesma implementação, marcado com `@deprecated` apontando para o novo nome,
   para sempre. Mover um export para outro módulo também o mantém no módulo antigo.
3. **Os tipos só se ampliam.** Uma união ganha alternativas, uma função ganha overloads ou parâmetros opcionais no final, um
   parâmetro se torna opcional; o que os apps passam (props, estilos, opções) ganha apenas membros opcionais. Os valores
   que um app lê crescem da mesma forma: `platform.os` ganha uma plataforma, um estado ou um motivo ganha um caso. Um caso que o app
   já viu mantém seu valor, e o app trata um valor que não conhece, com o `default` de um `switch`:

   ```tsx
   switch (platform.os) {
     case "ios":
     case "android":
       return <MobileLayout />;
     default:
       // The desktops, the web, and platforms NSH adds later.
       return <WideLayout />;
   }
   ```
4. **O comportamento é mantido.** O novo comportamento é opt-in, por meio de uma nova prop, opção ou valor.
5. **`nsh:rt` só cresce**, e cada função mantém sua assinatura e seu significado.
6. **Os formatos são lidos para sempre.** Pacotes, certificados, listas de revogação e `app.json` de versões anteriores são lidos
   pelas posteriores; um pacote informa o runtime mais antigo de que precisa (`nsh publish --min-runtime`).
7. **A segurança é a única exceção.** Um recurso que não pode ser mantido seguro é fechado, listado com seu motivo e
   citado nas notas de versão.

A promessa começa na primeira versão registrada como compatível e vale para sempre, seja qual for o número de versão.
Entre versões, uma API que apenas `main` possui ainda pode mudar.

<a id="how-it-is-enforced"></a>

## Como a promessa é garantida

O que as versões congelaram fica em um repositório próprio,
[longbridge/nsh-compat](https://github.com/longbridge/nsh-compat), separado do código do NSH. Uma mudança no NSH é executada
contra ele e não pode editá-lo: um pull request que renomeia uma API não pode também reescrever o registro dessa API.

```
nsh                                       nsh-compat
├─ crates/          the code              ├─ releases/v<version>/   one per compatible release, never changed
└─ tests/compat/    apps that test the    │  ├─ runtime.txt         every export, global and nsh:rt function
   ├─ cases/        API being written     │  ├─ types/              the declarations apps build against
   └─ examples/                           │  ├─ tailwind.txt        every Tailwind class and what it sets
                                          │  └─ apps/               the test apps as that release built them
                                          ├─ closed.txt             security closures, each with its reason
                                          └─ src/                   the checks
```

Todo pull request para o NSH executa as verificações de `nsh-compat` sobre o seu checkout (o workflow **Compat**, ou
`cargo xtask compat` localmente):

| Verificação | O que passa |
| --- | --- |
| `checkout_apps_run` | Os apps de `tests/compat/`, construídos por este checkout, fazem o que seus scripts dizem, e toda parte da API que um script afirma verificar é realmente verificada. |
| `nothing_released_is_removed` | Tudo o que cada versão registrada oferecia (exports, membros e seus tipos, declarações, classes Tailwind e o que elas definem) continua sendo oferecido, igual ou ampliado. |
| `released_apps_run` | Os apps que cada versão registrada construiu, como o compilador dela os construiu, iniciam neste runtime e fazem o que seus scripts dizem. |

A primeira verificação testa a API que está sendo escrita; as outras duas protegem todas as versões que foram registradas. A renomeação de uma
API já publicada falha assim:

```
v0.2.0: runtime [nsh] Platform: removed
Keep it: a rename keeps the old name as a @deprecated alias of the new one, a type only widens.
```

`nsh-compat` é revisado pelos mantenedores do NSH, e seu próprio CI o executa contra o `main` do NSH.

<a id="the-release-flow"></a>

## O fluxo de versão

1. **Desenvolver.** Uma API chega em `main` com um caso em `tests/compat/` cujo script a verifica. Até que uma versão a
   registre, ela pode ser renomeada ou remodelada; o caso muda junto.
2. **Registrar.** Em uma versão, `cargo xtask compat record <version>` grava `releases/v<version>/` em um checkout de
   `nsh-compat`: a superfície que a versão oferece e todos os apps de `tests/compat/` construídos pelo seu compilador, com seus
   scripts. Ele registra apenas uma API cujas partes são todas verificadas por um script.
3. **Congelar.** O registro é incorporado por meio de um pull request de `nsh-compat`. A partir daí, toda mudança no NSH é cobrada
   contra ele, junto com todos os registros anteriores.

<a id="developing-within-the-promise"></a>

## Desenvolvendo dentro da promessa

<a id="adding-an-api"></a>

### Adicionando uma API

Todo novo export, global, prop, evento ou chave de estilo vem com um caso:

1. Escreva um módulo `tests/compat/cases/<domain>/<case>.tsx` cujo export padrão seja um componente que use a API e
   mostre o resultado. Os domínios são `base`, `core`, `events`, `layout`, `paint`, `props`, `modules` e `web`, além de
   `android`, `macos` e `browser` para o que é decidido por uma plataforma ou por uma configuração de `nsh.json`.
2. Adicione-o ao `App.tsx` do domínio, que mostra um caso por vez.
3. Acrescente os passos ao `script.txt` do domínio: `tap id:case-<case>`, depois os passos que verificam o que a API faz,
   e um passo `covers <item>` para cada parte que ela adiciona.
4. Execute `cargo xtask compat` (`NSH_COMPAT_APP=<domain>` executa um domínio).

```txt
# props-media-video
tap id:case-props-media-video
prop id:clip src https://example.com/clip.mp4
prop id:clip paused true
tap id:play
prop id:clip paused false
covers [props] src
covers [props] paused
```

Um passo `covers` é verificado: o app precisa usar o item e, no caso de uma prop, evento ou chave de estilo, removê-lo do
app construído deve fazer um passo do script falhar. Os itens são nomeados como `[<module>] <export>`, `[globals] <name>`,
`[props] <name>`, `[events] <name>`, `[styles] <name>`, os próprios de um componente como `[props] <Component>.<name>`, e as props
de uma plataforma como `ios.<name>`, `android.<name>`, `desktop.<name>`, `web.<name>`.

<a id="renaming-or-moving-an-api"></a>

### Renomeando ou movendo uma API

Adicione o novo nome e mantenha o antigo como alias da mesma implementação, declarado como `@deprecated` com o novo
nome. Atualize o caso e seu script para o novo nome. Uma API que nenhuma versão registrou ainda pode simplesmente ser renomeada.

<a id="changing-a-type"></a>

### Alterando um tipo

Amplie-o: mais alternativas em uma união, mais overloads, parâmetros opcionais no final, novos membros opcionais no que os
apps passam. Uma união que os apps leem ganha membros da mesma forma, cada novo membro para um novo caso. Os nomes dos parâmetros podem mudar livremente; sua quantidade, opcionalidade e tipos permanecem.

<a id="changing-behavior"></a>

### Alterando comportamento

Mantenha o comportamento antigo e adicione o novo por trás de uma nova prop, opção ou valor. Uma correção de bug que muda o que um
app em funcionamento vê também é uma mudança de comportamento: coloque-a por trás de um opt-in ou garanta que nenhum app possa depender do resultado antigo. Dê ao
comportamento um passo em um caso, para que ele permaneça como está.

<a id="changing-the-compiler"></a>

### Alterando o compilador

Nada extra: os apps de cada versão permanecem como o compilador daquela versão os construiu, e os casos são construídos do zero pelo
seu. As funções que ele emite nos bundles (`nsh:rt`) só crescem.

<a id="closing-an-api-for-security"></a>

### Fechando uma API por segurança

Um pull request de `nsh-compat` adiciona a entrada ao seu `closed.txt` com o motivo (`<entry> -- <reason>`, a entrada
como a verificação a reporta) e é integrado primeiro; depois disso, a mudança no NSH que remove a API passa. As notas de versão explicam
o porquê.

## Scripts

Um `script.txt` tem um passo por linha. Passos que agem: `tap <selector>`, `type <selector> <text>`,
`key <selector> <key>`, `scroll <selector> <x> <y>`, `touch start|move|end|cancel`, `event <selector> <onEvent>
[<key>=<value>...]`, `wait <ms>`, `keyboard <height> <duration>`, `pixelratio <ratio>`. Passos que verificam:
`expect <text>`, `absent <text>`, `frame <selector> <x> <y> <width> <height>`, `origin`, `prop` / `noprop`,
`style` / `nostyle`, `listens`, `state`, `statusbar`, `log <text>`. As primeiras linhas podem definir a tela: `viewport <w> <h>`,
`platform <os> [desktop]`, `fontscale <scale>`. Um seletor é `id:<testID>`, `label:<label>`, `text:<text>` ou
`span:<text>`; props e estilos são escritos como os apps os escrevem (`style id:card backgroundColor #3366ffff`).
`NSH_COMPAT_DUMP=1` imprime o que cada passo adiciona à tela e remove dela, para ajudar a escrever um script.

<a id="commands"></a>

## Comandos

```sh
cargo xtask compat                      # the checks against this checkout
NSH_COMPAT_APP=props cargo xtask compat -v
cargo xtask compat record 0.2.0         # at a release: record it in nsh-compat, then open a pull request there
```

`cargo xtask compat` mantém um checkout de `nsh-compat` em `target/nsh-compat/` e o atualiza a cada execução;
um checkout com alterações próprias é usado como está, de modo que uma mudança nas verificações possa ser testada contra o NSH antes do respectivo
pull request.
