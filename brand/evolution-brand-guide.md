# Guia de identidad digital Evolution Studio

**Version:** 1.0  
**Fecha de corte:** 4 de septiembre de 2026  
**Alcance:** landing publicada y demo digital  
**Estado:** documentacion interna basada en evidencia; logo maestro pendiente

## Conclusion

La identidad digital actual combina una base negra, acentos dorados, texto marfil y una dupla tipografica editorial y funcional. Cormorant Garamond aporta expresion premium a los titulares; Jost sostiene la lectura, la navegacion y las llamadas a la accion. La landing ofrece un sistema visual coherente y contrastado, pero el unico archivo de logo disponible es una captura de Instagram y no debe tratarse como original oficial.

## Evidencia y limites

### Verificado

- La landing publicada responde en `https://evolution-barber.simbytelabs.com/`.
- Su codigo visual coincide con `../index.html`, salvo el script agregado por Cloudflare.
- La paleta, las fuentes y las reglas de composicion de esta guia provienen de ese codigo publicado.
- El logo mostrado en la landing utiliza `../assets/reference/evolution-logo-instagram.jpeg`.
- La identidad visible incluye el nombre Evolution Studio y el usuario de Instagram `@evolution_barbercut`.

### Inferencia razonable

- El lenguaje visual busca una posicion sobria, elegante y premium.
- El negro y dorado funcionan como codigos distintivos de la experiencia digital.
- La serif editorial refuerza el caracter de estudio y la sans serif mantiene claridad operativa.

### Pendiente

- Archivo maestro del logo.
- Geometria oficial del monograma, laureles, diamante y lockup.
- Color corporativo original fuera de la implementacion web.
- Area de seguridad, tamanos minimos y versiones monocromaticas aprobadas.
- Manual corporativo para aplicaciones impresas, letreros, uniformes y redes sociales.
- Aprobacion formal del cliente sobre esta sistematizacion.

## Paleta

### Colores principales

| Token | HEX | RGB | Uso observado |
|---|---|---|---|
| Negro principal | `#090909` | 9, 9, 9 | Fondo general |
| Negro secundario | `#0F0F0F` | 15, 15, 15 | Secciones y gradientes |
| Superficie | `#141311` | 20, 19, 17 | Capas oscuras |
| Linea | `#2D2922` | 45, 41, 34 | Bordes y separadores |
| Dorado principal | `#C9A54B` | 201, 165, 75 | Acentos y etiquetas |
| Dorado claro | `#EAD07F` | 234, 208, 127 | Titulares y enlaces destacados |
| Marfil | `#F4F0E8` | 244, 240, 232 | Texto principal |
| Gris calido | `#B4AEA4` | 180, 174, 164 | Texto secundario |

### Colores auxiliares

| Token | HEX | Uso observado |
|---|---|---|
| Dorado oscuro | `#9B792D` | Extremo del gradiente de accion |
| Texto oscuro | `#151109` | Texto sobre botones dorados |
| Gris tenue 1 | `#918A7F` | Firma secundaria de marca |
| Gris tenue 2 | `#8E877B` | Etiquetas informativas |
| Gris tenue 3 | `#817A70` | Texto del pie |

### Gradiente principal

`linear-gradient(135deg, #EAD07F 0%, #C9A54B 58%, #9B792D 100%)`

Se utiliza en las llamadas a la accion. El texto debe permanecer en `#151109`.

### Contraste verificado

| Combinacion | Ratio | Resultado para texto normal |
|---|---:|---|
| Marfil sobre negro | 17.52:1 | AAA |
| Gris calido sobre negro | 9.04:1 | AAA |
| Dorado principal sobre negro | 8.50:1 | AAA |
| Dorado claro sobre negro | 13.11:1 | AAA |
| Texto oscuro sobre dorado principal | 8.04:1 | AAA |
| Gris del pie sobre negro | 4.72:1 | AA |

## Tipografia

### Cormorant Garamond

Familia expresiva para titulares y momentos editoriales.

- Pesos implementados: 400, 500 y 600.
- Italica: aplicada a la palabra `Studio` en el hero.
- Titular principal: peso 500, interletraje `-0.025em`, interlineado `0.82`.
- Titulares de seccion: peso 500, interlineado entre `0.92` y `1`.
- Titulares secundarios: peso 500, interlineado `1.08`.

