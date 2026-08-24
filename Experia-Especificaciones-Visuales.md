# Experia · CEINFES — Especificaciones visuales

Sistema de diseño de la plataforma, extraído del código real (`src/styles.css`, `src/components/ui.jsx`, `index.html`). Pensado para reimplementarlo en otra plataforma sin tener el repo delante.

> **Cómo leerlo.** Todo lo que aparece como `--variable` es una CSS custom property que existe hoy en producción. Los bloques de código son copiar-y-pegar: no son ejemplos ilustrativos, son los valores vigentes.

---

## 1. Identidad

Paleta corporativa CEINFES. Los nombres son los del brandbook, no inventados.

| Nombre de marca | Token | Valor | Uso |
|---|---|---|---|
| Naranja Evolución | `--orange` | `#EC671A` | Color primario. Acciones, foco, progreso |
| Naranja Conocimiento | `--orange-light` | `#F59E33` | Estados hover y realces suaves |
| Morado Formación (PANTONE 3574 C) | `--purple` | `#5E4F9C` | Acento secundario **por defecto** |
| Azul Pensamiento (PANTONE 7455 C) | — | `#3A5BA7` | Acento alternativo |
| Verde Transformación (PANTONE 7722 C) | — | `#024B4E` | Acento alternativo |

`theme-color` del navegador: `#E8732C`. Idioma del documento: `es`.

**El acento secundario es intercambiable por el usuario**; el naranja no. Si portas esto, el naranja es la identidad y el morado/azul/verde son preferencia.

---

## 2. Tipografía

**Inter Variable**, auto-alojada (`/fonts/InterVariable.ttf`), un solo archivo que cubre los pesos 100–900. Se precarga en el `<head>` para evitar el parpadeo de fuente (FOUC).

```css
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('/fonts/InterVariable.ttf') format('truetype');
}

--font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

En otra plataforma sirve igual `https://fonts.googleapis.com/css2?family=Inter:wght@100..900`.

**Reglas base**

```css
body { line-height: 1.55; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
h1, h2, h3 { letter-spacing: -.02em; }
```

**Escala observada.** ⚠️ No existen tokens de tipografía: los tamaños se escriben inline en cada componente. Esta escala es la que *de hecho* se usa, por frecuencia real en el código — no un sistema formal:

| px | Frecuencia | Dónde |
|---|---|---|
| 11–13 | dominante (~180 usos) | Etiquetas, metadatos, tablas, chips |
| 14 | 55 usos | Texto de interfaz, botón `md` |
| 15–18 | ~20 usos | Subtítulos, título de modal (18/700) |
| 20–22 | ~19 usos | Encabezados de sección |
| 40 / 56 | ~13 usos | Cifras grandes y héroes |

Pesos habituales: `600` (botones, énfasis), `700` (títulos, cifras).

---

## 3. Color — modo claro (base)

```css
:root {
  /* Marca */
  --orange: #EC671A; --orange-light: #F59E33; --orange-pale: #FDDBBC;
  --orange-bg: #FEF0E6; --orange-50: #FFF8F2;

  /* Acento secundario (Morado Formación por defecto) */
  --accent-rgb: 94, 79, 156;
  --purple: #5E4F9C; --purple-deep: #45397A; --purple-light: #8A7FBD;
  --purple-bg: rgba(var(--accent-rgb), .10);
  --grad-mid: #C0538A;   /* transición cálida morado -> naranja */

  /* Texto */
  --dark: #1A1A2E; --text: #2D2D44; --text-sec: #4A4A5E;
  --muted: #6B7280; --subtle: #9CA3AF;

  /* Superficies */
  --border: #E5E7EB; --bg-alt: #F3F4F6; --bg: #F9FAFB; --white: #FFFFFF;

  /* Semánticos */
  --success: #0D9488; --warn: #F59E0B; --error: #EF4444;
  --success-bg: #F0FDFA; --success-bg-strong: #CCFBF1; --success-border: #5EEAD4;
  --error-bg: #FEF2F2; --error-bg-strong: #FEE2E2;
  --info-bg: #EFF6FF; --warn-bg: #FFFBEB; --violet-bg: #EDEAF7;

  /* Alias históricos: hoy son colores sólidos, no degradados.
     Se conservan los nombres para no romper usos existentes. */
  --gradient: var(--purple);
  --gradient-orange: var(--orange);
  --gradient-soft: var(--orange-bg);
  --gradient-text: var(--orange);
}
```

