"""Arma el banco final de preguntas a partir de draft.json (lo llama build.py).
Uso: python curate.py <carpeta_de_trabajo> <repo>
Escribe <repo>/src/lib/questionBank.json y copia las imágenes a <repo>/public/preguntas/.
"""
import json, os, re, sys, random
from PIL import Image

S, REPO = sys.argv[1], sys.argv[2]
d = json.load(open(os.path.join(S, 'draft.json'), encoding='utf-8'))

AREAS = {
    'matematicas': {'label': 'Matemáticas', 'icon': '🔢'},
    'lectura':     {'label': 'Lectura crítica', 'icon': '📖'},
    'biologia':    {'label': 'Biología', 'icon': '🧬'},
    'quimica':     {'label': 'Química', 'icon': '⚗️'},
    'fisica':      {'label': 'Física', 'icon': '🧲'},
}

# ── Imágenes: (carpeta docx, imagen) → nombre publicado ─────────────────────
IMGS = {
    ('mat', 'image1'): 'matematicas/visitantes-museo',
    ('mat', 'image2'): 'matematicas/cuadrado-inscrito',
    ('mat', 'image3'): 'matematicas/libros-vendidos',
    ('mat', 'image4'): 'matematicas/linea-quebrada',
    ('cie', 'image1'): 'ciencias/glucosa-en-sangre',
    ('cie', 'image2'): 'ciencias/solubilidad-sales',
    ('cie', 'image3'): 'ciencias/ley-de-hooke',
    ('cie', 'image4'): 'ciencias/crecimiento-logistico',
    ('cie', 'image5'): 'ciencias/bloques-polea',
    ('cie', 'image6'): 'ciencias/rampa-resorte',
    ('cie', 'image7'): 'ciencias/circuito-mixto',
    ('cie', 'image9'): 'ciencias/placas-paralelas',
    ('lec', 'image1'): 'lectura/rcp-infografia',
    ('lec', 'image2'): 'lectura/calvin-limonada',
    ('lec', 'image3'): 'lectura/quino-angel',
    ('lec', 'image4'): 'lectura/quino-no-me-grite',
    ('lec', 'image5'): 'lectura/crates-historieta',
    ('lec', 'image6'): 'lectura/oms-transito-infografia',
    ('lec', 'image7'): 'lectura/tetra-pak-anuncio',
    ('lec', 'image8'): 'lectura/mafalda-burocracia',
    ('lec', 'image9'): 'lectura/colmena-anuncio',
}
used_imgs = set()


def pub(folder, img):
    key = (folder, img)
    if key not in IMGS:
        return None
    used_imgs.add(key)
    return '/preguntas/' + IMGS[key] + '.jpg'


def export_images():
    for (folder, img), name in IMGS.items():
        if (folder, img) not in used_imgs:
            continue
        src = os.path.join(S, 'img', folder, img + '.png')
        dst = os.path.join(REPO, 'public', 'preguntas', name + '.jpg')
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        im = Image.open(src)
        if im.mode in ('RGBA', 'LA', 'P'):
            im = im.convert('RGBA')
            bg = Image.new('RGB', im.size, (255, 255, 255))
            bg.paste(im, mask=im.split()[-1])
            im = bg
        else:
            im = im.convert('RGB')
        if im.width > 1400:
            im = im.resize((1400, round(im.height * 1400 / im.width)), Image.LANCZOS)
        im.save(dst, 'JPEG', quality=84, optimize=True, progressive=True)


# ── Química/física: fórmulas que en el Word venían como texto plano ─────────
SUBS = [
    ('Si3N4', 'Si₃N₄'), ('N2O4', 'N₂O₄'), ('NO2', 'NO₂'), ('C6H12O6', 'C₆H₁₂O₆'),
    ('CH3-CH2-CH2-OH', 'CH₃–CH₂–CH₂–OH'), ('CH3-O-CH2-CH3', 'CH₃–O–CH₂–CH₃'),
    ('Cu2+', 'Cu²⁺'), ('Zn2+', 'Zn²⁺'), ('Cu0', 'Cu⁰'), ('Zn0', 'Zn⁰'), ('2e-', '2e⁻'),
    ('Al3+', 'Al³⁺'), ('Na+/K+', 'Na⁺/K⁺'), ('(Na+)', '(Na⁺)'), ('Na+/glucosa', 'Na⁺/glucosa'),
    ('CO2', 'CO₂'), ('O2', 'O₂'), ('N2', 'N₂'), ('ΔH1', 'ΔH₁'), ('ΔH2', 'ΔH₂'),
    ('[A]^2', '[A]²'), ('<=>', '⇌'), ('K_ps', 'Kps'), ('Q_ps', 'Qps'),
]


def chem(t):
    for a, b in SUBS:
        t = t.replace(a, b)
    return t


def tidy(t):
    t = re.sub(r'\(\s+', '(', t)
    t = re.sub(r'\s+([.,;:?)])', r'\1', t)
    return re.sub(r'[ \t]+', ' ', t).strip()


