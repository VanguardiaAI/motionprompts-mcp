// Dirección de imagen: qué imagen necesita cada sección, con qué modelo se hace y cómo se redacta
// el prompt para que sea DE ESA SECCIÓN y no del nicho.
//
// POR QUÉ EXISTE ESTE ARCHIVO
//
// Con la arquitectura y el movimiento ya resueltos, lo que sigue delatando a una página generada no
// es la animación: son las imágenes. Tres defectos medidos en las páginas del ejercicio one-shot:
//
//   1. LA IMAGEN ES DEL NICHO, NO DE LA SECCIÓN. Un bodegón de café correcto puesto en la sección
//      de orígenes, en la de método y en el cierre: tres veces la misma idea genérica. Sale bien
//      cuando el prompt nombra el CONTENIDO real de esa sección y mal cuando nombra el sector.
//   2. NO SALE NADIE. Ni una persona en cinco páginas. Una casa de comidas sin una sola cara es una
//      casa vacía. La causa no era una restricción: era que el único modelo que se usaba para
//      fotografía es el peor de los tres en caras.
//   3. TODO ES UN RECTÁNGULO. Cuadrado o 3:2, siempre con fondo. Sin un solo recorte con alfa, sin
//      un solo icono, sin nada que se pueda superponer, rotar o hacer flotar. Y el movimiento es
//      justo lo que se le pide a un asset recortado.
//
// Y dos más, medidos en la sexta página (examples/ascua), que son los que quedan cuando ya se han
// arreglado los tres de arriba. Los dos van de lo mismo: la imagen es BUENA y aun así no es la que
// necesita la página.
//
//   4. LA PÁGINA ESTÁ VACÍA AUNQUE HAYA RETRATOS. En ascua se generaron tres retratos, buenos, con
//      el modelo correcto. Los tres viven dentro de un mosaico que sólo los enseña al pasar el
//      puntero, y cuyo estado de reposo es la sala vacía. Un visitante que no pase el ratón por una
//      lista de tres nombres no ve UNA sola cara en toda la página. Generar personas no basta:
//      tienen que estar donde se ven sin hacer nada. Ver `personas`.
//   5. ES UN ENSAYO FOTOGRÁFICO, NO LA WEB DE UN NEGOCIO. La sala de ascua es una fotografía
//      preciosa de un comedor vacío a contraluz. Ningún restaurante de verdad publica su comedor
//      vacío: publica el comedor LLENO, porque lo que vende es que vayas. Un sitio de trabajo se
//      fotografía trabajando. Ver `foto_de_negocio`.
//
// Este módulo NO genera imágenes ni llama a nadie: devuelve texto. La generación la hace quien
// tenga su propia cuenta, con scripts/gen-assets.mjs o con lo que prefiera.

// ── los tres modelos ─────────────────────────────────────────────────────────
//
// Elegir mal el modelo se nota más que cualquier ajuste del prompt. No son intercambiables.

