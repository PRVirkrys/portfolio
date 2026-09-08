# Home scroll experience — storyboard y diseño de interacción

**Fecha:** 7 de septiembre de 2026  
**Estado:** propuesta lista para revisión  
**Alcance:** experiencia narrativa de la home, desde la introducción hasta el cierre con CTA

## 1. Objetivo

La home debe presentar a Paula Rodas a través de su proceso de trabajo, no solo mediante una lista de capacidades. La narrativa recorre cinco ideas en un orden deliberado:

1. Pensar y organizar.
2. Diseñar interfaces.
3. Construir el producto.
4. Colaborar con IA.
5. Reunir todas esas facetas en una identidad profesional.

La experiencia empieza con una introducción automática breve. A partir del saludo, el avance y el retroceso dependen del scroll. Todas las transformaciones deben ser reversibles: al subir, cada escena vuelve de forma continua al estado anterior.

## 2. Principios de la experiencia

- **Una historia continua:** las escenas se transforman unas en otras; no se sienten como diapositivas independientes.
- **El scroll es el control:** el progreso visual sigue la posición real del scroll, tanto al bajar como al subir.
- **Una transición con significado:** cada cambio representa el paso natural de una fase de trabajo a la siguiente.
- **Movimiento con jerarquía:** el contenido principal debe seguir siendo legible; la animación apoya el mensaje y no compite con él.
- **Marca propia:** las referencias a herramientas como Miro, Figma o un IDE sirven para comunicar conceptos, pero la interfaz final usa el sistema visual del portfolio y no copia literalmente esos productos.
- **Cierre definitivo:** el último estado es `I'm Paula Rodas`; no entra en un bucle automático.

## 3. Modelo general

La experiencia se construye dentro de un escenario principal de altura fija en pantalla (`sticky`). Una pista vertical aporta la distancia necesaria para controlar una línea de tiempo normalizada.

La secuencia completa es:

`Intro → Greeting → Board → Figma → IDE → AI Collaboration → Identity`

Después de la introducción automática, todo el recorrido permanece conectado a una única línea de tiempo reversible. Cada capítulo tiene un punto de reposo claro y las transiciones admiten estados intermedios.

El header, la navegación lateral y el footer son la estructura real del portfolio. Permanecen estables después de su entrada inicial. Las interfaces conceptuales viven únicamente dentro del canvas central y no duplican la navegación global.

## 4. Storyboard

> **Nota (implementación):** la intro (Escenas 0–1) ya no es una línea de tiempo aparte. Es el **primer tramo de la misma línea de tiempo scrubbeada** que el resto (`~14 %` de su duración, delante del saludo), así que el scroll la avanza y la revierte igual que cualquier capítulo. En la **primera visita** se auto-reproduce mediante un auto-scroll de ~2.4 s; cualquier gesto de scroll, tacto o tecla cancela ese auto-scroll y entrega la línea de tiempo al usuario en la posición exacta donde la interrumpió, sin salto. Recargas y revisitas abren directamente en el saludo con la UI ya dentro.

### Escena 0 — Board vacío

**Inicio:** fondo oscuro con la cuadrícula de puntos.

- Corresponde al progreso 0 de la línea de tiempo (línea sin dibujar, logo tapado, UI a opacidad 0).
- No se muestra todavía la interfaz global.
- El patrón de puntos puede tener una variación mínima de profundidad, sin distraer.
- El fondo está disponible inmediatamente para evitar flashes durante la carga.

### Escena 1 — Aparición del logo

**Tramo:** primer ~14 % de la línea de tiempo (auto-scroll de ~2.4 s en la primera visita).

- Una línea blanca vertical de ~3 px se dibuja de arriba abajo en el centro del viewport (`scaleY` de 0 a 1).
- La línea se desplaza hacia la izquierda; el logo, con su borde derecho pegado a la línea, se descubre a su paso mediante un `clip-path` que comparte la misma curva de easing, de modo que el borde revelado y la línea permanecen unidos.
- Al terminar el barrido, la línea se atenúa y colapsa mientras el logo se desliza hasta su posición de reposo junto al saludo.
- Header, sidebar, footer e indicador de scroll aparecen con opacidad.
- Todo el tramo es reversible: al hacer scroll hasta arriba del todo, la UI se atenúa, el logo se vuelve a tapar y la línea se repliega.
- El logo termina completamente nítido, sin rebote.

### Escena 2 — Saludo

**Duración automática:** aproximadamente 1.4 s.

- El logo se desplaza hacia la izquierda, siguiendo la composición aprobada.
- A la derecha se escribe por bloques: `Hi!`, `I'm` y `Paula Rodas`.
- El ritmo incluye pausas breves entre líneas y no reproduce una mecanografía uniforme carácter por carácter.
- El cursor parpadea al terminar y después pierde protagonismo.
- El header, la sidebar, el footer y el indicador de scroll ya han entrado en la Escena 1.

