# COMPOSITION_RULES

Reglas para montar una página con varios componentes de esta biblioteca. Están redactadas desde la
evidencia medida, no desde el gusto.

**Cómo leer cada regla.** Toda regla lleva su evidencia al lado y una marca:

- **[derivada]** — sale de un número medido en este repositorio. Si el número cambia, la regla
  cambia. La evidencia está en `generated/motion/composition-evidence.json` y en `AUDIT.md`.
- **[asumida]** — es un juicio de ingeniería sobre una frontera que los datos no fijan solos
  (normalmente un presupuesto). Lleva explícito **de dónde sale el umbral** y qué lo movería.

Las reglas las aplica `scripts/check-composition.mjs`, que es lo que ejecutan las aserciones C1/C2.
Una violación de una regla `hard` invalida la composición; una `soft` es un aviso.

---

## Vocabulario

| término | significado |
|---|---|
| **capacidad exclusiva** | recurso del documento del que solo puede haber un titular (el scroll, la altura, el primer canvas…). Medidas en `motion.capabilities` |
| **pasillo** (`viewport_heights`) | pantallas de scroll que un componente fabrica para sí mismo |
| **autoridad del tiempo** | qué fija la duración: `scroll-distance`, `input-continuous` o `authored` (`DECISIONS.md` D9) |

---

## R1 · Un solo dueño del scroll por página · **hard** · [derivada]

**Evidencia:** 93 de 219 componentes (42 %) tienen la capacidad `page-scroll-owner` — 83 instancian
su propio `new Lenis()` y 10 capturan la rueda con `preventDefault`. `AUDIT.md §6.1-G` verificó
contra `node_modules/lenis/dist/lenis.mjs` que **todas** apuntan a `window` (nadie pasa `wrapper`),
así que dos instancias son dos consumidores de rueda, dos drivers de rAF y dos escritores de
`window.scrollTo` por frame.

**Regla:** como máximo **1** titular de `page-scroll-owner`. Si la composición necesita varios
componentes que lo son, se elige uno como dueño y el resto se integra **sin** su Lenis (todos menos
3 de los 83 usan configuración por defecto idéntica, así que compartir una sola instancia es
gratis: `AUDIT.md §4.2`).

**Excepción medida:** `seventeenagency-scroll-animation` usa `infinite: true` y **no puede
compartir** — envuelve el documento entero y desarma la rueda de las demás instancias. Es
incompatible con cualquier otra cosa; trátalo como página completa.

## R2 · Un solo velo de entrada · **hard** · [derivada]

**Evidencia:** 22 componentes tienen la capacidad `entry-veil`. Los 23 `preloader` del catálogo son
`LOAD-ONESHOT`/`entry-veil` (100 % de la categoría, `AUDIT.md §5.4`). Un velo ocupa el documento
desde t=0 con una capa fija a pantalla completa.

**Regla:** como máximo **1** titular de `entry-veil` por página.

## R3 · El preloader precede al hero y el hero no puede depender de la carga · **hard** · [derivada]

**Evidencia:** `entry-veil` es *"timeline autónoma que arranca en la carga; nada de lo que hace el
usuario llega al render"*. `AUDIT.md §6.1-F` midió que **128 de 219 componentes se enganchan a
`DOMContentLoaded` sin comprobar `readyState`**, y que **31 componentes** ponen un estado inicial
oculto sobre selectores que pueden pertenecer a otro componente (`L5` de la sonda de ciclo de vida).

**Regla:** si hay preloader, el hero y todo lo demás debe inicializarse **después** de que el velo
termine, y ningún otro componente puede depender de `DOMContentLoaded` para su estado inicial. El
contrato de montaje (`get_integration_contract`) emite el orden: `preloader → onComplete → resto`.

**Consecuencia práctica:** un hero `entry-veil` + un preloader `entry-veil` es la violación más
frecuente y la más fácil de cometer, porque ambos "son la primera pantalla".

## R4 · Máximo 1 efecto WebGL de nivel hero · **hard** · [derivada + umbral asumido]

