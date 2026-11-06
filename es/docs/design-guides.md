---
title: "Guías de diseño"
description: "Orientación de diseño de producto y de interacción para aplicaciones creadas con Native Shell: jerarquía, color y tokens, espaciado, densidad, componentes, estados de interacción, superposiciones, movimiento, vistas con gran cantidad de datos, texto de la interfaz y adaptación a la plataforma."
order: 29
group: ui
source_hash: 4296bdbce6ed3911
---


# Guías de diseño

Usa esta guía antes de elegir componentes o escribir código de layout para una app creada con Native Shell. Recoge el criterio de producto que GPUI Kit acumuló a lo largo de años de trabajo en escritorio, trasladado a NSH: una interfaz debe sentirse nativa, sobria, precisa y comprensible sin adivinar.

Esta es una guía normativa. **Debe** indica una restricción de corrección o de ecosistema, **debería** es el valor por defecto que necesita una razón concreta para ser anulado, y **puede** es una técnica opcional. Las páginas de [Elementos](../elements/index.md) y de [API](../modules/index.md) siguen siendo la referencia para cada prop y método.

Las reglas se apoyan en el comportamiento de `nsh/base` (`nsh_base` en Rust), en el tema y sus tokens, y en la interacción que los usuarios de cada plataforma ya conocen. NSH renderiza con la UI propia de cada plataforma y deja el aspecto visual a cargo de la app: los componentes de `nsh/base` aportan comportamiento, estado, foco y accesibilidad, y cada color, tamaño, radio y espaciado proviene de los componentes propios de la app, por lo que estas reglas orientan el sistema de diseño de la app. <a href="https://ui.shadcn.com/docs" target="_blank" rel="noopener noreferrer">shadcn/ui</a> aporta métodos útiles (código abierto, composición y valores por defecto fiables), pero no determina cómo debe verse una app de NSH. Cuando haya influencias en conflicto, preserva el comportamiento de la plataforma y la interacción que la gente ya entiende.

<a id="design-thesis"></a>

## Tesis de diseño

Construye interfaces que se sientan nativas, tranquilas y precisas. Deja que el contenido, la jerarquía y la interacción lleven la experiencia; la decoración debe apoyarlos en lugar de competir con ellos.

