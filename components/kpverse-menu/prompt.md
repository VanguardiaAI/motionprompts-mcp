# Sliding Editorial Side-Menu with Text-Scramble Hover

## Goal
Build a fixed **black rounded side panel** navigation menu that lives off-screen to the left and **slides in from the left edge** when a small "Menu" toggle in the top nav is clicked. As the panel arrives, its six big display links **cascade in one after another** from the left, and every label **scrambles through random letters and then resolves** into the real word (a left-to-right settling wave). Hovering any link re-runs the same character-scramble, flips a **chamfered white "bg-hover" block** on behind the word (turning the black text to black-on-white / aquamarine-on-active), and **lights up the small sub-label to its right character-by-character**. A close (X) button in the sidebar slides the panel back out and staggers the links away. The star effect is the **SplitType per-character scramble + the CSS clip-path slide choreography** — there is **no GSAP** here.

## Tech
Vanilla HTML/CSS/JS with ES module imports. The **only** JS dependency is **`split-type`** (npm) for splitting text into per-character spans. **Do NOT use GSAP, ScrollTrigger, Lenis, or any tween library** — all motion is done with CSS `transition`/`@keyframes` plus vanilla `setTimeout`/`setInterval`. Icons come from **Ionicons v7 web components**, served from your own origin via script tags in the `<head>`:

```html
<script type="module" src="/vendor/ionicons/ionicons.esm.js"></script>
<script nomodule src="/vendor/ionicons/ionicons.js"></script>
```

Get those two files with `npm i ionicons@7.1.0` and copy `node_modules/ionicons/dist/ionicons/`
into your public directory. Copy the **whole** folder: the loader fetches its `p-*.entry.js` chunks
and one `svg/<name>.svg` per icon at runtime, resolved relative to the script's own URL.

Import in `script.js`:
```js
import SplitType from "split-type";
```

Ship `index.html`, `styles.css`, and an ES-module `script.js` (`<script type="module" src="./script.js">`), plus the stylesheet link in the `<head>`.

## Fonts (load concretely — the display face is the whole personality)
The original pairs a monospace grotesque body with a **bold ink-trap grotesque** for the 48px links. Reproduce with web-loadable Google Fonts:
- **Mono body / small UI text ("Akkurat Mono"-style):** **Space Mono** (or IBM Plex Mono). Used for `a, p, span` everywhere.
- **Display links (48px, bold, ink-trap grotesque — "ABC Whyte Inktrap"-style):** **Bricolage Grotesque** at weight 700 (it has genuine ink traps). Used only for `.menu-item-link a`.

Load both, e.g. as the first line of `styles.css`:
```css
@import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700&family=Space+Mono:wght@400;700&display=swap");
```

## Layout / HTML
Fixed widget over an otherwise empty white page. Full body skeleton (keep the copy verbatim — it is the editorial content):

```html
<nav>
  <div class="menu-toggle"><p>Menu</p></div>
  <p>Collection</p>
</nav>

<div class="container">
  <div class="menu-container">
    <div class="menu">
      <div class="menu-main">
        <div class="menu-top">
          <div class="menu-top-title"><p>discover</p></div>
          <div class="menu-top-content">
            <!-- 6 menu items. Each: -->
            <div class="menu-item">
              <div class="menu-item-link">
                <div class="bg-hover"></div>
                <a href="#">story</a>
              </div>
              <span>page 001</span>
            </div>
            <!-- item 2: Protocol / 20 ideas -->
            <!-- item 3: journal / 10 notes -->
            <!-- item 4: contact / email now -->
            <!-- item 5 HAS id="active":  gallery / check out  -> <div class="menu-item" id="active"> -->
            <!-- item 6: about / our office -->
          </div>
        </div>
        <div class="menu-bottom">
          <!-- 3 sub-items. Each: -->
          <div class="menu-sub-item">
            <div class="menu-title"><p>connect</p></div>
            <div class="menu-content"><p>Discord</p></div>
          </div>
          <!-- sub 2: buy On / Opensea -->
          <!-- sub 3: us-en / 2022 -->
        </div>
      </div>
      <div class="menu-sidebar">
        <div class="close-btn"><ion-icon name="close-sharp"></ion-icon></div>
        <div class="logo"><ion-icon name="funnel-sharp"></ion-icon></div>
      </div>
    </div>
  </div>
</div>

<script type="module" src="./script.js"></script>
```

The six `.menu-item`s (link label / sub-label `<span>`), top to bottom:
1. `story` / `page 001`
2. `Protocol` / `20 ideas`
3. `journal` / `10 notes`
4. `contact` / `email now`
5. `gallery` / `check out` — this one gets **`id="active"`**
6. `about` / `our office`