**Evidencia medida:** 32 componentes usan WebGL; **16 de ellos ocupan el viewport entero**
(canvas `position: fixed` a pantalla completa) y 4 corren solvers ping-pong con
`WebGLRenderTarget`. `AUDIT.md §6.1-H` estableció que **ninguno de los 32 limita su bucle de
render** (0/32 con gating por viewport), que **los contextos nunca se liberan** y que no hay manejo
de `webglcontextlost` en ningún sitio. `three` pesa **147,6 KB gzip** — el chunk más grande del
repositorio con diferencia.

**Regla:** **1** componente WebGL full-viewport por página. Un segundo WebGL solo se admite si es
un widget acotado (no full-viewport) **y** la suma de assets no rompe R7.

**[asumida]** El límite de 1 es un juicio: el navegador admite más contextos (Chromium ~16 antes de
empezar a descartarlos). El umbral es 1 porque **ninguno pausa su bucle**: dos heroes WebGL
significan dos rAF a pleno gas simultáneamente, uno de ellos siempre fuera de pantalla. Si algún
día se les añade gating por `IntersectionObserver`, esta regla sube a 2-3.

## R5 · Máximo 3 secciones pinned con scrub, y ≤2 400vh de pasillo total · **hard** · [derivada + umbral asumido]

**Evidencia medida:** 48 componentes hacen pin. De los que declaran pasillo:
**mediana 600vh, p75 800vh, máximo 1 500vh**. La suma de todos sería **28 075vh** (280 pantallas).
`AUDIT.md §6.1-G` midió además que **solo 6 de 77** componentes con ScrollTrigger llaman alguna vez
a `ScrollTrigger.refresh()`, que las distancias de pin se hornean al crearse y que solo 2 usan
`invalidateOnRefresh`.

**Regla:** máximo **3** secciones `pinned` con `scrub`, y la suma de `viewport_heights` de **todo
lo que declare pasillo** no puede pasar de **2 400vh** (24 pantallas de scroll).

**Corrección de C3 [derivada]:** "todo lo que declare pasillo" no es lo mismo que "los pins".
**26 de 219 componentes declaran `viewport_heights` sin estar pinneados**: su pasillo es un
`html,body { height: Nvh }` y ocupa documento igual. Sumar solo los pins daba **1 500vh** en la
composición del brief de portfolio cuando el pasillo real era **2 500vh** — por encima del
presupuesto, sin detectar. `budget.pin_vh` sigue reportando solo los pins; el presupuesto se mide
contra `budget.corridor_vh`.

**Reparable.** Recortar el pasillo es seguro cuando el efecto lee un progreso normalizado (0→1
sobre su rango): acortar cambia la velocidad, no el recorrido. C3 bajó `3d-slider-threejs` de
1 000vh a 700vh y sus 7 slides siguieron recorriéndose enteras. **No** es seguro si el componente
cuenta píxeles absolutos.

**[asumida]** El 2 400 sale de 3 × p75 (800vh). No hay un número "correcto": es el punto donde una
página deja de leerse como una página y pasa a ser un carrete. Súbelo si el brief pide
explícitamente una narrativa larga; bájalo a 1 200 para landings comerciales.

**Corolario, corregido por C3 [derivada]:** los 17 titulares de `document-height` fijan
`html/body {height: Nvh}`. La versión anterior de esta regla decía "máximo 1". **Es falso**: uno
solo ya recorta el documento entero de la página compuesta a la altura que ese componente declare.
El umbral correcto en una página con más de un componente es **0** — hay que quitarlo de todos y
dejar que la altura la genere el `pinSpacing` de ScrollTrigger. Reparable en el montaje.

## R6 · Categorías que no se repiten · **hard** · [derivada]

**Evidencia:** medido por capacidad, no por gusto (`composition-evidence.json → category_capability`).

| categoría | por qué no se repite | evidencia |
|---|---|---|
| `preloader` | 23/23 son `entry-veil` | R2 |
| `transition` | 11/11 son `CLICK-CURTAIN` y secuestran la navegación; `AUDIT.md §6.1-B` midió 9 componentes que interceptan clics de enlace, uno de ellos **todos** los `<a>` del documento | hard |
| `menu` | 15/16 son `CLICK-CURTAIN` con capa fija a pantalla completa; dos menús compiten por el mismo z-top y por el mismo gesto | hard |
| `footer` | por definición del documento hay uno | hard |