Este es el punto de reposo tras la intro. Al volver hacia arriba se rebobina el saludo y, si se sigue subiendo hasta el tope, también la Escena 1 (línea, logo y UI). Abrir la home en una pestaña nueva vuelve a auto-reproducir la intro desde el fondo vacío.

### Escena 3 — Apertura del Board

**Control:** scroll reversible.

- El saludo pierde opacidad y se separa ligeramente en profundidad.
- Las piezas del logo se desplazan hacia distintos límites del canvas:
  - trazos izquierdos hacia la izquierda;
  - arcos superiores hacia arriba;
  - diagonales inferiores hacia la derecha y abajo;
  - puntos con recorridos cortos y velocidades ligeramente distintas.
- Algunas piezas permanecen parcialmente visibles en los bordes durante la transición.
- La separación abre espacio para el primer hero.

### Escena 4 — Hero Board: pensar y organizar

**Mensaje principal:**

> I design and build products that make complex ideas actually usable.

**Contenido de apoyo:**

> I work at the intersection of product, design systems and code to ship experiences that scale.

**Composición:** texto a la izquierda y board interactivo a la derecha.

El board se construye con elementos HTML y SVG, no como vídeo o captura rasterizada. Su ciclo interno dura aproximadamente 7–9 segundos:

1. Aparece un cursor identificado con Paula.
2. Crea o revela los nodos `Research`, `User needs`, `Business goals`, `Flows` y `Product`.
3. Reordena dos o tres tarjetas.
4. Dibuja conexiones entre ellas.
5. Agrupa los elementos dentro de una sección.
6. Corrige una conexión para comunicar iteración.
7. Selecciona un frame completo.

La referencia conceptual es el uso que hace Miro de cursores, nodos y conexiones dentro de un lienzo colaborativo, adaptado al lenguaje de marca del portfolio.

**Parallax del texto:**

- Los tags avanzan o salen ligeramente más rápido.
- El titular se mueve a una velocidad media.
- El párrafo y el enlace tienen un pequeño retraso.
- Las palabras de color conservan un rastro luminoso muy corto.
- Al salir, el conjunto combina desplazamiento, opacidad y un blur mínimo.

No se anima cada palabra por separado: el protagonista secundario de esta escena es el board.

### Transición Board → Figma

La transición representa entrar en una idea para convertirla en interfaz:

1. El cursor selecciona el frame final del board.
2. Los elementos no seleccionados se alejan y pierden opacidad.
3. El frame seleccionado crece hasta ocupar el canvas.
4. La cuadrícula del board cambia gradualmente al canvas de diseño.
5. Aparecen la barra de herramientas, el panel de capas y el panel de propiedades.

No se desmonta toda la interfaz en esta transición; el zoom dentro del frame crea una continuidad más clara y evita repetir el efecto del logo.

### Escena 5 — Figma conceptual: diseñar

**Mensaje principal:**

> I turn complex systems into clear product experiences.

**Interfaz animada:**

1. El cursor crea un frame.
2. Dibuja la estructura principal del wireframe.
3. Añade navegación, cards y botones.
4. Aplica auto-layout o alineación.
5. Modifica una propiedad desde el panel derecho.
6. La estructura gris adquiere componentes y algunos colores de marca.

La interfaz recuerda a una herramienta profesional de diseño, pero evita reproducir logotipos, nombres o detalles innecesarios de Figma.

### Transición Figma → IDE

Esta transición comunica el puente entre diseño e implementación:

1. Se selecciona un componente del wireframe.
2. Sus cajas y líneas se transforman en líneas e indentaciones de código.
3. El panel de capas se convierte en explorador de archivos.
4. Las propiedades visuales se transforman en design tokens.
5. La toolbar se minimiza y aparece una pestaña de archivo.
6. El IDE ocupa el canvas.

### Escena 6 — IDE: construir

**Mensaje principal:**

> I bridge design and code to ship what I imagine.

- El explorador muestra una estructura simplificada del portfolio.
- Se escriben fragmentos reales y breves de Astro, HTML y CSS de esta misma web.
- El minimap y el estado del archivo reaccionan al contenido.
- Una preview pequeña refleja el resultado del código.
- El movimiento de escritura se detiene el tiempo suficiente para permitir leer fragmentos relevantes.

El código mostrado debe ser auténtico y legible, no una textura decorativa de líneas aleatorias.

### Transición IDE → AI Collaboration

La transición representa añadir contexto y diálogo al proceso de construcción:

1. El editor reduce su anchura.
2. Una selección de código permanece destacada.
3. Se abre una conversación relacionada con esa selección.
4. El explorador de archivos se reorganiza como lista de artefactos.
5. La preview se convierte en resultado compartido de la colaboración.

