// Arquitectura de información: lo que plan_page debería haber devuelto siempre.
//
// POR QUÉ EXISTE ESTE ARCHIVO
//
// El plan_page anterior tenía cinco huecos fijos (entry, hero, narrative, menu, footer) y elegía un
// componente por hueco con un argmax. Dos consecuencias medidas:
//
//   1. El techo de cualquier página eran cinco secciones. Las dos páginas que hicieron falta para
//      demostrar el problema tienen trece y catorce.
//   2. Para "agencia de software a medida, casos B2B" devolvía los MISMOS cinco slugs que para
//      "estudio de arquitectura boutique", y para el brief en inglés metía el componente `404` en
//      el hueco narrativo. El brief casi no influía.
//
// La causa no es el argmax: es el orden. Arrancar de las mecánicas de animación y deducir la página
// desde ahí sólo puede producir una página tan rica como la lista de componentes. Lo que este módulo
// devuelve es la lista de SECCIONES, con su papel y su cometido, y ni un solo componente. Las
// mecánicas se piden después, por rol, con suggest_mechanics.
//
// Ver examples/grieta/README.md y examples/relevo-agencia/README.md para el trabajo de campo.

// ── vocabulario de roles ─────────────────────────────────────────────────────
//
// `catalogo` es lo que habría que pedirle al catálogo para cubrir este rol. `null` significa que se
// miró y NO HAY: ni categoría ni useCase entre los 219 componentes sirve. Eso no es una carencia
// del buscador, es una carencia del catálogo, y decirlo en voz alta es el punto.
// mcp/lib/smoke.mjs verifica que los huecos siguen siendo huecos: si alguien añade un componente de
// acordeón o de contador y le pone su faceta, el test falla y avisa de que hay que actualizar esto.

