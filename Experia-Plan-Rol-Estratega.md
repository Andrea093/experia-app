# Plan — Rol Estratega en Experia

> Ajuste de `IMPLEMENTACION_ROL_ESTRATEGA.md` al código real de Experia.
> La especificación original describe bien **qué** construir; este documento
> corrige **cómo**, porque asume una arquitectura que este proyecto no tiene.

---

## 1. Lo que la especificación asume y no se cumple

Verificado contra el código, no supuesto:

| La spec asume | La realidad de Experia | Consecuencia |
|---|---|---|
| TypeScript (`.tsx`) | **Todo es `.jsx`** — no hay TS en el proyecto | Renombrar todos los componentes propuestos |
| `src/features/estratega/` | Convención real: `src/pages/` + `src/components/` | Reubicar el árbol de archivos |
| Rutas tipo `/estratega?tab=pipeline` | **Hash routing** (`#/page/nodeId`), sin query params | Las tabs van en estado local |
| Chart.js o recharts | **No hay ninguna librería de gráficas.** Dependencias: dicebear, supabase, react, react-dom, xlsx | Decisión pendiente (§4) |
| RLS con `auth.jwt() ->> 'role'` | El rol vive en `profiles.role`; hay helpers `is_admin()` / `is_instructor()` SECURITY DEFINER | Reescribir todas las policies |

Ninguna es bloqueante, pero copiar la spec tal cual produce código que no compila
ni corre.

---

## 2. La decisión de fondo: ¿rol nuevo o variante de interfaz?

Experia ya resolvió un caso casi idéntico —el **tutor clon**— y lo resolvió
*sin crear un rol*. La migración `0051` agregó `profiles.ui_variant` con este
comentario explícito:

> `'Variante de interfaz del piloto temporal (0051). null = interfaz normal;
> ''clone'' = modo clon. NO es un rol: los permisos los sigue dando
> profiles.role.'`

**Para Estratega la respuesta es la contraria: sí debe ser un rol.** El tutor
clon ve los mismos datos que un instructor con otra interfaz; el estratega
necesita ver **datos que hoy nadie puede ver** (ejecución presupuestal por
colaborador). Eso es un permiso nuevo, no una piel nueva.

```sql
alter type public.user_role add value if not exists 'estratega';
```

### ⚠️ Dos trampas de esto

**a) No se puede usar el valor en la misma migración que lo crea.** Postgres
prohíbe usar un valor de enum recién agregado dentro de la misma transacción.
La migración que hace `ADD VALUE` debe ir **sola**, y la que asigna el rol o
crea `is_estratega()` va en otra.

**b) El frontend trata a los roles desconocidos como estudiante.** Hoy hay
cadenas como:

```js
role === 'admin' ? adminItems : role === 'instructor' ? instructorItems : studentItems
```

Un `estratega` caería en el `else` y vería la interfaz de estudiante — sin
curso, sin ruta, probablemente con errores. **Hay que auditar todos los
`role ===` del frontend antes de asignar el rol a alguien**, no después.

---

## 3. Migraciones (numeración: siguen 0061 en adelante)

| # | Contenido | Nota |
|---|---|---|
| `0061` | `alter type user_role add value 'estratega'` | **Sola**, por la trampa (a) |
| `0062` | `is_estratega()` + las 4 tablas + RLS + trigger `updated_at` | El grueso |
| `0063` | Seed de datos reales | Aparte: es data, no esquema |

### El helper de permisos

Calcado de `is_admin()` (0001), no inventado:

```sql
create or replace function public.is_estratega() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                  where id = auth.uid() and role = 'estratega');
$$;
```

Y las policies quedan así, no como en la spec:

```sql
create policy estratega_lectura on public.estratega_finanzas
  for select using (public.is_estratega() or public.is_admin());
```

### Las tablas

Se toman las cuatro de la spec (§2.1–2.4) **con dos cambios**:

