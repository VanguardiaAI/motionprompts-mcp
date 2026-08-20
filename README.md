# motionprompts MCP

Un servidor MCP sobre un catálogo de **219 componentes de movimiento GSAP** de calidad de producción.
No genera animaciones: te da las que ya están resueltas y depuradas, te dice cómo componerlas sin que
se peleen, y te avisa cuando el catálogo **no** tiene lo que pides.

## Lo que expone

| Tool | Para qué |
| --- | --- |
| `plan_page` | La **arquitectura de información** de una página: 9-14 secciones con su rol, su cometido y si deben moverse. No devuelve componentes a propósito. |
| `suggest_mechanics` | Mecánicas para **una** sección, filtradas por las facetas reales de su rol. Sabe contestar que no hay nada. |
| `get_integration_contract` | Reparaciones, orden de montaje y presupuesto para un conjunto de componentes. Es el que impide que dos velos de entrada convivan, y —si le pasas `moving_sections`— el que te dice a la cara que te has quedado corto de movimiento. |
| `plan_imagery` | Dirección de imagen sección a sección: qué toma hace falta, **con qué modelo** (personas, objetos y paisaje no son intercambiables), cómo se consigue transparencia y de dónde salen los logotipos reales. Devuelve texto: no genera nada. |
| `get_component_prompt` | El prompt del autor **verbatim** + los tokens del sistema de movimiento + la instrucción de adaptarlo tú. |
| `search_components` | Búsqueda libre con `lexical_coverage`: fiable para decir «aquí no hay nada», no para decir «esto es lo mejor». |
| `get_component` | Meta, vista previa, prompt y, si lo pides, el código fuente. |
| `list_facets` · `list_components` · `list_motion_systems` · `get_motion_system` | Vocabulario y tokens. |

## Instalación

Requiere **Node 20 o superior**. No necesita ninguna clave de API ni ninguna variable de entorno.

### Claude Code

```bash
claude mcp add motionprompts -- node /ruta/al/repo/mcp/server.mjs
```

### Claude Desktop y otros clientes

En el JSON de configuración del cliente:

```json
{
  "mcpServers": {
    "motionprompts": {
      "command": "node",
      "args": ["/ruta/absoluta/al/repo/mcp/server.mjs"]
    }
  }
}
```

Comprueba que arranca:

```bash
npm run verify:mcp      # batería end-to-end sobre el protocolo real
```

## Sobre claves de API: no hace falta ninguna

**Este servidor no usa ninguna clave, y no puede gastar dinero de nadie.** No lee variables de
entorno, no pide secretos y **no hace ni una sola llamada de red**: abre ficheros del disco y
devuelve texto. Es un lector de catálogo.

Esto vale también para `plan_imagery`, que habla de modelos de imagen y de fondos magenta: **devuelve
texto**. Es una receta, no un generador. Nombra los tres modelos que usamos nosotros porque es la
información útil —cuál sirve para qué— pero no llama a ninguno, y las reglas de redacción y de
recorte valen igual con el proveedor que tú prefieras.