### Escena 7 — Colaboración con IA

**Mensaje principal:**

> I collaborate with AI to explore faster, decide better and build products that matter.

La composición recomendada es híbrida, entre chat y entorno de trabajo:

- Texto y CTA contextual a la izquierda.
- Conversación principal en el centro.
- Contexto del proyecto y artefactos a la derecha.
- Preview del producto dentro del área de trabajo.

La interacción demuestra criterio humano:

1. Paula plantea un problema o restricción.
2. La IA propone una dirección.
3. Paula corrige una condición relevante para la persona usuaria.
4. La solución se actualiza.
5. Se genera o modifica un artefacto verificable.

La historia no presenta a la IA como sustituta del trabajo de diseño, sino como colaboradora dentro de un proceso dirigido por Paula.

### Transición AI Collaboration → Identity

- Los paneles se comprimen y apilan verticalmente.
- La pila adopta el comportamiento visual de un reloj abatible.
- El ruido de interfaz se desvanece y vuelve el espacio limpio del board.
- El logo se reconstruye a la izquierda.

### Escena 8 — Identidad final

**Composición:**

- Logo grande a la izquierda.
- `I'm` permanece fijo.
- Una única línea abatible muestra el rol activo.
- Tag inferior: `DESIGNER SINCE 2015`.
- CTA principal: `See all my work`.
- CTA secundario: `Explore more about my brand`.

**Secuencia controlada por scroll:**

1. UX Designer
2. UI Designer
3. Product Designer
4. UX Engineer
5. Full-stack Developer
6. Brand Designer
7. Designer
8. Paula Rodas

Cada tramo de scroll ejecuta un cambio. Al desplazarse hacia arriba, las tarjetas vuelven en orden inverso. La animación no continúa sola cuando la persona deja de hacer scroll. `Paula Rodas` es el estado final y permanece visible.

## 5. Ritmo y distribución del scroll

La longitud se ajustará después de probar el prototipo, usando esta distribución inicial:

| Tramo | Distancia inicial |
|---|---:|
| Greeting → Board | 90vh |
| Board en reposo y actividad | 130vh |
| Board → Figma | 80vh |
| Figma en reposo y actividad | 110vh |
| Figma → IDE | 80vh |
| IDE en reposo y actividad | 110vh |
| IDE → AI | 80vh |
| AI en reposo y actividad | 120vh |
| AI → Identity y roles | 160vh |

La estimación inicial total es de aproximadamente 960vh. El recorrido inverso utiliza la misma pista y no añade altura adicional. La distancia no debe sentirse vacía: cada tramo tiene cambio visual, actividad o un punto de lectura.

Se aplicará un snap suave solo cuando el usuario termine cerca de uno de los puntos de reposo. Fuera de ese umbral, la transición puede permanecer a mitad. Se desactiva en dispositivos o configuraciones donde interfiera con el desplazamiento natural.

## 6. Indicador de scroll

- Aparece con la UI global al terminar la introducción.
- El punto grande desciende dentro del mouse mientras reduce tamaño y opacidad.
- Un punto pequeño actúa como rastro.
- El ciclo reinicia tras una pausa corta.
- El texto cambia de `Scroll to explore` a `Scroll to keep exploring` después del primer capítulo.
- Permanece durante el recorrido y desaparece al alcanzar el estado final `Paula Rodas`.
- Al volver hacia arriba desde el final, reaparece.

## 7. Reproducción, navegación y retorno

- La introducción automática completa se reproduce una vez por pestaña, registrada en `sessionStorage`.
- Una recarga en la misma pestaña omite la introducción automática y muestra directamente el saludo inicial.
- Al volver desde un caso de estudio, la home restaura el capítulo y la posición de scroll anteriores.
- Un gesto de scroll, una tecla de navegación o un toque durante la introducción acelera su final; nunca bloquea la interacción durante varios segundos.
- Después de la introducción, el navegador conserva el control normal del scroll.
- Al subir, todas las escenas y los roles se reconstruyen de forma reversible.
- Abrir la home en una pestaña nueva reinicia la experiencia desde el fondo; recargar la pestaña actual no repite la introducción.

## 8. Responsive

### Desktop

- Coreografía completa.
- Texto e interfaz pueden convivir en dos columnas.
- Las piezas del logo pueden alcanzar los cuatro límites del canvas.
- Paneles laterales completos en Figma, IDE e IA.

### Tablet

- Se reducen las distancias de parallax.
- Los paneles secundarios usan menos anchura o aparecen de forma parcial.
- El contenido textual conserva prioridad sobre el detalle de la interfaz.

### Mobile