1. **`estratega_colaboradores` desde el día uno**, no como "mejora
   recomendada". La spec ya detecta que `'Julian Bedoya'` y `'Julián Bedoya'`
   son la misma persona con dos grafías; con texto libre eso se multiplica en
   cada carga mensual. Y hace falta para el punto §6.
2. Prefijo `estratega_` conservado — es coherente con `clone_*` de 0051.

---

## 4. Las gráficas: la decisión que hay que tomar

**El proyecto no tiene librería de gráficas.** `AdminAnalytics.jsx` dibuja las
suyas a mano con SVG, y `ui.jsx` ya trae `ProgressRing` y `ProgressBar`.

| Opción | A favor | En contra |
|---|---|---|
| **SVG a mano** (recomendada) | Cero dependencias nuevas; consistente con `AdminAnalytics`; el dona y las barras dobles son simples | ~150 líneas de trabajo propio |
| Agregar Chart.js | Rápido de escribir | +200 KB al bundle, primera dependencia de UI del proyecto, tema oscuro y paleta hay que configurarlos aparte |

Recomiendo **SVG a mano**: los dos gráficos que pide la spec (dona de estados y
barras presupuestado-vs-ejecutado) son de los más simples que existen, y meter
una librería de gráficas por dos gráficos es caro en un bundle que hoy pesa
poco.

Si se hace, la **paleta debe salir de `--viz-1..8`** (documentadas en
`Experia-Especificaciones-Visuales.md`), no de los colores del HTML original.
Esa paleta ya está validada para daltonismo y para los dos temas.

---

## 5. Estructura de archivos (convención real)

```
src/pages/
  Estratega.jsx              -- shell + tabs (estado local, no query param)
src/components/estratega/
  FiltrosGestores.jsx
  KpiCards.jsx
  DonutEstados.jsx           -- SVG propio
  BarrasEjecucion.jsx        -- SVG propio
  GestorCard.jsx
  TablaEntregables.jsx
  PipelineHeatmap.jsx
  ProductoDrawer.jsx
  ChecklistFase.jsx
  ModalNuevaIniciativa.jsx
  reglasUrgencia.js          -- PURO, sin React (patrón de lib/effectiveness.js)
```

Puntos de integración obligatorios (si falta uno, la página no aparece):

1. `src/app.jsx` — `if (page === 'estratega') return <EstrategaPage />` con lazy
2. `src/components/Sidebar.jsx` — `estrategaItems` + la rama `role === 'estratega'`
3. `src/store/store.jsx` — cargar los datos en la sesión, o hacer fetch por página
4. Etiqueta y color de rol en el header (`Sidebar.jsx:86-91`)

**`reglasUrgencia.js` va como módulo puro**, siguiendo el patrón de
`lib/effectiveness.js`: funciones sin React ni Supabase, que son la única
fuente de verdad del cálculo. Es lo que permite probarlo con el arnés de
`scripts/test-migraciones/` sin levantar la app.

---

## 6. La relación con lo que ya existe

Esto es lo que pediste y la spec no contempla: **los gestores del Excel son, en
varios casos, usuarios que ya están en Experia.**

Ejemplo concreto: `'Katherine Bustos'` en el seed es, con toda probabilidad,
**Yeimy Katherine Bustos Fuentes**, la instructora que aparece en la
plataforma. Hoy son dos entidades sin ninguna conexión.

Por eso `estratega_colaboradores` debe llevar un vínculo **opcional**:

```sql
create table if not exists public.estratega_colaboradores (
  id            bigserial primary key,
  nombre        text not null unique,
  profile_id    uuid references public.profiles(id) on delete set null,
  activo        boolean not null default true
);
```

- **`profile_id` nullable a propósito**: no todo gestor tiene cuenta en Experia,
  y no se debe bloquear la carga por eso.
- Con el vínculo puesto se abren cosas que hoy son imposibles: que un gestor
  vea *su propia* ficha, cruzar entregables del pipeline con los cursos que esa
  persona dicta, y notificar sin exportar a Excel.
- Sin el vínculo, el módulo funciona igual — solo que aislado del resto de la
  plataforma.