export const MODELOS = {
  gente: {
    modelo: "nano-banana-2",
    para: "Personas: caras, manos, equipo, clientes, comensales, un oficio en marcha, fotografía de banco con gente dentro.",
    por_que:
      "Es el único de los tres con piel creíble. gpt-image-2 tiñe a las personas de un ocre " +
      "uniforme que se reconoce al instante y delata la página; seedream es excelente en luz y " +
      "flojo en caras. Si en el encuadre hay una persona reconocible, va aquí, aunque el resto de " +
      "la toma sea un paisaje.",
  },
  escena: {
    modelo: "nano-banana-2",
    para:
      "EL SITIO COMO SITIO REAL: el local abierto, la oficina un martes, el taller con gente " +
      "dentro, el mostrador con cola. Lo que el negocio se fotografiaría a sí mismo para su web.",
    por_que:
      "Estaba en seedream y ESE ERA EL FALLO. seedream devuelve una fotografía de autor —encuadre " +
      "de galería, contraluz, sitio vacío— y una página llena de fotografías de autor se lee como " +
      "un ensayo, no como un negocio. nano-banana-2 saca sitios que parecen sitios, con gente " +
      "dentro y con la luz mediocre y creíble que tiene un sitio de verdad. Ver `foto_de_negocio`.",
  },
  paisaje: {
    modelo: "seedream/5-pro-text-to-image",
    para: "Exterior amplio SIN gente: campo, costa, carretera, montaña, cielo, la ciudad desde lejos, el origen de la materia prima.",
    por_que:
      "Aquí seedream es insuperable: luz, profundidad, atmósfera y grano. Es donde la fotografía " +
      "de autor SUMA, porque un paisaje no tiene que parecer que lo hizo el negocio con su móvil.",
  },
  artistica: {
    modelo: "seedream/5-pro-text-to-image",
    para: "Textura, abstracto, macro, bodegón pictórico, fondos.",
    por_que: "Mismo motor, mismo criterio: donde manda la atmósfera y no el dibujo del objeto.",
  },
  objeto: {
    modelo: "gpt-image-2-text-to-image",
    para: "Bodegón de producto CON fondo: la ficha del objeto destacado, un plato, una herramienta.",
    por_que: "Dibuja el objeto con precisión y obedece la composición pedida.",
  },
  recorte: {
    modelo: "gpt-image-2-text-to-image",
    para: "UN objeto sobre magenta, para salir en PNG transparente.",
    por_que:
      "Es el único que respeta un fondo plano de un color exacto, y el fondo plano es el mecanismo " +
      "entero de la transparencia: ningún modelo devuelve alfa de verdad.",
  },
  hoja: {
    modelo: "gpt-image-2-text-to-image",
    para: "Hasta SEIS objetos en una rejilla 3×2 invisible sobre magenta → seis PNG transparentes.",
    por_que:
      "Una generación cuesta lo mismo lleve un objeto o seis. Seis y no más: cada objeto necesita " +
      "su margen para que el troceado por componentes conexas no funda dos vecinos en una caja.",
  },
};

// El reparto en una línea, porque es lo que más se consulta y lo que más se equivoca:
//
//   nano-banana-2  →  gente, escena      lo que tiene que parecer REAL
//   seedream       →  paisaje, artistica lo que tiene que parecer BONITO
//   gpt-image-2    →  objeto, recorte, hoja   lo que tiene que estar bien DIBUJADO
//
// Si dudas entre nano y seedream, pregúntate quién hizo la foto. Si la respuesta creíble es "el
// negocio", nano. Si es "un fotógrafo al que contrataron", seedream.
export const REPARTO = {
  "nano-banana-2": ["gente", "escena"],
  "seedream/5-pro-text-to-image": ["paisaje", "artistica"],
  "gpt-image-2-text-to-image": ["objeto", "recorte", "hoja"],
};

// ── las reglas de redacción ──────────────────────────────────────────────────