The three `.menu-sub-item`s (`.menu-title` / `.menu-content`): `connect`/`Discord`, `buy On`/`Opensea`, `us-en`/`2022`.

Note the fixed order inside `.menu-item-link`: the `.bg-hover` div comes **before** the `<a>` (it sits behind, z-index 0, while `a` is z-index 2). The `<span>` sub-label is a **sibling of `.menu-item-link`**, positioned absolutely to the right of the word by JS.

## Styling (essential — this defines the look)

**Reset / page**
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `html, body { width:100vw; height:100vh; overflow:hidden; font-family:"Space Mono", monospace; background:#fff; }` — the page is white and does not scroll.
- `a, p, span { text-transform:uppercase; font-size:10px; line-height:100%; cursor:pointer; }`

**Top nav**
- `nav { position:fixed; top:0; width:100%; display:flex; justify-content:space-between; align-items:center; padding:2em; z-index:2; }` — `.menu-toggle` on the left (holds `<p>Menu</p>`), `<p>Collection</p>` on the right.

**Sliding container (off-screen by default)**
- `.container { width:100%; height:100%; }`
- `.menu-container { position:fixed; top:50%; left:-100%; transform:translateY(-50%); padding:1.5em; width:45%; height:100%; display:flex; justify-content:center; align-items:center; z-index:2; transition:left 0.5s cubic-bezier(0.165,0.84,0.44,1); }` — **starts at `left:-100%` (fully off-screen left)**. The slide is a CSS transition on `left`.

**The panel**
- `.menu { width:100%; height:100%; background:#000; color:#fff; border-radius:20px; display:flex; overflow:hidden; }`
- `.menu-main { flex:5; display:flex; flex-direction:column; justify-content:space-between; border-right:1px solid rgba(255,255,255,0.125); }`
- `.menu-sidebar { flex:0.2; display:flex; flex-direction:column; justify-content:space-between; }`
- `.menu-main .menu-top { display:flex; border-top:1px solid rgba(255,255,255,0.125); }`
- `.menu-main .menu-bottom { display:flex; flex-direction:column; }`

**Menu top**
- `.menu-top-title { flex:1; padding:2em; }` (the small `discover` label column)
- `.menu-top-content { padding:1.25em 0; flex:4; display:flex; flex-direction:column; }`
- `.menu-item { position:relative; left:-100px; padding:0.5em 0; transition:left 0.3s; }` — **each item also starts pushed 100px left**, with its own `transition:left 0.3s`.
- `.menu-item-link { position:relative; }`
- `.menu-item-link a { position:relative; text-decoration:none; color:#fff; font-size:48px; font-family:"Bricolage Grotesque", sans-serif; letter-spacing:-2px; font-weight:bold; padding-left:10px; z-index:2; }`
- `.menu-item#active .menu-item-link a { color:#000; }` and `.menu-item:hover .menu-item-link a { color:#000; }` — text goes **black** on hover / on the active item (because a light block appears behind it).

**The chamfered hover block**
- `.bg-hover { position:absolute; top:0; left:0; height:100%; background-color:#fff; clip-path:polygon(0 0, 100% 0, 100% 80%, 95% 100%, 0 100%, 0% 50%); z-index:0; opacity:0; }` — a white block behind the word with a **chamfered bottom-right corner** (that `100% 80% → 95% 100%` cut). Its **width is set by JS** to `linkWidth + 30px`.
- `.menu-item:hover .bg-hover { opacity:1; }` — reveals on hover.
- `.menu-item#active .bg-hover { background-color:aquamarine; opacity:1; }` — the active item's block is **aquamarine (#7FFFD4)** and always visible.

**The sub-label span (character reveal)**
- `.menu-item span { position:absolute; top:0px; padding:1.5em 0; }` — its **`left` is set by JS** to `linkWidth + 40px` (so it sits just right of the word).
- Char colors (SplitType wraps each letter in `.word > .char`):
  - `.menu-item span .word .char { color:#000; }` — default **black on black = invisible**.
  - `.menu-item#active span .word .char { color:#fff; }` — active item's sub-label is **white (always readable)**.
  - `.menu-item span .word .char.char-active { color:#000; }`
  - `.menu-item:hover span .word .char.char-active { color:#fff; }` — on hover, letters that receive the `char-active` class turn **white**, so the sub-label lights up one character at a time.