Sugerencia de alcance: crear la tabla y la FK ahora, y **poblar `profile_id` a
mano** para los 3–4 gestores que sí tienen cuenta. Es media hora y evita el
trabajo de reconciliación después.

---

## 7. ⚠️ El seed tiene un error que lo hace fallar

Revisando `seed_estratega.sql` contra el `CHECK` que propone la propia spec:

```sql
estado text not null check (estado in ('ENTREGADO','EN PROCESO','NO ENTREGADO','DETENIDO',''))
```

Hay una fila con el estado `'JUNIO'` — un mes en la columna de estado:

```sql
('MAYO', 'Katherine Bustos', 'Aplicación de la encuesta Light + análisis
 de resultados (Ecosistema digital)', 'JUNIO'),
```

**Con el CHECK puesto, el seed entero falla** (un `insert` multi-fila es
atómico: si una viola la restricción, no entra ninguna). Viene del Excel, donde
seguramente significaba "se pasó para junio".

Hay que decidir qué es: ¿`'EN PROCESO'`? ¿`'NO ENTREGADO'`? ¿Un estado nuevo
tipo `'APLAZADO'`? **No lo puedo decidir yo** — es información del negocio.

Otros dos detalles menores del mismo archivo:
- `'Ecosistema  digital'` tiene **doble espacio** — se va a ver en la interfaz.
- Claudia Gacharná tiene 3 tareas con estado `''` (vacío). El CHECK lo permite,
  pero la dona de estados va a mostrar un segmento sin etiqueta.

---

## 8. Orden de trabajo propuesto

| Fase | Qué | Por qué en ese orden |
|---|---|---|
| **1** | `0061` (enum) + auditoría de los `role ===` del frontend | Sin la auditoría, asignar el rol rompe la sesión de esa persona |
| **2** | `0062` (tablas + RLS + `is_estratega`) y probarla con el arnés PGlite | Igual que 0055–0059: se prueba antes de tocar producción |
| **3** | Corregir el seed (§7) y cargarlo | Con los datos dentro, todo lo demás es visible |
| **4** | Shell + navegación + tab **Seguimiento de Gestores** | Valida el patrón de datos y filtros con lo más simple |
| **5** | Tab **Pipeline Comercial** (heatmap, drawer, checklist) | Lo más complejo, ya con el patrón probado |
| **6** | QA de paridad numérica contra el HTML original | Comparar Consolidado y cada mes |

**Fases 1–3 son de datos y no tienen interfaz**: se pueden aplicar sin que
ningún usuario note nada, porque hasta que no exista la página ni el rol
asignado, nadie llega ahí. Eso las hace seguras de hacer primero.

---

## 9. Lo que dejaría fuera de esta primera versión

- **Checklist por fase editable** (`estratega_pipeline_checklist`). La spec ya
  reconoce que no hay datos reales para poblarla. Crear la tabla sí; construir
  la interfaz de edición, después. Los contadores `*_hecho` del Excel bastan
  para el heatmap.
- **Sincronización con SharePoint/Power Automate.** La spec lo marca como
  fase 2 y estoy de acuerdo: primero que la carga manual funcione.
- **Exportar CSV.** Es un botón de 20 líneas, pero no aporta hasta que los
  datos estén confirmados.

---

## 10. Preguntas abiertas antes de arrancar

1. **El estado `'JUNIO'`** (§7): ¿a qué se traduce?
2. **¿Quién debe tener el rol?** ¿Solo Dirección/Coordinación, o también los
   gestores para ver su propia ficha? Cambia el diseño de las policies.
3. **¿Un estratega necesita seguir usando Experia como instructor?** Si sí, el
   enum no alcanza (un usuario tiene un solo `role`) y habría que usar una
   tabla puente, como `instructor_institutions`.
4. **¿Los datos de ejecución presupuestal son sensibles?** Hoy la RLS los
   dejaría ver a cualquier `admin`. Si el presupuesto por persona no debe verlo
   el admin de plataforma, las policies tienen que excluirlo explícitamente.
