# Fase 1 — Curaduría del corpus normativo

Cómo subir los PDF oficiales al bucket `corpus-normativo` (migración `0058`).

## Dónde se sube

**Dashboard de Supabase → Storage → `corpus-normativo`.**

El bucket lo crea la migración `0058_bucket_corpus_normativo.sql`. Si no aparece
en la lista, es que esa migración todavía no se ha corrido en el SQL Editor.

Subes desde el dashboard, no desde la app: tu sesión de admin del proyecto no
pasa por las policies de RLS. Un docente logueado en Experia **no puede** subir
nada aquí, y es a propósito — quien pueda meter un PDF en este bucket puede
meter texto que el agente citará después como si fuera ley.

## Cómo se organiza

Crea la carpeta al subir (en el dashboard, botón *Create folder*). La ruta no es
libre: el pipeline de extracción recorre el bucket por prefijo y
`corpus.normativo.storage_path` apunta a ella.

```
{tipo_norma}/{slug}/{archivo}.pdf
```

`{tipo_norma}` usa exactamente los valores del CHECK de la tabla:
`ley` · `decreto` · `dba` · `ebc` · `lineamiento`.

Ejemplos:

```
ley/ley-115-1994/ley-115-1994.pdf
decreto/decreto-1850-2002/decreto-1850-2002.pdf
dba/dba-matematicas/dba-matematicas.pdf
ebc/ebc-lenguaje/ebc-lenguaje.pdf
```

La columna `storage_path` de `inventario-corpus.csv` ya trae la ruta exacta de
cada documento. Cópiala tal cual.

## El inventario

`inventario-corpus.csv` — ábrelo en Excel (Datos → Desde texto/CSV, delimitador
coma, codificación UTF-8) o edítalo como texto plano.

| columna | qué va |
|---|---|
| `prioridad` | P0 = imprescindible para el primer plan generado; P1 = necesario para cobertura por área; P2 = enriquece |
| `tipo_norma`, `slug`, `storage_path` | **ya vienen puestos** — no los cambies, la ingesta depende de ellos |
| `tipo_estructura` | decide qué parser usa la Fase 3: `articulado` (regex por artículo), `tabular_por_grado` (DBA), `matriz_competencias` (EBC) |
| `url_oficial` | **la llenas tú al descargar.** Va vacía a propósito: no invento enlaces de sitios de gobierno, y hay que verificar en la fuente que sea la versión vigente y no una compilación de un tercero |
| `fecha_descarga`, `paginas` | los anotas al subir; sirven para saber cuándo toca revisar vigencia |
| `escaneado` | `si` / `no`. Si el PDF es imagen (no puedes seleccionar el texto), la Fase 2 necesita OCR: `ocrmypdf -l spa entrada.pdf salida.pdf` |
| `estado` | `pendiente` → `descargado` → `subido` → `extraido` → `chunkeado` |

## Orden sugerido

Empieza por los tres **P0**. Con Ley 115 + Decreto 1850 + Decreto 1075 Libro 2
Parte 3 ya se puede generar un plan de estudio fundamentado en lo esencial
(áreas obligatorias e intensidad horaria); los DBA y EBC agregan el detalle por
área y grado.

No hace falta subir todo antes de seguir: la Fase 2 puede arrancar en cuanto
estén los P0 arriba.

## Al terminar

Avísame con el inventario actualizado y sigo con la Fase 2 (extracción de texto
con PyMuPDF). Ojo: **Python no está instalado en esta máquina** — lo verifiqué
al probar las migraciones. Habrá que instalarlo, o hacer la extracción en Node.
Lo resolvemos cuando lleguemos ahí.
