# Documentación Técnica de Componentes - Proyecto Cine Progra IV

Esta documentación ofrece un desglose exhaustivo de todos los componentes Angular del proyecto **Proyecto Cine**, detallando su propósito, momento de utilización, eventos, entradas, salidas, la totalidad de sus métodos implementados y la integración del sistema de alertas y modales con **SweetAlert2** (`sweetalert2`).

---

## 🎨 Sistema de Modales y Notificaciones (SweetAlert2)

El proyecto cuenta con la librería **SweetAlert2** integrada para reemplazar la totalidad de las llamadas nativas `alert()` y `confirm()` del navegador por una interfaz visual interactiva, profesional y responsiva (`Swal.fire`).

### Tipos de Interacciones Implementadas:
- **Modales de Confirmación (`icon: 'question'` / `icon: 'warning'` con `showCancelButton: true`):** Utilizados antes de realizar operaciones destructivas o irreversibles (borrado de cupones, eliminación de perfiles de usuario, confirmación de pago con puntos).
- **Alertas de Información y Error (`icon: 'info'` / `icon: 'error'` / `icon: 'warning'`):** Utilizados para notificar requerimientos de autenticación, restricciones de acceso por rol, falta de selección de butacas o fallos en transacciones.
- **Toasts y Confirmaciones de Éxito (`icon: 'success'` con `timer`):** Feedback visual inmediato tras publicar reseñas, actualizar roles de usuario o generar comprobantes de compra.

---

## Índice de Componentes