export const REGLAS = {
  especificidad: {
    regla:
      "El sujeto de la imagen es lo que DICE ESA SECCIÓN, no a lo que se dedica el negocio. " +
      "Escribe el prompt desde el `purpose` de la sección y desde el contenido REAL que has puesto " +
      "en ella: el nombre del plato, el del proveedor, la pieza concreta, el número de cosas que " +
      "hay en la lista.",
    prueba:
      "PRUEBA DE LA COMPETENCIA: si el prompt, tal cual está escrito, serviría igual de bien en la " +
      "página de un competidor del mismo sector, es genérico y hay que reescribirlo. Tiene que " +
      "haber en él al menos un dato que sólo sea cierto en ESTA página.",
    mal: "Traditional Spanish food on a rustic table, warm light, appetising.",
    bien:
      "The Tuesday delivery being unpacked on the pass: a whole 36-month bellota ham still in its " +
      "net beside three tins of Cantabrian anchovies and a paper bag of Marcona almonds, the " +
      "kitchen docket taped to the steel counter beside them.",
  },

  coherencia: {
    regla:
      "Lee el prompt CONTRA LO QUE AFIRMA LA PÁGINA, no sólo contra el nicho. La prueba de " +
      "especificidad detecta lo genérico; ésta detecta lo CONTRADICTORIO, que es peor: una imagen " +
      "que desmiente el texto que tiene al lado destruye la credibilidad de la página entera, y el " +
      "modelo no puede saberlo porque no ha leído tus otras secciones.",
    como:
      "Antes de generar, haz la lista de las cosas que tu página NIEGA —lo que esta casa no usa, no " +
      "sirve o no hace— y prohíbelas explícitamente en el prompt. Un modelo rellena lo que no le " +
      "digas con lo estadísticamente normal del sector, y lo normal del sector es justo lo que tu " +
      "página está negando.",
    caso_real:
      "En examples/ascua la tesis es que no hay gas en el edificio: sólo brasa de roble. El prompt " +
      "del retrato del arrocero decía «turning a paella pan on the burner» y nano-banana-2 devolvió, " +
      "correctamente, una llama de gas azul debajo de la sartén. La foto era buena y desmentía a la " +
      "página. Lo escribió el autor del prompt, no el modelo.",
  },

  foto_de_negocio: {
    regla:
      "Estás emulando la web de un negocio que existe, no montando un porfolio de fotografía. La " +
      "diferencia no está en la calidad: está en QUIÉN se supone que hizo la foto y PARA QUÉ. Un " +
      "negocio fotografía su sitio para que quieras ir; un fotógrafo lo fotografía para que mires " +
      "la foto. Las dos cosas se ven distintas y sólo una de ellas vende.",
    como:
      "Reparte a conciencia. Las tomas del NEGOCIO —el local, la oficina, el mostrador, el taller, " +
      "el equipo— van con `escena` o `gente` (nano-banana-2), con gente dentro, en horario de " +
      "trabajo, con luz normal. Las tomas de ATMÓSFERA —el origen, el paisaje, la textura, el " +
      "macro— van con `paisaje` o `artistica` (seedream), y son la MINORÍA: una o dos por página, " +
      "como respiro entre lo demás.",
    prueba:
      "PRUEBA DEL SITIO ABIERTO: mira la toma y pregúntate qué hora es y si el sitio está abierto. " +
      "Si la respuesta es «media hora antes de abrir» o «acaban de cerrar», la has escrito mal. " +
      "Salvo que la sección hable justamente de eso, un sitio de trabajo se fotografía TRABAJANDO.",
    caso_real:
      "En examples/ascua el comedor se pidió «forty minutes before opening: empty room, eighteen " +
      "chairs pushed in, one hard shaft of dusk light». Salió una fotografía preciosa de un " +
      "restaurante vacío. Ningún restaurante publica eso: publica el comedor lleno un viernes, " +
      "porque lo que vende es que haya sitio y que se llene. La foto era buena y era la equivocada.",
    mal: "The dining room forty minutes before opening, empty, one hard shaft of dusk light from the left.",
    bien:
      "The dining room at 8pm on a Friday with every one of the eighteen seats taken: strangers " +
      "elbow to elbow down the communal table, plates being passed over shoulders, a server " +
      "leaning in over someone to set down a clay dish, the grill glowing through the service " +
      "window behind them. Ordinary warm light, nobody looking at the camera.",
  },

  producto_digital: {
    regla:
      "La INTERFAZ del producto no se genera nunca: se maqueta en HTML y CSS. Un modelo dibuja una " +
      "pantalla con las letras rotas, los números inventados y los iconos derretidos, y una " +
      "captura falsa es el tell más rápido de todos en un SaaS — es literalmente lo que el " +
      "visitante ha venido a mirar.",
    como:
      "Monta la pantalla con los mismos tokens de la página (tipografía, paleta, radios) y anímala " +
      "con la misma capa de movimiento: filas que entran, un contador que sube, una fila que se " +
      "marca. Sale mejor que cualquier captura, pesa la centésima parte, se ve nítida en cualquier " +
      "pantalla y encima se mueve. Lo que SÍ se genera alrededor es el contexto: la mesa, la mano, " +
      "la oficina, la persona que la está mirando.",
    donde: "Todo `feature` de SaaS o de producto digital, y toda la parte de `explainer` que enseñe pantalla.",
  },

  concrecion: {
    regla:
      "Nombra un objeto y un MOMENTO, no una categoría. Un modelo al que se le pide una categoría " +
      "devuelve la media de esa categoría, que es exactamente el aspecto de una imagen de banco. " +
      "Di qué está pasando, desde dónde se mira y qué luz hay.",
    mal: "A chef cooking.",
    bien:
      "Seen from behind the pass at eye level: the cook's hands tilting a steel paella pan so the " +
      "socarrat catches, one hard light from the left, everything else falling into shadow.",
  },

  cocina_de_casa: {
    regla:
      "Una sola COCINA FOTOGRÁFICA para toda la página, escrita una vez y pegada a cada prompt: " +
      "número de fuentes de luz, temperatura, grano, saturación y qué NO aparece. Sin eso salen " +
      "ocho fotos correctas que no se parecen entre sí, y una página con ocho fotos de ocho sitios " +
      "distintos se lee como una plantilla rellena.",
    ejemplo:
      "single hard directional light from the left, deep shadows, warm tungsten against a cool " +
      "grey-green room, fine natural film grain, desaturated except for the fire, photorealistic",
  },

  continuidad: {
    regla:
      "Repite dos o tres CONSTANTES FÍSICAS en todas las tomas —el mismo material, el mismo mantel, " +
      "el mismo azulejo, un color que no aparece en ningún otro sitio— para que se lean como una " +
      "campaña y no como un banco de imágenes. Es lo mismo que hace la paleta con el CSS.",
  },

  encuadre: {
    regla:
      "Cada toma se pide con la relación de aspecto de SU HUECO y sabiendo dónde va a caer el texto: " +
      "si el titular va a la izquierda, pide aire a la izquierda. Generar en 1:1 y recortar a 21:9 " +
      "después es cómo se decapita a la gente y se parte el objeto.",
    formatos:
      "Varía: 21:9 y 16:9 para una portada a sangre, 4:5 y 2:3 para retratos y para una columna, " +
      "1:1 sólo para fichas, 3:2 para lo demás. Una página donde todas las imágenes son cuadradas " +
      "se ve como una rejilla de contenido, no como una página diseñada.",
  },

  sin_letras: {
    regla:
      "Prohíbe SIEMPRE texto, letras, cifras, rótulos, logotipos, sellos y marcas de agua en el " +
      "prompt. Los modelos los inventan rotos y una letra mal dibujada arruina una foto por lo " +
      "demás buena. Todo lo que tenga que leerse va en HTML encima, donde además se puede animar.",
  },

  calidad_por_mision: {
    regla:
      "La resolución se decide por el DESTINO de la imagen, no por costumbre. Protagonista (hero, " +
      "fullscreen, slider que ocupa el viewport, cualquier toma que el visitante pueda ampliar): " +
      "2K / calidad media. Apoyo (thumbnail, celda de grid, trail, relleno que nunca se amplía): " +
      "1K / calidad baja. Pagar 2K en una celda de 200px es tirar créditos; servir 1K en un hero " +
      "es el defecto 'pixelada' que motivó la pasada de calidad de 2026-08.",
  },

  paleta_2026: {
    regla:
      "La imagen tiene que caber en la paleta del componente, y la paleta sigue el design system " +
      "2026 (docs/redesign-2026/DESIGN-SYSTEM.md): un neutro de alto contraste dominante + UN " +
      "acento saturado. Para fotografía eso significa: preferir b/n o duotono con el acento; " +
      "color natural sólo en travel/arquitectura/naturaleza. VETADO pedir bodegones beige, madera " +
      "clara, arena o cualquier gama crema+tan+marrón tono-sobre-tono: es la paleta que se retiró " +
      "de 50 componentes. Vetados también los nichos belleza/maquillaje/cosmética: pintalabios, " +
      "polveras, serums y 'piel glossy' fueron 35 de las 50 imágenes sustituidas en la pasada de " +
      "2026-08. Nichos que sí: diseño/branding, arquitectura, música/eventos, IA/futurista, " +
      "travel, editorial.",
  },

  personas: {
    regla:
      "Que salga gente, y que se vea. Las caras son lo primero que mira cualquiera y una página de " +
      "un sitio donde se trabaja sin una sola persona se siente deshabitada. Van con " +
      "nano-banana-2 y con un papel concreto, no con una etiqueta: no 'un cocinero', sino 'la " +
      "mujer que corta el jamón, sesenta y tantos, delantal de rayas, mirando la pieza y no a la " +
      "cámara'.",
    cuota:
      "MÍNIMO TRES TOMAS CON PERSONAS por página, y al menos UNA DE CADA TRES tomas fotográficas. " +
      "No es un tope: pasarse de gente no se ha visto nunca; quedarse corto, en cinco páginas de " +
      "seis. Y no todas en la misma sección: gente en la portada, gente en el sitio, gente usando " +
      "lo que vendes, y ADEMÁS los retratos del equipo.",
    visibilidad:
      "AL MENOS UNA PERSONA TIENE QUE VERSE SIN HACER NADA. Sin pasar el ratón, sin pulsar, sin " +
      "llegar a la sección catorce: en reposo y en el primer o segundo scroll. Una persona que " +
      "sólo aparece al interactuar, para la mitad de los visitantes no existe.",
    caso_real:
      "En examples/ascua hay tres retratos, buenos y con el modelo correcto, y aun así la página " +
      "se siente vacía: los tres viven dentro de un mosaico que sólo los enseña al pasar el " +
      "puntero por una lista de tres nombres, y su estado de reposo es la foto de la sala VACÍA. " +
      "Quien no pasara el ratón por ahí no vio una sola cara en toda la página. El fallo no fue de " +
      "generación: fue de colocación, y no lo detecta ningún control de imagen porque los ficheros " +
      "estaban ahí.",
    cuidado:
      "Nunca pidas ni describas a una persona real ni te acerques a su parecido. Y evita el " +
      "sonrisón a cámara: en una página de oficio la gente está mirando lo que hace. Varía edad, " +
      "cuerpo y aspecto entre tomas — seis personas de la misma edad y el mismo tipo se leen como " +
      "un banco de imágenes.",
  },

  transparencia: {
    regla:
      "Ningún modelo devuelve alfa: pedir 'transparent background' da un fondo blanco, gris o de " +
      "cuadros DIBUJADO. La única vía es pedir magenta puro #FF00FF plano y quitarlo después " +
      "(scripts/lib/imagen.mjs). Exige explícitamente: sin degradado, sin viñeta, sin sombra " +
      "arrojada, sin suelo, sin reflejo — cualquiera de esas cosas se lleva medio objeto en el " +
      "recorte.",
    cuidado:
      "Ningún objeto de la hoja puede ser magenta ni rosa fuerte: se recortaría a sí mismo. Es el " +
      "precio de usar ese color como fondo.",
  },

  hojas: {
    regla:
      "Los assets recortados se piden en HOJAS: una rejilla 3×2 INVISIBLE, un objeto por celda, " +
      "MÁXIMO SEIS, a escala parecida y sin tocarse. Seis PNG transparentes por generación. El " +
      "troceado no corta en tercios —eso deja al vecino asomando— sino que etiqueta las " +
      "componentes conexas del alfa y recorta cada objeto por su caja real; por eso el margen " +
      "entre objetos es un requisito y no un gusto.",
    para_que:
      "Un asset recortado es lo que hace que una página parezca compuesta y no maquetada: flota " +
      "sobre el texto, entra girando, se apila, sigue al puntero, se despliega en un proceso. Un " +
      "rectángulo con fondo no puede hacer nada de eso.",
    ejemplos_por_nicho:
      "café → un grano, un filtro de papel, una cuchara de catar, un tostador de mano; música → " +
      "unos cascos, una púa, un jack, un cassette; taberna → una aceituna con hueso, una copa de " +
      "fino, una lata de conserva abierta, un plato de barro. Objetos que un cliente de la casa " +
      "reconocería, no iconos de sistema.",
  },

  logotipos: {
    regla:
      "Los logotipos NO se generan: se buscan en Wikimedia Commons. Ningún modelo sabe dibujar un " +
      "logotipo real y saca una versión con las letras rotas, que es peor que no ponerlo. Y una " +
      "marquesina de marcas INVENTADAS se ve falsa al instante, porque el ojo reconoce que no " +
      "reconoce nada.",
    como:
      "Wikidata (wbsearchentities → propiedad P154 'logo image') → Commons imageinfo → SVG. " +
      "Buscar en Commons por nombre directamente devuelve camisetas y fotos de sedes. " +
      "En este repositorio: `node scripts/fetch-logos.mjs --out <dir> \"Marca\" …`.",
    donde:
      "Prueba social (`proof`), prensa y premios, integraciones y proveedores. En SaaS es casi " +
      "obligatorio; en producto físico funciona con premios, guías y distribuidores.",
    cuidado:
      "La licencia del FICHERO no da derechos sobre la MARCA. Pon un logotipo sólo donde la " +
      "relación sea cierta: insinuar un cliente, un premio o un patrocinio que no existe es un " +
      "problema legal, no de diseño. Y si no hay logo, el nombre en texto bien compuesto se ve " +
      "mejor que un logotipo inventado.",
  },
};