### Jost

Familia funcional para navegacion, lectura y acciones.

- Pesos implementados: 400, 500 y 600.
- Texto de parrafo: interlineado entre `1.5` y `1.65`.
- Botones: peso 600, mayusculas, interletraje `0.12em`.
- Etiquetas: pesos 500 o 600, mayusculas, interletraje entre `0.24em` y `0.25em`.

### Jerarquia recomendada para continuidad

| Nivel | Familia | Peso | Tratamiento |
|---|---|---:|---|
| Hero | Cormorant Garamond | 500 | Gran escala, interlineado compacto |
| Palabra destacada | Cormorant Garamond Italic | 400 | Dorado claro |
| Titulo de seccion | Cormorant Garamond | 500 | Marfil |
| Etiqueta | Jost | 500 | Mayusculas y tracking amplio |
| Cuerpo | Jost | 400 | Gris calido |
| CTA | Jost | 600 | Mayusculas sobre gradiente dorado |

## Composicion y componentes

### Llamadas a la accion

- Fondo: gradiente dorado principal.
- Texto: `#151109`.
- Radio: `2px`.
- Altura minima principal: `52px`.
- Altura minima compacta: `44px`.
- Texto en mayusculas con tracking amplio.
- El foco visible utiliza un contorno de `2px` en dorado claro y separacion de `4px`.

### Etiquetas

- Jost en mayusculas.
- Dorado principal o gris tenue.
- Tracking entre `0.24em` y `0.25em`.
- Linea horizontal fina como recurso editorial opcional.

### Separadores y superficies

- Separadores en `#2D2922` o dorado con baja opacidad.
- Superficies predominantemente planas, sin sombras intensas.
- Los brillos dorados deben ser difusos, tenues y secundarios al contenido.
- Evitar bordes redondeados grandes, tarjetas luminosas o colores saturados ajenos a la paleta.

## Direccion fotografica

No existe todavia una biblioteca fotografica aprobada dentro de la landing. Si se incorpora fotografia, debe documentar el local, el trabajo o el equipo real. Deben evitarse imagenes genericas que puedan presentarse como evidencia del negocio.

Tratamiento propuesto para futuras fotografias, pendiente de aprobacion:

- luz calida y contraste controlado;
- negros profundos sin perder detalle;
- acentos dorados discretos;
- piel y cabello con color natural;
- encuadres cercanos al oficio, herramientas, proceso y espacio real;
- ausencia de textos o promociones inventadas dentro de la imagen.

## Logo

La referencia disponible muestra un monograma `EE`, laureles, un diamante y el texto `Evolution Studio` en dorado sobre negro. La fuente disponible es una captura vertical de Instagram de 946 por 2048 pixeles, sin transparencia.

### Uso permitido en este paquete

- Conservar la captura original como evidencia.
- Mostrarla como referencia, identificada como no maestra.
- Mantener el recorte operativo ya utilizado por la landing mientras no exista reemplazo aprobado.

### Uso no autorizado

- Declarar un SVG reconstruido como logo oficial.
- Inventar detalles faltantes mediante generacion de imagenes.
- Cambiar monograma, laureles, diamante, proporciones o texto.
- Presentar una version transparente o monocromatica como aprobada.
- Extraer colores corporativos oficiales desde el efecto metalico de la captura.

## Voz visual y verbal

La landing utiliza lenguaje breve, directo y funcional. Los textos deben ayudar a identificar el estudio, ubicarlo, conocer su trabajo o iniciar una reserva. Deben evitarse promociones, precios, servicios, testimonios, horarios o promesas que no hayan sido confirmados.

## Implementacion

Los archivos `tokens/evolution.css` y `tokens/evolution.tokens.json` registran el sistema actual sin modificar la landing. Son una fuente reutilizable para una integracion futura, no una indicacion de que el codigo publicado haya sido migrado.

## Control de cambios

Antes de cambiar la paleta, la tipografia o el logo se debe registrar:

1. elemento afectado;
2. fuente de la solicitud;
3. evidencia o aprobacion del cliente;
4. fecha;
5. version del paquete;
6. aplicaciones que deben actualizarse.