> **`--white` no es blanco.** Es "la superficie de tarjeta", y en modo oscuro vale `#1C1B28`. Si al portar lo tratas como blanco literal, el modo oscuro se rompe entero. Lo mismo con `--dark`, que en oscuro es texto claro.

---

## 4. Color — modo oscuro

Se activa con `<html data-theme="dark">`. **No es un filtro del modo claro**: las superficies son gris-violeta desaturado (tinte de marca), escalonadas parejo. Un azul-marino frío chocaba con el naranja y el esmeralda.

```css
[data-theme="dark"] {
  color-scheme: dark;

  /* Texto off-white, no blanco puro: reduce el deslumbramiento */
  --dark: #E7E7EF; --text: #D2D2DD; --text-sec: #ABABBC;
  --muted: #9090A2; --subtle: #61617A;

  --border: #2B2A3B; --bg-alt: #211F2D; --bg: #15141D; --white: #1C1B28;

  --orange-bg: rgba(232,115,44,.12); --orange-50: rgba(232,115,44,.07);
  --orange-pale: rgba(232,115,44,.36);
  --purple-bg: rgba(var(--accent-rgb), .20);

  --success: #2DD4BF;
  --success-bg: rgba(13,148,136,.13); --success-bg-strong: rgba(13,148,136,.22);
  --success-border: rgba(45,212,191,.34);
  --error-bg: rgba(239,68,68,.11); --error-bg-strong: rgba(239,68,68,.19);
  --info-bg: rgba(59,130,246,.13); --warn-bg: rgba(245,158,11,.13);
  --violet-bg: rgba(139,92,246,.18);

  --glass-bg: rgba(21,20,29,.74);
  --glass-border: rgba(255,255,255,.07);
  --shimmer: rgba(255,255,255,.06);
}
```

Dos reglas que acompañan al modo oscuro:

- **El logo pasa a silueta blanca:** `filter: brightness(0) invert(1)`.
- **El certificado siempre es claro.** Es un documento imprimible: redefine los tokens dentro de `#certificate` para ignorar el tema activo.

---

## 5. Acentos alternativos

`<html data-accent="azul | esmeralda">`. Sin atributo = morado.

```css
[data-accent="azul"] {       /* Azul Pensamiento */
  --accent-rgb: 58, 91, 167;
  --purple: #3A5BA7; --purple-deep: #2B4485; --purple-light: #7090CC;
  --grad-mid: #9A5CB8;
}
[data-accent="esmeralda"] {  /* Verde Transformación */
  --accent-rgb: 2, 75, 78;
  --purple: #024B4E; --purple-deep: #013738; --purple-light: #3D8E8A;
  --grad-mid: #8CCAAE;
}
```

`--accent-rgb` existe aparte del hex porque varios tintes se componen con `rgba(var(--accent-rgb), α)`. Al portar, mantén las dos formas sincronizadas.

---

## 6. Alto contraste

`<html data-contrast="alto">`. Sube el contraste de bordes, texto secundario y naranja hasta cumplir **WCAG AA 4.5:1 en todos los tamaños de texto**.

```css
[data-contrast="alto"] {
  --orange: #B84E00;      /* 4.5:1 sobre blanco */
  --orange-light: #9A5E00; --orange-pale: #FFD1A8;
  --muted: #374151; --subtle: #4B5563; --text-sec: #1F2937;
  --border: #6B7280;      /* bordes más visibles */
  --bg-alt: #EBEBEB;
  --success: #0F766E;
}
[data-contrast="alto"][data-theme="dark"] {
  --orange: #FFAA66; --orange-light: #FFC080;
  --muted: #D1D5DB; --subtle: #9CA3AF; --border: #9CA3AF;
  --bg-alt: #2D2B40; --success: #5EEAD4;
}
```

---

## 7. Paleta de gráficas

Ocho tonos para series y categorías, **en orden fijo**.