**Menu bottom (sub-items)**
- `.menu-sub-item { width:100%; display:flex; gap:1em; border-top:1px solid rgba(255,255,255,0.125); padding:1em 2em; }`
- `.menu-title { flex:1; }`; `.menu-content { flex:4; padding-left:2em; }`
- `.menu-content p { position:relative; width:max-content; padding:0.125em; }`
- `.menu-content p::after { content:""; position:absolute; top:0; left:0; width:0%; height:100%; background:#fff; mix-blend-mode:difference; }`
- Hover sweep keyframes:
```css
@keyframes hoverEffect {
  0%, 100% { width:0%; left:0; }
  50% { width:100%; left:0; }
  51% { left:auto; right:0; width:100%; }
  100% { left:auto; right:0; width:0%; }
}
.menu-content p:hover::after { animation:hoverEffect 1s ease forwards; }
```
This runs a `mix-blend-mode:difference` bar that grows left→right to full, then collapses right→left (a highlight wipe across the word) over **1s ease**.

**Sidebar**
- `.close-btn, .logo { padding:1.5em; }`
- `.close-btn { border-bottom:1px solid rgba(255,255,255,0.125); cursor:pointer; }` — top icon is `close-sharp`, bottom is `funnel-sharp`.

**Responsive (`@media (max-width:900px)`):** `.menu-container { width:100%; }`; `.menu-top-content { padding:1.5em; }`; hide `.menu-top-title, .menu-item span, .menu-title, .bg-hover { display:none; }`; force `.menu-item:hover a` and `.menu-item#active a { color:#fff; }`; `.menu-sub-item { padding:1em 0; }`.

## Motion / interaction effect (the important part — be exhaustive)

There is **no GSAP** and **no timeline library**. Everything below is CSS transitions + `setTimeout`/`setInterval` + SplitType. Run all of this inside `document.addEventListener("DOMContentLoaded", …)`.

### 1) SplitType character split (do this first)
Split four selector groups into **words and chars** so every letter is an individually addressable `.char`:
```js
new SplitType(".menu-item a",   { types: "words, chars" });
new SplitType(".menu-item span",{ types: "words, chars" });
new SplitType(".menu-title p",  { types: "words, chars" });
new SplitType(".menu-content p",{ types: "words, chars" });
```

### 2) Per-item measurement (sizing the block + placing the span)
For each `.menu-item`, read `linkEl.offsetWidth` and set inline styles:
- `.bg-hover` width = `linkWidth + 30 + "px"`
- the sibling `span` `left` = `linkWidth + 40 + "px"`

### 3) OPEN sequence — click on `.menu-toggle`
Three things fire together:
1. `menuContainer.style.left = "0%"` → the CSS `transition:left 0.5s cubic-bezier(0.165,0.84,0.44,1)` slides the whole panel in from off-screen (a 0.5s ease-out-expo glide).
2. `shuffleAll()` → run the **scramble** (§5) on every link, sub-title and sub-content simultaneously.
3. `animateMenuItems(items, "in")` → **staggered link cascade** (§4).

### 4) Link cascade — `animateMenuItems(items, direction)`
```js
items.forEach((item, index) => {
  setTimeout(() => {
    item.style.left = direction === "in" ? "0px" : "-100px";
  }, index * 50);
});
```
Each `.menu-item` animates its own `left` from **-100px → 0px** via its CSS `transition:left 0.3s`, but the JS **staggers the trigger by `index * 50ms`** top-to-bottom (item 0 at 0ms, item 5 at 250ms). Closing reverses it: `left` back to **-100px**, same 50ms cascade.

### 5) The text scramble — `addShuffleEffect(element)` (the star)
Given an element already split into `.char`s, snapshot the original letters, then scramble each char through random lowercase a–z and resolve it, later chars scrambling **longer** so the word settles left→right:
```js
function addShuffleEffect(element) {
  const chars = element.querySelectorAll(".char");
  const originalText = [...chars].map((c) => c.textContent);
  const shuffleInterval = 10;   // ms between random-letter swaps
  const resetDelay = 75;        // base ms before a char resolves
  const additionalDelay = 150;  // extra resolve delay per char index

  chars.forEach((char, index) => {
    setTimeout(() => {
      const interval = setInterval(() => {
        char.textContent = String.fromCharCode(97 + Math.floor(Math.random() * 26)); // a–z
      }, shuffleInterval);

      setTimeout(() => {
        clearInterval(interval);
        char.textContent = originalText[index];
      }, resetDelay + index * additionalDelay);
    }, index * shuffleInterval);
  });
}
```
Precise timing per char `i`: it **starts** scrambling at `i * 10ms`, swaps a fresh random a–z glyph every **10ms**, and **stops/resolves** to the real letter at `75 + i * 150ms` after its start. Because the stop time grows by 150ms per index, the first letter settles almost immediately while later letters keep flickering — producing a left-to-right "decoding" wave. (Uppercase display comes from the CSS `text-transform:uppercase`, even though the random glyphs are generated lowercase.)

