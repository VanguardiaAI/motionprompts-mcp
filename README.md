# motionprompts MCP

![motionprompts: GSAP and WebGL components, each with a live demo and a validated prompt](https://raw.githubusercontent.com/VanguardiaAI/motionprompts-mcp/main/mcp/assets/portada.gif)

An MCP server over a catalog of **<!--n-->259<!--/n--> production-grade GSAP motion components**
([motionprompts.dev](https://motionprompts.dev)). A curated set of components is free with the full
prompt; the rest of the library returns a 12-line preview until you pass a Full Stack key
(`Authorization: Bearer mpk_...`, from [motionprompts.dev/account](https://motionprompts.dev/account/)).
Plans: [motionprompts.dev/pricing](https://motionprompts.dev/pricing/). It does not generate animations: it hands you the
ones that are already solved and debugged, tells you how to compose them without them fighting each
other, and says so plainly when the catalog does **not** have what you asked for.

## What it exposes

| Tool | What for |
| --- | --- |
| `plan_page` | The **information architecture** of a page: 9–14 sections with their role, their job, and whether they should move. Deliberately returns no components. |
| `suggest_mechanics` | Mechanics for **one** section, filtered by the real facets of its role. Knows how to answer that there is nothing. |
| `suggest_page_treatments` | The twin of `suggest_mechanics` for mechanics that belong to the **page**, not a section slot: smooth scroll, shaped edges between sections, running backgrounds. |
| `get_integration_contract` | Repairs, mount order and budget for a set of components. It is what stops two entry veils from coexisting, and — given `moving_sections` — what tells you to your face that the page is under-animated. |
| `plan_imagery` | Image direction section by section: which shot is needed, **with which model** (people, objects and landscape are not interchangeable), how to get transparency, and where real logos come from. Returns text: it generates nothing. |
| `get_component_prompt` | The author's prompt **verbatim** + the motion-system tokens + the instruction to adapt it yourself. |
| `search_components` | Free-text search with `lexical_coverage`: reliable for saying "there is nothing here", not for saying "this is the best". |
| `search_components_motion` | Search by **measured motion metadata** (trigger, cluster, easing, duration) instead of by looks. |
| `get_component` | Meta, preview, prompt and — where the distribution carries it — source. |
| `list_facets` · `list_components` · `list_motion_systems` · `get_motion_system` | Vocabulary and tokens. |
| `render_prompt` | Deprecated; use `get_component_prompt`. |

## Hosted endpoint — no install

The server runs live at `https://motionprompts.dev/mcp` (Streamable HTTP, stateless; a Bearer key is optional and unlocks the paid prompts).
Add it to Claude Code with one command and you are done:

```bash
claude mcp add --transport http motionprompts https://motionprompts.dev/mcp
```

Discovery manifest: [motionprompts.dev/.well-known/mcp](https://motionprompts.dev/.well-known/mcp).

## Local installation

Requires **Node 20 or newer**. No API key and no environment variables for the free set; the local package carries only the free prompts in full (the paid ones as previews), so for the whole library use the hosted endpoint with your key.

The package is on npm as [`motionprompts-mcp`](https://www.npmjs.com/package/motionprompts-mcp) —
no clone needed:

```bash
claude mcp add motionprompts -- npx -y motionprompts-mcp
```

Or from a clone:

```bash
git clone https://github.com/VanguardiaAI/motionprompts-mcp.git
cd motionprompts-mcp
npm install
```

### Claude Code

```bash
claude mcp add motionprompts -- node /absolute/path/to/motionprompts-mcp/mcp/server.mjs
```

### Claude Desktop and other clients

In the client's JSON configuration:

```json
{
  "mcpServers": {
    "motionprompts": {
      "command": "node",
      "args": ["/absolute/path/to/motionprompts-mcp/mcp/server.mjs"]
    }
  }
}
```

Check that it works:

```bash
npm run verify      # end-to-end battery over the real MCP protocol
```

To self-host the HTTP endpoint instead of stdio: `npm run start:http` (defaults to
`127.0.0.1:4478`; configure with `MCP_HTTP_HOST` / `MCP_HTTP_PORT`).

## About API keys: none needed

**This server uses no key and cannot spend anyone's money.** It reads no environment variables,
asks for no secrets, and makes **not a single network call**: it opens files from disk and returns
text. It is a catalog reader.

That includes `plan_imagery`, which talks about image models and transparent backgrounds: **it returns
text**. It is a recipe, not a generator. It names the three models we use ourselves because that is
the useful information — which one is for what — but it calls none of them, and the writing and
cut-out rules work the same with whatever provider you prefer.

If you came looking for the notice about [kie.ai](https://kie.ai): that key belongs to a separate
authoring tool — the one that generated the photography for the example pages — which is **not part
of this package**. It is excluded on purpose, so nothing in here can generate images or bill anyone.
If you want photography for your pages, use whatever service you prefer with your own account.

## How to use it well

Order matters, and it is the hardest thing to get right:

1. **`plan_page` first.** It returns sections, not components: a page can only be as rich as the
   list it is composed from, and composing straight from animation mechanics flattens it to five
   sections. Adjust the list to the actual brief before going on.
2. **`suggest_mechanics` per section**, with `avoid` to exclude what you already used. Without it
   you will repeat components: broad roles offer a hundred-plus candidates with tied scores, and
   reusing the same `need` string always returns the same first hit.

   **`avoid` is for not repeating yourself, not for animating less.** If you discard the #1 because
   it is taken, take the #2 — they are tied. A section left static because its first candidate was
   already used is the most expensive failure of this flow, and it was literally an `if` in the
   example script.
3. **`get_integration_contract`** with all the slugs at once, before writing a line, and with
   `moving_sections` set: it is the coverage audit.
4. **`get_component_prompt`** per component. **Re-dress, don't reimplement**: change images, copy,
   palette, typography and element counts, and keep the mechanic. Discard a component only if its
   MECHANIC does not fit — never on aesthetic taste.
5. **`plan_imagery`** before writing a single image prompt, with the same section list.

Five roles are declared **catalog gaps** (`faq`, `data`, `pricing`, `testimonial`, `reference`):
there is nothing for them among the <!--n-->259<!--/n--> components. But "no component" does **not**
mean "this section stays still": they are three to five sections out of a thirteen-section page, and
`suggest_mechanics` returns for each one a **recipe written in the token vocabulary**
(`hand_written_recipe`). For everything else, adopt.

### Overshoot rather than undershoot

`plan_page` returns a `motion_coverage` block with the math done: how many sections should move,
which are covered by adopting and which by recipe. One of them ending up with nothing is a defect of
the page, not a style decision. The mistake people make is not excess: it is spreading four
mechanics across the showy sections and leaving the rest blank. What saves a page from noise is not
scarcity of motion — it is everything moving in the same language, and the motion system already
takes care of that.

### Images are what still gives a generated page away

With architecture and motion solved, what keeps ringing false is the imagery. `plan_imagery`
encodes the three measured defects and their remedy:

- **The image belongs to the industry, not to the section.** Competitor test: if the prompt would
  work unchanged on a competitor's page, it is generic. It must carry a fact that is only true on
  this page.
- **Nobody appears.** People go to `nano-banana-2` and only that one: the other two give them a
  recognizable tint or plainly cannot do faces.
- **Everything is a rectangle with a background.** Cut-outs go to gpt-image-2.5 with
  `background: transparent`, which returns real alpha (the magenta chroma key is kept only as a
  fallback for old raws). And they are requested in **sheets of six** — an invisible 3×2 grid —
  because a generation costs the same whether it carries one or six. A shot that fails on one
  detail is **retouched** image-to-image from its own raw, not re-rolled.

And **logos are never generated**: they are looked up on Wikimedia (Wikidata → P154 → Commons). No
model draws a real logotype without breaking the letters, and a marquee of invented brands reads as
fake instantly.

## Pages built with it

The source repository contains five complete pages built with this server, each with a README
documenting which mechanic was adopted, which was re-dressed and which was discarded **and why**.
Every component in the catalog has a live demo and build notes at
[motionprompts.dev](https://motionprompts.dev/component/).

## What this distribution does NOT carry

**The components' source code.** You get the prompts, the metadata, the composition rule engine and
the server. You do not get each piece's `index.html` / `script.js` / `styles.css`.

That is not a gap: it is how these are meant to be used. **The prompt is the product** — a
self-sufficient brief that rebuilds the mechanic from scratch and adapts it to your page, instead of
pasting someone else's component into it. The example pages were built exactly that way: adopting
mechanics and re-dressing them, not copying code.

`get_component` with `include: ['source']` says so explicitly and returns the live demo and the
prompt URL instead. Everything else — `search_components`, `plan_page`, `suggest_mechanics`,
`get_integration_contract`, `get_component_prompt` — works the same.

## License

**PolyForm Noncommercial 1.0.0** with mandatory attribution. Noncommercial use allowed; commercial
use requires a separate license. Any permitted use must keep the notice and visibly credit
motionprompts.dev. See [LICENSE](LICENSE).

It is not an OSI-approved license, so npm and GitHub will flag it as non-standard. If you are going
to rely on it for anything serious, have a lawyer read it: I am not one.