```css
:root {
  --viz-1: #2A78D6;  /* azul     */   --viz-5: #E87BA4;  /* magenta  */
  --viz-2: #EB6834;  /* naranja  */   --viz-6: #008300;  /* verde    */
  --viz-3: #1BAF7A;  /* aqua     */   --viz-7: #4A3AA7;  /* violeta  */
  --viz-4: #EDA100;  /* amarillo */   --viz-8: #E34948;  /* rojo     */
}
[data-theme="dark"] {
  --viz-1: #3987E5; --viz-2: #D95926; --viz-3: #199E70; --viz-4: #C98500;
  --viz-5: #D55181; --viz-6: #008300; --viz-7: #9085E9; --viz-8: #E66767;
}
```

> ⚠️ **Esta paleta se validó como conjunto**, no color por color: lightness, croma, separación para daltonismo y contraste sobre las dos superficies reales (`#FFFFFF` y `#1C1B28`). Los valores oscuros **no son un filtro** de los claros, son su propio paso.
>
> La peor pareja adyacente queda en **ΔE 9.1 (protanopía)** — por debajo de lo cómodo. Es aceptable *solo* porque cada barra lleva **siempre** su nombre y su valor en texto: la identidad de la serie nunca depende del color. **Si portas esta paleta, porta también esa regla**, o el gráfico deja de ser accesible.
>
> Cambiar un color obliga a revalidar el conjunto completo.

---

## 8. Radios, sombras y superficies

```css
--r-sm: 8px; --r-md: 12px; --r-lg: 16px; --r-xl: 24px; --r-full: 9999px;
```

Sombras con tinte de marca (azul-violeta `26,26,46`), no gris neutro:

```css
--sh-sm: 0 1px 2px rgba(26,26,46,.04), 0 1px 3px rgba(26,26,46,.06);
--sh-md: 0 2px 4px rgba(26,26,46,.04), 0 6px 16px rgba(26,26,46,.08);
--sh-lg: 0 4px 8px rgba(26,26,46,.05), 0 12px 32px rgba(26,26,46,.10);
--sh-xl: 0 8px 16px rgba(26,26,46,.06), 0 24px 56px rgba(26,26,46,.16);
--sh-orange: 0 8px 24px -8px rgba(236,103,26,.45);
--sh-purple: 0 8px 24px -8px rgba(var(--accent-rgb), .40);
```

En modo oscuro son un punto más suaves, para evitar halos duros: `--sh-md: 0 2px 4px rgba(0,0,0,.30), 0 6px 16px rgba(0,0,0,.34)` (y análogos).

**Glassmorphism**

```css
--glass-bg: rgba(255,255,255,.72);
--glass-border: rgba(255,255,255,.55);
--glass-blur: saturate(1.5) blur(16px);
--shimmer: rgba(255,255,255,.75);

.glass {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
}
```

---

## 9. Layout

```css
--sidebar-w: 260px;   /* 280px en móvil */
--header-h: 64px;     /*  56px en móvil */
```

Barra lateral + header en escritorio; overlay en móvil. **Punto de quiebre único: 768px** (`useMobile(768)`).

```css
html, body, #root { height: 100%; width: 100%; overflow: hidden }
table { min-width: 560px }   /* las tablas hacen scroll, no comprimen */
@media (max-width: 767px) { button, a { min-height: 40px } }
```

⚠️ **No hay escala de espaciado tokenizada.** Los paddings y gaps se escriben inline. Los valores que más se repiten son `6 · 8 · 12 · 16 · 18 · 20 · 24` px. Si vas a otra plataforma, este es el punto donde conviene formalizar una escala en lugar de copiar el estado actual.

---

## 10. Movimiento

```css
--ease:        cubic-bezier(.4, 0, .2, 1);      /* estándar */
--ease-out:    cubic-bezier(.16, 1, .3, 1);     /* entradas, elevación */
--ease-spring: cubic-bezier(.34, 1.56, .64, 1); /* rebote */
```

Duraciones típicas: `.15s` (foco), `.2s` (hover), `.25–.35s` (entradas de página y modales), `.8s` (barras y anillos de progreso).