// ── qué pide cada rol ────────────────────────────────────────────────────────
//
// `null` en `assets` significa QUE NO LLEVA IMAGEN, y es una decisión, no un olvido: una tabla de
// precios con una foto detrás es de los tells más fiables de una plantilla.

const A = (tipo, ar, que) => ({ tipo, ar, que });

export const IMAGEN_POR_ROL = {
  entry: {
    assets: [A("recorte", "1:1", "La marca de la casa o el objeto de la tesis, recortado, para que el velo dibuje ALGO suyo.")],
    nota: "Si no tienes qué dibujar aquí, no pongas velo. Un logotipo girando no es un velo.",
  },
  chrome: { assets: null, nota: "La navegación no lleva fotografía. Como mucho, un recorte pequeño en el menú abierto." },
  hero: {
    assets: [A("escena", "21:9", "El oficio EN MARCHA Y CON GENTE DENTRO. Lo que se ve al entrar por la puerta un día cualquiera.")],
    nota:
      "Es la única imagen que verá TODO el mundo, y por eso es donde se cumple la regla de " +
      "visibilidad: si en la portada no hay una persona, más vale que la haya en la sección " +
      "siguiente. Pídela con aire donde va a caer el titular, y que no sea el bodegón de catálogo " +
      "del sector. Nunca el sitio vacío antes de abrir: eso es una foto de autor, no una portada.",
  },
  proof: { assets: null, nota: "Logotipos reales de Wikimedia, o los nombres en texto. Aquí no se genera nada." },
  thesis: {
    assets: [A("hoja", "3:2", "Un recorte por afirmación: el objeto que la prueba. Tres o cuatro, no seis.")],
    nota: "Una postura ilustrada con un objeto concreto se sostiene; ilustrada con una foto de ambiente, no.",
  },
  feature: {
    assets: [A("objeto", "4:5", "La pieza destacada con su ficha: bodegón cuidado, fondo controlado, un solo objeto.")],
    nota:
      "Aquí SÍ va bodegón de producto, y es el único sitio donde va. SALVO que el producto sea " +
      "digital: una pantalla no se genera JAMÁS, se maqueta en HTML (regla `producto_digital`), y " +
      "lo que se genera es quien la mira o dónde está.",
  },
  collection: {
    assets: [A("hoja", "3:2", "Los N objetos comparables, recortados, a la misma escala y con la misma luz.")],
    nota:
      "Una hoja es lo que hace que los seis se comparen de verdad: generados por separado salen " +
      "con seis luces distintas y la rejilla se ve descosida. Si son platos o piezas grandes, " +
      "`objeto` uno a uno con la misma cocina fotográfica.",
  },
  process: {
    assets: [A("hoja", "3:2", "Un recorte por paso: el objeto o la herramienta de ese paso, no un número dentro de un círculo.")],
    nota: "Los pasos ilustrados con iconos de sistema se ven a plantilla. Con el utensilio real, no.",
  },
  signature: {
    assets: [A("artistica", "16:9", "El fondo o la textura sobre la que se dibuja el artefacto propio.")],
    nota:
      "La firma suele ser un SVG dibujado por ti —la curva, el plano, la fórmula—, no una foto. " +
      "La imagen aquí es soporte: que no compita con el trazo.",
  },
  context: {
    assets: [
      A("escena", "3:2", "EL SITIO en marcha, con gente: taller, sala, mostrador, oficina un martes."),
      A("paisaje", "2:3", "DE DÓNDE VIENE: el campo, la costa, la carretera, la cantera. Sin gente y sin prisa."),
    ],
    nota:
      "Es el rol donde se ve mejor el reparto de la regla `foto_de_negocio`: una toma con nano " +
      "(el sitio, real, habitado) y una con seedream (el origen, atmosférica). Dos formatos " +
      "distintos, una ancha y una vertical, no dos 3:2 iguales.",
  },
  explainer: {
    assets: [A("hoja", "3:2", "Los utensilios o las piezas que aparecen en la explicación, recortados.")],
    nota: "Si lo práctico es una tabla, la tabla manda y los recortes acompañan al margen.",
  },
  people: {
    assets: [A("gente", "4:5", "Retratos de las personas con su papel, mirando a lo que hacen.")],
    nota:
      "CON nano-banana-2, sin excepción. Y con el mismo encuadre y la misma luz en todos: tres " +
      "retratos de tres estudios distintos se ven peor que ninguno. OJO CON LA MECÁNICA que elijas " +
      "para enseñarlos: si sólo aparecen al pasar el puntero, la página sigue estando vacía para " +
      "quien no lo pase (regla `personas`, apartado `visibilidad`). Si la mecánica es de hover, que " +
      "su estado de REPOSO ya sea una cara.",
  },
  cta: { assets: [A("artistica", "16:9", "Una textura o un fondo atmosférico que cierre, si el cierre lo pide.")], nota: "Opcional de verdad: un cierre limpio con una sola acción suele ganar." },
  footer: { assets: null, nota: "El pie se resuelve con tipografía y movimiento. Si acaso, un recorte que caiga o se arrastre." },

  // Los huecos del catálogo de movimiento son también, casi todos, huecos de imagen.
  data: { assets: null, nota: "Las cifras se dibujan, no se fotografían." },
  pricing: { assets: null, nota: "Una tabla de precios con una foto detrás es de los tells más fiables de una plantilla." },
  testimonial: {
    assets: [A("gente", "1:1", "El retrato de quien firma la cita, con su papel y su sitio de trabajo detrás.")],
    nota:
      "Una cita sin cara pesa la mitad, así que en una página de muestra —donde el negocio, la " +
      "persona y la cita son ficción coherente— va con retrato. Lo prohibido es lo otro: colgarle " +
      "una cara inventada al nombre de una persona o de una empresa QUE EXISTEN. Si citas a " +
      "alguien real, el retrato no se genera.",
  },
  faq: { assets: null, nota: "Sin imagen." },
  reference: {
    assets: null,
    nota:
      "Lo que se consulta no lleva foto detrás. Pero OJO: una rejilla de integraciones o de " +
      "proveedores sí lleva LOGOTIPOS, que no son imagen generada sino ficheros de Wikimedia " +
      "Commons (regla `logotipos`). No generar aquí no es lo mismo que dejarlo desnudo.",
  },
};