export const ROLES = {
  entry: {
    label: "velo de entrada",
    catalogo: { categories: ["preloader"], useCases: ["preloader"] },
    movimiento: "optional",
    razon_movimiento:
      "Sólo se lo gana si lo que muestra es del sujeto y no un logo girando. Si no tienes qué " +
      "dibujar ahí, no pongas velo.",
  },
  chrome: {
    label: "navegación",
    catalogo: { categories: ["menu"], useCases: ["navigation"] },
    movimiento: "optional",
  },
  hero: {
    label: "la tesis, en la primera pantalla",
    catalogo: { categories: ["3d-webgl", "scroll", "text", "slider"], useCases: ["hero"] },
    movimiento: "earned",
    razon_movimiento: "Es donde el movimiento más rinde y donde el visitante decide si sigue.",
  },
  proof: {
    label: "prueba social: marcas, cifras rápidas",
    catalogo: { categories: ["scroll"], useCases: ["marquee"] },
    movimiento: "optional",
    razon_movimiento:
      "Una marquesina de clientes es un clásico que funciona y el catálogo la tiene resuelta. " +
      "Si la lista es corta y hay que LEERLA entera, déjala quieta; si es larga y sirve de " +
      "reconocimiento, que corra.",
  },
  thesis: {
    label: "la postura, en dos a cuatro puntos",
    catalogo: { categories: ["text", "scroll"], useCases: ["text-reveal"] },
    movimiento: "optional",
  },
  feature: {
    label: "UN objeto destacado, con su ficha completa",
    catalogo: { categories: ["cards", "scroll", "gallery"], useCases: ["product-showcase"] },
    movimiento: "optional",
  },
  collection: {
    label: "N objetos comparables entre sí",
    catalogo: { categories: ["cards", "gallery", "slider"], useCases: ["card-deck", "gallery", "product-showcase"] },
    movimiento: "optional",
  },
  process: {
    label: "una secuencia con orden real",
    catalogo: { categories: ["scroll", "cards"], useCases: ["scroll-story"] },
    movimiento: "optional",
    razon_movimiento:
      "Es el único sitio donde numerar es información y no decoración: si el orden no importa, " +
      "esta sección no es un proceso.",
  },
  signature: {
    label: "la pieza propia: lo que sólo esta marca puede enseñar",
    catalogo: { categories: ["scroll", "3d-webgl"], useCases: ["scroll-story", "background"] },
    movimiento: "earned",
    razon_movimiento: "Si algo merece un momento orquestado, es esto. Gasta aquí la audacia.",
  },
  context: {
    label: "de dónde viene: origen, taller, historia",
    catalogo: { categories: ["gallery", "scroll"], useCases: ["image-reveal", "gallery"] },
    movimiento: "optional",
  },
  explainer: {
    label: "cómo se usa: lo práctico",
    catalogo: { categories: ["text", "scroll"], useCases: ["text-reveal"] },
    movimiento: "optional",
  },
  people: {
    label: "las personas",
    catalogo: { categories: ["hover", "cards", "gallery"], useCases: ["team-section", "hover-interaction"] },
    movimiento: "optional",
  },
  cta: {
    label: "el cierre: qué quieres que haga",
    catalogo: { categories: ["text", "footer"], useCases: ["cta"] },
    movimiento: "optional",
  },
  footer: {
    label: "pie",
    catalogo: { categories: ["footer"], useCases: ["footer"] },
    movimiento: "optional",
    razon_movimiento:
      "El pie animado es de los sitios donde más rinde una mecánica de catálogo: cierra la " +
      "página y nadie espera nada allí. Adopta uno de los cinco; repetirlo entre páginas no " +
      "molesta a nadie.",
  },

  // ── huecos declarados del catálogo ─────────────────────────────────────────
  data: {
    label: "cifras, gráfica o tabla",
    catalogo: null,
    movimiento: "optional",
    razon_movimiento: "La cifra puede contar hasta su valor; la tabla no se mueve.",
  },
  pricing: {
    label: "modelos de contratación",
    catalogo: null,
    movimiento: "still",
    razon_movimiento: "Se viene a comparar. Que las columnas entren escalonadas obliga a leer persiguiendo.",
  },
  testimonial: {
    label: "voces de terceros",
    // DEJÓ DE SER UN HUECO el 2026-08-02. Lo llena `anchored-headline-speech-bubbles`, escrito
    // a partir de la sección de testimonios de terryhoproducts.com observada por fotogramas.
    // El charco es estrecho a propósito: la etiqueta `testimonial` la lleva un solo componente,
    // y meter aquí `cards` o `gallery` devolvería tarjetas genéricas con aire de respuesta —
    // exactamente lo que este MCP existe para no hacer.
    catalogo: { tags: ["testimonial"] },
    movimiento: "optional",
    razon_movimiento:
      "Una cita que aparece sola se lee como una voz; tres tarjetas que entran escalonadas se " +
      "leen como una rejilla. La diferencia está en que lleguen de una en una.",
  },
  faq: {
    label: "preguntas frecuentes",
    catalogo: null,
    movimiento: "optional",
    razon_movimiento:
      "Con <details>/<summary> ya funciona sin JavaScript; el movimiento sólo le pone altura " +
      "animada. Ojo: buscar 'acordeón' devuelve accordion-frames, que es una galería horizontal " +
      "de láminas. Es el falso positivo más constante del catálogo.",
  },
  reference: {
    label: "material de consulta: tablas, fichas, especificaciones",
    catalogo: null,
    movimiento: "still",
    razon_movimiento: "Lo que se consulta no se mueve. Regla dura.",
  },
};

// ── recetas para los huecos del catálogo ─────────────────────────────────────
//
// POR QUÉ EXISTEN
//
// Decir "el catálogo no tiene esto, escríbelo desde los tokens" era correcto y era insuficiente:
// medido sobre las páginas del ejercicio, las secciones de rol hueco acababan QUIETAS. No porque se
// decidiera que no se movían, sino porque "escríbelo tú" es un final de camino y adoptar es un
// principio. Cinco roles huecos son entre tres y cinco secciones de una página de trece: dejarlas
// todas quietas es justo la sensación de que a la página le falta algo.
//
// Así que el hueco viene ahora con la receta puesta, en el vocabulario de los tokens. No es una
// animación de catálogo —no la hay— pero tampoco es un folio en blanco.