**Keyframes del sistema:** `fadeIn` · `fadeUp` · `fadeDown` · `slideR` · `slideL` · `scaleIn` · `modalIn` · `sheetIn` · `pageIn` · `pulse` · `glow` · `float` · `confetti` · `xpPop` · `shimmer` · `spin` · `nodePing` · `shake` · `drawPath` · `badgePop` · `progressFill` · `heroFloat` · `gradientShift` · `logoPulse`.

**Utilidades**

```css
.hover-lift:hover { transform: translateY(-3px); box-shadow: var(--sh-lg) }
.btn-press:active:not(:disabled) { transform: translateY(0) scale(.97) !important; transition-duration: .08s }
.page-enter { animation: pageIn .35s var(--ease-out) }
.skeleton::after { /* barrido shimmer 1.4s infinito */ }
```

> `.page-enter` **no lleva `fill-mode`** a propósito: al terminar, el `transform` vuelve a `none`. Si se quedara aplicado, crearía un *containing block* que rompe los modales con `position: fixed`. Es un detalle fácil de perder al portar.

---

## 11. Componentes

### Botón

7 variantes × 3 tamaños. Base: `inline-flex`, `gap: 8`, `font-weight: 600`, `border-radius: var(--r-md)`, sin borde.

| Tamaño | Padding | Fuente |
|---|---|---|
| `sm` | `8px 16px` | 13 |
| `md` | `11px 22px` | 14 |
| `lg` | `14px 32px` | 16 |

| Variante | Fondo | Texto | Sombra |
|---|---|---|---|
| `primary` | `--gradient-orange` | `#fff` | `--sh-orange` |
| `secondary` | `--bg-alt` | `--text` | — |
| `outline` | transparente | `--orange` | `inset 0 0 0 2px var(--orange)` |
| `ghost` | transparente | `--muted` | — |
| `gradient` | `--gradient` | `#fff` | `--sh-purple` |
| `white` | `#fff` | `#1A1A2E` | `--sh-sm` |
| `danger` | `--error` | `#fff` | — |

Hover: `translateY(-1.5px)` + `filter: brightness(1.05)` + sombra ampliada (`primary` → `0 10px 28px -8px rgba(232,103,26,.55)`).
Deshabilitado: `opacity: .5` + `pointer-events: none`.

### Modal

- Overlay `rgba(15,15,30,.45)` + `backdrop-filter: blur(10px) saturate(1.2)`, `z-index: 5000`.
- Escritorio: centrado, `max-width: 560px` (configurable), `border-radius: var(--r-xl)`, animación `modalIn .3s`.
- Móvil: **hoja inferior** — pegado abajo, `border-radius: 24px 24px 0 0`, ancho completo, `max-height: 92vh`, animación `sheetIn .35s`.
- Cabecera *sticky* con fondo glass y `border-bottom: 1px solid var(--border)`; título 18/700.
- Botón de cierre: 32×32, `--bg-alt`, **rota 90° al hover**.
- Bloquea el scroll del body mientras está abierto.

### Progreso

- **Anillo:** SVG rotado −90°, `size` 56 por defecto, grosor 4, `stroke-linecap: round`, pista `--border`, transición `.8s`.
- **Barra:** altura 8, `border-radius` = altura, relleno con transición `width .8s var(--ease-out)`.

### Skeleton

`background: var(--bg-alt)`, radio `--r-sm`, barrido `shimmer` de 1.4 s. Siempre `aria-hidden="true"`.

---

## 12. Temas inmersivos de curso

`<html data-course-theme="...">`. Redefinen los tokens globales, así que **todos los componentes se adaptan sin tocarlos**. Cuando hay tema de curso activo, el interruptor claro/oscuro se deshabilita.

| Tema | Fondo | Acento | Texto | Carácter |
|---|---|---|---|---|
| `detective` | `#0A0A0F` | ámbar `#D4A017` | crema `#EDE8DC` | Noir: lluvia, parpadeo de lámpara, sellos, máquina de escribir |
| `escape-room` | `#080E08` | ámbar `#F0A500` | `#D8CCAA` | Verde-ámbar, éxito `#00C853` |
| `lab` | `#04080F` | verde neón `#00FF88` | `#C0F0D8` | Cian `#00D4FF`, violeta `#7B2FFF` |
| `time-travel` | `#030510` | oro `#C9A227` | `#D4C8E8` | Azul `#5B8DD9`, violeta `#A855F7` |