**Se pueden repetir:** `scroll`, `gallery`, `slider`, `hover`, `cards`, `text`, `interactive`
— siempre que respeten R1, R4 y R5. `hover` es el único **sin ningún contrato**: `pointer-latch` es
puramente local al elemento (`DECISIONS.md` D8), así que admite cantidad arbitraria.

## R7 · Presupuesto de página: 450 KB gzip de JS y 6 MB de assets · **soft** · [derivada + umbral asumido]

**Evidencia medida** (chunks reales de `dist/assets`, gzip nivel 6, el mismo que sirve nginx):

| librería | gzip | notas |
|---|---:|---|
| three | **147,6 KB** | el mayor con diferencia |
| lottie | 77,0 KB | |
| matter-js | 26,1 KB | |
| ScrollTrigger | 17,7 KB | |
| GLTFLoader | 13,2 KB | se suma a three |
| Draggable | 11,6 KB | |
| Flip | 7,6 KB | |
| lenis | 5,2 KB | |
| gsap core | 4,4 KB | compartido por todos |
| OrbitControls | 4,4 KB | |
| SplitText / CustomEase | 3,3 KB c/u | |

Assets por componente: **mediana 0,85 MB, p90 3,27 MB, máximo 107,6 MB**. `AUDIT.md §6.1-H` midió
que una página Monte-Carlo de 6 componentes tiene **mediana 7,0 MB** de assets binarios, y que
**no hay ninguna disciplina de carga sobre 834 imágenes** (sin `lazy`, sin dimensiones, sin
`decoding`).

**Regla:** suma de librerías únicas ≤ **450 KB gzip**; suma de assets ≤ **6 MB**. Se avisa, no se
bloquea.

**[asumida]** 450 KB permite `three + lottie + ScrollTrigger + gsap + lenis` (≈252 KB) con margen;
excluye de facto combinar three **y** matter **y** lottie. 6 MB está por debajo de la mediana
medida de 7,0 MB a propósito: la mediana actual ya es demasiado.

## R8 · Un solo titular de cada capacidad restante · **hard** · [derivada]

| capacidad | titulares | mecanismo |
|---|---:|---|
| capacidad | titulares | mecanismo | umbral |
|---|---:|---|---|
| `page-scroll-lock` | 31 | `html/body { overflow: hidden }` — mata el scroll de toda la página | **0** si hay más de un componente |
| `first-canvas` | 5 | `document.querySelector("canvas")` reclama el primero del documento | **0** si hay más de un canvas en la página |
| `window-onload` | 4 | `window.onload =` (asignación): solo el último inicializa | 1 |

**Corrección de C3 [derivada].** "Un solo titular" es el umbral correcto solo para las capacidades
que se ejercen **asignando** algo: dos `window.onload` chocan, uno no. Las que se ejercen
**declarando CSS global** o **reclamando un singleton del documento** rompen la página con un único
titular en cuanto hay alguien más al lado:

- `kpverse-menu` es el único `page-scroll-lock` de la composición del brief de portfolio. La regla
  anterior daba la página por válida y **el documento no scrolleaba**: ni el pasillo del héroe ni
  el pin de la galería se movían.
- `3d-slider-threejs` es el único `first-canvas`, pero `3d-parallax-footer` inserta su canvas con
  `appendChild`. Quién se lleva el renderer lo decide el orden de montaje.

Las tres son reparables: acotar el `overflow`, acotar el `querySelector`, usar `addEventListener`.

## R9 · Ningún par con conflicto específico `ease-name` sin resolver · **hard** · [derivada]

**Evidencia:** 402 aristas dirigidas. La causa concreta: **22 componentes registran `hop` con 13
curvas distintas** y `hop2` con 2 (`AUDIT.md §6.1-C`, verificado contra
`node_modules/gsap/CustomEase.js:282` → `registerEase` es una asignación sobre un mapa global,
último en escribir gana, sin aviso).