`shuffleAll()` simply calls `addShuffleEffect` on the resolved target inside every `link` (see §7).

### 6) Per-character color reveal of the sub-label — `colorChars` / `clearColorChars`
On each `.menu-item`, grab `span .char`s and, on the link's hover, add the `.char-active` class one letter at a time:
```js
function colorChars(chars) {
  chars.forEach((char, index) => setTimeout(() => char.classList.add("char-active"), index * 50));
}
function clearColorChars(chars) { chars.forEach((c) => c.classList.remove("char-active")); }
linkEl.addEventListener("mouseenter", () => colorChars(chars));  // sub-label lights up L→R, 50ms/char
linkEl.addEventListener("mouseleave", () => clearColorChars(chars)); // instantly hides again
```
Combined with the CSS char rules, the black-on-black sub-label turns white letter-by-letter (50ms stagger) while hovering, then snaps back to invisible on leave. (On the active item the sub-label is already white, so this is a no-op there.)

### 7) Hover wiring (which elements scramble)
Build the hoverable set:
```js
const links = document.querySelectorAll(
  ".menu-item, .menu-sub-item .menu-title, .menu-sub-item .menu-content"
);
links.forEach((link) => {
  link.addEventListener("mouseenter", (e) => {
    const target = e.currentTarget.querySelector(".menu-item-link a, .menu-title p, .menu-content p");
    if (target) addShuffleEffect(target);        // scramble the main word
    const span = link.querySelector("span");
    if (span) addShuffleEffect(span);            // and its sub-label, if any
  });
});
```
So hovering a `.menu-item` scrambles both its 48px word **and** its sub-label span; hovering a `.menu-title`/`.menu-content` scrambles that small word. The `.menu-content p` additionally fires its CSS `hoverEffect` difference-bar wipe (§Styling) at the same time.

### 8) CLOSE sequence — click on `.close-btn`
`menuContainer.style.left = "-100%"` (panel slides back out over 0.5s) and `animateMenuItems(items, "out")` (links stagger back to -100px, 50ms apart). No scramble on close.

## Assets / images
- **No photographic or illustrative image assets at all** — the piece is pure type + geometry on a black panel over a white page. `assetCount = 0`.
- **Two Ionicons vector glyphs** only, via the CDN web component: `close-sharp` (the X close button) and `funnel-sharp` (the small filter/logo mark below it) in the sidebar. Any equivalent thin sharp-style close + funnel icon works if Ionicons is unavailable.