# ── Pistas: las dice el tutor del curso durante la pregunta en vivo ─────────
HINTS = {
    'mat-01': 'Calcula el área total y su 40 %: ¿el resultado contradice lo que dice el agricultor?',
    'mat-02': 'El radio va al cuadrado en la fórmula: si se duplica, ¿por cuánto se multiplica r²·h?',
    'mat-03': 'Pregúntate qué parte de la tarifa cambia con los kilómetros y cuál se cobra una sola vez.',
    'mat-04': 'Recuerda que 1 km = 100.000 cm. Convierte y mira cuál de los dos resultados tiene sentido.',
    'mat-05': 'Lee en la gráfica el valor de febrero y el de marzo (en miles) y calcula la mitad del primero.',
    'mat-06': 'Calcula P(8) y P(5) por separado… ¿qué le pasa al bono de 200 cuando restas?',
    'mat-07': 'Seno = cateto opuesto ÷ hipotenusa. Si ese cociente es 1/2, ¿cuántas veces cabe el cateto en la hipotenusa?',
    'mat-08': 'Al sumar los dos clubes, quienes están en ambos quedan contados dos veces.',
    'mat-09': 'Buscas el número más grande que divida exactamente a 120 y a 80.',
    'mat-10': 'Suma los cinco precios y reparte en partes iguales entre los 5 amigos.',
    'mat-11': 'Revisa si el aumento de un mes a otro es siempre el mismo y prueba la fórmula con m = 1 y m = 2.',
    'mat-12': 'Después de sacar la primera canica, ¿cuántas quedan en la bolsa? Multiplica las dos probabilidades.',
    'mat-13': 'Si ambos catetos crecen en la misma proporción, la hipotenusa crece en esa misma proporción.',
    'mat-14': 'El segundo descuento se calcula sobre el precio ya rebajado, no sobre el original.',
    'mat-15': 'Los puestos son distintos, así que el orden importa: ¿cuántos pueden ser gerente, luego subgerente, luego asistente?',
    'mat-16': 'Multiplica cada nota por su porcentaje: el 70 % va con el examen final.',
    'mat-17': 'Mira la figura: los cuatro triángulos blancos de las esquinas, ¿qué parte del cuadrado grande ocupan juntos?',
    'mat-18': 'Lee el valor exacto de cada barra y verifica afirmación por afirmación: buscas la que NO se cumple.',
    'mat-19': 'Piensa qué operación no te acerca a despejar la x, aunque se haga a ambos lados.',
    'mat-20': 'Mide cada tramo por separado: ¿desde qué altura empieza el tramo que baja?',

    'bio-01': 'Compara los 2 mg/L con el límite de 4 mg/L que señalan los investigadores.',
    'bio-02': 'Para poner a prueba una hipótesis necesitas dos grupos que solo se diferencien en lo que quieres probar.',
    'bio-03': 'El agua se mueve hacia donde hay más sal. ¿En qué solución entra agua a la célula y en cuál sale?',
    'bio-04': 'En la tabla, sobrevivir mucho significa ser resistente: busca el porcentaje más alto.',
    'bio-05': 'Pregúntate quién gana en esta relación: ¿la orquídea, el insecto o los dos? ¿Alguien se come a alguien?',
    'bio-06': 'Ni el agua ni el abono reemplazan lo que impulsa la fotosíntesis.',
    'bio-07': 'Si disminuye un depredador, ¿qué le pasa a la presa que se comía?',
    'bio-08': 'Lo único que cambió entre los dos grupos fue la presencia de las bacterias.',
    'bio-09': 'Haz el cuadro de Punnett Rr × Rr: ¿cuántas de las 4 casillas son rr?',
    'bio-10': '¿Qué hormona baja la glucosa en la sangre y en qué forma la guarda el cuerpo?',
    'bio-11': 'Sigue la cadena: más nutrientes → más algas → menos luz → ¿quién gasta el oxígeno al descomponerlas?',
    'bio-12': 'En Hardy-Weinberg, el fenotipo recesivo es q². Saca la raíz cuadrada en cada momento.',
    'bio-13': 'El transporte secundario usa un gradiente que otra bomba mantiene gastando ATP.',
    'bio-14': 'Pasa la hebra molde a ARNm y mira qué aminoácido codifica el codón que cambió.',
    'bio-15': 'Con el cuerpo deshidratado, los riñones deben ahorrar agua: ¿qué hormona da esa orden?',
    'bio-16': 'La banda de Caspary es el filtro que obliga al agua a pasar por dentro de las células. ¿Y si se rompe?',
    'bio-17': 'La proteína Rb sin fosforilar mantiene frenado el paso de G1 a S.',
    'bio-18': 'El sistema inmune tiene memoria para lo que ya conoce, no para lo nuevo.',
    'bio-19': 'Una sustancia persistente se va acumulando en cada eslabón de la cadena trófica.',
    'bio-20': 'La célula sabe copiar ADN y pasar ADN a ARN, pero no fabricar ARN a partir de ARN.',
    'bio-21': 'Si no se libera acetilcolina, el músculo nunca recibe la orden de contraerse.',
    'bio-22': 'Para que el clon tenga solo el genoma del donante, hay que quitarle algo al óvulo.',
    'bio-23': 'Las dos especies viven en el mismo estanque, pero se reproducen en meses distintos.',
    'bio-24': 'Mira la gráfica: ¿en qué punto la curva sube más empinada? Fíjate en la línea punteada verde.',
    'bio-25': 'Una hormona estimula las raíces y la otra rompe la dominancia de la yema apical.',

    'qui-01': 'Una sustancia pura hierve a una temperatura fija y no deja residuo.',
    'qui-02': 'Suma la masa de lo que entró y compárala con la de lo que salió (producto + sobrante).',
    'qui-03': 'La masa de los reactivos es igual a la de los productos: resta.',
    'qui-04': 'Si 100 g de solución tienen 25 g de ácido, ¿cuánto tendrán 500 g?',
    'qui-05': 'Ubica en la gráfica la línea de cada sal a 20 °C y a 80 °C y compara.',
    'qui-06': 'El número de masa suma las partículas del núcleo.',
    'qui-07': 'Compartir electrones es la marca de un tipo de enlace.',
    'qui-08': 'La ecuación dice que 1 mol de N₂ da 2 de NH₃. Revisa si el H₂ alcanza.',
    'qui-09': 'Lo más denso se va al fondo.',
    'qui-10': 'Compara cada temperatura con 25 °C: un líquido funde por debajo y hierve por encima.',
    'qui-11': 'Primero balancea: 3 Si + 2 N₂ → Si₃N₄. Luego calcula cuántas moles tienes de cada reactivo.',
    'qui-12': 'El recipiente es rígido: el volumen no cambia. Si la temperatura absoluta se duplica, ¿qué pasa con la presión?',
    'qui-13': 'Le Châtelier: el calor favorece la reacción endotérmica y la presión favorece el lado con menos moles de gas.',
    'qui-14': 'Calcula los moles de HCl y de NaOH: ¿qué sobra y en cuánto volumen total queda?',
    'qui-15': 'Reemplaza en la ecuación: [A] se duplica (¡y está al cuadrado!) y [B] se reduce a la mitad.',
    'qui-16': 'En la pila se oxida el metal con el potencial de reducción más bajo; E° = cátodo − ánodo.',
    'qui-17': 'El punto de ebullición sube según el número de partículas disueltas, no según su masa.',
    'qui-18': 'Mismos átomos, pero una molécula es un alcohol (–OH) y la otra un éter (–O–).',
    'qui-19': 'El oxígeno tiene 2 pares de electrones libres que empujan los enlaces.',
    'qui-20': 'Invierte la segunda reacción y súmala con la primera.',
    'qui-21': 'El último nivel es el 3 y tiene 6 electrones de valencia: ¿cuántos le faltan para el octeto?',
    'qui-22': 'Los tres líquidos se mezclan entre sí, pero hierven a temperaturas distintas.',
    'qui-23': 'Markovnikov: el H se une al carbono que ya tiene más hidrógenos.',
    'qui-24': 'Calcula Q = [Ba²⁺]·[SO₄²⁻] y compáralo con Kps.',
    'qui-25': 'En la desintegración β⁻ un neutrón se vuelve protón: el número de masa no cambia.',

    'fis-01': 'Velocidad constante: distancia = velocidad × tiempo.',
    'fis-02': 'F = k·q₁·q₂ / r². Y ojo: ¿cargas del mismo signo se atraen o se repelen?',
    'fis-03': 'Peso = masa × gravedad.',
    'fis-04': 'La luz cambia de medio, y con él cambian su velocidad y su dirección.',
    'fis-05': 'Si la fuerza va en contra del desplazamiento, el ángulo entre ellos es 180°.',
    'fis-06': 'Al recoger los brazos, el patinador reduce su momento de inercia… algo tiene que conservarse.',
    'fis-07': 'En la altura máxima la velocidad es 0: ¿cuánto tarda la gravedad en frenar 30 m/s?',
    'fis-08': 'Ley de Ohm: I = V / R.',
    'fis-09': 'Velocidad de una onda = frecuencia × longitud de onda.',
    'fis-10': 'La gráfica es una recta que pasa por el origen: la fuerza es proporcional al alargamiento.',
    'fis-11': 'Separa la velocidad en componentes: la vertical se anula en la cima; la horizontal no cambia.',
    'fis-12': 'Lo que mueve el sistema es el peso de m₂; lo que lo frena es la fricción sobre m₁. Las dos masas se aceleran juntas.',
    'fis-13': 'Toda la energía potencial del inicio termina como energía elástica: mgh = ½kx².',
    'fis-14': 'Torricelli: v = √(2gh), con h medida desde la superficie hasta el orificio.',
    'fis-15': 'Primero resuelve las dos de 6 Ω en paralelo; después súmales la de 4 Ω en serie.',
    'fis-16': 'Cuando la fuente se acerca el sonido se oye más agudo; cuando se aleja, más grave.',
    'fis-17': 'Eficiencia de Carnot = 1 − T fría / T caliente.',
    'fis-18': 'Ecuación del espejo: 1/f = 1/dₒ + 1/dᵢ. El objeto está entre f y 2f.',
    'fis-19': 'La energía del fotón se reparte: una parte arranca el electrón y el resto es energía cinética.',
    'fis-20': 'Tercera ley de Kepler: T² es proporcional a R³.',
    'fis-21': 'F = q(v × B): dedos hacia v, dóblalos hacia B (entrando en la página) y mira hacia dónde apunta el pulgar.',
    'fis-22': 'La pelota cambia de sentido: el cambio de velocidad es 15 + 25, no 25 − 15.',
    'fis-23': 'Distancia entre franjas: y = λ·D / d. Cuida las unidades (nm y mm).',
    'fis-24': 'T = 2π·√(L/g), y aquí g = π².',
    'fis-25': 'E = ΔV / d, y el trabajo para mover la carga es W = q·ΔV.',

    'lec-01': '“Famélico” viene de “hambre”: busca la palabra que signifique lo contrario de muy flaco.',
    'lec-02': 'Fíjate en los pronombres: “…le gustaba llevarme…”. ¿Quién está hablando?',
    'lec-03': 'Johnny vive como magnate sin trabajar y a costa de otros. ¿Qué palabra resume eso?',
    'lec-04': 'Busca la cita que muestra una conducta repetida sin cambio, aunque no tenga sentido.',
    'lec-05': 'El título da la pista: ¿la avispa piensa o sigue un instinto?',
    'lec-06': 'Sigue el orden de los pasos: el masaje cardíaco va después de comprobar algo.',
    'lec-07': 'Ubica en la infografía el paso que empieza con “Si no respira…”.',
    'lec-08': 'Pregúntate qué NO necesita ilustrar una guía de primeros auxilios.',
    'lec-09': 'Las metáforas describen una mesa casi vacía. ¿Qué dicen de lo que cocina Diego?',
    'lec-10': 'La narradora dice que imagina “el infierno” como las tareas del hogar obligatorias.',
    'lec-11': 'El título dice “contra el método”: ¿el texto propone un método nuevo o critica la idea de que la ciencia es un método?',
    'lec-12': 'El liberalismo dice que todos son iguales. ¿Qué afirmación pone a todas las teorías en el mismo nivel?',
    'lec-13': 'El niño inventa justificaciones que le convienen: ¿es economía real o su propia versión?',
    'lec-14': 'Mira la figura tendida en el piso: tiene alas. ¿Qué le hizo la multitud?',
    'lec-15': 'El Partido no permite lealtad, amor ni arte… salvo hacia él. ¿Qué queda de cada persona?',
    'lec-16': 'La imagen de la bota no es un plan: describe cómo vivirán las personas bajo ese poder.',
    'lec-17': '“Irrecusable” es algo que no se puede rechazar ni refutar.',
    'lec-18': 'El texto habla de los turistas en general; el resumen, de un grupo en particular.',
    'lec-19': 'La descripción hace parte del relato de las campañas del capitán Galarza y sus soldados.',
    'lec-20': 'Borja sostiene que el indio de Aguado es “retórico”: construido en el texto.',
    'lec-21': 'Pregúntate si la caricatura critica a un gobierno o se burla de una situación cotidiana.',
    'lec-22': 'Busca un hecho concreto del que el autor dice ser “testigo”.',
    'lec-23': '“Escamotear” es hacer desaparecer algo con habilidad, sin que se note.',
    'lec-24': 'La autora critica que la ciencia de su época no aceptaba hablar de motivaciones.',
    'lec-25': 'El personaje dice que separarse de Crates sí depende de él.',
    'lec-26': 'Rubens aparece justo después de hablar de lo bello que nos gusta ver en la realidad.',
    'lec-27': 'Un juicio de valor es una opinión, no un hecho que se pueda comprobar.',
    'lec-28': 'El texto defiende que la belleza de un cuadro no depende de la belleza de su tema.',
    'lec-29': 'El autor sostiene que NADIE es justo por voluntad. ¿Qué afirmación lo niega?',
    'lec-30': 'Decir que la injusticia da “más” ventajas supone que la justicia también da alguna.',
    'lec-31': 'Busca la opción que, si fuera cierta, confirmaría que solo somos justos por obligación.',
    'lec-32': 'El primer párrafo dice que es la ley la que obliga a seguir el camino del respeto.',
    'lec-33': 'Giges, con poder y sin castigo, actuó injustamente. ¿Qué quiere demostrar el autor con eso?',
    'lec-34': 'El texto dice que la idea del amor como base del matrimonio aparece en el siglo XVIII.',
    'lec-35': '“Sin embargo” marca un contraste… pero ¿niega lo anterior o lo matiza?',
    'lec-36': 'La dote era el dinero, los bienes o las tierras que aportaba la mujer al casarse.',
    'lec-37': 'El ejemplo de China muestra que en otras culturas el amor y el matrimonio no van juntos.',
    'lec-38': 'Busca un dato histórico que muestre que esa idea es reciente.',
    'lec-39': 'Lo político y lo económico tienen que ver con dinero, bienes y tierras.',
    'lec-40': 'Algunas mujeres fulbes aprueban el amor, pero solo después de cumplido el objetivo del matrimonio.',
    'lec-41': 'El texto recorre distintas épocas y culturas.',
    'lec-42': '“A pesar de” introduce algo que no se esperaría. ¿Qué es lo inesperado aquí?',
    'lec-43': 'Revisa si todo lo que menciona la descripción aparece de verdad en la infografía.',
    'lec-44': 'Suma los porcentajes de peatones, ciclistas y motociclistas: ¿qué queda para los demás?',
    'lec-45': 'Las cifras están dadas por cada 100.000 habitantes de cada región.',
    'lec-46': 'Compara la proporción de vehículos con la proporción de muertes de cada grupo de países.',
    'lec-47': 'Las figuras humanas solo repiten, en dibujo, el dato “3 de 4”.',
    'lec-48': 'La infografía presenta riesgos de morir, no consejos para conducir.',
    'lec-49': '¿A quién le interesaría mostrar el riesgo de morir en un accidente?',
    'lec-50': 'El texto atribuye la baja cobertura a la poca garantía de acceso y de aseguramiento de la población pobre.',
    'lec-51': 'Si se estudian para saber cuáles son perjudiciales, ¿qué haría después la autoridad con ellas?',
    'lec-52': 'En el segundo párrafo el autor dice que los opositores “no entienden” el toreo.',
    'lec-53': 'Una falacia compara cosas que no son equivalentes: morir naturalmente no es lo mismo que ser matado.',
    'lec-54': 'Busca la frase de Escobar que empieza con “El propósito era…”.',
    'lec-55': 'Truman dice: “Producir más es la clave…”. ¿Y cuál es la clave para producir más?',
    'lec-56': 'Felipe le habla a Isabel con ironía y le echa la culpa. ¿Qué siente hacia ella?',
    'lec-57': 'Helena insiste una y otra vez en lo que ella prefiere para el jardín.',
    'lec-58': 'David admite que el árbol se veía “sucio, débil y gris”.',
    'lec-59': 'La vaca en el carrito sugiere llevarse algo “tal como sale de la vaca”.',
    'lec-60': 'El anuncio presenta dos ideas (“reciclable” y “no deja pasar la luz”) como si una causara la otra.',
    'lec-61': 'Con la burocracia, nunca se sabe cuándo atienden…',
    'lec-62': 'El autor está en contra de las corridas, pero también en contra de prohibirlas.',
    'lec-63': 'La autora cita a Mattelart sin dar pruebas de lo que afirma.',
    'lec-64': 'Luisa compara estar con alguien “porque sí” con estar “por plata”, como si fuera lo mismo.',
    'lec-65': 'Piensa en lo que garantiza la condición “solo si”… y en lo que NO garantiza.',
    'lec-66': 'Pregúntate qué hace cada conector: ¿“pero” contradice o matiza? ¿“ya que” explica o concluye?',
    'lec-67': 'Si una búsqueda “es” la otra, quien hace una también hace la otra.',
    'lec-68': 'Una antítesis afirma lo contrario: que un orden puede ser justo SIN satisfacer a todos.',
    'lec-69': 'Benevolencia es querer el bien del otro. ¿Qué es lo contrario?',
    'lec-70': '“Sin embargo” contrasta dos ideas sin negar la primera.',
    'lec-71': 'Pregúntate cuál de las dos ideas sirve para justificar a la otra.',
    'lec-72': 'La tesis es que las sociedades nacen del miedo mutuo. Lo contrario sería…',
    'lec-73': 'Para Hobbes, el miedo a ser dominado lleva a buscar…',
    'lec-74': 'Hobbes dice que dominar resulta “mejor” que asociarse para obtener comodidades.',
    'lec-75': 'El anuncio es de un banco, no de una agencia de citas: ¿qué ofrece realmente?',
}