1. [App](#1-app)
2. [Navbar](#2-navbar)
3. [Catalogo](#3-catalogo)
4. [Buscador](#4-buscador)
5. [TarjetaPelicula](#5-tarjetapelicula)
6. [Destacados](#6-destacados)
7. [PeliculaId](#7-peliculaid)
8. [ProcesoCompra](#8-procesocompra)
9. [DisposicionButacas](#9-disposicionbutacas)
10. [CandyBar](#10-candybar)
11. [Login](#11-login)
12. [MenuEmpleados](#12-menuempleados)
13. [GestionFunciones](#13-gestionfunciones)
14. [GestionPeliculas](#14-gestionpeliculas)
15. [GestionUsuarios](#15-gestionusuarios)
16. [DespachoCandy](#16-despachocandy)
17. [Cupones](#17-cupones)
18. [Facturacion](#18-facturacion)
19. [Graficos](#19-graficos)

---

## 1. AppComponent

- **Selector:** `app-root`
- **Ubicación:** `src/app/app.ts`
- **Ruta asociable:** Raíz global de la aplicación.

### ¿Para qué se usa?
Es el componente contenedor raíz de Angular. Define la estructura base donde se carga la barra de navegación (`app-navbar`) y la zona dinámica de intercambio de vistas (`router-outlet`).

### ¿Cuándo se usa?
Permanentemente durante el ciclo de vida completo de la ejecución de la aplicación.

### Métodos y Propiedades

- `title: string`: Contiene el título de la aplicación (`Cine puchito puchito 🚬 🚬`).

---

## 2. NavbarComponent

- **Selector:** `app-navbar`
- **Ubicación:** `src/app/components/navbar/navbar.ts`
- **Ruta asociable:** Presente en todas las páginas (dentro de `app.html`).

### ¿Para qué se usa?
Es la barra de navegación superior. Proporciona los enlaces principales de navegación, visualiza los puntos acumulados del usuario registrado, determina dinámicamente el acceso al menú de empleados o panel de administración según el rol autenticado, e incluye el botón de cierre de sesión.

### ¿Cuándo se usa?
Visibilidad constante en el encabezado de todas las rutas de la plataforma.

### Métodos y Propiedades

- `usuario`: Signal derivado del servicio de Supabase que observa el usuario autenticado actualmente.
- `esAdmin: signal<boolean>`: Estado que indica si el usuario posee rol de Administrador.
- `esPersonal: signal<boolean>`: Estado reactivo que evalúa si el usuario es Administrador o Empleado.
- `puntos`: Signal que contiene la cantidad de puntos acumulados por el usuario.
- `constructor()`: Inicializa un `effect` que reacciona ante cambios en el estado de autenticación de `usuario()`, consultando los permisos (roles) y el saldo de puntos desde `SupabaseService`.
- `irAlMenuEmpleados(): void`: Navega de manera programática a la ruta `/menu-empleados`.
- `irAlLogin(): void`: Navega hacia la pantalla de inicio de sesión `/login`.
- `irAlPanelAdmin(): void`: Redirige al panel de administración de funciones `/panelAdministrador`.
- `esRutaCandy(): boolean`: Evalúa si la URL actual del navegador coincide exactamente con `/candybar`.
- `irAlCandy(): void`: Ejecuta el método helper del servicio Supabase para dirigir al usuario a la tienda Candy Bar.
- `cerrarSesion(): Promise<void>`: Cierra la sesión activa en Supabase, resetea el flag `esAdmin` a `false` y redirige al inicio (`/`).

---

## 3. CatalogoComponent

- **Selector:** `app-catalogo`
- **Ubicación:** `src/app/components/catalogo/catalogo.ts`
- **Ruta asociable:** `/` (Ruta raíz predeterminada).

### ¿Para qué se usa?
Funciona como la landing page / catálogo principal de películas. Muestra el carrusel de películas destacadas (más vendidas), las películas actualmente "En Cartelera", los "Próximos Estrenos" y aloja el componente de filtro/búsqueda.

### ¿Cuándo se usa?
Se carga al ingresar a la raíz del sitio web o cuando el usuario hace clic en el logotipo o enlace de inicio.

### Métodos y Propiedades

- `peliculas: signal<Pelicula[]>`: Lista de películas en cartelera.
- `destacadas: signal<Pelicula[]>`: Top 3 de películas en cartelera ordenadas por volumen total de ventas.
- `proximamente: signal<Pelicula[]>`: Lista de películas catalogadas como próximos estrenos.
- `busqueda: signal<boolean>`: Flag que indica si hay una consulta de filtro activa.
- `cargando: signal<boolean>`: Flag para mostrar indicador de carga durante la consulta inicial.
- `ngOnInit(): Promise<void>`: Ejecuta la carga de datos iniciales del catálogo.
- `cargarDatosIniciales(): Promise<void>`: Consulta todas las películas a Supabase junto con sus géneros asociados, separándolas en cartelera y próximos estrenos, y calculando las destacadas.
- `onBuscar(filtro: FiltroBusqueda): Promise<void>`: Recibe la emisión del componente `app-buscador` y realiza las consultas filtradas en la base de datos por coincidencia de título e IDs de géneros.
- `obtenerDestacadas(listaEnCartelera: Pelicula[]): void`: Ordena las películas según `ventas_totales` descendente y extrae las 3 principales.
- `irAlDetalle(id: string): void`: Navega hacia `/pelicula/:id` al presionar sobre la tarjeta de una película.

---

## 4. Buscador

- **Selector:** `app-buscador`
- **Ubicación:** `src/app/components/buscador/buscador.ts`
- **Ruta asociable:** Subcomponente de `CatalogoComponent`.

### ¿Para qué se usa?
Proporciona el formulario interactivo de búsqueda rápida por campo de texto y selección mediante checkboxes de géneros cinematográficos.

### ¿Cuándo se usa?
Cada vez que se renderiza el catálogo principal de películas.

### Entradas y Salidas
- `@Output() buscar = new EventEmitter<FiltroBusqueda>()`: Emite los criterios de filtro en tiempo real o al hacer submit.

### Métodos y Propiedades

- `busquedaTexto: signal<string>`: Texto ingresado por el usuario.
- `generos: signal<Genero[]>`: Lista completa de géneros traídos desde la base de datos.
- `generosSeleccionadosIds: signal<string[]>`: Arreglo de IDs de géneros tildados.
- `ngOnInit(): Promise<void>`: Carga la lista de géneros disponibles al iniciar.
- `cargarGeneros(): Promise<void>`: Consulta la tabla `generos` ordenada alfabéticamente.
- `onGeneroChange(id: string, checked: boolean): void`: Agrega o remueve un género según la interacción con los checkboxes y dispara `emitirFiltro()`.
- `onTextoInput(valor: string): void`: Actualiza el valor del texto buscado y dispara la búsqueda.
- `onBuscarSubmit(): void`: Ejecuta la búsqueda al presionar enter o el botón del formulario.
- `limpiarBuscador(): void`: Limpia el texto de búsqueda, desmarca géneros y restablece la vista general del catálogo.
- `emitirFiltro(): void`: Emite el objeto `{ texto, generosIds }` al componente padre.

---

## 5. TarjetaPeliculaComponent

- **Selector:** `app-tarjeta-pelicula`
- **Ubicación:** `src/app/components/tarjeta-pelicula/tarjeta-pelicula.ts`
- **Ruta asociable:** Componente reutilizable en `CatalogoComponent`.

### ¿Para qué se usa?
Componente puramente de presentación. Muestra la tarjeta visual de una película (afiche, título, restricciones) con animación al pasar el mouse.

### ¿Cuándo se usa?
En la grilla de cartelera y próximos estrenos dentro del catálogo.

### Entradas y Salidas
- `@Input({ required: true }) pelicula!: Pelicula`: Objeto con la información de la película.
- `@Input() esDestacada: boolean`: Flag para aplicar diseño especial si es destacada.
- `@Input() rankingIndex?: number`: Posición en el ranking si aplica.
- `@Output() seleccionar = new EventEmitter<Pelicula>()`: Notifica la selección de la película.

### Métodos y Propiedades

- `onSeleccionar(): void`: Emite la película seleccionada al hacer clic sobre la tarjeta.

---

## 6. Destacados

- **Selector:** `app-destacados`
- **Ubicación:** `src/app/components/destacados/destacados.ts`
- **Ruta asociable:** Componente de presentación dentro de `CatalogoComponent`.

### ¿Para qué se usa?
Muestra el banner o tarjeta especial de películas destacadas, remarcando su posición o ranking de popularidad en el cine.

### ¿Cuándo se usa?
En el carrusel/sección de "Películas Más Vistas" en la parte superior del catálogo.

### Entradas y Salidas
- `@Input({ required: true }) pelicula!: Pelicula`: Datos de la película destacada.
- `@Input() esDestacada: boolean`: Define el diseño destacado.
- `@Input() rankingIndex?: number`: Número de puesto en el ranking.
- `@Output() seleccionar = new EventEmitter<Pelicula>()`: Evento al interactuar con la tarjeta.

### Métodos y Propiedades

- `onSeleccionar(): void`: Emite el objeto película al ser clickeado.

---

## 7. PeliculaIdComponent

- **Selector:** `app-pelicula-id`
- **Ubicación:** `src/app/components/pelicula-id/pelicula-id.ts`
- **Ruta asociable:** `/pelicula/:id`

### ¿Para qué se usa?
Muestra los detalles completos de una película elegida (sinopsis, duración, formato, afiche), sus calificaciones promedio y el listado de comentarios/reseñas dejados por otros usuarios. Permite a los usuarios registrados publicar sus propias reseñas y puntuación (1 a 10 estrellas). Integrado con **SweetAlert2** para alertas de sesión, validación e impacto de la reseña.

### ¿Cuándo se usa?
Cuando un usuario hace clic en una película desde el catálogo para ver su ficha técnica y opiniones.

### Entradas
- `@Input() id!: string`: ID de la película obtenido directamente de los parámetros de la URL.

### Métodos y Propiedades

- `cargando: signal<boolean>`: Indicador de carga de datos.
- `enviando: signal<boolean>`: Indicador de envío de comentario.
- `pelicula: signal<any>`: Objeto con la información de la película actual.
- `resenas: signal<any[]>`: Arreglo de reseñas registradas.
- `comentarioTexto: signal<string>`: Texto ingresado para la nueva reseña.
- `estrellasSeleccionadas: signal<number>`: Cantidad de estrellas (1 a 10) seleccionadas por el usuario.
- `ngOnInit(): Promise<void>`: Dispara la lectura de información de la película y sus reseñas.
- `cargarPeliculaYResenas(): Promise<void>`: Realiza las llamadas a la base de datos en Supabase relacionando reseñas con perfiles de usuarios.
- `enviarResena(): Promise<void>`: Valida con `Swal.fire` la sesión del usuario y la cantidad de estrellas seleccionadas; al confirmar el guardado en Supabase, muestra un modal de éxito (`icon: 'success'`).

---

## 8. ProcesoCompraComponent

- **Selector:** `app-proceso-compra`
- **Ubicación:** `src/app/components/proceso-compra/proceso-compra.ts`
- **Ruta asociable:** `/proceso-compra/:id`

### ¿Para qué se usa?
Asiste al usuario en la primera etapa de compra de entradas: selección del día de la función, elección del horario/sala disponible, cantidad de entradas, cálculo de descuentos según edad del perfil (Jubilados / Niños) y selección de las butacas específicas. Integra **SweetAlert2** para validar la función y la cantidad de asientos.

### ¿Cuándo se usa?
Al presionar el botón "Comprar Entradas" en la ficha de una película.

### Entradas
- `@Input() id` / `peliculaId`: ID de la película recibida por parámetro de ruta.
- `@Input() tituloPelicula: string`: Título opcional pasado directamente.

### Métodos y Propiedades

- `precioBase`: Precio por omisión de la entrada ($12.000).
- `todasLasFunciones: signal<FuncionPelicula[]>`: Lista completa de funciones programadas.
- `diasDisponibles: signal<DiaOpcion[]>`: Arreglo de los próximos 7 días a partir de la fecha actual.
- `fechaSeleccionada: signal<string>`: Fecha ISO del día seleccionado por el usuario.
- `funcionesDelDia`: Computado que filtra las funciones disponibles para la fecha seleccionada.
- `funcionSeleccionadaId: signal<string>`: ID de la función elegida.
- `cantidadEntradas: signal<number>`: Número de entradas que se desean adquirir (1 a 10).
- `porcentajeDescuentoEdad: signal<number>`: Porcentaje de descuento obtenido según la edad del usuario registrado.
- `requiereAdulto: signal<boolean>`: Flag que advierte si la película es SAM (ej. SAM 16/18) y el usuario es menor de edad.
- `butacasSeleccionadas: signal<Butaca[]>`: Arreglo de butacas marcadas en el mapa interactivo.
- `ngOnInit(): Promise<void>`: Genera la lista de días, obtiene la edad del usuario y carga las funciones disponibles.
- `generarDiasSemana(): void`: Calcula las fechas de la semana en curso.
- `cargarPelicula(): Promise<void>`: Trae el título y la restricción de edad de la película.
- `cargarDatosUsuarioYDescuentos(): Promise<void>`: Lee la fecha de nacimiento del perfil de usuario y evalúa si aplica a alguna regla de la tabla `descuentos`.
- `evaluarRestriccionEdad(): void`: Compara la edad del usuario con la clasificación de la película.
- `calcularEdad(fechaNacimientoStr: string): number`: Helper para calcular la edad exacta en años.
- `evaluarDescuentoPorEdad(edad: number): Promise<void>`: Obtiene el porcentaje correspondiente desde la base de datos.
- `cargarFunciones(): Promise<void>`: Consulta las funciones activas en la base de datos dentro de los próximos 7 días.
- `seleccionarFecha(fechaStr: string): void`: Cambia la fecha activa y auto-selecciona el primer horario disponible.
- `autoSeleccionarPrimerHorario(): void`: Marca la primera función encontrada como seleccionada por defecto.
- `onButacasCambiadas(butacas: Butaca[]): void`: Callback ejecutado desde el subcomponente de butacas para sincronizar la selección.
- `modificarCantidad(cambio: number): void`: Incrementa o decrementa el contador de entradas.
- `finalizarCompra(): void`: Lanza avisos con `Swal.fire` (`icon: 'warning'`) si no se seleccionó función o si los asientos marcados no coinciden con las entradas elegidas, antes de guardar el borrador en `localStorage` y redirigir al Candy Bar.

---

## 9. DisposicionButacasComponent

- **Selector:** `app-disposicion-butacas`
- **Ubicación:** `src/app/components/disposicion-butacas/disposicion-butacas.ts`
- **Ruta asociable:** Subcomponente de `ProcesoCompraComponent`.

### ¿Para qué se usa?
Renderiza la grilla interactiva de butacas de la sala de cine (filas A hasta T en 3 bloques por fila, incluyendo filas accesibles J y K). Realiza suscripción a Supabase Realtime para deshabilitar en vivo asientos ocupados por otras compras simultáneas.

### ¿Cuándo se usa?
Dentro de la pantalla de proceso de compra cuando se ha seleccionado una función válida.

### Entradas y Salidas
- `@Input() funcionId!: string`: ID de la función elegida.
- `@Input() salaId!: string`: ID de la sala.
- `@Input() cantidadMaxSeleccionable: number`: Limita cuántos asientos se pueden seleccionar a la vez.
- `@Output() seleccionCambiada = new EventEmitter<Butaca[]>()`: Notifica cuando el usuario selecciona o desmarca un asiento.

### Métodos y Propiedades

- `mapaFilas: signal<...>`: Representación jerárquica de la sala por filas y bloques.
- `butacasSeleccionadas: signal<Butaca[]>`: Arreglo de asientos actualmente seleccionados por el usuario.
- `ngOnInit(): Promise<void>`: Construye la matriz de butacas, consulta las ocupadas en Supabase y activa la suscripción Realtime.
- `ngOnChanges(changes: SimpleChanges): Promise<void>`: Reinicia la selección y vuelve a cargar si cambia la función o sala.
- `ngOnDestroy(): void`: Cancela la suscripción al canal Realtime para evitar fugas de memoria.
- `suscribirRealtime(): void`: Escucha eventos `INSERT` en la tabla `entradas_reservadas` filtrados por la función actual.
- `desuscribirRealtime(): void`: Cierra el canal en Supabase.
- `marcarAsientoComoOcupadoRealtime(asientoId: string): void`: Deshabilita dinámicamente una butaca al ser reservada en tiempo real.
- `generarMapaYObtenerOcupadas(): Promise<void>`: Crea la estructura de filas/bloques cruzando los datos con los asientos previamente reservados.
- `obtenerAsientosOcupados(): Promise<string[]>`: Consulta la tabla `entradas_reservadas` en Supabase.
- `crearBloque(...)`: Helper para construir arreglos de objetos `Butaca`.
- `seleccionarButaca(butaca: Butaca): void`: Agrega o remueve butacas de la selección del usuario respetando el límite máximo.

---

## 10. CandyBarComponent

- **Selector:** `app-candy-bar`
- **Ubicación:** `src/app/components/candy-bar/candy-bar.ts`
- **Ruta asociable:** `/candybar`

### ¿Para qué se usa?
Punto de venta de golosinas/combos del cine y cierre de transacción. Integra **SweetAlert2** para la gestión completa del checkout: avisos de autenticación, saldo de puntos, diálogos de confirmación interactiva para canjes de puntos y alertas de comprobante PDF emitido.

### ¿Cuándo se usa?
Cuando el usuario navega a la tienda de golosinas o cuando es redirigido tras elegir sus entradas de cine.

### Métodos y Propiedades

- `productos: signal<ProductoCandy[]>`: Catálogo de golosinas/bebidas disponibles.
- `carrito: signal<ItemCarrito[]>`: Artículos agregados al carrito.
- `reservaPendiente: signal<ReservaEntradasCache | null>`: Entradas pendientes recuperadas del `localStorage`.
- `puntosUsuario: signal<number>`: Puntos disponibles en el perfil del usuario.
- `cuponAplicado`: Signal con los datos del cupón promocional validado.
- `descuentoReglaAplicada`: Descuento automático (ej. 20% OFF en la 1ª compra).
- `ngOnInit(): Promise<void>`: Recupera la reserva pendiente, productos, puntos del perfil y reglas de descuento.
- `cargarPuntosUsuario(): Promise<void>`: Obtiene el total de puntos acumulados.
- `evaluarDescuentosAutomaticos(): Promise<void>`: Verifica si el usuario nunca ha realizado compras para aplicar el beneficio de bienvenida.
- `aplicarCupon(): Promise<void>`: Consulta el código ingresado en la tabla `cupones` verificando que haya stock disponible (`disponible > 0`).
- `cargarReservaPendiente(): Promise<void>`: Lee y parsea `reserva_entradas_pendiente` desde `localStorage`.
- `cancelarReservaEntradas(): void`: Elimina la reserva de entradas pendiente del almacenamiento local.
- `cargarProductos(): Promise<void>`: Consulta los items de la tabla `candy`.
- `seleccionarCategoria(cat: string): void`: Filtra la lista de productos por categoría.
- `agregarAlCarrito(producto: ProductoCandy): void`: Incorpora un producto o incrementa su cantidad en el carrito.
- `modificarCantidad(productoId: string, cambio: number): void`: Ajusta la cantidad de un producto o lo elimina si llega a 0.
- `vaciarCarrito(): void`: Elimina todos los ítems de candy bar del carrito.
- `pagarConPuntos(): Promise<void>`: Despliega modal de confirmación `Swal.fire({ title: '¿Confirmar pago con puntos?', icon: 'question', showCancelButton: true })`; al aceptar, efectúa el descuento de puntos en Supabase y emite un modal de éxito (`icon: 'success'`).
- `pagarYGenerarPdf(): Promise<void>`: Procesa la compra ordinaria y despliega `Swal.fire` notificando que el ticket PDF con código QR fue descargado exitosamente.
- `completarTransaccion(generadorCodigo, estadoCustom): Promise<void>`: Registra la orden en `comprobantes`, bloquea las butacas en `entradas_reservadas`, actualiza contador de ventas y llama al `PdfService`.

---

## 11. LoginComponent

- **Selector:** `app-login`
- **Ubicación:** `src/app/components/login/login.ts`
- **Ruta asociable:** `/login`

### ¿Para qué se usa?
Proporciona los formularios de inicio de sesión y registro de usuarios. Durante el registro solicita datos personales completos, fecha de nacimiento, grupo sanguíneo, color de ojos y días de vacaciones acumulados (según requerimientos específicos del dominio del sistema). Permite además continuar en modo invitado.

### ¿Cuándo se usa?
Cuando un usuario no autenticado desea identificarse, crear una cuenta nueva o acceder libremente como invitado.

### Métodos y Propiedades

- Signals para campos de Login (`loginEmail`, `loginPassword`) y Registro (`regNombre`, `regApellido`, `regUsuario`, `regEmail`, `regPassword`, `regDia`, `regMes`, `regAnio`, `regTipoSangre`, `regColorOjos`, `regDiasVacaciones`).
- Computados para validación de formato de email, campos requeridos y fechas válidas (`errLoginEmail`, `errRegNombre`, `regFormValido`, etc.).
- `marcarTocado(campo: string): void`: Registra interacción del usuario con un control para activar mensajes de error en plantilla.
- `onLogin(): Promise<void>`: Valida el formulario de login y llama a `SupabaseService.iniciarSesion()`.
- `onRegister(): Promise<void>`: Registra un nuevo perfil de usuario invocando `SupabaseService.registrarUsuario()`.
- `continuarComoInvitado(): void`: Limpia el estado de usuario autenticado en el servicio y redirige al catálogo.

---

## 12. MenuEmpleadosComponent

- **Selector:** `app-menu-empleados`
- **Ubicación:** `src/app/components/menu-empleados/menu-empleados.ts`
- **Ruta asociable:** `/menu-empleados` (Protegida por `empleadoGuard`).

### ¿Para qué se usa?
Dashboard o panel de control intuitivo con accesos directos hacia las distintas áreas de operación del cine: Despacho de Candy Bar / Escáner QR, Gestión de Películas, Gestión de Funciones, Gestión de Usuarios, Cupones y Facturación.

### ¿Cuándo se usa?
Al ser accedido por personal administrativo o empleados tras autenticarse.

### Métodos y Propiedades
Es un componente estático de enrutamiento que utiliza `RouterLink` para la navegación a los módulos de trabajo.

---

## 13. GestionFuncionesComponent

- **Selector:** `app-gestion-funciones`
- **Ubicación:** `src/app/components/gestion-funciones/gestion-funciones.ts`
- **Ruta asociable:** `/panelAdministrador`

### ¿Para qué se usa?
Permite a los administradores crear y programar nuevas funciones de cine asociando películas con salas, idiomas y horarios. Cuenta con un algoritmo de cálculo e imputación automática de horarios y salas libres sin solapamientos.

### ¿Cuándo se usa?
Para el armado de la grilla horaria del cine.

### Métodos y Propiedades

- `peliculas: signal<Partial<Pelicula>[]>`: Lista de películas elegibles.
- `salas: signal<Sala[]>`: Salas configuradas.
- `funciones: signal<FuncionPelicula[]>`: Funciones previamente registradas.
- Computados para obtener el formato de la sala seleccionada, precio y horario estimado de finalización (`fechaFinPelicula`).
- `ngOnInit(): Promise<void>`: Comprueba los permisos de administrador y carga películas, salas y funciones.
- `verificarAcceso(): Promise<void>`: Restringe la vista a administradores.
- `cargarPeliculas()`, `cargarSalas()`, `cargarFunciones()`: Consultas de datos a Supabase.
- `calcularSalaYHorarioAutomatico(): void`: Algoritmo inteligente que busca la primera sala compatible con el formato de la película (2D/3D/4D) y calcula la hora exacta de inicio posterior a la última función programada (sumando un margen de limpieza de 30 minutos).
- `crearFuncion(): Promise<void>`: Valida que no existan cruces u horarios solapados en la misma sala y guarda la función en la tabla `funciones`.

---

## 14. GestionPeliculasComponent

- **Selector:** `app-gestion-peliculas`
- **Ubicación:** `src/app/components/gestion-peliculas/gestion-peliculas.ts`
- **Ruta asociable:** `/gestionPeliculas` (Protegida por `empleadoGuard`).

### ¿Para qué se usa?
Módulo CRUD de gestión de películas. Permite dar de alta nuevas películas subiendo su afiche/portada al bucket de almacenamiento de Supabase, definir géneros múltiples, restricciones de edad, duraciones, formatos y estados de disponibilidad (cartelera, próximamente, no disponible), o editar películas existentes.

### ¿Cuándo se usa?
Cuando los administradores o empleados necesitan actualizar la oferta cinematográfica.

### Métodos y Propiedades

- Signals para control de campos del formulario (`titulo`, `sinopsis`, `duracionMinutos`, `formato`, `restriccionEdad`, `disponibilidad`, etc.).
- `generosSeleccionadosIds: signal<(number | string)[]>`: Arreglo reactivo con los géneros tildados.
- `ngOnInit(): Promise<void>`: Carga géneros y catálogo de películas si posee permisos.
- `cargarGeneros()`, `cargarPeliculas()`: Métodos de carga inicial.
- `seleccionarParaEditar(p: Pelicula): Promise<void>`: Completa el formulario con los datos de una película existente para su modificación.
- `onGeneroCheckboxChange(generoId, isChecked): void`: Manipula el set de géneros seleccionados.
- `onArchivoSeleccionado(event: Event): void`: Lee el archivo de imagen local seleccionado y genera una URL de vista previa mediante `FileReader`.
- `guardarPelicula(): Promise<void>`: Sube el afiche a Supabase Storage si se cargó un archivo nuevo, actualiza o inserta la película en la tabla `peliculas` y sincroniza las relaciones M:N en la tabla intermedia `generos_peliculas` mediante `upsert`.
- `limpiarFormulario(): void`: Resetea todos los campos del formulario.

---

## 15. GestionUsuariosComponent

- **Selector:** `app-gestion-usuarios`
- **Ubicación:** `src/app/components/gestion-usuarios/gestion-usuarios.ts`
- **Ruta asociable:** `/gestionUsuarios` (Protegida por `empleadoGuard`).

### ¿Para qué se usa?
Ofrece una interfaz de administración de los perfiles de usuario registrados. Permite a un administrador alterar el rol de cualquier cuenta (`cliente`, `empleado`, `administrador`) o eliminar usuarios del sistema. Integrado con **SweetAlert2** para confirmaciones de borrado y toasts temporales de actualización de rol.

### ¿Cuándo se usa?
Para el control de accesos y la gestión de permisos del personal.

### Métodos y Propiedades

- `usuarios: signal<UsuarioEdicion[]>`: Arreglo de usuarios registrados obtenido desde la tabla `perfiles`.
- `ngOnInit(): Promise<void>`: Verifica permisos y carga la lista de usuarios.
- `cargarUsuarios(): Promise<void>`: Consulta los perfiles en la base de datos.
- `onSeleccionarRol(usuario: UsuarioEdicion, nuevoRol): void`: Modifica el rol localmente y marca la fila como editada (`modificado = true`).
- `guardarRol(usuario: UsuarioEdicion): Promise<void>`: Guarda el nuevo rol en Supabase y muestra un toast dinámico con `Swal.fire({ icon: 'success', title: 'Rol actualizado', timer: 1500 })`.
- `eliminarPerfil(usuario: UsuarioEdicion): Promise<void>`: Lanza un diálogo modal `Swal.fire({ title: '¿Eliminar perfil?', icon: 'warning', showCancelButton: true })` antes de ejecutar la eliminación en Supabase.

---

## 16. DespachoCandyComponent

- **Selector:** `app-despacho-candy`
- **Ubicación:** `src/app/components/despacho-candy/despacho-candy.ts`
- **Ruta asociable:** `/despacho` (Protegida por `empleadoGuard`).

### ¿Para qué se usa?
Herramienta de punto de entrega para el personal del cine. Permite validar los comprobantes de compra escaneando con la cámara el código QR impreso en los tickets PDF o mediante ingreso manual del código de reserva, permitiendo marcar la orden como "ENTREGADO". Integra **SweetAlert2** para avisar si una orden ya fue entregada previamente.

### ¿Cuándo se usa?
En el mostrador del cine al momento de entregar golosinas o validar las entradas de los clientes.

### Métodos y Propiedades

- `codigoInput: signal<string>`: Código ingresado manualmente o capturado.
- `comprobanteActual: signal<Comprobante | null>`: Comprobante obtenido desde la BD.
- `escaneoActivo: signal<boolean>`: Controla el encendido de la cámara de escaneo QR.
- `buscarComprobante(codigoABuscar?: string): Promise<void>`: Consulta el comprobante en Supabase por `codigo_reserva`.
- `alEscanearQR(codigoRespuesta: string): void`: Callback invocado por el módulo `ZXingScannerComponent` al detectar un código QR. Parsea el texto/JSON y busca el comprobante.
- `marcarComoEntregado(): Promise<void>`: Despliega `Swal.fire({ icon: 'info', title: 'Ya despachado' })` si la orden figura como entregada; de lo contrario actualiza el estado a `ENTREGADO` y guarda `fecha_canje`.
- `toggleCamara(): void`: Enciende o apaga el escáner de cámara.
- `limpiar(): void`: Limpia las búsquedas y mensajes en pantalla.

---

## 17. CuponesComponent

- **Selector:** `app-cupones`
- **Ubicación:** `src/app/components/cupones/cupones.ts`
- **Ruta asociable:** `/cupones`

### ¿Para qué se usa?
Permite a los administradores administrar cupones de descuento promocionales (código, porcentaje de descuento y stock disponible) así como reglas de descuento por tramos de edad (nombre, edad mínima, porcentaje y tope de reintegro en pesos). Integrado con **SweetAlert2** para la confirmación de borrado de promociones.

### ¿Cuándo se usa?
Para la configuración del sistema de promociones e incentivos de venta.

### Métodos y Propiedades

- `cupones: signal<Cupon[]>`: Cupones activos cargados.
- `descuentos: signal<DescuentoRegla[]>`: Reglas de descuento configuradas.
- `ngOnInit(): Promise<void>`: Comprueba permisos de administrador y realiza la carga de datos.
- `verificarAdmin()`, `cargarTodo()`, `cargarCupones()`, `cargarDescuentos()`: Métodos de inicialización.
- `guardarCupon(): Promise<void>`: Valida los datos con `Swal.fire` y registra un nuevo código promocional en la tabla `cupones`.
- `borrarCupon(id: string): Promise<void>`: Solicita confirmación mediante `Swal.fire({ title: '¿Eliminar cupón?', icon: 'warning', showCancelButton: true })` antes de borrar el registro en Supabase.
- `guardarDescuentoEdad(): Promise<void>`: Crea una regla automática de descuento por edad notificando con `Swal.fire`.
- `borrarDescuento(id: string): Promise<void>`: Elimina una regla tras confirmación del administrador.

---

## 18. Facturacion

- **Selector:** `app-facturacion`
- **Ubicación:** `src/app/components/facturacion/facturacion.ts`
- **Ruta asociable:** `/facturacion`

### ¿Para qué se usa?
Dashboard financiero de auditoría para la administración. Presenta desglose de ventas por película y por producto de Candy Bar en un selector de los últimos 7 días, calculando ingresos totales y volumen de ítems vendidos. Incorpora el componente visual de gráficos estadísticas (`app-graficos`). Integrado con **SweetAlert2** para denegar el acceso a no administradores.

### ¿Cuándo se usa?
Cuando los administradores revisan el rendimiento económico de la sucursal.

### Métodos y Propiedades

- `diasDisponibles: signal<DiaSelector[]>`: Lista con las fechas de los últimos 7 días.
- `fechaSeleccionadaIso: signal<string>`: Día seleccionado para la auditoría.
- `ventasPeliculas: signal<VentaPelicula[]>`: Resumen agrupado de recaudación por película.
- `ventasCandy: signal<VentaProducto[]>`: Resumen agrupado de ventas en golosinas.
- Computados para totales recaudados (`totalFacturadoEntradas`, `totalFacturadoCandy`, `totalFacturadoDiarioGeneral`, etc.).
- `ngOnInit(): Promise<void>`: Valida acceso de administrador; si no lo es, notifica con `Swal.fire({ icon: 'error', title: 'Acceso Denegado' })` y redirige al inicio.
- `generarUltimos7Dias(): void`: Calcula el rango de fechas recientes.
- `seleccionarDia(fechaIso: string): Promise<void>`: Cambia la fecha de consulta y recarga el informe.
- `cargarReporteDiario(): Promise<void>`: Obtiene todos los comprobantes emitidos en el rango horario del día seleccionado (`00:00:00` a `23:59:59`), analiza los items de `detalle_items` y agrupa las métricas por tipo de producto y entradas.

---

## 19. GraficosComponent

- **Selector:** `app-graficos`
- **Ubicación:** `src/app/components/graficos/graficos.ts`
- **Ruta asociable:** Subcomponente de `Facturacion`.

### ¿Para qué se usa?
Genera y renderiza gráficos estadísticos e interactivos apoyándose en la librería **Chart.js** sobre un elemento HTML5 `<canvas>`. Permite conmutar dinámicamente entre 3 tipos de análisis de ventas.

### ¿Cuándo se usa?
Dentro del panel de Facturación para el análisis gráfico del negocio.

### Métodos y Propiedades

- `@ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>`: Referencia directa al lienzo de renderizado DOM.
- `tipoSeleccionado: signal<TipoGrafico>`: Tipo de gráfico activo (`ventas_semana`, `ventas_mes_peliculas`, `candy_mes`).
- `ngAfterViewInit(): void`: Inicializa el gráfico una vez disponible el canvas en el DOM.
- `cambiarTipo(nuevoTipo: TipoGrafico): Promise<void>`: Actualiza el tipo seleccionado y vuelve a generar el gráfico.
- `cargarGrafico(): Promise<void>`: Destruye la instancia anterior de `Chart` para evitar sobreposiciones y bifurca según la opción elegida.
- `generarGraficoVentasSemana(): Promise<void>`: Consulta las compras de los últimos 7 días y construye un gráfico de líneas (`line`) mostrando la evolución diaria por película.
- `generarGraficoVentasMesPeliculas(): Promise<void>`: Consulta las entradas vendidas en el mes actual y dibuja un gráfico de barras (`bar`).
- `generarGraficoCandyMes(): Promise<void>`: Consulta los productos de dulcería vendidos en el mes y dibuja un gráfico en forma de dona (`doughnut`).
- `renderizarChart(type, labels, datasets): void`: Instancia el objeto `Chart` con la configuración de colores, leyendas y comportamientos responsivos.

---

## Cuadro Resumen de Componentes y Roles de Acceso

| Componente | Selector | Permisos / Guard | Tipo |
| :--- | :--- | :--- | :--- |
| **AppComponent** | `app-root` | Público | Root Container |
| **NavbarComponent** | `app-navbar` | Público | Global Header |
| **CatalogoComponent** | `app-catalogo` | Público | Vista / Landing Page |
| **Buscador** | `app-buscador` | Público | Subcomponente Filtro |
| **TarjetaPeliculaComponent** | `app-tarjeta-pelicula` | Público | Subcomponente UI |
| **Destacados** | `app-destacados` | Público | Subcomponente UI |
| **PeliculaIdComponent** | `app-pelicula-id` | Público | Vista Detalle / Opiniones |
| **ProcesoCompraComponent** | `app-proceso-compra` | Público | Vista Flujo Venta |
| **DisposicionButacasComponent** | `app-disposicion-butacas` | Público | Subcomponente Realtime |
| **CandyBarComponent** | `app-candy-bar` | Público | Vista Tienda / Checkout |
| **LoginComponent** | `app-login` | Público | Auth / Registro |
| **MenuEmpleadosComponent** | `app-menu-empleados` | `empleadoGuard` | Dashboard Empleados |
| **GestionFuncionesComponent** | `app-gestion-funciones` | Solo Administrador | Admin Funciones |
| **GestionPeliculasComponent** | `app-gestion-peliculas` | `empleadoGuard` / Admin | CRUD Películas |
| **GestionUsuariosComponent** | `app-gestion-usuarios` | `empleadoGuard` / Admin | Admin Usuarios / Roles |
| **DespachoCandyComponent** | `app-despacho-candy` | `empleadoGuard` | Escáner QR / Entrega |
| **CuponesComponent** | `app-cupones` | Solo Administrador | Admin Cupones / Reglas |
| **Facturacion** | `app-facturacion` | Solo Administrador | Dashboard Reportes |
| **GraficosComponent** | `app-graficos` | Solo Administrador | Subcomponente Chart.js |
