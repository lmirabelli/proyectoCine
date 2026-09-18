# Alcance inicial

## E-Mail 1 y 2

### Modulo Cliente
- Catalogo de Peliculas: Muestreo de peliculas con titulo, sinopsis, afiche y duracion. OK
- Destacados y Ranking: Seccion principal con las 3 peliculas mas vendidas. OK
- Buscador Integrado: Buscador simple de peliculas en la pagina de inicio. OK
- Reseñas y Calificaciones: Sistema de valoracion por estrellas, comentarios breves por pelicula y calculo de puntuacion promedio. OK
- Proceso de Compra: Seleccion de formato (2D, 3D, 4D, 5D), idioma (castellano/subtitulada) y generacion de comprobante en PDF con codigo QR unificado. OK
- Registro e Identificacion: Creacion de cuenta recopilando email, nombre, apellido, fecha de nacimiento, tipo de sangre, color de ojos y dias de vacaciones al año. Habilitacion de compra en modo invitado (anonimo).
- Beneficio Inicial: Aplicacion de un 20% de descuento en la primera compra de usuarios registrados.

### Modulo Administrador

- Control Horario de Funciones: Regla tecnica para evitar la programacion de funciones en una misma sala sin una ventana minima de 30 minutos de limpieza entre proyecciones.

## E-Mail 3

- Filtro Multicriterio: Se extiende el buscador principal para permitir la filtracion por genero, contemplando peliculas asignadas a multiples generos de forma simultanea.

## E-Mail 4

- Venta e Integracion de Candy Bar: Desarrollo del modulo de venta de comestibles y bebidas por categorias.
- QR Unificado (Cine + Candy): Integracion de los productos comestibles comprados en el mismo codigo QR del ticket de cine.
- Gestion Dinamica de Cupones: Panel para ajustar el porcentaje del cupon de bienvenida y creacion de cupones segmentados por reglas (ej. usuarios mayores de 50 años).

## E-Mail 5

- Gestion de Roles y Permisos:
    - Rol Empleado: Interfaz dedicada para escaneo de QR y despacho de Candy Bar. Permite ingreso manual de codigo si falla el lector.
    - Rol Admin: Control total de configuraciones, salas y productos.
- Control de Estado del QR: Invalidacion automatica e inmediata del codigo QR tras su primer uso para acceso o entrega de comida.
- Motor de Asignacion Automatica de Salas: Algoritmo que recibe la grilla de dias/horarios solicitada y asigna salas disponibles automaticamente evitando solapamientos de funciones.

## E-Mail 6 

- Restriccion de Edad: Control de fecha de nacimiento contra la calificacion de la pelicula (+13 / +18). Bloqueo de venta autonoma e impresion de la leyenda "Debe asistir acompañado por un adulto" en el ticket.
- Mapa de Sala Reestructurado: Modificacion del layout a 20 filas (A-T). Asignacion de filas J y K para butacas adaptadas/accesibles en bloques de 2, 10 y 2 asientos.
- Sincronizacion en Tiempo Real: Visualizacion en tiempo real (via Supabase Realtime) de butacas ocupadas mientras se realiza la compra, con resaltado grafico especial para las filas J y K.

## E-Mail 7

- Optimizacion UX: Rediseño de selectores de fecha y hora para evitar scroll continuo.
- Reporte Basico de Facturacion: Modulo administrativo que expone el total facturado diario y la cantidad de entradas vendidas.

## E-Mail 8

- Programa de Puntos: Sistema de acumulacion de 1 punto por peso gastado en usuarios registrados (puntos personales e intransferibles).
- Gestion y Canje de Puntos: Seccion en la cuenta del usuario para consultar saldo, historial de canjes y cambiar puntos por entradas o items del Candy Bar (precios en puntos configurables por el Admin).
- Combos Especiales: Creacion y destaque visual de paquetes cerrados (ej. Entrada + Pochoclo + Bebida) a precio fijo en el checkout.

## E-Mail 9

- Seccion "Proximamente" y Alertas: Listado de futuros estrenos con suscripcion a notificaciones para cuando se habilite la venta.
- Modulo de Preventa: Apertura de venta anticipada hasta 7 dias antes del estreno con precio promocional configurable.
- Modulo "Mis Peliculas": Galeria en el perfil con el historial visual de peliculas vistas, fechas y la calificacion propia emitida.

## E-Mail 10

Billetera Virtual y Cancelacion: Permitir cancelaciones hasta 2 horas antes de la funcion, acreditando el importe pagado como saldo a favor (sin devolucion de dinero).
Butacas VIP: Asignacion de Filas R, S y T como categoria VIP con tarifa diferencial y diferenciacion grafica en el mapa de asientos.
Reportes Avanzados y Exportacion: Graficos estadisticos de peliculas mas vistas (semanal/mensual), producto mas vendido del Candy y exportacion de reportes de facturacion a PDF y Excel.
Logs de Auditoria: Modulo inmutable para registrar fecha, hora y usuario detras de cada accion administrativa o de validacion.

# Exclusiones

- Devolucion de dinero en efectivo o cuenta bancaria.
- Navegacion o mapa 3D interactivo del edificio del cine.
- Transferencia de puntos entre cuentas de usuario.
- Aplicaciones moviles nativas