**Regla:** si dos componentes de la composición registran el mismo nombre con curva distinta, la
página **debe** adoptar un motion system y usar su `custom_ease_defs` como definición única
(`DECISIONS.md` D10). Sin eso, la composición es inválida.

## R10 · Ningún componente `kills-all` junto a otro consumidor de scroll · **hard** · [derivada]

**Evidencia:** 291 aristas. Tres componentes ejecutan `ScrollTrigger.getAll().forEach(t => t.kill())`
—`kaitonote-3d-gallery-showcase-scroll-animation`, `madeinuxstudio-page-transition`,
`nakedcityfilms-scroll-animation`— y **dos lo hacen también en cada `resize`**.

**Regla:** ninguno de esos 3 puede convivir con ningún componente `pinned` o de `trigger: scroll`.
No es negociable ni parcheable desde fuera: hay que editar el componente.

## R11 · Coherencia de motion system · **soft** · [derivada]

**Evidencia:** la compatibilidad la fija la autoridad del tiempo (`DECISIONS.md` D9): 98 componentes
comparten los 5 sistemas `authored`, 72 los 2 de `scroll-distance`, 49 quedan en
`continuous-follow`. Ningún componente es compatible con los 8.

**Regla:** todos los componentes de una página deberían declarar el mismo motion system como
compatible. Cuando no sea posible (una página casi siempre mezcla autoridades), el sistema elegido
gobierna los componentes que lo admiten y el resto conserva su timing nativo. Se avisa.

## R12 · Los 72 `solo_on_page` avisan, no bloquean · **soft** · [derivada]

**Evidencia:** 72 componentes tienen `solo_on_page: true`, con motivos medidos
(`html/body overflow:hidden` 31, altura de documento fija 17, `preventDefault` en wheel 10,
`window.onload` 4, reclamar el primer canvas 5, matar todos los ScrollTrigger 3).

**Regla:** un `solo_on_page` en una composición de varios es un aviso con su motivo concreto. La
mayoría de los motivos son **reparables desde fuera** (acotar el CSS, quitar el `overflow:hidden`);
los de R10 no.

---

## R13 · Una sola barra fija por página · **hard** · [derivada]

**Evidencia medida:** **44 de 219** componentes declaran su propio cromo fijo — una regla
`nav`, `header`, `footer`, `.nav`, `.header` o `.navbar` con `position: fixed` anclada a `top: 0`
o `bottom: 0`. **Tres de los cinco** componentes de la composición del brief de portfolio traían el
suyo (`3d-slider-threejs` con `nav` *y* `footer`, `eseagency-scroll-carousel-javascript`,
`kpverse-menu`). Apilados se solapan en la misma esquina.

**Regla:** una sola barra fija ejerce de cromo de la página. En las demás, la barra pasa a
`position: absolute` dentro del envoltorio de su sección, para que se vaya con ella al terminar su
pasillo en vez de quedarse encima de todo el documento. **Reparable en el montaje.**

**Corolario [asumida]:** la barra que se conserva viajará sobre los fondos de todas las secciones,
así que su contraste deja de ser asunto del componente que la trae. En C3 el `nav` de
`kpverse-menu` era oscuro sobre claro y quedaba invisible sobre el héroe casi negro; hubo que
invertirlo a mano. **Ninguna regla de este documento cubre eso** — ver el punto 4 de la sección
siguiente.

## R14 · Una sola capa fija a pantalla completa, y ninguna fuera del velo · **hard** · [derivada]

**Evidencia medida:** **50 de 219** componentes declaran algún `position: fixed`. De ellos, **46**
declaran cubrir el viewport (`inset:0`, bordes opuestos, o `100vw`+`100vh`) y **4** lo declaran sin
dimensionar — lo que ocupen lo decide su contenido.

R13 solo mira barras (`nav`, `header`, `footer`). No basta. En la **FASE 1 del brief editorial**,
`.model` —el contenedor del canvas WebGL del héroe— era `position: fixed` sin dimensionar, con un
canvas hijo de `innerWidth × innerHeight` dentro: se quedó tapando las **21 pantallas** de la página
y ninguna regla lo vio.