/* ─────────────────────────────────────────────────────────────────────────────
 * TRATAMIENTOS DE PÁGINA
 *
 * POR QUÉ EXISTE ESTA TABLA, Y CUÁL FUE EL AGUJERO.
 *
 * `plan_page` reparte SECCIONES y `suggest_mechanics` sugiere una mecánica para cada una. Todo
 * el modelo asume que una mecánica ocupa un hueco de la lista. Hay una familia entera que no lo
 * hace: se aplica a la página, o ENTRE secciones, y por eso era inalcanzable desde el planificador
 * por mucho que estuviera en el catálogo.
 *
 * Lo destapó `shaped-section-boundary`: la frontera con forma entre dos secciones apiladas sale
 * en 4 de 8 sitios premiados del nicho food-drink y el catálogo no tenía nada. Al escribirlo,
 * `suggest_mechanics` seguía sin ofrecerlo para ningún rol — y con razón: no es una sección, es
 * el canto entre dos. Lo mismo pasaba con el scroll suave, el cursor, el fondo continuo y las
 * transiciones de ruta, que llevaban tiempo en el catálogo sin que nada los pidiera.
 *
 * Un tratamiento NO consume un hueco de `sections` y NO cuenta para `motion_coverage`.
 * ───────────────────────────────────────────────────────────────────────────── */
export const TRATAMIENTOS = {
  "scroll-suave": {
    label: "scroll suave",
    catalogo: null, // No es un componente: es una decisión de página.
    por_defecto: true,
    cuando: "Siempre, en cualquier página que baje. No es opcional en este catálogo.",
    nota:
      "Lenis. La mitad de las mecánicas de scroll del catálogo están medidas CON él y se ven " +
      "escalonadas sin él. Una sola instancia por página: dos se pelean por el scroll y ninguna " +
      "gana. Si un componente adoptado ya instancia la suya, reutilízala en vez de crear otra.",
  },
  "frontera-de-seccion": {
    label: "el canto entre secciones apiladas",
    // NO por `category: "transition"`: esa categoría son las 12 transiciones de RUTA, que es
    // precisamente la familia de la que hay que distinguir ésta. Sólo por etiqueta.
    catalogo: { tags: ["boundary", "divider"] },
    por_defecto: false,
    cuando:
      "Cuando la página apila secciones de COLOR PLANO. Si todas las secciones comparten fondo " +
      "no hay canto que dar forma y esto no aplica.",
    nota:
      "Una forma, dos como mucho, repetida. Cinco cantos distintos es un muestrario, no " +
      "dirección de arte. Medido en 4 de 8 sitios premiados del nicho food-drink.",
  },
  "fondo-continuo": {
    label: "un fondo que recorre la página entera por detrás",
    catalogo: { useCases: ["background"] },
    por_defecto: false,
    cuando:
      "Cuando quieras que la página se lea como UNA cosa y no como una pila. Excluye " +
      "`frontera-de-seccion`: si el fondo es continuo, no hay canto.",
    nota: "Suele costar un canvas a pantalla completa. Mira el presupuesto antes de adoptarlo.",
  },
  cursor: {
    label: "cursor propio",
    catalogo: { useCases: ["cursor-effect"] },
    por_defecto: false,
    cuando: "Sólo si la página tiene zonas donde el puntero hace algo. Un cursor bonito sobre una página que no reacciona es ruido.",
    nota: "No existe en táctil. Todo lo que dependa del cursor necesita su equivalente para dedo.",
  },
  "transicion-de-ruta": {
    label: "transición entre páginas",
    catalogo: { useCases: ["page-transition"] },
    por_defecto: false,
    cuando: "SÓLO si el sitio tiene más de una página de verdad. En una landing de una sola página no aplica.",
    nota:
      "Los 12 componentes de `transition` del catálogo son casi todos de esto: clic en un enlace " +
      "y la ruta cambia detrás de un telón. No confundir con `frontera-de-seccion`.",
  },
};

