# Tipografía corporativa — Inter (auto-alojada)

La plataforma usa **Inter** como fuente principal, cargada desde esta carpeta
mediante `@font-face` en `src/styles.css`.

## Cómo está configurada

Se usa la **fuente variable** `InterVariable.ttf` (un solo archivo que cubre
todos los pesos 100–900 con tamaño óptico automático). No se necesitan archivos
estáticos por peso.

```
public/fonts/InterVariable.ttf   ← único archivo de fuente requerido
```

Fuente oficial: https://github.com/rsms/inter (v4.1, licencia SIL OFL).

## Verificar

1. `npm run dev`
2. Abre la app → DevTools → pestaña **Network**, filtro **Font**.
3. Debe cargar `InterVariable.ttf` con estado 200.

## Notas

- No hacen falta las cursivas: la plataforma casi no las usa (las citas usan Georgia).
- Si en el futuro quieres cursivas variables, agrega `InterVariable-Italic.ttf`
  y un segundo `@font-face` con `font-style: italic`.