**Regla:** un elemento fijo que cubre el viewport es cromo, se llame como se llame. Solo el velo de
entrada puede serlo legítimamente. **Reparable en el montaje.**

**La reparación es `sticky`, no `absolute`.** `position: sticky; top: 0; height: 100vh` más un
margen negativo que lo saque del flujo: queda clavado al viewport mientras su sección esté en
pantalla y se va con ella. `position: absolute` lo clava a un extremo de la sección y deja de
seguir al viewport, que es justo lo que el efecto hacía. En la FASE 2 se probaron las dos: con
`absolute`, el footer de `lukebaffait-animated-footer` —que está a `z-index: 0` para que las
secciones opacas le pasen por encima— se plantó sobre su propio relleno.

**Los `fixed` sin dimensionar no se pueden resolver leyendo el CSS.** Se marcan como aviso y los
zanja la aserción en runtime de `scripts/verify-composition.mjs`, que mide qué cubre de verdad.
Esa aserción ignora las capas **inertes** (fondo transparente y `pointer-events: none`): son anclas
de posicionamiento, no superposiciones.

## R15 · El CSS de cada componente se acota antes de pegarlo · **hard** · [derivada]

Esto estaba en «lo que no cubrimos». Ya no: ahora está medido y tiene herramienta y test.

**Evidencia medida:** `AUDIT.md §6.2` — **0 de 219** usan `@layer`, `@scope` o `contain`. La
**FASE 1 del brief editorial** puso número al daño: pegadas las cuatro hojas en crudo,
**78 de 203 propiedades computadas (38 %)** cambian respecto del mismo componente renderizado solo.

| qué deriva | cuántas |
|---|---:|
| fondo efectivo | 24 |
| tipografía | 19 |
| color de texto | 15 |
| `text-transform` | 9 |
| tamaño de fuente | 8 |

Un solo `* { font-family: … }` fija la tipografía de la página entera. Los cuatro `:root`
colapsan en uno y **el último gana**: `--ink` estaba declarado por los cuatro con cuatro valores
distintos. Un `section { height: 100vh }` de un componente redimensionó las 13 secciones.

**Regla:** pasar cada `styles.css` por `node scripts/scope-css.mjs <slug> <.raíz> <destino>` antes
de pegarlo, y re-alojar a mano lo que el script retire de `html`/`body`. **Reparable en el montaje.**

**Test:** `node scripts/verify-theming.mjs examples/<dir>` abre cada componente aislado y la
composición, y compara propiedad a propiedad. La deriva debe ser **0** salvo la que pidan otras
reparaciones. En la FASE 2 del editorial bajó de **78 a 2**, y las dos son explicables: el `.sticky`
de la narrativa cambia de `position` porque en la demo aislada está pinneado a scroll 0, y el
`footer` cambia porque lo pide la reparación de R14.

## R16 · Todo bucle de pintado perpetuo se gatea, no solo los de WebGL · **hard** · [derivada]

**Evidencia medida:** **41 de 219** componentes tienen una función que se re-agenda sola con
`requestAnimationFrame` y además pinta. **27 son WebGL; 14 no** — pintan sobre canvas 2D o escriben
`style.transform` directamente. La versión anterior de esta regla solo miraba los WebGL, así que
`lukebaffait-animated-footer` pasaba con **dos** bucles perpetuos (el ASCII de cada mano y el
parallax) corriendo a 60 fps durante las 17 pantallas en las que el footer no se ve.

**Regla:** cada bucle va dentro de un `IntersectionObserver` que cancele su `rAF` al salir del
viewport. `renderer.dispose()` al desmontar, si es WebGL.

**Lo que NO se gatea:** un `rAF` que solo alimenta a Lenis. Pararlo congela el scroll de toda la
página. Por eso se detecta el bucle que **pinta**, no el que existe: `3d-slider-threejs` tiene `rAF`
y no debe gatearse. El contrato emite un paso `webgl-nogate` que los nombra, porque el error por
defecto es gatearlos.

## R17 · Cada raíz de sección es bloque contenedor · **hard** · [derivada]

**Evidencia medida:** **207 de 219** componentes usan `position: absolute` — **799 reglas** en
total. Es, con diferencia, la regla que más código toca de todo este documento.