# Explicaciones de Ciencias (parte 1): el Word solo traía la temática.
EXPLAIN = {
    'bio-01': 'Con 2 mg/L el oxígeno queda muy por debajo del umbral de 4 mg/L a partir del cual aumenta la mortalidad: la población disminuirá.',
    'bio-02': 'Un experimento controlado compara dos grupos que solo difieren en la variable de la hipótesis (raíces conectadas vs. separadas por una barrera). Las otras opciones no ponen a prueba el intercambio de nutrientes.',
    'bio-03': 'En agua destilada (hipotónica) entra agua y la célula se hincha; al 0,9 % (isotónica) no hay flujo neto; al 10 % (hipertónica) sale agua y la célula se encoge.',
    'bio-04': 'La bacteria C sobrevive un 85 % con el antibiótico Z, frente a 5 % con X y 40 % con Y: es su mayor resistencia.',
    'bio-05': 'La orquídea imita a la hembra del insecto y así consigue que el macho la polinice, pero el insecto no recibe nada a cambio (ni néctar ni pareja): es un mimetismo engañoso. No es mutualismo, porque solo una especie se beneficia; tampoco parasitismo, porque la orquídea no se alimenta del insecto, ni competencia, porque no se disputan ningún recurso.',
    # Corregidas (oct 2026): en el Word la clave o los datos no cuadraban.
    'mat-01': 'El área del terreno es 20 × 30 = 600 m² y el 40 % de 600 es 240 m². Como 240 < 600, el invernadero cabe y la afirmación es correcta. B calcula mal el porcentaje, C toma el 40 % de un solo lado (llega a 240 por casualidad, con un razonamiento incorrecto) y D suma porcentajes de los lados, que no es como se calcula un área.',
    'mat-02': 'El cono grande tiene el doble de diámetro (6 vs 3 cm) y de altura (12 vs 6 cm) que el pequeño. Si el radio se duplica, r² se multiplica por 4, y la altura por 2: el volumen se multiplica por 2 × 2² = 8, no por 2. Por eso la afirmación es incorrecta.',
    'mat-20': 'La línea tiene dos tramos: uno horizontal de 5 cm y uno vertical que baja desde 2 cm por debajo del borde superior hasta el borde inferior, es decir 6 − 2 = 4 cm. En total: 5 + 4 = 9 cm. 14 cm (8 + 6) solo sería cierto si la línea recorriera el ancho y el alto completos del rectángulo.',
    'bio-06': 'La fotosíntesis depende de la luz: más horas de luz solar directa permiten más fotosíntesis. Ni el agua ni el abono reemplazan la luz.',
    'bio-07': 'Las serpientes se comen a las ranas: si las serpientes disminuyen, las ranas tienen menos depredadores y su población aumenta.',
    'bio-08': 'El único factor distinto fue la presencia de bacterias fijadoras de nitrógeno, que aportan nitrógeno aprovechable: benefician el crecimiento.',
    'bio-09': 'Rr × Rr da RR, Rr, Rr y rr: solo 1 de 4 (25 %) es rr y tiene flores blancas.',
    'bio-10': 'Tras el pico, la insulina hace que el hígado y los músculos conviertan la glucosa en glucógeno, y el nivel en sangre baja.',
    'qui-01': 'La sustancia 1 hierve a una temperatura fija y no deja residuo: es pura. La 2 hierve en un rango y deja residuo: es una mezcla.',
    'qui-02': 'Entran 20 g (10 + 10) y salen 20 g (15 g de C + 5 g de B sin reaccionar): la masa se conserva.',
    'qui-03': 'Por conservación de la masa: 36,5 + 40 = 76,5 g de reactivos; 76,5 − 58,5 = 18 g de agua.',
    'qui-04': '25 g por cada 100 g de solución: en 500 g hay 5 × 25 = 125 g de H₂SO₄.',
    'qui-05': 'La línea de la sal X sube de unos 33 g a 20 °C a unos 42 g a 80 °C: es más soluble a 80 °C.',
    'qui-06': 'Número de masa = protones + neutrones = 11 + 12 = 23.',
    'qui-07': 'Cuando los átomos comparten electrones forman enlaces covalentes.',
    'qui-08': '1 mol de N₂ reacciona con 3 de H₂ y da 2 de NH₃. Con 2 mol de N₂ y 6 de H₂ (proporción exacta) se forman 4 mol de NH₃.',
    'qui-09': 'Las capas se ordenan por densidad: glicerina (1,26) abajo, luego agua (1,0) y arriba aceite (0,9).',
    'qui-10': 'Una sustancia es líquida a 25 °C si funde por debajo de 25 °C y hierve por encima. El bromo funde a −7 °C y hierve a 59 °C: es líquido. El hierro sigue sólido (funde a 1538 °C), y el cloro y el oxígeno ya hirvieron (−34 °C y −183 °C): son gases.',
    'fis-01': 'd = v·t = 20 m/s × 10 s = 200 m.',
    'fis-02': 'F = 9×10⁹ × (2×10⁻⁶)² / 0,3² = 0,036 / 0,09 = 0,4 N. Las cargas del mismo signo se repelen.',
    'fis-03': 'P = m·g = 2 kg × 10 m/s² = 20 N.',
    'fis-04': 'La refracción es el cambio de dirección de la luz al pasar de un medio a otro con distinta velocidad de propagación.',
    'fis-05': 'W = F·d·cos θ. Con la fuerza opuesta al movimiento, θ = 180° y cos 180° = −1: el trabajo es negativo.',
    'fis-06': 'Sin torques externos, L = I·ω se conserva: al reducir I (brazos recogidos), ω aumenta.',
    'fis-07': 'v = v₀ − g·t → 0 = 30 − 10·t → t = 3 s.',
    'fis-08': 'I = V / R = 120 V / 10 Ω = 12 A.',
    'fis-09': 'v = f·λ = 5 Hz × 0,4 m = 2 m/s.',
    'fis-10': 'La fuerza es proporcional al alargamiento (F = k·x): es la ley de Hooke. Aquí k = 50 N/m.',
}