// ── el esqueleto del prompt ──────────────────────────────────────────────────

export const ESQUELETO = [
  "[SUJETO] un objeto o un momento concreto de ESTA sección, con su nombre propio",
  "[ACCIÓN] qué está pasando ahora mismo en el encuadre",
  "[PUNTO DE VISTA] desde dónde se mira y a qué altura",
  "[LUZ] cuántas fuentes, de dónde, qué temperatura",
  "[AIRE] dónde queda el hueco para el texto que va encima",
  "[COCINA DE CASA] la línea compartida por toda la página",
  "[PROHIBICIONES] no text, no lettering, no logos, no watermark",
].join(" · ");

/** La imaginería de una página: reglas, enrutado y qué toca en cada sección. */
export function planImagen({ archetype, sections = [], paleta = null } = {}) {
  const porSeccion = sections.map((s) => {
    const r = IMAGEN_POR_ROL[s.role] ?? { assets: null, nota: "Rol desconocido: decide tú." };
    return {
      id: s.id,
      role: s.role,
      purpose: s.purpose ?? null,
      lleva_imagen: !!r.assets,
      assets: (r.assets ?? []).map((a) => ({ ...a, modelo: MODELOS[a.tipo].modelo })),
      nota: r.nota,
    };
  });

  const todos = porSeccion.flatMap((s) => s.assets);
  const cuenta = (t) => todos.filter((a) => a.tipo === t).length;

  // El censo es la regla `personas` hecha número, y existe porque en ascua la regla estaba escrita
  // y aun así la página salió deshabitada: lo que no se cuenta no se cumple.
  const FOTOGRAFICAS = ["gente", "escena", "paisaje", "artistica", "objeto"];
  const fotos = todos.filter((a) => FOTOGRAFICAS.includes(a.tipo)).length;
  const conGente = cuenta("gente");
  const secciones_con_gente = porSeccion.filter((s) => s.assets.some((a) => a.tipo === "gente")).map((s) => s.id);
  const MINIMO = 3;
  const censo = {
    tomas_con_personas: conGente,
    tomas_fotograficas: fotos,
    proporcion: fotos ? Number((conGente / fotos).toFixed(2)) : 0,
    minimo: MINIMO,
    minimo_proporcion: 0.33,
    secciones_con_gente,
    veredicto:
      conGente >= MINIMO && (!fotos || conGente / fotos >= 0.33) ? "suficiente"
        : conGente === 0 ? "deshabitada"
          : "escasa",
    nota:
      conGente === 0
        ? "NO HAY UNA SOLA PERSONA. Es el defecto más repetido y el más caro: reescribe el plan " +
          "antes de generar nada, no después."
        : conGente < MINIMO || (fotos && conGente / fotos < 0.33)
          ? `Sólo ${conGente} de ${fotos} tomas llevan gente. Sube a ${MINIMO} como mínimo y a una de cada tres: ` +
            "la portada y el sitio son los dos huecos que casi siempre se dejan vacíos."
          : "Cuota cumplida en el PLAN. Falta la otra mitad de la regla, que el plan no puede " +
            "comprobar: que al menos una de esas caras se vea EN REPOSO, sin pasar el ratón y sin " +
            "bajar catorce secciones.",
    cuenta_lo_que:
      "Sólo las tomas de tipo `gente`: aquéllas en las que la persona ES el sujeto. Las de tipo " +
      "`escena` también tienen que llevar gente dentro —un sitio de trabajo se fotografía " +
      "trabajando— pero no cuentan aquí, porque ahí el sujeto es el sitio y la cara queda pequeña.",
  };

  return {
    archetype: archetype ?? null,
    modelos: MODELOS,
    reparto: REPARTO,
    reglas: REGLAS,
    esqueleto_del_prompt: ESQUELETO,
    paleta,
    por_seccion: porSeccion,
    censo_de_personas: censo,
    resumen: {
      secciones_con_imagen: porSeccion.filter((s) => s.lleva_imagen).length,
      secciones_sin_imagen: porSeccion.filter((s) => !s.lleva_imagen).map((s) => s.id),
      hojas_de_recortes: cuenta("hoja"),
      tomas_con_personas: conGente,
      generaciones_estimadas: todos.length,
    },
    autocritica:
      "Antes de generar nada, lee tus prompts seguidos y contesta a siete preguntas. Si alguna sale " +
      "mal, reescribe: (1) ¿sale alguna PERSONA en la página? (2) ¿hay algún RECORTE con alfa, o " +
      "son todo rectángulos? (3) ¿hay al menos tres FORMATOS distintos? (4) ¿podría cada prompt, " +
      "tal cual, servir en la página de un competidor? (5) ¿hay algún prompt que CONTRADIGA lo que " +
      "afirma la página —un utensilio, un material o un método que tu propio texto niega? " +
      "(6) ¿cuántas de las tomas del NEGOCIO están vacías de gente o pedidas fuera de horario, como " +
      "si las hubiera hecho un fotógrafo de galería en vez del propio negocio? (7) ¿en qué scroll " +
      "aparece la primera cara, y hay que hacer algo —pasar el ratón, pulsar— para verla? " +
      "La cuarta es la que más falla; la quinta es la que más caro sale; la sexta y la séptima son " +
      "las que dejan la página bonita y deshabitada, que es el defecto de examples/ascua.",
    siguiente:
      "Escribe un plan { dir, casa, tomas[] } y genera con tu propia cuenta. En este repositorio: " +
      "`node scripts/gen-assets.mjs --plan <plan.json>` (enruta el modelo por `tipo`, quita el " +
      "magenta y trocea las hojas) y `node scripts/fetch-logos.mjs` para los logotipos. Este " +
      "servidor no genera imágenes ni hace ninguna llamada de red: devuelve texto.",
  };
}