export const RECETAS_SIN_CATALOGO = {
  data:
    "Cada cifra cuenta desde 0 hasta su valor al entrar en pantalla, en `duration.slow` con " +
    "`ease.primary`, y las cifras entre sí escalonan a `stagger.base`. La unidad y el pie NO " +
    "cuentan: aparecen ya puestos. Si la cifra tiene una barra o un anillo, su longitud se anima " +
    "con el mismo tiempo, no con otro. NUNCA con scrub: una cifra que cuenta persiguiendo el " +
    "scroll no se llega a leer. Y se anima una sola vez (`once: true`).",
  pricing:
    "Quieto al leer, que no es lo mismo que inmóvil: UNA entrada del bloque entero (opacidad y " +
    "12 px) en `duration.base`, y ahí se acaba. Las columnas no entran escalonadas y las cifras no " +
    "cuentan — se viene a comparar. Lo que sí se mueve es el conmutador mensual/anual: fundido " +
    "cruzado de `duration.fast` sobre las cifras, que además demuestra que el precio cambió.",
  testimonial:
    "La cita entra por líneas enmascaradas con `stagger.tight` y `ease.primary` — es texto, y el " +
    "texto por líneas es lo que mejor se lee. El nombre y el cargo entran después, en un solo " +
    "bloque. Si hay más de dos citas, un carrusel manual con `duration.base` por transición; " +
    "nunca automático: una cita que se va sola mientras la lees es un defecto.",
  faq:
    "La altura del panel se anima sobre su `scrollHeight` MEDIDO (nunca sobre `auto`) en " +
    "`duration.base` con `ease.primary`, el signo o el galón rota en el mismo tiempo, y la regla " +
    "inferior de la fila se dibuja con `scaleX` desde el origen izquierdo. Con <details>/<summary> " +
    "de base, para que sin JavaScript siga abriéndose. Sin scrub y sin escalonado: aquí el usuario " +
    "manda el tiempo, no el scroll.",
  reference:
    "Quieto al leer. UNA entrada del bloque completo en `duration.base` y nada más: las filas de " +
    "una tabla NO entran escalonadas, porque obliga a leer persiguiendo. Lo único que se puede " +
    "permitir es el filo superior de la tabla dibujándose con `scaleX` a la vez que entra el " +
    "bloque, que es un gesto de una sola vez y no interfiere con la lectura.",
};

// ── arquetipos ──────────────────────────────────────────────────────────────
//
// Sigue habiendo detección por expresión regular, y sigue siendo tosca. La diferencia con lo
// anterior está en el modo de fallo: equivocarse de arquetipo te da una lista de secciones que
// puedes editar, no un componente `404` en el hueco narrativo. Por eso la respuesta lleva las
// alternativas y admite `archetype` explícito para pisarlo.

const S = (id, role, purpose, content, extra = {}) => ({ id, role, purpose, content, ...extra });