# Preguntas que el equipo académico debe revisar antes de usar: quedan en el
# banco con aviso y FUERA de las rondas predeterminadas. Vacío desde oct 2026:
# las cinco que había (mat-01, mat-02, mat-20, bio-05, qui-10) se corrigieron
# abajo en FIX — ver el comentario de cada una.
REVIEW = {}


def _stem_replace(q, pairs):
    stem = list(q['stem'])
    for a, b in pairs:
        stem = [s.replace(a, b) for s in stem]
    return stem


FIX = {
    # ── Corregidas: en el Word la clave o los datos no cuadraban ────────────
    # mat-01: la opción B (clave del Word) decía "No…" y a la vez "su
    # afirmación es correcta". B pasa a ser un distractor real y la clave es A.
    'mat-01': lambda q: {**q, 'options': [q['options'][0], 'No, porque el 40 % de 600 m² es 360 m², no 240 m².'] + q['options'][2:],
                         'correct': 0},
    # mat-02: la tabla no duplicaba las medidas (3→5 cm) pero la clave D sí lo
    # suponía. Ahora el cono grande duplica al pequeño y D es la correcta.
    'mat-02': lambda q: {**q, 'stem': _stem_replace(q, [('▸ Mediano | 4 | 8', '▸ Mediano | 4,5 | 9'), ('▸ Grande | 5 | 10', '▸ Grande | 6 | 12')]),
                         'options': ['Sí, porque la altura y el diámetro del cono grande son el doble de los del cono pequeño.',
                                     q['options'][1], 'No, porque el factor de escala entre los conos es 3/2, no 2.', q['options'][3]],
                         'correct': 3},
    # mat-20: la figura no permitía llegar a 14 cm (8 + 6). Se dan las medidas
    # de los tramos que muestra el dibujo y la respuesta es 5 + 4 = 9 cm.
    'mat-20': lambda q: {**q, 'stem': ['La figura muestra un rectángulo de 8 cm de ancho y 6 cm de alto. En su interior se ha dibujado una línea quebrada de color azul: parte del lado izquierdo, 2 cm por debajo del borde superior, avanza 5 cm hacia la derecha y luego baja en línea recta hasta el borde inferior.',
                                       '¿Cuál es la longitud total de la línea quebrada de color azul?'],
                         'options': ['9 cm', '14 cm', '11 cm', '7 cm'], 'correct': 0},
    # bio-05: "depredación" no describe el fenómeno. La opción A nombra ahora
    # lo que es (mimetismo engañoso), con la misma justificación del Word.
    'bio-05': lambda q: {**q, 'options': ['Mimetismo engañoso, porque la orquídea se beneficia y el insecto es engañado sin recibir nada a cambio.'] + q['options'][1:],
                         'correct': 0},
    # qui-10: el mercurio también es líquido a 25 °C y los datos del "cloro"
    # eran de otro elemento. Se cambia el mercurio por hierro y se corrigen
    # los datos del cloro: solo el bromo queda líquido.
    'qui-10': lambda q: {**q, 'stem': _stem_replace(q, [('▸ Mercurio | -39 | 357', '▸ Hierro | 1538 | 2862'),
                                                        ('▸ Cloro | 660 | 2520', '▸ Cloro | -101 | -34'),
                                                        ('▸ Oxigeno |', '▸ Oxígeno |')]),
                         'options': ['Bromo', 'Hierro', 'Cloro', 'Oxígeno'], 'correct': 0},

    'mat-14': lambda q: {**q, 'stem': [q['stem'][0], q['stem'][1]] + [f'{i + 1}. {l}' for i, l in enumerate(q['stem'][2:6])] + q['stem'][6:]},
    'mat-14': lambda q: {**q, 'stem': [q['stem'][0], q['stem'][1]] + [f'{i + 1}. {l}' for i, l in enumerate(q['stem'][2:6])] + q['stem'][6:]},
    'mat-19': lambda q: {**q, 'stem': ['Un grupo de estudiantes debe resolver la siguiente ecuación:', '2(x − 3) = 4x + 2',
                                       'Cuatro estudiantes proponen los siguientes primeros pasos para despejar la incógnita:']
                                      + ['• ' + l for l in q['stem'][3:7]] + q['stem'][7:]},
    'bio-15': lambda q: {**q, 'stem': [s.replace('sustained', 'sostenido') for s in q['stem']]},
    'fis-05': lambda q: {**q, 'stem': [s.replace('En el sistema de la figura, una fuerza', 'Una fuerza') for s in q['stem']]},
    'fis-16': lambda q: {**q, 'stem': [s.replace(' emitie una', ' y emite una') for s in q['stem']]},
    # La flecha de la imagen original dibuja el protón desviándose hacia ABAJO,
    # lo contrario de la clave (y de la física): se publica sin la imagen.
    'fis-21': lambda q: {**q, 'images': []},
    'lec-11': lambda q: {**q, 'options': [o.replace('El texto crítica', 'El texto critica') for o in q['options']]},
    'lec-24': lambda q: {**q, 'stem': [s.replace('Consideré el', 'Considere el') for s in q['stem']]},
    'lec-37': lambda q: {**q, 'options': [o.replace('Demuestrar', 'Demostrar').replace('de como la', 'de cómo la') for o in q['options']]},
    'lec-54': lambda q: {**q, 'options': q['options'][:3] + ['generar altos niveles de industrialización y urbanización, tecnificando la agricultura de los países menos avanzados.']},
    'lec-60': lambda q: {**q, 'stem': [q['stem'][0].replace('Este texto induce al lector a pensar que erróneamente.', 'Este texto induce al lector a pensar, erróneamente, que')]},
    'lec-66': lambda q: {**q, 'stem': ['Considere el siguiente fragmento: “La Justicia es en primer lugar una cualidad posible, **pero** no necesaria, de un orden social que regula las relaciones mutuas entre los hombres. Sólo secundariamente es una virtud humana, **ya que** un hombre es justo sólo si su conducta se adecúa a las normas de un orden social supuestamente justo”.',
                                       'Las palabras resaltadas en negrilla (**pero** y **ya que**) indican respectivamente']},
    'lec-69': lambda q: {**q, 'stem': ['Según el texto anterior, ¿cuál de las siguientes expresiones sería el antónimo más adecuado para la expresión “mutua benevolencia”?']},
    'lec-75': lambda q: {**q, 'passage': None},
}