Un `position: absolute` se resuelve contra el ancestro posicionado más cercano. En la demo de un
componente ese ancestro **normalmente no existe**, así que resuelve contra el bloque contenedor
inicial — que ahí es del tamaño del viewport y está anclado al origen del documento, es decir,
justo donde está el componente. Por eso se ve bien. Al componer, ese origen queda a 12 000px de la
sección y el elemento se va a la cabecera de la página.

**Regla:** `position: relative` en la raíz de cada sección **y en cada `<section>` que haya dentro**.
**Reparable en el montaje.**

**La raíz sola no basta.** Cada componente escribió su CSS creyendo que un `<section>` suyo *era*
la página: el `.hand-container` de `samuelsiebler-js` es `top: 50%` y espera el 50 % de una
pantalla, no el 50 % de los 9 000px que ocupa su raíz con el pin. En la FASE 2 se probó primero
solo con la raíz y el retrato apareció a 4 500px de su sitio.

## R18 · Nada crece en el flujo por encima de un pin · **soft** · [derivada + aproximación]

**Evidencia medida:** **34 de 239** componentes animan una propiedad que cambia la caja —`height` en
30 de ellos, `fontSize` en cuatro—. **48** pinnean. La intersección de las dos listas es donde vive
este defecto.

ScrollTrigger calcula la posición de un pin en el `refresh()` y la deja horneada. Si algo POR ENCIMA
de ese pin cambia la altura del documento después, el pin sigue creyendo que empieza donde empezaba
y arranca antes de tiempo: la sección pinneada se pega al viewport mientras la anterior todavía está
en pantalla y se dibuja **encima** de ella.

**Caso medido (ASCUA, sección 06 contra sección 09).** `qindustrial-scroll` lleva cada una de sus
cinco filas de 150 a 450 px de alto, en el flujo normal. Cinco filas × 300 px = **el documento crece
1 500 px mientras el visitante baja**. Cuatro secciones más abajo, el cierre pinneado arrancaba esos
1 500 px antes de tiempo y se pintaba sobre la sección del equipo. En su página de origen la mecánica
es intachable, porque debajo de ella no hay nada pinneado: **el defecto no está en el componente,
está en la composición**, que es de lo que va este documento entero.

**Lo que costó verlo.** No daba ningún error, y buscar la intersección de los rectángulos de las dos
secciones devolvía cero: cada sección estaba exactamente donde decía estar. Lo que estaba mal era el
punto de arranque del pin. Se encontró cuando `scripts/qc-layout.mjs` midió `scrollHeight` a lo largo
de todo el recorrido y salió que crecía 1 500 px entre y=16 650 y y=19 350.

**Regla:** si una mecánica que anima una propiedad de layout convive con una pinneada, comprobar si
lo que se anima está en el flujo. Si lo está, hay dos salidas: reservarle su tamaño final para que
crecer no mueva nada, o llamar a `ScrollTrigger.refresh()` **una vez por elemento, cuando termina de
crecer** —en los `onEnter/onLeave/onEnterBack/onLeaveBack` de su propio trigger, nunca en cada tick
del scrub—. **Reparable en el montaje.**

**Avisa y no bloquea, a propósito.** La medida detecta que se anima una propiedad de layout, no si el
elemento animado está en el flujo: un menú desplegable en `position:absolute` que anima su altura
sale marcado y es completamente inofensivo. Convertirlo en regla dura marcaría como inválidas
composiciones correctas.

## Lo que estas reglas NO cubren

Honestidad sobre los límites, para que nadie las lea como una garantía:

1. **Colisiones de CSS.** `AUDIT.md §6.1-D` midió 142 componentes con `img {}` global sin ámbito,
   171 con `font-family` global, `--ink` en 164 con **polaridad invertida en 34**, y `.hero` en 96.
   Ninguna regla de aquí lo evita, porque **no hay frontera de componente**: 0/219 usan `@layer`,
   `@scope` o `contain`. Dos componentes cualesquiera se re-tematizan mutuamente y el orden de
   pegado decide. → **Ya está cubierto: es R15**, con herramienta (`scope-css.mjs`) y test
   (`verify-theming.mjs`). Lo que sigue sin cubrir es **decidir dónde re-alojar** lo que el script
   retira de `html`/`body`: eso sigue siendo manual.