export const ARQUETIPOS = {
  agency: {
    re: /agencia|agency|estudio|studio|consultor|despacho/i,
    label: "agencia o estudio que vende servicios",
    sections: [
      S("cromo", "chrome", "Llevar a las cuatro cosas que importan y a la acción.", "Cinco enlaces como mucho, más un botón."),
      S("portada", "hero", "Decir a qué se dedican de forma que nadie más pueda firmarlo.", "Titular, entradilla de dos líneas, dos acciones y una cifra que sostenga la promesa."),
      S("clientes", "proof", "Que el visitante reconozca a alguien antes de leer nada.", "Seis a diez nombres. Texto, no logotipos borrosos."),
      S("cifras", "data", "Convertir la promesa en números comprobables.", "Tres o cuatro cifras con su unidad y su periodo."),
      S("servicios", "collection", "Qué se puede contratar exactamente.", "Cuatro o cinco servicios: nombre, una frase y qué entregan."),
      S("proceso", "process", "Enseñar cómo trabajan, con el calendario por delante.", "Cuatro o cinco pasos anclados a días o semanas reales."),
      S("casos", "collection", "Demostrar con trabajo hecho, no con adjetivos.", "Tres casos: cliente, problema, qué se hizo y un antes/después medido."),
      S("principios", "thesis", "Las reglas que les hacen decir que no.", "Cinco o seis reglas de una frase. Que alguna incomode."),
      S("equipo", "people", "Poner cara y oficio a quien va a hacer el trabajo.", "Nombres con su papel. Sin fotos de banco de imágenes."),
      S("contratacion", "pricing", "Cómo se empieza y cuánto cuesta.", "Dos o tres modelos con precio o rango. Un precio de verdad."),
      S("voces", "testimonial", "Que lo diga otro.", "Dos citas con nombre, cargo y empresa."),
      S("preguntas", "faq", "Contestar lo que frena la decisión.", "Cinco o seis preguntas incómodas de verdad."),
      S("cierre", "cta", "Pedir una sola cosa.", "Una acción, un correo, un plazo de respuesta."),
      S("pie", "footer", "Navegación secundaria y lo legal.", "Columnas, dirección, aviso."),
    ],
  },

  // Un sitio donde se come no es una marca de producto: no se compra de forma recurrente, se
  // RESERVA, y la reserva es la acción principal de la página, no un bloque de precios al final.
  // Con `product-brand` el brief de un restaurante caía en una sección de suscripción marcada
  // `still`, que es justo lo contrario de lo que necesita.
  restaurant: {
    // Ensanchada tras medir el fallo: «hamburguesería» no casaba y el encargo caía en `agency`.
    // Cubre ahora comida rápida de autor, cocinas por producto y el vocabulario de sala, que es
    // por donde entran la mayoría de los encargos reales de este arquetipo.
    re: /restaurante|restaurant|parrilla|asador|ahumader|taberna|bar\b|bistr[oó]|tasca|mes[oó]n|pizzer|cocina de|hamburgues|burger|smash|braser[ií]a|brasa|freidur[ií]a|marisquer[ií]a|arrocer[ií]a|cerver[ií]a|vermuter[ií]a|gastrobar|food ?truck|street ?food|cafeter[ií]a|churrer[ií]a|croissanter[ií]a|heleder[ií]a|helader[ií]a|ramen|sushi|taquer[ií]a|tacos|kebab|bocater[ií]a|men[uú] del d[ií]a|carta y (reserva|pedido)|donde se come/i,
    label: "sitio donde se come, con reserva",
    sections: [
      S("cromo", "chrome", "Llevar a la carta y a reservar.", "Cuatro enlaces y un botón de reserva."),
      S("portada", "hero", "Abrir con el fuego, no con un plato emplatado de catálogo.", "Titular con la postura, una línea de qué se hace, reservar y una lectura de la cocina."),
      S("registro", "reference", "Lo práctico, de una pasada: cuándo, dónde, cuánto se tarda.", "Horarios, dirección, teléfono y cuánto dura una comida."),
      S("tesis", "thesis", "Qué defiende esta casa sobre el fuego y la carne.", "Tres afirmaciones discutibles, con su porqué. Nada de «producto de calidad»."),
      S("carta", "collection", "Los cortes, comparables de un vistazo.", "Cinco o seis cortes: nombre, animal, peso, maduración, para cuántos y precio."),
      S("destacado", "feature", "La pieza de esta semana, con su ficha entera.", "Foto, ganadero, raza, días de maduración, corte y precio por kilo."),
      S("fuego", "signature", "Enseñar el ahumadero: lo que sólo esta casa puede enseñar.", "La curva de temperatura y horas por pieza, con la madera de cada tramo."),
      S("origenes", "context", "De qué ganadería viene cada cosa.", "Tres o cuatro ganaderos con raza, provincia y alimentación."),
      S("maduracion", "explainer", "Cómo se madura y se ahúma, con números.", "Tabla: corte, días de cámara, temperatura, madera y horas de humo."),
      S("sala", "context", "Cómo es estar ahí.", "Foto del local, aforo, mesas grandes, si hay barra y si se puede ir solo."),
      S("equipo", "people", "Quién está delante de la parrilla.", "Dos o tres personas con su oficio. Sin fotos de banco de imágenes."),
      S("reservar", "cta", "Reservar, que es a lo que se viene.", "Formulario o teléfono, con la política de grupos y cancelación."),
      S("preguntas", "faq", "Lo que preguntan por teléfono.", "Cinco o seis: niños, alérgenos, punto de la carne, aparcamiento, grupos."),
      S("pie", "footer", "Navegación, redes y lo legal.", "Columnas, dirección, aviso."),
    ],
  },

  "product-brand": {
    re: /marca|producto f[ií]sico|tienda|caf[eé]|vino|cerveza|tostad|panader|cer[aá]mic|mueble|ropa|cosm[eé]tic|perfum|hotel/i,
    label: "marca con un producto físico que se vende",
    sections: [
      S("cromo", "chrome", "Llevar al producto y a comprar.", "Cinco enlaces y un botón de compra."),
      S("portada", "hero", "Abrir con lo más característico del oficio, no con un bodegón genérico.", "Titular con la tesis, entradilla, dos acciones y una lectura de datos reales del producto."),
      S("registro", "reference", "Las condiciones prácticas, de una pasada.", "Cuatro hechos: cuándo se produce, cuándo se envía, de dónde viene, qué garantiza."),
      S("tesis", "thesis", "Por qué este producto es distinto, en términos del oficio.", "Tres afirmaciones con su explicación. Que se puedan discutir."),
      S("destacado", "feature", "Un producto concreto con su ficha entera.", "Foto, procedencia, ficha técnica, precio y acción."),
      S("coleccion", "collection", "Lo que hay, comparable de un vistazo.", "Cuatro o cinco productos: foto, procedencia, notas, un dato distintivo y precio."),
      S("origenes", "context", "De dónde sale la materia prima.", "Dos fotos y una tabla de cuatro orígenes con sus datos."),
      S("firma", "signature", "Enseñar lo que sólo esta casa puede enseñar.", "El artefacto propio: la curva, el plano, la fórmula. Con sus etapas anotadas."),
      S("uso", "explainer", "Cómo se disfruta bien, con números.", "Una tabla de recetas o de uso: proporciones, tiempos, temperaturas."),
      S("suscripcion", "pricing", "Cómo comprar de forma recurrente.", "Dos o tres planes con precio, ritmo y qué incluyen."),
      S("taller", "context", "Quiénes lo hacen y dónde.", "Foto del sitio, dos párrafos, dirección y horarios."),
      S("preguntas", "faq", "Lo que preguntan en la puerta.", "Cinco o seis preguntas reales, contestadas sin marketing."),
      S("pie", "footer", "Correo, navegación y lo legal.", "Formulario, columnas, dirección, aviso."),
    ],
  },

  saas: {
    // Sin `software` ni `b2b` a secas: "agencia de software a medida, casos B2B" es una agencia de
    // servicios, no un producto por suscripción, y con esos dos términos caía aquí.
    re: /saas|dashboard|plataforma|api\b|herramienta|app\b|suscripci[oó]n de software/i,
    label: "producto de software por suscripción",
    sections: [
      S("cromo", "chrome", "Producto, precio, documentación y entrar.", "Cuatro enlaces más dos botones."),
      S("portada", "hero", "Decir qué problema quita, no qué tecnología usa.", "Titular, entradilla, acción principal y una demostración o captura viva."),
      S("clientes", "proof", "Quién lo usa ya.", "Seis a diez nombres o una cifra de uso verificable."),
      S("problema", "thesis", "Nombrar el dolor con las palabras del usuario.", "Tres síntomas concretos del antes."),
      S("capacidades", "collection", "Qué hace, agrupado por trabajo a resolver.", "Cuatro o cinco capacidades: nombre, una frase y qué se ve en pantalla."),
      S("demostracion", "feature", "Enseñarlo funcionando en vez de describirlo.", "Un flujo completo, paso a paso, con datos verosímiles."),
      S("integraciones", "reference", "Con qué encaja.", "Rejilla de nombres. Material de consulta: no se mueve."),
      S("seguridad", "reference", "Contestar a compras y a seguridad antes de que pregunten.", "Certificaciones, ubicación de datos, retención, exportación."),
      S("precios", "pricing", "Que se pueda comparar sin escribir a nadie.", "Tres planes con precio real, límites y qué pasa al superarlos."),
      S("voces", "testimonial", "Resultado medido por un cliente.", "Dos citas con cifra, nombre y empresa."),
      // Añadida después de medir la sexta página. El arquetipo NO TENÍA sección de personas, y un
      // producto de software sin una sola cara es la página más fácil de confundir con una
      // plantilla: todo lo demás —tabla de precios, rejilla de capacidades, preguntas— es
      // exactamente igual en los mil competidores. La gente es lo único que no se puede copiar.
      // Y en una herramienta de operaciones no es decoración: quién contesta el teléfono es
      // información que el comprador quiere.
      S("equipo", "people", "Quién lo construye y quién contesta cuando algo se rompe.", "Tres o cuatro personas con nombre, papel y de dónde vienen."),
      S("preguntas", "faq", "Migración, contratos, datos, cancelación.", "Cinco o seis preguntas de las que frenan la firma."),
      S("cierre", "cta", "Una acción sola: probar o hablar.", "Un botón y qué pasa después."),
      S("pie", "footer", "Producto, empresa, legal, estado.", "Columnas y aviso."),
    ],
  },

  portfolio: {
    re: /portfolio|porfolio|book|trabajos|fot[oó]graf|ilustrador|dise[nñ]ador|arquitect/i,
    label: "portfolio personal o de estudio",
    sections: [
      S("cromo", "chrome", "Trabajo, sobre mí, contacto.", "Tres enlaces."),
      S("portada", "hero", "Que la primera pantalla sea el trabajo, no una biografía.", "Una pieza a sangre y el nombre. Nada más."),
      S("seleccion", "collection", "Los trabajos, comparables y navegables.", "Seis a diez piezas: imagen, cliente, año y disciplina."),
      S("destacado", "feature", "Un proyecto contado entero.", "Encargo, decisión, resultado, con tres o cuatro imágenes."),
      S("proceso", "process", "Cómo se llega de un encargo a la pieza.", "Cuatro pasos, con lo que se entrega en cada uno."),
      S("sobre", "thesis", "Quién firma y con qué criterio.", "Dos párrafos en primera persona. Sin adjetivos de agencia."),
      S("clientes", "reference", "Con quién se ha trabajado.", "Lista de nombres. No se mueve."),
      S("reconocimientos", "reference", "Premios y publicaciones, si los hay.", "Lista con año y medio."),
      S("contacto", "cta", "Cómo se contrata y con cuánta antelación.", "Correo, disponibilidad, qué mandar en el primer mensaje."),
      S("pie", "footer", "Redes y lo legal.", "Enlaces y aviso."),
    ],
  },

  event: {
    re: /evento|event|conferencia|festival|congreso|feria|jornada/i,
    label: "evento con fecha y entradas",
    sections: [
      S("cromo", "chrome", "Programa, ponentes, entradas.", "Tres enlaces y un botón."),
      S("portada", "hero", "Qué, cuándo y dónde, sin bajar la página.", "Nombre, fecha, ciudad, sede y comprar."),
      S("cifras", "data", "El tamaño de la cosa.", "Asistentes, ponentes, días, escenarios."),
      S("tesis", "thesis", "Para quién es y para quién no.", "Tres frases. Que excluyan a alguien."),
      S("programa", "process", "El horario real.", "Bloques por día con hora, sala y tema."),
      S("ponentes", "collection", "Quién habla.", "Ocho a doce personas: nombre, papel, empresa y charla."),
      S("sede", "context", "Cómo se llega y qué hay alrededor.", "Foto, mapa, transporte, alojamiento."),
      S("entradas", "pricing", "Qué incluye cada entrada y hasta cuándo.", "Dos o tres tipos con precio, límite y qué incluyen."),
      S("ediciones", "context", "Que se vea que ya pasó antes.", "Fotos de la edición anterior con un dato."),
      S("preguntas", "faq", "Devoluciones, cambio de nombre, accesibilidad, comida.", "Cinco o seis preguntas prácticas."),
      S("cierre", "cta", "Comprar, con la urgencia real.", "Botón y la fecha en que sube el precio."),
      S("pie", "footer", "Organización, patrocinio, legal.", "Columnas y aviso."),
    ],
  },

  editorial: {
    re: /editorial|revista|magazine|blog|peri[oó]dico|medio|publicaci[oó]n/i,
    label: "publicación o medio",
    sections: [
      S("cromo", "chrome", "Secciones y suscripción.", "Cinco secciones y un botón."),
      S("portada", "hero", "La pieza de apertura, con su jerarquía de portada.", "Titular, entradilla, autor, fecha e imagen."),
      S("destacado", "feature", "La segunda pieza, con otro peso.", "Titular, entradilla e imagen."),
      S("ultimo", "collection", "Lo reciente, ojeable.", "Seis a diez piezas: titular, sección, autor y fecha."),
      S("secciones", "reference", "El mapa de la publicación.", "Lista de secciones con su cadencia."),
      S("firmas", "people", "Quién escribe.", "Nombres con su especialidad."),
      S("sobre", "thesis", "Qué criterio editorial se sigue.", "Dos párrafos y la política de correcciones."),
      S("boletin", "cta", "Suscribirse, con expectativa clara.", "Formulario, frecuencia y qué llega."),
      S("pie", "footer", "Secciones, legal, contacto.", "Columnas y aviso."),
    ],
  },
};