# ── Ids estables por asignatura ──────────────────────────────────────────────
AREA_OF = {'mat': 'matematicas', 'lec': 'lectura', 'bio': 'biologia', 'qui': 'quimica', 'fis': 'fisica'}
seq = {}
out_q = []
for it in d['items']:
    k = it['src']
    seq[k] = seq.get(k, 0) + 1
    qid = f'{k}-{seq[k]:02d}'
    it = dict(it)
    if qid in FIX:
        it = FIX[qid](it)
    it['id'] = qid
    out_q.append(it)

# ── Textos de lectura ───────────────────────────────────────────────────────
SOURCE_START = ('Tomado', 'Adaptado', 'Rubio, M.', 'La invención del Tercer Mundo')
pass_out = {}
for p in d['passages']:
    pid = f"lp-{p['id'] + 1:02d}"
    head = p['head']
    body = list(p['body'])
    title = None
    if p['id'] == 8:  # 17 y 18 — el título quedó pegado al encabezado
        head, title = head.replace(' Sobre la fotografía', ''), 'Sobre la fotografía'
    if p['id'] == 13:
        head, body = head + ' INFORMACIÓN', ['Aprendiendo de los chimpancés'] + body[1:]
    if p['id'] == 27:
        head, body = head.replace(' INFORMACIÓN EL', ' INFORMACIÓN'), ['EL CONSUMIDOR DEL “AJUSTE”'] + body[1:]
    src_i = next((i for i, l in enumerate(body) if l.startswith(SOURCE_START)), len(body))
    source = ' '.join(body[src_i:]) or None
    paras = body[:src_i]
    if title is None and paras and len(paras[0]) < 70 and not paras[0].rstrip().endswith(('.', ':', '»')) and not paras[0].startswith('»'):
        title, paras = paras[0], paras[1:]
    if p['id'] == 23:  # pasaje de novela: numeración de líneas y renglones partidos
        joined = []
        for l in paras:
            l = re.sub(r'^[-–]\s*', '', l).strip()
            l = re.sub(r'^\d{1,2}\s+', '', l).strip()
            if joined and (l[:1].islower() or joined[-1].endswith((',', 'hubiera', 'más bien', 'algo como', 'uno de', 'Un árbol', 'maldita'))):
                joined[-1] += ' ' + l
            else:
                joined.append(l)
        paras = [l.replace('che lines', 'chelines').replace('iOh!', '¡Oh!').replace('“‘¡Maravilloso', '“¡Maravilloso')
                 for l in joined]
    imgs = [{'url': pub('lec', im)} for im in p['images'] if pub('lec', im)]
    pas = {'intro': head.replace('RESPONDA ', 'RESPONDE ').strip()}
    if title: pas['title'] = title
    if paras: pas['paragraphs'] = paras
    if imgs: pas['images'] = imgs
    if source: pas['source'] = source
    pass_out[pid] = pas


