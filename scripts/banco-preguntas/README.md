# Banco de preguntas de las rondas en vivo

Convierte los Word del equipo académico en `src/lib/questionBank.json` (lo que
lee el editor de ruta) y en las imágenes de `public/preguntas/`.

```bash
pip install pillow                      # una sola vez
python scripts/banco-preguntas/build.py # Word → banco + imágenes
node scripts/build-rondas.mjs           # banco → migración 0075 (rondas predeterminadas)
node scripts/test-migraciones/run-rondas.mjs   # probar la migración antes de correrla
```

## Fuente

`scripts/data/banco-preguntas/`: `matematicas.docx`, `lectura-critica.docx`,
`ciencias-naturales.docx` (biología, química y física en un solo documento, en
dos partes). Las claves salen de las tablas de respuestas de cada documento.

## Qué hace cada paso

| Script | Qué hace |
|---|---|
| `dump.py` | Vuelca el .docx a texto: listas, tablas, imágenes y ecuaciones (OMML → texto lineal). |
| `parse.py` | Separa pregunta por pregunta, opciones, clave, justificación y los textos de lectura compartidos. |
| `curate.py` | Lo editorial: correcciones de transcripción, **pistas** (las escribe el script, una por pregunta), explicaciones de Ciencias parte 1, preguntas a revisar, dificultad, tiempos y rondas predeterminadas. |

## Decisiones que conviene saber

- **Dificultad al azar (provisional).** El equipo académico aún no la definió:
  `curate.py` la asigna con semilla fija (`random.Random(2026)`), así que
  regenerar no la baraja de nuevo. Cuando llegue la real, ponerla por id en
  `curate.py` en vez del azar.
- **Preguntas corregidas respecto al Word** (en `FIX`, con un comentario cada
  una): mat-01 (la opción clave se contradecía), mat-02 (la tabla no duplicaba
  las medidas), mat-20 (la figura no daba 14 cm: ahora el enunciado da los
  tramos y la respuesta es 9 cm), bio-05 (“depredación” → mimetismo engañoso) y
  qui-10 (dos respuestas posibles: mercurio → hierro y datos reales del cloro).
  En fis-21 se quitó la imagen porque dibujaba la desviación al revés de la
  clave. Si aparece otra pregunta dudosa, `REVIEW` la deja en el banco con
  "⚠️ Revisar" y fuera de las rondas predeterminadas.
- **Ids estables** (`mat-01`, `lec-37`…): son el id de la pregunta dentro del
  módulo. Cambiar el orden del Word cambia los ids — si ya hay rondas en uso,
  agregar las preguntas nuevas al final.
- **Lectura**: cada pregunta lleva su texto copiado (`passage`), porque en el
  módulo las preguntas se eligen sueltas.
- **Ciencias Sociales** no tiene documento todavía: al llegar, agregarlo a
  `build.py` (`DOCS`), a `parse.py` y a `AREAS`/`HINTS` en `curate.py`, y la
  familia en `scripts/build-rondas.mjs`.