1. **Claridad antes que personalidad.** Aclara la tarea principal y la siguiente acción antes de añadir expresión de marca.
2. **Composición antes que invención.** Empieza con componentes establecidos y compónlos en flujos de trabajo específicos del producto. Crea un nuevo primitivo solo cuando su comportamiento sea realmente nuevo.
3. **Tokens antes que valores.** Los colores, radios, tipografía y espaciado deben formar un sistema. Evita literales aislados que no puedan responder a los temas. Consulta [Estilos](./styling.md), [Tailwind](./tailwind.md) y [el tema](./rust.md#theme).
4. **Plataforma antes que convención web.** Preserva el acceso por teclado, el chrome de ventana, los menús, las vistas de datos densas, las regiones redimensionables y la navegación persistente en los escritorios, y las cabeceras, el gesto de retroceso, las alertas y los objetivos táctiles del sistema en teléfonos y tabletas, allí donde la tarea se beneficie de ellos.
5. **El estado debe ser visible.** Los estados de hover, pulsado, foco, selección, deshabilitado, carga, validación y destructivo necesitan un tratamiento distinto y coherente.
6. **La geometría explica la contención.** Los radios, márgenes interiores y límites deben describir una única jerarquía coherente, incluso donde las superficies se superpongan.
7. **El feedback refleja la realidad.** La carga, los tooltips y el movimiento deben aclarar un estado o una transición reales, no añadir ceremonia a una acción inmediata.

<a id="learning-from-shadcn"></a>

## Aprender de Shadcn

La aportación más útil de Shadcn no es un color de borde concreto. Es una forma de construir un sistema:

- ser dueño de la capa superior de la interfaz en lugar de pelear con una abstracción sellada;
- componer partes pequeñas y predecibles en componentes específicos del producto;
- ofrecer valores por defecto que ya formen un único lenguaje visual;
- mantener el código y la composición legibles tanto para personas como para IA;
- separar los primitivos de comportamiento de la capa con estilos.

NSH aplica esas ideas mediante la división entre los primitivos de `nsh`, los componentes base sin estilos de `nsh/base` y la capa con estilos, que pertenece a la app ([Tres capas](./architecture.md#three-layers)). Las aplicaciones construyen sus componentes sobre `nsh/base`, en TSX o en el crate de Rust de la app; el comportamiento reutilizable pertenece a `nsh/base`, y la política visual permanece por encima.

No copies ciegamente estas suposiciones de la web:

| Hábito web | Valor por defecto en NSH |
| --- | --- |
| Cursor de mano en cada botón | Cursor por defecto; mano señaladora (`cursor-pointer`) para enlaces |
| La navegación entre páginas como estructura principal | Ventanas persistentes, paneles, barras laterales, pestañas y menús en los escritorios; un `NavStack` con el retroceso del sistema en teléfonos |
| El foco y el scroll del navegador como respaldo | Propiedad explícita del foco y scroll gestionado por cada región (`Scroll`, `List`) |
| Una sola columna con enfoque mobile-first | Una columna en teléfonos, un shell redimensionable con un tamaño mínimo de ventana definido en los escritorios |
| Acciones críticas reveladas al pasar el cursor | Acciones accesibles con teclado, tacto y puntero que no dependan del hover |
| Una fila de botones de icono solo visibles con hover | Una acción principal visible más `Menu` o `ContextMenu` para los comandos secundarios |
| Texto con estilo de enlace para comandos de la aplicación | Un `Button` con el estilo predeterminado, outline o ghost de la app; el estilo de enlace solo para URLs, recursos web o direcciones de correo |
| Gran densidad táctil en todas partes | Objetivos de tamaño táctil en pantallas táctiles; densidad media con puntero, compacta solo donde el trabajo con información lo aproveche |
| Una cabecera dibujada y una tarjeta de alerta en cada plataforma | La cabecera y el `AlertDialog` del sistema en iOS y Android; el slot `header` de la página en los escritorios y la web |
| Sobrescrituras CSS sobre los descendientes | Los componentes de la app, sus partes y los tokens del tema |

<a id="start-from-the-task"></a>

## Empieza por la tarea

Antes de dibujar una pantalla, anota:

- la tarea principal del usuario;
- el objeto que se ve o se modifica;
- las acciones que deben permanecer disponibles de inmediato;
- la información necesaria para tomar una decisión;
- los estados vacío, de carga, de error, sin conexión, de solo lectura y de permiso denegado;
- el recorrido con teclado, tacto y lector de pantalla a lo largo del flujo de trabajo;
- dónde se muestra la app: por sí sola o dentro de una app anfitriona.

Organiza la pantalla en torno a esas respuestas. No empieces por una cuadrícula de dashboard ni por un catálogo de componentes. Una buena interfaz expone el modelo mental del usuario: documentos, cuentas, proyectos, mensajes, ajustes u otro objeto estable, no la arquitectura interna de los servicios.

Diseña la tarea principal antes de repartir los controles. Su peso visual, ubicación y profundidad de información deben corresponder a su importancia para el producto. Un resultado central no debe reducirse a un contador pequeño, un icono en una esquina o una acción débil en el pie mientras el contenido secundario ocupa la página. Cuando un conjunto de resultados es el principal valor del producto, considera una región de resumen o una tarjeta que muestre el recuento, resultados representativos, un estado significativo y una siguiente acción clara.

Para cada acción propuesta, nombra su objeto visible, estado actual, alcance y resultado. Si la interfaz no muestra o no sugiere claramente esas cosas, la acción es prematura. No expongas una capacidad solo porque el backend la tenga; primero diseña cómo entra el objeto en el modelo mental del usuario.

<a id="visual-language"></a>

## Lenguaje visual

<a id="hierarchy"></a>

### Jerarquía

Prefiere un número reducido de niveles claros:

- el **título de ventana o de página** identifica el objeto o espacio de trabajo actual;
- el **título de sección** separa regiones significativas (`role="header"`, para que los lectores de pantalla puedan saltar entre ellas);
- el **texto del cuerpo** lleva el trabajo;
- el **texto atenuado** ofrece metadatos secundarios y ayuda;
- las **etiquetas** identifican controles y valores.

Usa tamaño, peso, espaciado y separadores antes de añadir color o contenedores. Evita anidar tarjetas dentro de tarjetas: la mayoría de las regiones solo necesitan un fondo, un límite de línea fina y un espaciado intencionado.

Evalúa la jerarquía en toda la funcionalidad, no componente por componente. Oculta el color de acento y la decoración durante la revisión: la tarea principal, la selección actual, el resumen de resultados y la siguiente acción deberían seguir siendo obvios por la estructura. Una pantalla con controles individualmente plausibles puede fallar si no forman un único orden de lectura y un único camino de decisión.

Trata el énfasis como un presupuesto limitado. Una superficie local necesita un punto focal claro, no un campo de resaltados que compiten. Si todo está coloreado, con insignias, en negrita, enmarcado o promovido a alerta, nada se lee como importante. Establece la prioridad primero con estructura y proximidad; gasta color y componentes más fuertes solo donde una distinción cambie lo que el usuario nota o hace.

<a id="color-and-themes"></a>

### Color y temas

Lee los colores del tema (`theme()` en Rust, clases de tokens en TSX) y úsalos según su rol semántico:

- `background` y `foreground` para la superficie y el texto principales;
- `card`, `popover`, `sidebar` y sus tokens de primer plano para sus superficies con nombre;
- `muted` y `muted-foreground` para información de apoyo;
- `primary` para la acción principal o el énfasis de selección, `secondary` y `accent` para un énfasis más discreto y para filas con hover o foco;
- `destructive` solo para acciones destructivas y errores, y los colores de estado que la app añada a su tema (`success`, `warning`) solo para sus significados;
- `chart-1` a `chart-5` para series de datos;
- `border`, `input` y `ring` para estructura e interacción.

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

No uses un color semántico de estado como decoración. No codifiques el significado solo con color. Verifica cada superficie personalizada en temas claro y oscuro y con valores de tema personalizados, incluido el tema de una app anfitriona que incruste la tuya; nunca asumas que el primer plano es negro o que el fondo es blanco.

Usa una insignia para un estado corto, un recuento o una clasificación que se beneficie de un escaneo rápido, no para cada etiqueta, valor de metadatos, filtro o título de sección. Mantén la mayoría de las insignias neutras; reserva los colores semánticos para estados que realmente transmitan éxito, advertencia, peligro o información. Una fila de insignias multicolor suele indicar que falta una decisión de jerarquía o de agrupación.

La UI de la aplicación no debe contener colores hex sin procesar, colores `rgb()`/`rgba()` o `hsl()`, ni clases de paleta como `bg-zinc-100`. Resuelve los colores desde el tema según su rol semántico. Si el rol necesario no existe, defínelo en el archivo de tema de la app ([Tokens del tema](./tailwind.md#theme-tokens): `"up": "#16a34a"` en su `light` y `dark` genera `text-up`, `bg-up/30`, `token("up")` en TSX y `theme().color("up")` en Rust) en lugar de incrustar un valor de paleta en el punto de uso. Los colores sin procesar solo pertenecen a las definiciones del tema o a contenido de datos/raster auditado cuyo color sea en sí mismo el dato.

<a id="radius-spacing-and-density"></a>

### Radio, espaciado y densidad

Usa una escala de radios finita, igual que con la tipografía y los tamaños de control. Elige entre los `radius` del tema (para controles y superficies por igual, `rounded-(--radius)`), los radios que la app añada a su tema y los de Tailwind (`rounded-sm` … `rounded-2xl` entre ellos) en lugar de inventar un radio para cada elemento. Los contenedores grandes pueden usar un nivel más suave que los controles que contienen; los controles compactos y las superposiciones usan niveles más ajustados. Para un rectángulo ordinario, el radio debe seguir siendo visiblemente menor que la mitad de su lado más corto. Usa `rounded-full` (`.rounded_full()`) solo para círculos y píldoras intencionados; un tooltip no debe convertirse en una cápsula por accidente.

Las superficies anidadas deben leerse como formas concéntricas. Usa `inner radius ≈ max(0, outer radius − gap)` para elegir el radio adecuado más cercano; la banda visible debe permanecer uniforme a lo largo de la curva. Añade un token con nombre al tema (`"radius-inset": "0.375rem"`, `rounded-(--radius-inset)`) si una composición repetida necesita un valor intermedio. Un control segmentado es una sola silueta: sus segmentos de los extremos siguen las esquinas interiores del contenedor, sus segmentos centrales permanecen cuadrados y cada límite tiene un único divisor de grosor uniforme.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/radius-hierarchy-light.svg" alt="Light theme chat composer: the inset surface, both buttons, and placeholder spacing change together; red guide circles show their shared corner center.">
<img class="diagram diagram-dark" src="/diagrams/radius-hierarchy-dark.svg" alt="Dark theme chat composer: the inset surface, both buttons, and placeholder spacing change together; red guide circles show their shared corner center.">
</div>

Un radio debe gobernar toda la superficie visible, no solo su borde. Las esquinas expuestas permanecen transparentes respecto a la superficie que hay detrás; los fondos de los hijos, los rellenos de selección y el contenido con scroll también deben seguir el límite. Da a las superficies interiores su propio radio, o recorta el contenedor con `overflow-hidden` (`.overflow_hidden()`), y luego inspecciona la composición sobre un fondo contrastante en ambos temas. Preserva los anillos de foco hacia el exterior al elegir un recorte.

Usa una escala de espaciado compacta y repítela. Los pares etiqueta/control relacionados deben estar más cerca que los grupos separados; los grupos separados deben estar más cerca que las secciones separadas. Prefiere los tamaños de los componentes de la app (pequeño, mediano por defecto, grande) a alturas puntuales. Usa variantes compactas para barras de herramientas y pantallas densas en datos, no para comprimir un layout poco claro en menos espacio.

La escala semántica compartida es deliberadamente pequeña: el espaciado progresa aproximadamente por 2, 4, 8, 12, 16, 24 y 32 puntos, mientras que la tipografía se mantiene cerca de 12, 14, 16, 18 y 20 puntos. Trátalos como relaciones, no como permiso para esparcir sus valores actuales por el código de las funcionalidades. La escala de espaciado de Tailwind los proporciona: un paso son 4 puntos (`p-4` son 16 pt), tanto en clases como en métodos tipados de Rust; `"spacing"` en el `"tailwind"` de `nsh.json` cambia el paso de las clases, y los métodos tipados mantienen la escala por defecto de Tailwind. Una aplicación que necesite una escala distinta la define en sus propios componentes o tokens de tema (`p-(--gap-card)`) y la usa de forma coherente.
<a id="spatial-grammar"></a>

### Gramática espacial

El espaciado expresa relación. Elige un intervalo de la escala semántica preguntándote qué significan los dos elementos el uno para el otro:

| Relación | Clase típica | Escala actual | Ejemplos |
| --- | --- | --- | --- |
| Corrección óptica | `gap-0.5` | 2 pt | línea base de un icono, separador compacto |
| Partes de un mismo control | `gap-1` | 4 pt | icono/etiqueta de menú, título/descripción |
| Controles estrechamente relacionados | `gap-2` | 8 pt | icono/etiqueta de botón, acciones de un diálogo |
| Un grupo de contenido | `gap-3` | 12 pt | columnas de una notificación, filas compactas de formulario |
| Grupos separados dentro de una sección | `gap-4` | 16 pt | relleno de un panel, grupos de formulario |
| Secciones separadas | `gap-6` | 24 pt | bloques principales de una página o de un inspector |
| Límite de una región principal | `gap-8` | 32 pt | espacio de respiro de un estado vacío, bandas de página |

Estos valores describen la escala predeterminada, no son literales que haya que repetir. Usa las clases de espaciado y los métodos tipados (`gap-2`,
`.gap_2()`, `p-4`, `.p_4()`) o los tokens del tema. Una escala propia del producto debe conservar el orden y
las relaciones, y debe pasar por los componentes de la propia aplicación en lugar de escribirse en cada punto de uso.

Usa estas reglas al resolver el espacio horizontal y vertical:

1. **Primero el interior, después el exterior.** El relleno de un componente pertenece al componente; el intervalo entre componentes pertenece a
   su padre.
2. **El ritmo vertical muestra la agrupación.** El intervalo entre un título y su descripción es menor que el intervalo entre esa
   descripción y la siguiente sección. Intervalos iguales implican relaciones iguales.
3. **El espacio horizontal favorece el escaneo.** Las filas repetidas mantienen iconos, etiquetas, valores, insignias y acciones finales en
   columnas estables.
4. **Inicio y final son semánticos.** Piensa en los bordes según el orden de lectura y escríbelos como inicio y final (`ps-*`,
   `me-*`, `.ps_4()`), de modo que el diseño se refleje de derecha a izquierda.
5. **No dupliques el relleno.** Una tarjeta colocada en un panel que ya tiene relleno no debería añadir automáticamente otro margen
   completo de panel.
6. **Usa la alineación óptica con moderación.** Una corrección de uno o dos puntos es válida para la geometría de iconos o glifos, pero
   documenta por qué difiere de la escala.

Las composiciones comunes ilustran las relaciones:

- el contenido de los botones usa 4 pt en tamaños pequeños y 8 pt en tamaños normales;
- los encabezados y pies de los diálogos usan un intervalo interno de 8 pt;
- las filas compactas de listas y menús usan 4 pt de relleno vertical y 8–12 pt de relleno horizontal;
- los encabezados de las hojas usan unos 16 pt de espacio al inicio y 12 pt al final, dejando sitio para un elemento de cierre, mientras que los pies
  usan 16 pt horizontales y 12 pt verticales;
- las notificaciones usan 16 pt de relleno horizontal y 12 pt de intervalo entre columnas, porque el icono, el mensaje y la acción son grupos
  distintos.

No trates esto como recetas para copiar y pegar en cualquier superficie. Revelan el sistema: los controles son más ajustados por dentro,
las filas optimizan el escaneo y los contenedores gastan más espacio en su borde que entre sus contenidos.

<a id="proportion-and-layer-hierarchy"></a>

### Proporción y jerarquía de capas

Empieza por los requisitos del contenido y después define las proporciones. Evita las mitades arbitrarias cuando un panel tiene un rol claramente distinto.

- Una barra lateral de navegación debe ser lo bastante ancha para mostrar etiquetas estables, pero claramente subordinada al área de trabajo. Dale un
  ancho mínimo, preferido y máximo (`min-w-*`, `w-*`, `max-w-*`) en lugar de solo un porcentaje.
- En los diseños maestro–detalle, deja que la colección siga siendo escaneable y da el espacio sobrante al panel de detalle. Un punto de partida de
  aproximadamente un tercio/dos tercios suele ser útil, pero las restricciones del contenido son las que mandan. En un teléfono, los dos
  paneles pasan a ser dos páginas de un `NavStack`.
- Los inspectores y las hojas auxiliares no deberían cubrir el objeto principal de forma predeterminada. Deben poder redimensionarse o descartarse
  cuando su contenido crece; un [`Sheet`](../elements/sheet.md) se cierra con su fondo, con Escape y con el botón de retroceso.
- El ancho de un diálogo se deduce de la decisión que plantea: un `AlertDialog` para una confirmación breve, un formulario mediano o una
  ventana/página dedicada para un trabajo complejo. No ensanches un diálogo solo para crear espacio en blanco.
- Reserva la elevación más fuerte para la capa de decisión superior. Dentro de una capa, usa el fondo y líneas finas, no sombras
  cada vez mayores, para mostrar la jerarquía.

Define tres restricciones de tamaño para cada región principal: el mínimo con el que su tarea aún funciona, un valor predeterminado cómodo y cómo
absorbe el espacio sobrante. Persiste las divisiones controladas por el usuario cuando representen una preferencia de flujo de trabajo, y
limita los valores restaurados según la ventana actual.

<a id="alignment-details"></a>

### Detalles de alineación

La alineación es un sistema estructural, no una pasada final de pulido. Establece un conjunto reducido de ejes de alineación para cada superficie:
bordes de inicio y final compartidos, líneas base del texto, líneas centrales y carriles funcionales fijos. Los elementos del mismo nivel
deben unirse al mismo eje de arriba abajo o de inicio a final, aunque sean tipos de componente distintos.

<div class="diagram-scroll">
<img class="diagram diagram-light" src="/diagrams/alignment-spines-light.svg" alt="Alignment spines across a content region">
<img class="diagram diagram-dark" src="/diagrams/alignment-spines-dark.svg" alt="Alignment spines across a content region">
</div>

Las líneas rojas verticales están junto a los bordes compartidos o los centros de los controles para el contenido, el estado, la hora y las acciones finales.
Las líneas horizontales están bajo las líneas base del texto o atraviesan el centro de una fila para mostrar la alineación inferior y la del centro vertical.
La comparación compacta aísla una deriva de un píxel renderizado que debe corregirse en su propietario estructural.

- Da a las regiones hermanas un margen de contenido compartido. Un encabezado, una barra de herramientas, una fila de lista, un estado vacío y un pie que describen el
  mismo nivel no deberían inventar cada uno un borde de inicio ligeramente distinto.
- Repite la geometría de columnas en toda la región. Los encabezados, las filas, los resúmenes, los estados de carga y los editores en línea deben reservar los mismos
  carriles para identidad, metadatos, estado, números y acciones.
- Alinea los controles relacionados entre filas y secciones. Las etiquetas, los campos, las descripciones y los mensajes de validación de un formulario deben
  revelar una cuadrícula vertical estable cuando la página se recorre de arriba abajo.
- Mantén coherentes las bandas horizontales. Los elementos que comparten una barra de herramientas, un encabezado, una barra de estado o una fila deben usar una sola línea base o línea
  central en lugar de desplazamientos ajustados individualmente.
- Introduce sangría solo para una jerarquía, contención o despliegue reales. La sangría decorativa hace que los hermanos parezcan
  subordinados y rompe la línea de lectura de la superficie.
- Cuando termina un nivel anidado, vuelve exactamente al eje del padre. No dejes que el relleno acumulado se desvíe a lo largo de los contenedores
  anidados.
- Conserva el eje aunque falte contenido opcional. La ausencia de iconos, insignias, descripciones o acciones finales no debe mover
  las etiquetas restantes; usa ranuras o carriles intencionales cuando importe la comparación entre filas.
- Alinea las regiones principales entre sí cuando su jerarquía coincide. Los encabezados de la barra lateral, los títulos del contenido, los paneles divididos, las
  barras de herramientas y las barras inferiores no tienen por qué compartir todas las coordenadas, pero los niveles coincidentes deben formar líneas continuas visibles.

No todos los bordes deben alinearse. Un hijo puede tener sangría, un valor principal puede preceder a sus metadatos de apoyo y una decisión
destructiva puede ganar separación. Estas excepciones deben comunicar jerarquía o significado; no deben ser el resultado de
rellenos de componentes descoordinados. Empieza por el eje compartido y después haz explícita la excepción.

Trata la alineación exacta y los intervalos repetidos como invariantes de calidad. Cuando dos bordes o espacios deben ser iguales, una diferencia de un
píxel renderizado es un defecto, no una aproximación óptica aceptable. Inspecciona los límites resueltos con una herramienta de medición en
tamaños de ventana, tamaños de texto y factores de escala de pantalla representativos. Compara coordenadas y
distancias; no apruebes una alineación solo a partir de una captura de pantalla casual.

La tolerancia de píxeles renderizados es una regla de verificación, no un permiso para parchear el código con desplazamientos en puntos sin procesar. Las relaciones
iguales deben resolverse a partir de la misma clase o método de espaciado, token, definición de cuadrícula o margen compartido de componente.
Corrige el propietario común cuando difieran. Ten en cuenta el diseño fraccionario y el redondeo del dispositivo (teléfonos 2× y 3×, escalas
fraccionarias de escritorio) para que los ejes previstos caigan en el mismo píxel físico en lugar de desviarse en ciertas escalas.

- Alinea el texto por las líneas base, no por los centros de sus cuadros delimitadores, cuando tamaños mixtos comparten una fila.
- Centra los iconos en una ranura fija para que las etiquetas no se muevan cuando los iconos difieren en ancho intrínseco.
- Alinea al final los números comparables y usa cifras tabulares (`tabular-nums`); alinea al
  inicio la prosa y los identificadores, salvo que la configuración regional requiera otra cosa.
- Mantén las acciones finales de las filas y los indicadores de despliegue en carriles de ancho fijo.
- Alinea los controles de formulario por su marco interactivo, no por el texto de ayuda situado debajo.
- Usa `justify-between` (`.justify_between()`) solo cuando los dos lados son realmente propietarios de bordes opuestos; no debe
  disimular la falta de estructura en el medio.
- Las líneas finas pertenecen al propietario del límite. Dos regiones adyacentes no deben dibujar cada una el mismo separador.
- Una barra de desplazamiento pertenece a la región que se desplaza y se sitúa contra el borde final de ese panel, editor o ventana.
  El relleno del contenido puede separar el texto y las filas del borde, pero no debe llevar la barra de desplazamiento al medio de la superficie. Aplica el relleno al
  contenido de la vista de desplazamiento, no a la vista de desplazamiento.

<a id="density-tiers"></a>

### Niveles de densidad

Medio es el valor predeterminado. Cambia la densidad para todo el contexto local, no para un único control aislado:

- **cómodo / grande:** incorporación, formularios poco densos, decisiones destacadas;
- **estándar / medio:** la mayor parte del chrome de la aplicación y de los flujos de trabajo, y todas las pantallas táctiles;
- **compacto / pequeño:** barras de herramientas de escritorio, menús, tablas y datos profesionales repetidos;
- **extra compacto / xsmall:** utilidades excepcionales de alta densidad, nunca la elección automática para toda una aplicación.

Usa una escala acotada en lugar de tamaños arbitrarios. En las pantallas táctiles, todo objetivo pulsable mide al menos 44 × 44 puntos
([Áreas táctiles](./accessibility.md#touch-targets)). Con un puntero, los botones suelen moverse entre marcos de aproximadamente 24, 28
y 32 pt, los campos de entrada llegan a unos 40 pt en tamaño grande, y las filas de tabla usan unos 28, 32 y 40 pt. Da a los componentes de
la aplicación un tamaño que cambie a la vez la tipografía, el icono, el relleno y el área de pulsación; una altura personalizada que cambie
solo el cuadro exterior suele ser incompleta.

<a id="text-size-base-font-and-points"></a>

### Tamaño del texto, fuente base y puntos

Una escala bien diseñada preserva la jerarquía mientras el texto crece. Un texto más grande tiene éxito cuando la relación entre
título y cuerpo, control e icono, espaciado interior y exterior, regiones primarias y secundarias sigue sintiéndose igual en cada
tamaño, y no simplemente cuando todos los objetos se hacen más grandes.

Las longitudes de NSH son puntos, y el tamaño de texto del usuario (Dynamic Type en iOS, el tamaño de fuente en Android, el escalado de texto de los
escritorios, o el ajuste propio de una aplicación anfitriona) escala el texto: todo texto y campo de entrada que permita el escalado de fuente crece, mientras que el espaciado,
los radios, los bordes y las imágenes conservan su tamaño ([Tamaño del texto](./device-and-environment.md#text-size)). El tamaño de texto base de la aplicación (`text-base` de Tailwind, 16 puntos) es el tamaño del cuerpo en torno al cual se escalonan los pasos de la escala tipográfica.

Diseña con proporciones:

- los pasos tipográficos mantienen la misma jerarquía en torno al tamaño base del cuerpo;
- los pasos de espaciado mantienen las mismas relaciones de agrupación en torno a la tipografía;
- los marcos de los controles y las áreas de pulsación crecen con sus etiquetas: dimensiónalos por su contenido y un mínimo (`min-h-11`), no por una
  altura fija;
- los mínimos de los paneles y los anchos cómodos tienen en cuenta los textos más grandes;
- los radios de las esquinas y el tratamiento del foco siguen siendo ópticamente coherentes con el marco del control.

Como el texto crece por sí solo, un marco fijo a su alrededor se rompe: una etiqueta mayor dentro de un botón de altura fija, un
documento mayor dentro de mínimos de panel fijos, o filas mayores dentro de una altura de fila fija destruyen el ritmo original y pueden recortar
el contenido. Deja que las filas se ajusten en varias líneas o pasen a una columna cuando el texto se hace grande (`fontScale()`, `font_scale()`), y limita la escala
del texto que ya es grande, como un título de 34 pt (`maxFontSizeMultiplier`).

Como regla, el diseño de la aplicación no debería escribir valores literales en puntos (`p-[13px]`, `px(13.0)`). Usa la escala de espaciado
(`p-2`, `gap-3`, `w-64`, `text-sm` y sus métodos tipados) o los tamaños de componente de la aplicación. Usa puntos literales solo cuando
el valor represente un límite físico o de trama: una línea fina, un margen de ventana de la plataforma, las dimensiones de un mapa de bits, una tolerancia mínima de
detección de pulsaciones, o una geometría que deba coincidir con una superficie externa. Son excepciones auditadas y documentadas. El espaciado
del producto, la tipografía, el tamaño de los iconos y la geometría ordinaria de los controles se mantienen en la escala.

Prueba con varios tamaños de texto, no solo con el predeterminado. Verifica la jerarquía, el ajuste de línea, el truncamiento, el tamaño mínimo de ventana, el
redimensionado de paneles, el margen del anillo de foco, la ubicación de los elementos emergentes y la medición de las filas de lista.
<a id="surfaces-and-elevation"></a>

### Superficies y elevación

Usa la elevación para explicar el apilamiento, no la importancia. La superficie base es plana; los separadores y el contraste de fondo definen sus regiones. Los popovers, menús, hojas, diálogos y notificaciones pueden usar sombras progresivamente más fuertes porque se sitúan por encima de otro contenido. No pongas una sombra en cada tarjeta.

Todas las superficies del mismo tipo deben compartir un único tratamiento. Da a las familias de popups una única superficie con tema (los tokens `popover`, el borde, `radius` y una sombra) para que `Popover`, `Menu`, `ContextMenu` y `Tooltip` no se desvíen entre sí. Cuando una aplicación invente otra superficie anclada, reutiliza ese tratamiento en lugar de aproximarlo con valores literales de borde y sombra no relacionados.

<a id="typography-and-icons"></a>

### Tipografía e iconos

Usa la fuente de interfaz de la plataforma para el texto de la interfaz y monoespaciada solo para código, identificadores, atajos y datos numéricos alineados. Mantén el texto del cuerpo legible y evita el exceso de mayúsculas o de espaciado entre letras, especialmente en texto CJK.

Usa una sola familia de iconos en un producto. Los iconos complementan las etiquetas; no deben sustituir acciones poco familiares con conjeturas. Los botones con solo icono siempre necesitan un nombre accesible (`accessibilityLabel`). Su explicación visual sigue la política de tooltips que se describe más abajo. Usa iconos rellenos o de color para comunicar un estado, no simplemente para dar vida a una barra de herramientas.

<a id="layout-patterns"></a>

## Patrones de maquetación

<a id="choose-a-stable-shell"></a>

### Elige una estructura base estable

La mayoría de las aplicaciones deberían usar una de estas estructuras:

- **espacio de trabajo único:** un encabezado o barra de herramientas sobre una vista principal;
- **pila de navegación:** páginas que se apilan y se desapilan (`NavStack`), con el gesto de retroceso del sistema en teléfonos;
- **espacio de trabajo con barra lateral:** navegación persistente junto a una vista de detalle cambiante;
- **maestro–detalle:** paneles redimensionables de colección y detalle, dos páginas en un teléfono;
- **espacio de trabajo de documentos:** pestañas para varios objetos de larga duración;
- **ventana de utilidad:** una tarea concreta con un camino de acciones corto y fijo.

Mantén estable la navegación global mientras cambia el contenido. Da al área de trabajo principal el espacio restante con `flex-1` (`.flex_1()`) y con `min-w-0` / `min-h-0` allí donde los hijos que desbordan deban encogerse. Usa `Scroll` y `List` para el comportamiento para el que fueron concebidos, en lugar de reconstruir el desplazamiento o la virtualización a partir de vistas anidadas.

En escritorio, una barra de título propia de la app ([`nsh/desktop`](../modules/nsh-desktop.md)) es, ante todo, chrome de la ventana. Conserva su región de arrastre (`.window_drag(true)`) y evita asociar los clics ordinarios sobre el título a comandos de edición poco frecuentes. Renombrar pertenece a un comando explícito sobre el objeto, con una vía de teclado cuando corresponda.

<a id="responsive-windows"></a>

### Ventanas adaptables

Una ventana puede tener cualquier tamaño: lo decide el usuario, una vista dividida o la app anfitriona. Decide qué ocurre cuando una ventana se estrecha:

1. preserva la tarea principal;
2. permite que las regiones redimensionables lleguen a un mínimo documentado;
3. contrae las etiquetas secundarias o los inspectores;
4. mueve las acciones de baja frecuencia a un menú;
5. desplaza únicamente la región cuyo contenido realmente desborda.

No ocultes una acción sin ofrecer otra vía para llegar a ella. Evita que se desplace toda la ventana cuando solo debería desplazarse una lista o el cuerpo de un documento. Los breakpoints (`md:`, `lg:`) y `windowSize()` (`window()` en Rust) siguen a la superficie en la que NSH renderiza.

El layout flex de NSH tiene la misma presión de tamaño intrínseco que se encuentra en otros sistemas de layout: un hijo `flex-1` aún puede negarse a encogerse alrededor de un contenido largo. El diseño y la implementación deben ponerse de acuerdo sobre qué paneles pueden encogerse, truncarse, ajustarse o desplazarse. Una región recortada también recorta un anillo de foco que sobresale; nunca sacrifiques la visibilidad del teclado solo para simplificar el desbordamiento.

<a id="forms-and-settings"></a>

### Formularios y ajustes

Usa una etiqueta visible para cada campo y coloca la ayuda o la validación junto al campo que describen. Alinea los campos relacionados, pero no fuerces etiquetas largas en una columna fija estrecha. Usa el control adecuado: `Checkbox` para opciones independientes, un [`RadioGroup`](../elements/radio.md) de `Radio`s para un conjunto pequeño y visible, un `Menu` de opciones para un conjunto más largo, y [`Switch`](../elements/switch.md) para un ajuste que surte efecto de inmediato. Sus partes (el carril y el pulgar del switch, el indicador del checkbox) son responsabilidad de la app para darles estilo, con clases `checked:`, `indeterminate:` y `disabled:` que siguen al control:

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

Un checkbox de «seleccionar todo» muestra una selección parcial con su estado indeterminado:

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

Deshabilita el envío mientras una operación está en curso, conserva lo que el usuario ha introducido y muestra el resultado cerca de la acción. Mantén los campos de entrada por encima del teclado de software (`env(keyboard-inset-height)`). Reserva los diálogos para decisiones breves y concretas; usa una página completa o una hoja para los flujos que requieren exploración o muchos campos.

Un tratamiento de carga debe representar una espera real. El cambio entre paneles de ajustes cuyo contenido ya está disponible debe ser inmediato; un skeleton solo es apropiado mientras el contenido se está cargando de verdad y su forma es conocida.

<a id="components-and-composition"></a>

## Componentes y composición

Sigue el principio de Shadcn: los componentes son material de construcción, no un sistema de diseño sellado. `nsh/base` aporta el comportamiento; la app aporta valores predeterminados coherentes en sus propios componentes y es responsable de la composición y de la semántica del producto.

- Usa las variantes de los componentes según su significado. Primary se reserva para la confirmación predeterminada explícita en un área de decisión, normalmente la acción invocada por Return en escritorio. Una acción única, frecuente o deseable no es automáticamente primary. Un comando `Add` en una barra de herramientas de gestión normalmente usa un botón default; la confirmación predeterminada `Create` de un formulario puede usar primary. Usa destructive para la confirmación destructiva y ghost para las acciones discretas de la barra de herramientas.
- Prefiere partes y slots explícitos antes que dar estilo a descendientes arbitrarios.
- Mantén coherente un patrón repetido en todo el producto. Envuélvelo en un componente de la aplicación cuando lleve lenguaje de dominio o políticas.
- Usa el componente estándar para su función semántica. `Menu`, `ContextMenu`, `Popover`, `Sheet`, `Dialog` y `AlertDialog` no son cajas intercambiables; cada uno es responsable de contratos distintos de selección, foco, teclado, cierre y layout, y adopta su propia forma en cada dispositivo.
- Conserva la geometría de la familia de componentes. Las filas de un menú comparten relleno vertical y horizontal, altura, huecos para icono y marca de verificación, separadores, radio y tratamiento de estados. No imites un menú con un popup personalizado cuyo espaciado solo se aproxime al del sistema.
- No envuelvas un componente solo para renombrar cada prop o para congelar todas sus capacidades.
- Mueve el comportamiento reutilizable sin estilo de producto a `nsh/base`, o a un crate que compartan los productos de la app; mantén la presentación con tema y con criterio propio en los componentes de la aplicación.

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

## Estados de interacción

<a id="make-the-result-understandable-before-the-click"></a>

### Haz comprensible el resultado antes del clic

Un control debe anticipar su resultado. Usa controles y ubicaciones familiares de la plataforma para que las personas puedan actuar sin aprender primero la interfaz. Su etiqueta nombra la acción y el objeto, su estado muestra la disponibilidad y su respuesta confirma el mismo resultado.

No etiquetes un Button como `Save` si abre un flujo de configuración, ni como `Delete` si solo quita un elemento de un grupo. Nombra el alcance cuando el contexto no lo deje claro. Responde de inmediato a la activación, evita envíos duplicados durante trabajos largos y muestra el resultado cerca del objeto que cambió. Añade un mensaje de éxito solo cuando el resultado en sí no sea visible.

Todo control interactivo debe diseñarse para:

| Estado | NSH | Requisito de diseño |
| --- | --- | --- |
| Reposo | | Affordance clara sin ruido visual |
| Hover | `hover:` | Respuesta sutil al puntero, nunca la única señal |
| Pulsado | `active:` | Respuesta inmediata a la pulsación, con estilo de la app |
| Abierto / pulsado | el `open` del popup | Respuesta persistente mientras hay un popup asociado abierto |
| Foco visible | `focus-visible:` | Anillo de foco de teclado con alto contraste |
| Seleccionado / marcado | `selected:`, `checked:` | Estado persistente distinto del hover |
| Deshabilitado | `disabled:` | Menor énfasis y sin respuesta engañosa de hover o pulsación |
| Cargando | | Conserva el contexto, evita acciones duplicadas, explica las esperas largas |
| Error | | Indica qué ocurrió y cómo recuperarse |

Asocia los comandos que deben funcionar desde el teclado con [`keymap`](../modules/nsh.md#keymap) en escritorio y en la web. Usa los atajos habituales de la plataforma (`"mod+k"` es Command en macOS y Control en el resto), muestra los atajos en menús o tooltips y mantén el foco en un lugar lógico tras abrir o cerrar una superposición.

La selección forma parte del modelo de información, no es un pulido opcional. Las pestañas, las opciones segmentadas, las filas seleccionables, los filtros y los destinos de navegación deben mostrar un estado seleccionado persistente (`selected`, que los lectores de pantalla anuncian). Un botón que controla un menú debe permanecer visiblemente pulsado o abierto hasta que el popup se cierre; el hover por sí solo no puede explicar la relación entre el disparador y la superficie.

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

En un control segmentado, el relleno seleccionado y la superficie no seleccionada deben compartir la silueta del contenedor. Ninguno puede cuadrar la esquina de un extremo ni hacer que un límite parezca más pesado que los demás.

Muestra un elemento de navegación, una fila de lista o una pestaña seleccionados mediante la propia superficie del elemento: un relleno de selección, un primer plano más intenso o un peso mayor. No añadas una barra en el borde inicial ni un borde de un solo lado como marcador de selección. Es un hábito de las plantillas web, no una convención nativa; rompe la silueta redondeada del elemento y añade un segundo borde en competencia a una columna que ya se alinea con su texto.

En las acciones destructivas, distingue entre el trabajo reversible y el irreversible. Prefiere deshacer o una notificación temporal para los cambios reversibles. Usa un [`AlertDialog`](../elements/alert-dialog.md) cuando la consecuencia sea grave y no pueda deshacerse; nombra el objeto concreto y la consecuencia en el texto de la confirmación.

<a id="pointer-conventions"></a>

### Convenciones del puntero

Usa el cursor predeterminado para botones, checkboxes, elementos de menú, pestañas y otros controles. Usa una mano que señala (`cursor-pointer`) para los enlaces y para el contenido que se comporta como un enlace. Usa los cursores de texto, redimensionado, agarre y prohibido solo cuando describan la manipulación activa. Un cursor refuerza una affordance; no sustituye el estado visible ni el rol accesible del control.

Mantén los efectos de hover discretos, porque la interacción táctil, de teclado y de accesibilidad no tiene hover. No reveles al pasar el puntero la única copia de una acción destructiva o esencial. Las acciones contextuales de una fila pueden volverse más discretas en reposo si los mismos comandos siguen disponibles mediante la selección, el teclado o un menú contextual.

<a id="prefer-command-surfaces-over-hover-toolbars"></a>

### Prefiere las superficies de comandos a las barras de herramientas con hover

Usa la frecuencia y el alcance de los comandos para elegir dónde vive una acción:

- mantén visible la acción principal o frecuente como un botón con etiqueta o un control familiar de barra de herramientas;
- coloca las acciones secundarias de la región actual tras un disparador [`Menu`](../elements/menu.md) visible;
- coloca los comandos que actúan sobre el objeto situado bajo el puntero o el dedo en un `ContextMenu`: un clic derecho en escritorio, un dedo mantenido en pantallas táctiles;
- expón el mismo comando importante mediante un atajo de teclado ([`keymap`](../modules/nsh.md#keymap)) cuando tenga una forma natural de teclado, y en el menú de la aplicación (`Menu.setApplicationMenu` de [`nsh/desktop`](../modules/nsh-desktop.md));
- usa un icono que aparece al pasar el puntero solo como atajo de un comando que siga siendo accesible por otra vía.

Esto es más que una preferencia visual. Los menús de `nsh/base` ya se encargan de la colocación en el disparador, de los submenús en cascada en escritorio y de una hoja con submenús en el mismo lugar en teléfonos, del cierre al elegir un elemento, al pulsar fuera, con Escape o al retroceder, y de los roles de menu y menu item para los lectores de pantalla. Una tira personalizada de botones con hover debe reconstruir esos comportamientos y es invisible para los flujos táctiles, solo de teclado y de muchas tecnologías de asistencia.

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

Elige `Menu` cuando los usuarios necesiten una indicación visible de que existen más comandos, por ejemplo en el desbordamiento de una barra de herramientas, en las acciones de un documento o en un menú de cuenta. Elige `ContextMenu` para los comandos con alcance de selección u objeto, como renombrar, duplicar, mostrar o quitar. El menú contextual no debe ser la única forma de ejecutar un comando esencial; ofrece una vía mediante la barra de menús, la barra de herramientas, el teclado o una vista de detalle, según corresponda.

No metas todas las acciones en un menú solo para que una pantalla parezca minimalista. El descubrimiento y la rapidez importan: la acción principal sigue visible, los elementos peligrosos permanecen claramente etiquetados y separados, y un elemento de menú debe usar el mismo verbo, icono, atajo, estado de habilitación y resultado dondequiera que aparezca.
<a id="button-means-application-action-link-means-external-resource"></a>

### Un botón es una acción de la aplicación; un enlace es un recurso externo

Usa un `Button` cuando la activación cambie el estado de la aplicación, confirme una decisión, abra una herramienta, envíe datos o ejecute un comando. Elige su tratamiento según la jerarquía local:

- botón primario para el único compromiso destacado en una zona de decisión;
- botón predeterminado para las acciones visibles habituales;
- botón con contorno cuando una acción necesita un límite claro con menos énfasis;
- botón fantasma para acciones familiares y de bajo énfasis en barras de herramientas y en línea;
- botón de icono solo para un símbolo bien conocido, con un nombre accesible y un tooltip cuando el significado o el alcance no estén claros.

No asignes el estilo primario porque un botón sea la única acción en pantalla, porque esté en la esquina superior derecha o porque el equipo quiera más clics. El estilo primario comunica el compromiso predeterminado y el comportamiento del teclado. Si la activación es simplemente un comando ordinario, como añadir un elemento, abrir una herramienta o actualizar una vista, usa un botón predeterminado, con contorno o fantasma según su jerarquía local.

Usa un enlace subrayado (`role="link"`) solo para un destino que sea un recurso externo: una URL, una página web, documentación en línea o una dirección de correo electrónico. Usa el cursor de mano con el dedo señalando porque su contrato es salir del contexto actual de la aplicación hacia ese recurso. No uses el estilo de enlace para que un comando funcional parezca discreto. Una acción con forma de enlace como Eliminar, Guardar, Actualizar, Añadir, Abrir menú o de navegación dentro de la aplicación oculta la affordance del control y expone un rol de accesibilidad incorrecto.

«Ver» no convierte un destino dentro de la aplicación en un enlace. Un informe completo, un análisis, un panel de detalles o un registro local se siguen abriendo mediante un botón, una fila, una tarjeta, una pestaña o un control de despliegue. Usa etiquetas concisas y sensibles al contexto, como `Full analysis`, cuando la tarjeta que lo contiene ya establece qué se abre; reserva el subrayado para un recurso que realmente se abre en un navegador o en un cliente de correo.

Toda la navegación interna (filas de la barra lateral, pestañas, migas de pan, elementos de lista, apertura de una vista local o cambio de espacios de trabajo) debe usar la pila de navegación, un `Button` o el componente correspondiente. El énfasis visual se elige mediante la variante del botón o el estado seleccionado del componente de navegación, nunca falseando la semántica.

<a id="feedback-and-overlays"></a>

## Comentarios y superposiciones

Elige la superficie más pequeña que se ajuste a la decisión:

- tooltip: una explicación breve o un atajo ([`Tooltip`](../elements/tooltip.md), o el `tooltip` de cualquier elemento);
- popover: controles contextuales que no interrumpen la tarea ([`Popover`](../elements/popover.md));
- menú: una lista compacta de acciones ([`Menu`](../elements/menu.md));
- notificación: estado asíncrono que no requiere una decisión;
- diálogo: una decisión concreta o un formulario breve ([`Dialog`](../elements/dialog.md));
- diálogo de alerta: confirmación explícita de una acción con consecuencias ([`AlertDialog`](../elements/alert-dialog.md));
- sheet: trabajo complementario que se beneficia de un espacio más persistente ([`Sheet`](../elements/sheet.md)).

Cada uno adopta la forma que espera su dispositivo, a partir de una única estructura que la aplicación estiliza (`popupClass`, `backdropClass`):

| | Escritorio | Teléfonos y tabletas |
| --- | --- | --- |
| `Tooltip` | tras detenerse el puntero sobre el elemento | solo cuando la aplicación lo abre |
| `Popover` | anclado; una pulsación fuera lo cierra y continúa | anclado; una pulsación fuera solo lo cierra |
| `Menu` | una ventana emergente junto al disparador, con submenús en cascada | un sheet en la parte inferior; un submenú ocupa el lugar de sus elementos |
| `ContextMenu` | el botón secundario, en la posición del puntero | al mantener el dedo pulsado se abre el sheet |
| `Sheet` | un panel de borde sobre un fondo | igual |
| `AlertDialog` | una alerta con el estilo de diálogo de la plataforma | la alerta o la hoja de acciones del sistema |

Un tooltip aporta el significado que falta; no repite una acción evidente. Resérvalo para un símbolo poco familiar, un alcance ambiguo o un atajo útil que de otro modo quedaría oculto. Los comandos repetidos y reconocibles, como Copiar y Descargar en el pie de un mensaje, necesitan nombres accesibles y acceso por teclado, pero sus etiquetas al pasar el puntero añaden interrupción en lugar de claridad. Los teléfonos muestran un tooltip solo cuando la aplicación lo abre, así que un tooltip nunca debe contener lo que necesita un usuario táctil.

Una alerta interrumpe la jerarquía visual aunque no abra un modal. Úsala para información importante y excepcional que requiere atención en la tarea actual, no como un contenedor decorado para descripciones ordinarias, consejos o espacio vacío. Prefiere la ayuda en línea, el texto atenuado o una sección normal cuando el contenido no requiera atención ni acción inmediatas.

Evita apilar superposiciones. Escape y el botón de retroceso de Android descartan la capa descartable situada más arriba; mantén el estado de la aplicación sincronizado desde `onOpenChange` y devuelve el foco al disparador o al siguiente destino lógico.

Una acción de una superposición debe referirse a un objeto o estado que la superposición realmente muestra. Por ejemplo, expón `Clear history` solo cuando una sección de historial reciente diferenciada sea visible y contenga entradas. Los resultados de búsqueda, los elementos recientes y los favoritos son colecciones distintas; etiquétalos y sepáralos en lugar de mezclarlos en una única lista sin explicación. Oculta una acción que no sea aplicable o desactívala con un motivo útil; no dejes un icono de papelera ambiguo en un pie.

El espacio del pie no es un cajón de sastre para las capacidades que no encontraron lugar en el diseño. Un pie puede presentar atajos, estado o acciones que se apliquen a toda la superficie, pero cada elemento debe responder: cuál es su objeto, por qué está disponible ahora, qué alcance afecta y qué estado visible cambia tras la activación.

<a id="motion"></a>

## Movimiento

El movimiento explica el cambio; no es decoración ambiental. Usa transiciones cortas para la aparición, el descarte, la expansión y la continuidad espacial. Evita animar grandes cambios de diseño cuando la opacidad o una transformación comunican la misma relación. Respeta las preferencias de movimiento reducido (`motion-reduce:`, `reduceMotion()`), no exijas nunca una animación para entender el estado y no añadas una animación predeterminada a cada componente.

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

La política de movimiento pertenece a la capa de la aplicación. `nsh/base` es responsable del mecanismo de ciclo de vida o de la geometría necesarios para una transición, pero no decide que todos los productos usen fundidos o deslizamientos. Da una identidad estable a los valores que se animan de forma independiente y haz que la interrupción se invierta con suavidad desde el valor muestreado en ese momento, en lugar de reiniciarse desde un extremo anterior.

El movimiento sigue la continuidad de la interacción. Mientras un puntero o una posición de desplazamiento se mueve entre destinos relacionados, mantén estable la superficie de vista previa y actualiza su contenido o su posición en el mismo lugar. Descártala solo cuando termine la interacción; repetir un fundido de salida y de entrada en cada actualización se percibe como parpadeo.

<a id="designing-data-heavy-interfaces"></a>

## Diseño de interfaces con muchos datos

Denso no significa apretado. En tablas, árboles, listas largas y editores:

- mantén estables visualmente los encabezados y la identidad principal de las filas;
- alinea los valores comparables y usa numerales tabulares cuando proceda;
- distingue el foco, el estado al pasar el puntero, la fila activa y la selección múltiple;
- mantén visibles y reversibles la ordenación y el filtrado;
- conserva la selección por identidad de dominio al filtrar y reordenar;
- virtualiza las colecciones grandes (`List`) sin cambiar la semántica del teclado;
- usa la divulgación progresiva para las columnas secundarias y los inspectores;
- ofrece un estado vacío útil que explique la siguiente acción.

Elige una tabla para comparar campos coherentes, una lista para examinar elementos heterogéneos y un árbol para una jerarquía real. No uses un diseño de datos complejo como estilo visual.

<a id="interface-language"></a>

## Lenguaje de la interfaz

Las palabras forman parte de la arquitectura de la interfaz. Escribe el vocabulario de una función como un sistema (destinos, objetos, comandos, estados y resultados) y no como traducciones aisladas de funciones de implementación. Prefiere la formulación más corta que siga siendo precisa en su contexto real.

<a id="let-context-carry-context"></a>

### Deja que el contexto aporte el contexto

No repitas información que la superficie circundante ya establece. Un destino de la barra lateral suele ser el propio objeto o dominio: usa `Users`, no `User Management`; `Shortcuts`, no `Shortcut Configuration Management`. Una columna cuyas filas ya contienen acciones puede omitir un encabezado genérico `Operation`. Un diálogo titulado `Delete “Roadmap”?` no necesita un texto que vuelva a plantear la misma pregunta.

Esto es economía de contexto, no eliminación por sí misma. Añade texto cuando cambie la decisión: identifica el alcance afectado, una consecuencia irreversible, un requisito previo poco habitual o una forma de recuperación. Cada palabra adicional debe responder a una pregunta que el diseño actual aún no responde.

Usa sustantivos para destinos y objetos (`Users`, `Appearance`, `Orders`), verbos para comandos (`Save`, `Duplicate`, `Export`) y adjetivos o frases cortas para estados (`Offline`, `Up to date`, `Pending review`). Evita envoltorios como `Management`, `Module`, `Page`, `Function`, `Operation` y `System`, salvo que la palabra distinga un concepto real del dominio.

<a id="write-each-language-do-not-translate-its-shape"></a>

### Escribe cada idioma, no traduzcas su forma

Parte de la intención, la jerarquía y la terminología compartidas, y compón cada configuración regional como lenguaje de interfaz natural. No conserves el orden de palabras, el número de palabras, el relleno de cortesía ni la categoría gramatical del idioma de origen. El inglés `Users` puede expresar un concepto de función en chino que, traducido literalmente, se expandiría a «gestión de usuarios»; la fidelidad consiste en conservar el propósito, no los tokens.

Elimina las palabras que ya aporta la arquitectura de la información que lo rodea. Dentro de una superficie `Settings`, un destino suele ser simplemente `Account`, no `Account Settings` y nunca el singular poco natural `Account Setting`. La etiqueta correcta en inglés se elige según su rol y sus vecinas, no a partir de la frase de origen aislada.

Mantén un pequeño léxico de producto para los objetos, comandos y estados recurrentes. Usa el mismo término en la barra de herramientas, el menú, el menú contextual, el diálogo, la búsqueda de atajos y la documentación, salvo que el contexto cambie realmente su significado. Revisa el texto en la superficie renderizada: las etiquetas vecinas suelen revelar repeticiones o alcances incoherentes que un archivo de configuración regional no muestra.

En la redacción técnica localizada, conserva un término establecido de un framework cuando una traducción sería menos precisa. Mantén los identificadores de API en su forma original y dales formato de código. No conserves palabras extranjeras corrientes solo para sonar técnico. Explica un término conservado la primera vez que se use, si hace falta, y después emplea la misma forma en toda la interfaz, la documentación y los ejemplos de API.

En la documentación, usa el nombre exacto en inglés de una API, componente, archivo fuente o guía con nombre en el texto del enlace, también en las páginas localizadas. Por ejemplo, escribe `View`, `Button`, `Menu` y `Text` en lugar de traducir sus nombres o añadir un prefijo `NSH` redundante. Mantén las explicaciones circundantes en el idioma de la página. Enlaza solo el destino con nombre; coloca fuera del enlace palabras como «fuente» cuando describan por qué se cita.

En una tabla comparativa técnica compartida entre configuraciones regionales, mantén los nombres de capacidades, de frameworks, de API y de modelos en su forma inglesa establecida. Traduce la explicación que rodea la tabla, no sus etiquetas técnicas. Las palabras comunes de la interfaz que tengan un nombre local establecido aún pueden localizarse fuera de ese contexto comparativo.
<a id="buttons-and-confirmation-dialogs"></a>

### Botones y diálogos de confirmación

Las etiquetas de los botones son cortas por defecto, normalmente una o dos palabras, y describen el resultado, no el gesto ni el componente.
Prefiere `Save`, `Move` o `Delete` a `Click to save`, `Perform move` o `Confirm deletion`. Usa `Cancel` de forma coherente
para la acción que sale sin confirmar. Reserva `OK` para dar acuse de recibo de contenido puramente informativo.

Corto es un valor por defecto, no un límite de caracteres. Es mejor una etiqueta deliberadamente más larga cuando sus palabras exponen una consecuencia
o distinguen opciones que los usuarios podrían confundir, por ejemplo `Delete from this group` frente a `Eliminar
en todas partes`, or `Reiniciar sin guardar`. La longitud debe aportar información decisiva para la decisión; no debe repetir el
título ni el cuerpo del diálogo.

Usa como etiqueta de confirmación el resultado conciso más específico posible:

| Contexto | Débil | Preferible |
| --- | --- | --- |
| Diálogo de eliminación | `Yes`, `Sure`, `Confirm deletion` | `Delete` |
| Cambios sin guardar | `Confirm`, `Yes` | `Discard changes` |
| Simple acuse de recibo | `Confirm operation` | `OK` o `Done` |
| Consentimiento complejo cuyo resultado no tiene un verbo claro | `Yes` | `Confirm` |

`Confirm` es una alternativa útil cuando el diálogo circundante nombra por completo un compromiso complejo y ningún verbo de resultado más corto
es preciso. No debe sustituir a un comando claro. `Sure` es coloquial y no un comando estable en inglés, y
resulta demasiado ambiguo para el vocabulario estándar.

Un diálogo de confirmación debe formar una decisión compacta:

- título: la decisión o condición, como `Delete “Roadmap”?`;
- cuerpo: solo información nueva sobre el alcance, la consecuencia o la recuperación;
- acciones: `Cancel` y el resultado, como `Delete`;
- estilo destructivo: se aplica al resultado destructivo (una acción `AlertDialog` con el rol `destructive`), sin sustituir
  a una redacción precisa.

Evita títulos genéricos como `Notice`, `Warning`, `Error` y `Confirmation` cuando se pueda nombrar la condición real.
Evita frases rituales como “¿Seguro que quieres…?”, “¿Te gustaría…?”, “Ten en cuenta que…” y
“correctamente” cuando la estructura o el estado ya lo comunican. La cortesía debe venir de un tono sereno y respetuoso, no de repetir `please`.

<a id="capitalization-punctuation-and-symbols"></a>

### Mayúsculas, puntuación y símbolos

Usa por defecto mayúsculas de oración (sentence case) en la interfaz en inglés: `Reset layout`, no `Reset Layout` ni `RESET LAYOUT`. Conserva los nombres
propios y los acrónimos establecidos. Sigue una convención de la plataforma, como las mayúsculas de título (title case) en los comandos de menú
nativos, solo cuando la integración con la plataforma lo aproveche, y aplícala de forma coherente dentro de la clase de componente.

Las MAYÚSCULAS pueden aportar un énfasis tipográfico contenido en etiquetas de sección muy cortas, antetítulos, estados, acrónimos
establecidos e identificadores con aspecto de código. Su forma compacta y su espaciado medido pueden formar un nivel similar al de la negrita, pero
no corresponden a botones, encabezados largos, frases ni listas densas. No combines mayúsculas, color intenso y
peso en negrita en la misma región, y no transformes automáticamente todas las cadenas: los nombres de producto, los acrónimos y el contenido
localizado deben conservar su capitalización prevista.

Las etiquetas, botones, elementos de menú, pestañas, encabezados, marcadores de posición y estados breves no llevan punto final. Las frases completas
explicativas, de advertencia y de error sí. Evita los signos de exclamación en los mensajes rutinarios de éxito y error. En
chino, usa puntuación de ancho completo en las frases y omite la puntuación final en las etiquetas breves de controles según la misma
regla semántica.

Usa el carácter único de puntos suspensivos (`…`), no tres puntos. Añádelo a todo botón o elemento de menú que abra un diálogo,
una hoja o una ventana independiente, y a todo comando que requiera más datos o decisiones antes de poder completarse, como
`Settings…` o `Export…`. Un comando que se ejecuta de inmediato no lleva puntos suspensivos. Usa un indicador de progreso
indeterminado, no puntos decorativos, para comunicar trabajo en curso.

Los errores deben decir qué ha ocurrido y, cuando sea útil, la siguiente acción de recuperación. La confirmación de éxito debe nombrar el estado resultante
solo cuando ese estado no sea ya visible. Prefiere `Couldn’t save. Check your connection and try again.` a un
código técnico o a una disculpa larga; omite un toast `Saved successfully` cuando el documento pasa a estar guardado de forma visible.

<a id="internationalization-and-platform-fit"></a>

## Internacionalización y adaptación a la plataforma

Los nombres y etiquetas de accesibilidad (A11y) pueden permanecer en inglés; no es necesario localizar estas cadenas. Conserva la
etiqueta propia del elemento al nombrar un control que actúa sobre él, incluso cuando esa etiqueta esté localizada. Esta excepción no
se aplica al texto visible de la interfaz.

El texto debe soportar la expansión, la tipografía CJK, las escrituras de derecha a izquierda y distintas notaciones de atajos. No dimensiones un
control a partir de una sola etiqueta en inglés. Mantén el texto fuera de los recursos rasterizados, evita concatenar fragmentos traducidos y deja que las
etiquetas se ajusten o se trunquen solo donde el producto defina una vía de recuperación, como un tooltip.

Respeta las diferencias de plataforma que tienen significado: Command frente a Control, decoraciones nativas de ventana, apariencia
del sistema, comportamiento de las barras de desplazamiento, menús, capacidades de notificación y, en teléfonos, la cabecera del sistema, el gesto de retroceso y las
alertas. Mantén estable la arquitectura de información del producto entre plataformas, pero no borres el comportamiento
familiar de cada plataforma por una igualdad superficial de píxeles.

Las apps NSH se ejecutan en teléfonos, tabletas, escritorios y la web, y a menudo dentro de una app anfitriona. Diseña para cada uno:

- **La interfaz del sistema conserva el aspecto de la plataforma.** En iOS y Android la cabecera de una página es la del sistema (`NavPage` de `title` y las
  opciones de cabecera); los escritorios y la web muestran el slot `header` de la página, que dibuja la app. Da a cada página ambos
  ([Navigation](./navigation.md#navpage-and-the-header)). Las confirmaciones usan `AlertDialog`; la barra de estado sigue a la
  página o al diálogo que esté encima (`statusBar`).
- **El tema del anfitrión.** Una app incrustada puede recibir el tema de su anfitrión; las clases y los enlaces de Rust que leen tokens
  lo siguen de forma nativa ([Theme tokens](./tailwind.md#theme-tokens)).
- **Áreas seguras y teclado.** Mantén el contenido dentro del área segura (`env(safe-area-inset-*)`, `safeAreaInsets()`) y los campos de entrada
  por encima del teclado en pantalla (`env(keyboard-inset-height)`) ([Device and environment](./device-and-environment.md)).
- **Apariencia, tamaño de texto y movimiento.** Cada superficie funciona en claro y oscuro (`dark:`, `colorScheme()`), con el
  tamaño de texto del usuario y con movimiento reducido (`motion-reduce:`, `reduceMotion()`).
- **De derecha a izquierda.** La dirección del diseño sigue a la configuración regional, y el estilo `direction` la establece para una vista y su
  subárbol; las propiedades de inicio y fin se reflejan ([Right to left](./layout.md#right-to-left)).
- **Táctil y puntero.** Los objetivos táctiles miden al menos 44 × 44 puntos; el hover y los tooltips existen solo con puntero.

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

## Guía para interfaces generadas por IA

Una IA que modifique una interfaz NSH debe inspeccionar primero la funcionalidad más cercana, los componentes y los tokens de tema de la app, y
la documentación y las declaraciones de los componentes (`.nsh/types`). Debe indicar la tarea principal, el propietario del estado, la composición de componentes
y las rutas de teclado y táctiles antes de generar código. No debe inferir una API a partir de ejemplos de React, React Native
o Shadcn ni inventar una prop o un método de NSH porque el nombre parezca plausible; `nsh check` y la comprobación de clases de la compilación informan de lo que no existe.

El resultado de una IA está incompleto hasta que una persona pueda explicar por qué la jerarquía, la densidad, la elección de componentes
y los valores literales excepcionales pertenecen a este producto. Una captura de pantalla visualmente plausible no es una prueba: el comportamiento de teclado y táctil,
el foco, el contenido dinámico, los temas, el redimensionado, el tamaño de texto y los estados de error forman parte del diseño.

<a id="accessibility-checklist"></a>

## Lista de comprobación de accesibilidad

Antes de dar una pantalla por completa, verifica que:

- todas las acciones son accesibles y utilizables con teclado, tacto y lector de pantalla;
- el orden del foco sigue el orden visual y el de la tarea;
- el foco permanece visible y se restaura tras las superposiciones;
- los controles tienen nombres accesibles; los controles solo con icono usan tooltips cuando su significado, alcance o atajo necesita
  explicación;
- el texto y los límites significativos tienen contraste suficiente;
- el estado no se comunica solo mediante el color;
- los estados deshabilitado y de solo lectura se distinguen;
- las etiquetas, los errores y las descripciones permanecen cerca de sus controles;
- el contenido sigue siendo utilizable con traducciones más largas, de derecha a izquierda y con texto más grande;
- los objetivos táctiles miden al menos 44 × 44 puntos, y los objetivos de puntero tienen un tamaño cómodo incluso en un diseño denso.

<a id="design-review-checklist"></a>

## Lista de comprobación de la revisión de diseño

Una revisión no hace un inventario de componentes; juzga si la interfaz tomó las decisiones correctas. Pregunta, por orden:

1. **¿Está clara la tarea?** ¿Puede un usuario nuevo reconocer el propósito, la acción principal y el siguiente paso sin aprender,
   adivinar ni experimentar?
2. **¿Cada acción cumple su promesa?** ¿Describen la etiqueta, el control, el estado, el alcance, la respuesta y el resultado un único
   resultado coherente?
3. **¿Es la jerarquía decisiva y contenida?** ¿Recibe la funcionalidad principal el espacio que merece mientras el color intenso,
   la negrita, las insignias, las alertas y los botones primarios siguen siendo escasos?
4. **¿Podría la interfaz hacer menos, pero mejor?** ¿Se puede eliminar, combinar o aplazar un punto de entrada, una opción o un estado
   sin debilitar la tarea completa?
5. **¿Es exacta la estructura?** ¿Comparten los elementos pares los mismos ejes de alineación, los espacios iguales siguen siendo iguales hasta el píxel renderizado y
   las barras de desplazamiento se sitúan en el borde de su región de desplazamiento real?
6. **¿Sigue el sistema de componentes?** ¿Conservan los controles estándar su geometría, estados, comportamiento de teclado y
   modelo de cierre, con la apariencia proporcionada por los tokens de tema y de escala?
7. **¿Sigue siendo utilizable en todos los estados y restricciones?** Verifica el comportamiento de teclado, táctil y de foco,
   los estados vacío, de carga, de error y de permisos, las traducciones más largas, el texto más grande, de derecha a izquierda, ambas apariencias,
   el tamaño mínimo de ventana y el movimiento reducido.
8. **¿Se ha probado en plataformas reales?** Completa la tarea con componentes reales, texto real y contenido representativo
   en cada plataforma en la que se publique (`nsh run --target …`, `nsh test --target …`), no solo con una captura de pantalla ideal.