def time_limit(q, area, passage):
    if area == 'lectura':
        chars = sum(len(x) for x in (passage or {}).get('paragraphs', [])) if passage else 0
        t = 45 + chars / 15
        if passage and passage.get('images'):
            t = max(t, 120)
        return int(min(180, max(60, round(t / 15) * 15)))
    base = 60 if q['set'] == 1 else 90
    return base + (15 if q.get('images') else 0)


rng = random.Random(2026)
DIFFS = ['facil', 'media', 'dificil']
questions = []
for it in out_q:
    area = AREA_OF[it['src']]
    stem = [chem(tidy(l.replace('▸ ', ''))) if area in ('quimica', 'fisica', 'biologia') else tidy(l.replace('▸ ', '')) for l in it['stem']]
    opts = [chem(tidy(o)) if area in ('quimica', 'fisica', 'biologia') else tidy(o) for o in it['options']]
    passage_id = f"lp-{it['passage'] + 1:02d}" if it.get('passage') is not None else None
    q = {'id': it['id'], 'area': area, 'question': '\n'.join(stem), 'options': opts, 'correct': it['correct']}
    imgs = [pub(it['src'] if it['src'] in ('mat', 'lec') else 'cie', im) for im in it.get('images', [])]
    imgs = [x for x in imgs if x]
    if imgs:
        q['image'] = imgs[0]
    # EXPLAIN primero: en las preguntas corregidas reemplaza la justificación del Word.
    exp = EXPLAIN.get(it['id']) or it.get('explanation') or ''
    if area == 'lectura' and it.get('topic'):
        exp = f"Competencia que evalúa: {it['topic'][0].lower() + it['topic'][1:]}"
    if exp:
        q['explanation'] = chem(exp) if area in ('quimica', 'fisica') else exp
    q['hint'] = HINTS[it['id']]
    q['difficulty'] = rng.choice(DIFFS)
    if it.get('topic') and area != 'lectura':
        q['topic'] = it['topic'].split(' - ', 1)[-1]
    if area == 'lectura' and it.get('topic'):
        q['topic'] = it['topic'].rstrip('.')
    if passage_id:
        q['passageId'] = passage_id
    q['timeLimit'] = time_limit(it, area, pass_out.get(passage_id))
    if it['id'] in REVIEW:
        q['review'] = REVIEW[it['id']]
    q['source'] = {'mat': 'Prueba de Matemáticas', 'lec': f"Lectura crítica — parte {it['set']}"}.get(it['src'], f"Ciencias Naturales — parte {it['set']}")
    questions.append(q)