Si venías buscando el aviso sobre [kie.ai](https://kie.ai): esa clave pertenece a una herramienta de
autoría distinta —la que generó la fotografía de las páginas de ejemplo— que **no forma parte de
este paquete**. Está excluida a propósito, así que aquí no hay nada capaz de generar imágenes ni de
facturar a nadie. Si quieres fotografía para tus páginas, usa el servicio que prefieras con tu
propia cuenta.

## Cómo se usa bien

El orden importa, y es lo que más cuesta acertar:

1. **`plan_page`** primero. Devuelve secciones, no componentes: una página solo puede ser tan rica
   como la lista de la que se compone, y componer a partir de mecánicas de animación la deja en cinco
   secciones. Ajusta la lista al encargo real antes de seguir.
2. **`suggest_mechanics` por sección**, con `avoid` para excluir lo que ya usaste. Sin eso repetirás
   componente: los roles anchos ofrecen más de cien candidatos cuyas puntuaciones están empatadas, y
   reutilizar la misma cadena `need` da siempre el mismo primero.

   **`avoid` es para no repetirse, no para animar menos.** Si descartas el nº1 por repetido, coge el
   nº2 — están empatados. Que una sección se quede quieta porque su primer candidato ya estaba
   cogido es el fallo más caro de este flujo, y era literalmente un `if` del guion de ejemplo.
3. **`get_integration_contract`** con todos los slugs a la vez, antes de escribir una línea, y con
   `moving_sections` puesto: es la auditoría de cobertura.
4. **`get_component_prompt`** por componente. **Re-viste, no reimplementes**: cambia imágenes,
   textos, paleta, tipografía y número de elementos, y conserva la mecánica. Descarta un componente
   solo si su MECÁNICA no sirve, nunca por gusto estético.
5. **`plan_imagery`** antes de escribir un solo prompt de imagen, con la misma lista de secciones.

Cinco roles están declarados como **huecos del catálogo** (`faq`, `data`, `pricing`, `testimonial`,
`reference`): no hay nada para ellos entre los 219 componentes. Pero «no hay componente» **no es**
«esta sección se queda quieta»: son tres a cinco secciones de una página de trece, y `suggest_mechanics`
devuelve para cada una una **receta escrita en el vocabulario de los tokens** (`hand_written_recipe`).
Para todo lo demás, adopta.

### Pasarse antes que quedarse corto

`plan_page` devuelve un bloque `motion_coverage` con la cuenta hecha: cuántas secciones deben
moverse, cuáles se cubren adoptando y cuáles con receta. Que una de ellas acabe sin nada es un
defecto de la página, no una decisión de estilo. El error que se comete no es el exceso: es repartir
cuatro mecánicas por las secciones vistosas y dejar el resto en blanco. Lo que salva a una página del
ruido no es la escasez de movimiento, es que todo se mueva con el mismo idioma — y de eso ya se
encarga el motion system.

### Las imágenes son lo que queda por delatar a una página generada

Con la arquitectura y el movimiento resueltos, lo que sigue cantando son las imágenes. `plan_imagery`
codifica los tres defectos medidos y su remedio:

- **La imagen es del sector, no de la sección.** Prueba de la competencia: si el prompt serviría
  igual en la página de un competidor, es genérico. Tiene que llevar dentro un dato que solo sea
  cierto en esta página.
- **No sale nadie.** Las personas van con `nano-banana-2` y solo con ése: los otros dos les dan un
  tono reconocible o directamente no saben hacer caras.
- **Todo son rectángulos con fondo.** Ningún modelo devuelve alfa: se pide **magenta plano #FF00FF**
  y se quita después. Y los recortes se piden en **hojas de seis** —rejilla 3×2 invisible— porque una
  generación cuesta lo mismo lleve uno o seis.

Y los **logotipos no se generan**: se buscan en Wikimedia (Wikidata → P154 → Commons). Ningún modelo
dibuja un logotipo real sin romper las letras, y una marquesina de marcas inventadas se ve falsa al
instante.

## Ejemplos construidos con él

`examples/` contiene cinco páginas completas hechas con este servidor, cada una con un README que
documenta qué mecánica se adoptó, qué se re-vistió y qué se descartó **y por qué**. Sirven de
referencia de uso y también de registro de los fallos que se fueron encontrando.

## Qué NO lleva esta distribución

**El código fuente de los componentes.** Van los prompts, los metadatos, el motor de reglas de
composición y el servidor. No van los `index.html` / `script.js` / `styles.css` de cada pieza.

No es una carencia: es cómo están pensados para usarse. **El prompt es el producto** — un brief
autosuficiente que reconstruye la mecánica desde cero y la adapta a tu página, en vez de pegarte un
componente ajeno dentro. Las cinco páginas de `examples/` en el repositorio privado se construyeron
así, adoptando mecánicas y re-vistiéndolas, no copiando código.

`get_component` con `include: ['source']` lo dice explícitamente y te devuelve la demo en vivo y la
URL del prompt. Todo lo demás —`search_components`, `plan_page`, `suggest_mechanics`,
`get_integration_contract`, `get_component_prompt`, `render_prompt`— funciona igual.

## Licencia

**PolyForm Noncommercial 1.0.0** con atribución obligatoria. Uso no comercial permitido; el uso
comercial requiere una licencia aparte. Cualquier uso permitido debe conservar el aviso y citar
motionprompts.dev de forma visible. Ver [LICENSE](LICENSE).

No es una licencia aprobada por la OSI, así que npm y GitHub la marcarán como no estándar. Si vas a
apoyarte en ella para algo serio, que la revise un abogado: yo no lo soy.