- Se mantiene la misma historia y orden.
- Texto e interfaz se componen verticalmente.
- Las interfaces se simplifican a su acción principal.
- Las piezas del logo recorren distancias menores.
- No se muestran paneles pequeños cuyo contenido no pueda leerse.
- El indicador se coloca por encima de la navegación inferior.

## 9. Accesibilidad y fallback

- Con `prefers-reduced-motion: reduce`, se eliminan parallax, escritura, trayectorias largas, blur animado y flip continuo.
- En modo reducido, las escenas cambian mediante fades cortos o se presentan como secciones estáticas.
- Todo el texto importante existe como HTML real y conserva un orden de lectura lógico.
- Las interfaces decorativas y sus cursores se excluyen del árbol accesible cuando no aportan información adicional.
- Los CTA mantienen foco visible y son utilizables con teclado.
- Si JavaScript no carga, se muestra una home estática con los mensajes principales y los CTA; el contenido no queda oculto.
- El color no es el único recurso para comunicar selección o progreso.

## 10. Arquitectura propuesta

La implementación se dividirá por responsabilidad:

- `HomeScrollExperience`: escenario sticky, capítulos y progreso general.
- `IntroSequence`: fondo, aparición del logo, saludo y entrada de UI.
- `AnimatedHeroLogo`: copia especializada y agrupada del SVG para animación.
- `ScrollIndicator`: indicador reutilizable y estado final.
- `BoardScene`: nodos, conectores y cursor.
- `DesignScene`: canvas, wireframe y paneles de diseño.
- `CodeScene`: explorador, editor, código y preview.
- `AICollaborationScene`: conversación, contexto, artefactos y resultado.
- `IdentityScene`: logo, flipboard de roles y CTA.
- `home-scroll-timeline`: único controlador de la secuencia y sus puntos de reposo.

Los componentes visuales exponen estados y no conocen la posición global del scroll. El controlador transforma el progreso en estados de escena. Esta separación permite ajustar el ritmo sin reescribir los componentes.

La tecnología recomendada es GSAP con ScrollTrigger para pinning, scrub, reversibilidad y coordinación. HTML y SVG se usan para las interfaces animadas; no se requiere canvas o WebGL.

## 11. Rendimiento

- Priorizar `transform` y `opacity` para el movimiento.
- Pausar los ciclos internos cuando su escena no está activa.
- Aplicar `will-change` solo a elementos animados durante el tramo correspondiente.
- Evitar filtros costosos simultáneos en grandes superficies.
- Recalcular medidas al cambiar de breakpoint, no en cada frame.
- Esperar a que las fuentes estén disponibles antes de medir el saludo.
- Mantener las interfaces conceptuales con un número controlado de nodos DOM/SVG.

## 12. Verificación

Antes de considerar la experiencia terminada se comprobará:

- Recorrido completo hacia abajo y hacia arriba.
- Correspondencia exacta entre scroll y progreso, sin saltos.
- Regreso correcto desde cada transición intermedia.
- Estados de reposo y snap con trackpad, rueda y teclado.
- Carga directa, recarga y regreso desde otra página.
- Breakpoints de desktop, tablet y mobile.
- `prefers-reduced-motion`.
- Navegación por teclado y foco visible.
- Fallback sin JavaScript.
- Estabilidad de layout y ausencia de scroll horizontal.
- Rendimiento sostenido durante todo el recorrido.

## 13. Orden de trabajo posterior a la aprobación

1. Cerrar los estados visuales inicial y final de Board, Figma, IDE, IA e Identity.
2. Preparar el logo animable y los assets vectoriales.
3. Construir un prototipo de movimiento de baja fidelidad para validar ritmo y reversibilidad.
4. Implementar las escenas por separado.
5. Integrarlas en la línea de tiempo global.
6. Adaptar tablet, mobile y movimiento reducido.
7. Realizar QA visual, funcional y de rendimiento.

No debe comenzar la implementación hasta que este storyboard y los estados visuales principales hayan sido aprobados.

## 14. Español e inglés

- La experiencia debe funcionar en español e inglés sin duplicar componentes ni timelines.
- Todo el copy se obtiene mediante un objeto de contenido con claves estables; los componentes no contienen textos literales salvo alternativas técnicas de accesibilidad.
- La implementación final cargará los contenidos desde archivos JSON separados por idioma.
- La animación selecciona elementos mediante atributos `data-motion` y nunca busca el texto visible.
- Los saltos de línea dependen del ancho disponible y del idioma; no se insertan saltos manuales para forzar que ambas traducciones coincidan.
- El cambio de idioma conserva el capítulo y el progreso aproximado de scroll.
- Después de cambiar de idioma se espera a `document.fonts.ready`, se recalcula el layout y se actualizan las medidas de ScrollTrigger.
- Las pruebas cubren los textos más largos de ambos idiomas en desktop, tablet y mobile.