missing = [q['id'] for q in questions if not q.get('hint')]
assert not missing, missing

# ── Rondas predeterminadas (10 por ronda; sin preguntas "a revisar") ─────────
byarea = {}
for q in questions:
    byarea.setdefault(q['area'], []).append(q)
defaults = {}
for area, qs in byarea.items():
    ok = [q for q in qs if 'review' not in q]
    if area == 'lectura':
        # Por bloques de texto completos, para no partir una lectura en dos rondas.
        r1_p = ['lp-01', 'lp-02', 'lp-03', 'lp-06', 'lp-07']           # Johnny, avispa, RCP, Calvin, Quino
        r2_p = ['lp-17', 'lp-08', 'lp-09', 'lp-11']                    # Giges, Gran Hermano, fotografía, Quino
        r1 = [q['id'] for q in ok if q.get('passageId') in r1_p]
        r2 = [q['id'] for q in ok if q.get('passageId') in r2_p]
    else:
        # Primera ronda: las primeras del documento (las más directas);
        # ronda final: las del segundo bloque, que piden más elaboración.
        first = [q for q in ok if q['source'].endswith('parte 1') or area == 'matematicas']
        second = [q for q in ok if q['source'].endswith('parte 2')]
        if area == 'matematicas':
            r1 = [q['id'] for q in ok[:10]]
            r2 = [q['id'] for q in ok[10:20]]
        else:
            r2 = [q['id'] for q in second[:10]]
            r1 = [q['id'] for q in first[:10]]
            r1 += [q['id'] for q in second[10:]][:10 - len(r1)]
    defaults[area] = {'r1': r1, 'r2': r2}

bank = {
    '_generado': 'NO EDITAR A MANO — lo genera scripts/banco-preguntas/build.py (ver CLAUDE.md §14).',
    'version': 1,
    'areas': AREAS,
    'passages': pass_out,
    'questions': questions,
    'defaults': defaults,
}
export_images()
dst = os.path.join(REPO, 'src', 'lib', 'questionBank.json')
json.dump(bank, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
from collections import Counter
print('preguntas', len(questions), Counter(q['area'] for q in questions))
print('dificultad', Counter(q['difficulty'] for q in questions))
for a, v in defaults.items():
    print(a, 'r1', len(v['r1']), 'r2', len(v['r2']))
print('bytes', os.path.getsize(dst))