// Orden de evaluación: del patrón más específico al más genérico, y `agency` el último porque su
// vocabulario ("estudio", "despacho") se solapa con casi todos. Sin esto, "estudio de arquitectura"
// caía en `agency` cuando lo que describe es un portfolio.
const ORDEN = ["restaurant", "portfolio", "product-brand", "event", "editorial", "saas", "agency"];

export function detectarArquetipo(brief) {
  const aciertos = ORDEN.filter((k) => ARQUETIPOS[k].re.test(brief));
  if (aciertos.length === 1) return { archetype: aciertos[0], confidence: "alta", alternatives: [] };
  if (aciertos.length > 1) {
    return { archetype: aciertos[0], confidence: "ambigua", alternatives: aciertos.slice(1) };
  }
  // Sin señal: "agency" es el patrón más genérico de los seis, no un acierto.
  //
  // ESTE CAMINO ES EL FALLO CARO Y ESTABA MUDO. Medido: el encargo «hamburguesería artesanal con
  // local físico, carta y pedido online» no casaba con NINGUNA expresión —«hamburgues» no estaba
  // en `restaurant`— y devolvía las catorce secciones de agencia: casos de estudio, principios,
  // equipo, contratación, testimonios y FAQ para un sitio donde se come. El dato de que no había
  // acierto SÍ viajaba en la respuesta, pero como un campo más entre treinta, y quien la lee se
  // queda con la lista de secciones. Se marca con `fallback: true` para que el consumidor pueda
  // tratarlo distinto, y `planPage` lo saca a la superficie como aviso de primer nivel.
  return {
    archetype: "agency",
    confidence: "ninguna",
    fallback: true,
    alternatives: ORDEN.filter((k) => k !== "agency"),
  };
}

// Sistema de movimiento por arquetipo. Es una sugerencia de partida, no una imposición: lo puede
// pisar `motion_system_hint`, igual que antes.
const SISTEMA_POR_ARQUETIPO = {
  restaurant: "reveal-on-enter",
  agency: "reveal-on-enter",
  "product-brand": "reveal-on-enter",
  saas: "reveal-on-enter",
  portfolio: "scrub-lagged",
  event: "reveal-on-enter",
  editorial: "reveal-on-enter",
};

export function sistemaSugerido(archetype) {
  return SISTEMA_POR_ARQUETIPO[archetype] ?? "reveal-on-enter";
}

export function politicaMovimiento(role) {
  const r = ROLES[role];
  return {
    motion: r?.movimiento ?? "optional",
    motion_reason: r?.razon_movimiento ?? null,
    // Una sección de rol hueco no se queda quieta por no tener candidato: se escribe con esto.
    hand_written_recipe: RECETAS_SIN_CATALOGO[role] ?? null,
  };
}