## Behavior notes
- The whole thing is a **fixed-position widget**; the page never scrolls (`overflow:hidden`, `100vh`). No ScrollTrigger, no scroll interaction of any kind.
- Panel width is **45% on desktop**, **100% under 900px**; on small screens the sub-label spans, the `discover` title column, the sub-item titles and the `bg-hover` block are all hidden, and link text stays white.
- The active item (`#active`, the "gallery" link) is permanently highlighted: aquamarine chamfered block, black word, white always-visible sub-label.
- Motion is **desktop/mouse-oriented** (all reveals are hover-driven); there is no `prefers-reduced-motion` handling in the original.
- The scramble uses raw `setTimeout`/`setInterval` with no cleanup guard, so rapidly re-hovering can stack intervals briefly — that flickery overlap is part of the original's texture; keep it simple, don't add debouncing.
- Everything must be initialized **after** SplitType has wrapped the text (chars must exist before measuring widths and wiring scramble/color handlers).

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`, wires two click handlers and roughly two dozen hover listeners straight onto elements it finds with `document.querySelector`, and never has to undo any of it. React withdraws that guarantee quietly — the panel still slides and the letters still scramble, so nothing looks broken at a glance, and the failure shows up later as drift, not as an error.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Nothing here gets destroyed between those two mounts, so the second pass adds a second copy of everything the first pass built onto the same live DOM: a second `click` listener on `.menu-toggle` and on `.close-btn`, a second `mouseenter`/`mouseleave` pair on every one of the six `.menu-item` link elements, a second `mouseenter` on all twelve entries of the broader hoverable set (the six `.menu-item`s plus the three `.menu-title` and three `.menu-content` sub-items), and — worse — a second `SplitType` pass over `.menu-item a`, `.menu-item span`, `.menu-title p` and `.menu-content p`, each one splitting the `.word`/`.char` spans the first pass already produced instead of the original text. One click on the toggle after that double-mount now runs `animateMenuItems` and `shuffleAll` twice at once, and every later hover fires `addShuffleEffect` twice over spans that no longer hold one character each but a split of a split — so `item.querySelectorAll("span .char")` and `element.querySelectorAll(".char")` return the wrong nodes, or twice as many, and the left-to-right settle stops landing on the real word. It will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener is never called and the effect never runs — no panel, no scramble, nothing to debug. Delete the listener and move its entire body — the four `SplitType` calls, the per-item width measurement, the `colorChars`/`clearColorChars` wiring, the `links` hover wiring, and the `menuToggle`/`closeBtn` click handlers — into a `useEffect` with an empty dependency array.

*(2) Element lookups* — Every lookup here — `.menu-toggle`, `.close-btn`, `.menu-container`, the `.menu-item` NodeList, each item's own `.menu-item-link a` / `.bg-hover` / `span` / `span .char` queries, and the combined `links` selector — assumes this component owns the document. Give the component a root `ref` and resolve all of it from there instead of from `document`. That includes the four `SplitType` calls: handed a plain string like `".menu-item a"`, `SplitType` queries `document.querySelectorAll` internally, unscoped — hand it the elements themselves instead, via `root.querySelectorAll(".menu-item a")`, so it only ever touches this component's own copy of the markup. The scoping is not cosmetic during the StrictMode remount: two copies of the panel exist for an instant, and an unscoped `SplitType` call or an unscoped `.menu-toggle` lookup can bind to the copy that is on its way out.

*(3) Cleanup* — There is no GSAP anywhere in this component, so there is no `gsap.context` to hang a single `.revert()` off. Everything has to be tracked and undone by hand: an `AbortController` for the listeners, a shared registry for the raw `setTimeout`/`setInterval` handles `animateMenuItems` and `addShuffleEffect` create, and the four `SplitType` instances' own `.revert()`.

```jsx
useEffect(() => {
  const root = rootRef.current;
  const controller = new AbortController();
  const { signal } = controller;
  const timers = new Set();
  const after = (fn, delay) => { const id = setTimeout(fn, delay); timers.add(id); return id; };
  const every = (fn, delay) => { const id = setInterval(fn, delay); timers.add(id); return id; };

  const link = new SplitType(root.querySelectorAll(".menu-item a"), { types: "words, chars" });
  const span = new SplitType(root.querySelectorAll(".menu-item span"), { types: "words, chars" });
  const menuTitle = new SplitType(root.querySelectorAll(".menu-title p"), { types: "words, chars" });
  const menuContent = new SplitType(root.querySelectorAll(".menu-content p"), { types: "words, chars" });

  // per-item width measurement, animateMenuItems, addShuffleEffect and colorChars exactly
  // as above, with every setTimeout/setInterval call routed through after(...)/every(...)
  // and every addEventListener call passed { signal } as its options argument

  root.querySelector(".menu-toggle").addEventListener("click", openMenu, { signal });
  root.querySelector(".close-btn").addEventListener("click", closeMenu, { signal });

  return () => {
    controller.abort();
    timers.forEach((id) => { clearTimeout(id); clearInterval(id); });
    link.revert();
    span.revert();
    menuTitle.revert();
    menuContent.revert();
  };
}, []);
```

`controller.abort()` removes every listener registered with that `signal` in a single call — the two click handlers and the twenty-four hover listeners (two per each of the six `.menu-item` link elements, plus one more on each of the twelve entries in `links`) alike — which is the only realistic way to undo this many `addEventListener` calls by hand. `clearTimeout` and `clearInterval` accept either kind of handle interchangeably, so one `Set` is enough to cancel whatever is still pending: a `.menu-item` cascade mid-flight, or a scramble whose per-char `setInterval` is still swapping in random letters because the route unmounted mid-hover. Reverting the four splits matters even outside StrictMode: `SplitType`'s own `.revert()` restores the original text nodes, so if this component is ever conditionally unmounted and remounted, the effect splits real text again instead of splitting its own leftover `.word`/`.char` wrapping into one more layer of nesting.

The per-item width measurement — `linkElement.offsetWidth`, used to size `.bg-hover` and to place the sub-label `span` — has to run after the four splits and after **Bricolage Grotesque** has actually painted. `SplitType` and `offsetWidth` both measure whatever face is on screen the instant they run, and this component leans on that measurement twice: once for the split's own line boxes, once more for the chamfered block's pixel width and the span's offset. Gate the whole setup behind `document.fonts.ready`, keep the effect itself synchronous, and flip a `cancelled` flag in the cleanup so a `.then()` that resolves after a StrictMode unmount does not go on to split and measure elements this component no longer owns.