2. **Assets rotos.** 194 de 219 dan 404 fuera de este dominio (`AUDIT.md §6.1-I`).
3. **Montaje en framework.** 128 de 219 están muertos al llegar en React/Next.
4. **Qué parte del marcado de un componente ES el componente.** `plan_page` devuelve slugs. Ni el
   registro ni el contrato marcan qué nodos son la pieza y cuáles eran relleno de su demo. Montando
   el brief editorial al pie de la letra, `lukebaffait-animated-footer` aportó **3 secciones de
   relleno (2 700px)** con su propia copia —"We design with type / We build with code"— que no
   tienen nada que ver con un footer. No hay forma automática de saberlo: haría falta anotar los
   219 componentes con su raíz real.
5. **Dirección de arte entre secciones.** Medido, no resuelto — ver la sección siguiente.
6. **Coste de arranque.** R3 exige inicializar todo en el `onComplete` del velo. Tomado al pie de
   la letra, un velo de 8s significa que los assets **empiezan** a cargar en t=8s: C3 midió
   **estado listo a 9.4s** con solo 2,31MB. El contrato lo advierte (paso `entry-cost`) y propone
   montar detrás del velo opaco, pero **esa variante no está verificada**.
7. **Que la página se vea bien.** Estas reglas garantizan que *no colisione*, no que sea buena.

## El tamaño de la capa que falta: dirección de arte

Medido sobre el brief editorial ya reparado (FASE 2, deriva estructural 2/203), para saber qué
queda cuando la composición es técnicamente correcta. `verify-theming.mjs` lo emite aparte y **no
falla por ello**: es un inventario, no una regla.

**1 · Variables con el mismo nombre y distinto valor: 3.**

| variable | la declaran | valores |
|---|---:|---|
| `--ink` | 4 de 4 | `#12100e` `#0f0f12` `#191917` `#161615` |
| `--paper` | 3 de 4 | `#f3efe6` `#edeae2` `#f3f0ea` |
| `--muted` | 3 de 4 | `#6b6b74` `#8a857a` `#6b6763` |

R15 las aísla, así que ya no se pisan. Pero la página acaba con **cuatro negros distintos y tres
blancos distintos** que nadie ha decidido que convivan. Ninguna regla puede resolverlo: unificar
`--ink` cambiaría la identidad de cada pieza.

**2 · Contraste por debajo de 4.5:1 — 8 sondas de 29.** El dato importante es que **las ocho valen
exactamente lo mismo aisladas que compuestas**: son decisiones de los propios componentes, no daño
de la composición. Antes de R15 eran 12, y cuatro de ellas sí eran daño (un texto a 1:1 sobre su
propio color). Componer, con las reglas puestas, **no introduce ni un problema de contraste nuevo**.

**3 · Cambios de polaridad de fondo entre bandas contiguas: 4 de 14.** Claro→oscuro o al revés, sin
transición. **Tres son internos a un solo componente** (su propio ritmo editorial). **Uno es una
costura entre componentes**: el footer claro de la sección de texto contra el `#161615` de la
sección de footer. Ese es el número que importa: **1 costura real por cada 3 saltos propios**.

**4 · El cromo superviviente de R13 viaja sin contrato.** La barra que se conserva cruza todas las
secciones. En el brief editorial es `oak atelier / COMMISSION A PIECE` en hueso sobre el héroe casi
negro; al llegar al footer se solapa con los enlaces del propio footer. En C3 el `nav` del menú era
oscuro sobre claro y quedaba invisible sobre el héroe. **Ninguna regla mira esto**, y es sistemático:
R13 fuerza que haya cromo persistente y nadie comprueba que se lea sobre lo que va a cruzar.

**Tamaño de la capa, en una línea:** por página compuesta, del orden de **3 colisiones de variable,
1 costura de polaridad entre componentes y 1 barra de cromo sin contrato de contraste**. Los
problemas de contraste heredados de cada componente (8 aquí) no son de esta capa.