Los cuatro son oscuros y declaran `color-scheme: dark`. Cada uno remapea como mínimo: `--bg`, `--white`, `--border`, `--text`, `--muted`, `--dark`, `--orange*`, `--purple*`, `--success` y las sombras `--sh-md` / `--sh-lg`.

⚠️ **Aquí `--gradient*` sí son degradados de verdad**, a diferencia del tema base donde son colores sólidos. Ejemplo (detective):

```css
--gradient: linear-gradient(125deg, #1C1208 0%, #3A2A10 35%, #6B4A20 65%, #D4A017 100%);
```

Si tu plataforma destino asume que `--gradient` es un color plano, estos cuatro temas se rompen.

---

## 13. Accesibilidad

No es opcional en esta plataforma; está cableado.

**Anillo de foco de doble contorno**, visible sobre cualquier fondo:

```css
:focus { outline: none }
:focus-visible {
  outline: 2px solid var(--orange);
  outline-offset: 3px;
  border-radius: 4px;
  box-shadow: 0 0 0 5px rgba(255,255,255,.85), 0 0 0 7px var(--orange);
}
[data-theme="dark"] :focus-visible {
  box-shadow: 0 0 0 5px rgba(18,18,32,.9), 0 0 0 7px var(--orange);
}
```

**Skip link** — oculto hasta recibir foco, primer elemento del `<body>`:

```css
.skip-link { position: absolute; top: -100%; left: 12px; z-index: 10000;
  padding: 10px 20px; background: var(--orange); color: #fff;
  font-size: 15px; font-weight: 700; border-radius: 0 0 12px 12px;
  box-shadow: var(--sh-lg); transition: top .15s var(--ease) }
.skip-link:focus { top: 0 }
```

**Movimiento reducido** — se respeta la preferencia del sistema:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
  html { scroll-behavior: auto }
}
```

**Otros:** objetivos táctiles mínimos de 40 px en móvil, `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation` (excepto en campos de formulario), y `::selection` con `--orange-pale`.

---

## 14. Mecanismo de theming

Tres atributos independientes y combinables en `<html>`:

| Atributo | Valores | `localStorage` |
|---|---|---|
| `data-theme` | `dark` (ausente = claro) | `experia-theme` |
| `data-accent` | `azul`, `esmeralda` (ausente = morado) | `experia-accent` |
| `data-contrast` | `alto` (ausente = normal) | `experia-contrast` |
| `data-course-theme` | `detective`, `escape-room`, `lab`, `time-travel` | (lo fija el curso) |

Se aplican con un script **bloqueante en el `<head>`, antes del primer paint**, para evitar el flash de tema equivocado.

> **Regla de producto, no de estilo:** el modo oscuro solo se aplica si hay sesión de Supabase activa. Sin sesión, la landing y el login son **siempre** claros. El script detecta la sesión buscando una clave `sb-*-auth-token` en `localStorage`.

---

## 15. Notas de portabilidad

Lo que **no** se traduce solo al llevarlo a otra plataforma:

1. **Todo el estilo es inline + variables CSS.** No hay clases de utilidad, ni CSS Modules, ni Tailwind. La ventaja es aislamiento total; el costo es que no hay escala de espaciado ni de tipografía que puedas importar. Formalízalas al portar.
2. **`--white` y `--dark` son roles, no colores.** Se invierten en modo oscuro.
3. **`--gradient*` cambia de naturaleza** según el tema: color sólido en el tema base, degradado real en los temas inmersivos.
4. **La paleta de gráficas exige rótulos de texto.** Sin ellos no cumple accesibilidad para daltonismo.
5. **`.page-enter` no puede llevar `fill-mode`** o rompe los modales fijos.
6. Los cuatro temas inmersivos son **remapeos de token**, no hojas de estilo aparte. Si tu destino no soporta redefinir variables por atributo del `<html>`, habrá que reconstruir ese mecanismo antes que nada.
