# Evolution Studio — prototipo de reserva

Prototipo frontend-only del flujo servicio → barbero → fecha/hora → confirmación, revestido con la identidad visual del demo público de Evolution Studio. Todas las selecciones y la confirmación final son locales: no consulta Vortexa, no envía datos ni crea citas reales.

## Ejecutar

Desde la raíz del repositorio:

```bash
python3 -m http.server 4173
```

Abrir `http://localhost:4173/reservation-prototype/`. En Sites, el mismo documento se publica en `/reservar` con sus assets incrustados.

## Alcance

- Servicio → barbero → fecha/hora → confirmación.
- Datos de muestra capturados de la interfaz fuente el 31 de agosto de 2026 y etiquetados como demostrativos.
- Calendario dinámico en zona `America/Santiago`, desde el día vigente hasta 60 días futuros.
- Horarios simulados de 15:00 a 20:30 cada 30 minutos; los horarios pasados del día actual se ocultan.
- Cormorant Garamond, Jost, Bootstrap Icons y el logo de Evolution guardados localmente.
- Sin framework, backend, base de datos ni dependencias npm.
- Nombre, teléfono y notas existen sólo en memoria y se borran al recargar o iniciar una nueva simulación.
