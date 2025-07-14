# Plan de Proyecto: Dashboard IT - OsTicket (Task Master)

## Fase 1: Configuración del Entorno y Backend Inicial

- [ ] **1.1. Configuración del Proyecto Base:**
    - [x] Crear estructura de directorios: (Parcial: `backend/routes/` creada. `frontend/...` y `sql/` creadas como vacías)
        ```
        /dashboard-osticket/
         backend/
            routes/
         frontend/
            public/
            src/
                components/
         sql/
        ```
    - [ ] Inicializar un repositorio Git (`git init`). (PENDIENTE: Git no instalado/configurado en PATH)
    - [ ] Crear archivo `README.md` inicial con la descripción del proyecto. (Existente, puede requerir actualización)
    - [x] Crear archivo `.env.example` con variables de entorno (ej. `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `BACKEND_PORT`).
    - [x] Crear archivo `.gitignore` adecuado para el stack tecnológico elegido (Node.js o Python).

- [x] **1.2. Backend - Elección de Tecnología y Configuración Inicial:**
    - [x] Decidir tecnología backend: (Node.js + Express) o (Python + Flask/FastAPI).
        *   *Decisión tomada: Node.js + Express*
    - [x] Instalar dependencias del framework web (Express, Flask, FastAPI).
    - [x] Crear archivo principal del servidor (`server.js` o `app.py`).
    - [x] Configurar el servidor básico para que escuche en un puerto definido en `.env`.

- [x] **1.3. Backend - Conexión a Base de Datos OsTicket:**
    - [x] Elegir e instalar ORM: (Sequelize para Node.js) o (SQLAlchemy para Python).
        *   *Decisión tomada: Sequelize*
    - [x] Instalar conector MySQL para el lenguaje elegido (ej. `mysql2` para Node, `mysqlclient` o `PyMySQL` para Python).
    - [x] Implementar la lógica de conexión a la base de datos MySQL de OsTicket usando el ORM. (Modelos base y asociaciones completados)
    - [x] Configurar la conexión para usar las credenciales de `.env`.
    - [ ] Asegurar que la conexión sea de solo lectura (a nivel de permisos de usuario de BD si es posible, o no implementando
          rutas de escritura en el API).

- [x] **1.4. Backend - Definición de Modelos (ORM):**
    - [x] Crear modelos para las tablas principales de OsTicket que se usarán en el dashboard:
        - [x] `Ticket` (`ost_ticket`)
        - [x] `User` (`ost_user`, `ost_user_email`, `ost_user_account`)
        - [x] `TicketStatus` (`ost_ticket_status`)
        - [x] `Department` (`ost_department`)
        - [x] `Staff` (`ost_staff`)
        - [x] `Organization` (`ost_organization`)
        - [x] `TicketPriority` (`ost_ticket_priority`)
        - [ ] (Opcional) `HelpTopic` (`ost_help_topic`) - *Considerar si es necesario para prioridades*
        - [ ] (Opcional) `Team` (`ost_team`)
        - [ ] (Opcional) `Group` (`ost_groups`)
        - [ ] (Opcional) `Thread` (`ost_thread`, `ost_thread_entry`, `ost_thread_entry_email`)
        - [ ] (Opcional) `Attachment` (`ost_attachment`)
    - [x] Definir relaciones entre modelos (ej. Ticket con User, Ticket con Department).
        - [x] `TicketCdata` (`ost_ticket__cdata`) - *Añadido para búsqueda por asunto*

- [x] **1.5. Backend - Sincronización Inicial y Pruebas de Conexión:**
    - [x] Sincronizar modelos con la base de datos (crear tablas si no existen, solo para desarrollo inicial si se usa una BD de prueba).
        *   *Nota: En producción, la BD de OsTicket ya existe. La sincronización debe ser no destructiva.*
    - [x] Implementar un script o endpoint de prueba para verificar la conexión y realizar una consulta simple.

## Fase 2: Desarrollo de Endpoints API (Backend)

- [x] **2.1. Diseño y Definición de Endpoints API:** (Completado)
    - [x] `/api/tickets` (GET todos, GET por ID)
    - [x] `/api/tickets/count` (GET total, por estado, por departamento)
    - [x] `/api/departments` (GET todos, GET por ID)
    - [x] `/api/departments/:id/tickets` (GET tickets por departamento)
    - [x] `/api/users` (GET todos, GET por ID)
    - [x] `/api/users/:id/tickets` (GET tickets por usuario)
    - [x] `/api/staff` (GET todos los agentes, GET por ID)
    - [x] `/api/staff/:id/tickets` (GET tickets asignados a un agente)
    - [x] `/api/organizations` (GET todas, GET por ID)
    - [x] `/api/organizations/:id/tickets` (GET tickets por organización)
    - [x] `/api/statuses` (GET todos los estados de ticket)
    - [x] `/api/priorities` (GET todas las prioridades de ticket)
    - [x] (Opcional) `/api/helptopics` (GET todos los temas de ayuda)

- [ ] **2.2. Implementación de Endpoints - Tickets:**
    - [x] Lógica para obtener todos los tickets con filtros (estado, departamento, prioridad, fecha).
    - [x] Lógica para obtener un ticket específico por su ID.
    - [x] Incluir información relacionada (usuario, departamento, estado, agente asignado).
    - [x] Implementar paginación para listados de tickets (Realizado para `GET /api/tickets`, `/api/users/:id/tickets`, `/api/staff/:id/tickets`, `/api/departments/:id/tickets`, `/api/organizations/:id/tickets`, `/api/helptopics/:id/tickets`).
    - [x] Implementar búsqueda básica en tickets (por número de ticket, asunto) (Funcional y verificado para `GET /api/tickets`).

- [x] **2.3. Implementación de Endpoints - Departamentos:**
    - [x] Lógica para obtener todos los departamentos.
    - [x] Lógica para obtener un departamento específico y sus tickets asociados.

- [x] **2.4. Implementación de Endpoints - Usuarios y Agentes (Staff):**
    - [x] Lógica para obtener usuarios y sus tickets.
    - [x] Lógica para obtener agentes y sus tickets asignados.

- [x] **2.5. Implementación de Endpoints - Otros (Status, Prioridades, etc.):**
    - [x] Lógica para obtener listados de estados, prioridades, etc.

- [ ] **2.6. Seguridad y Optimización de API:**
    - [x] Implementar filtro por departamento en todos los endpoints relevantes (tickets, departments) para mostrar solo datos de "Soporte Informatico" o "Soporte IT". (MEMORIA CRÍTICA)
    - [x] Asegurar que solo se expongan los datos necesarios (evitar campos sensibles). (Completado 2025-06-09)
    - [x] Optimizar consultas a la base de datos para un buen rendimiento (en cuanto a selección de atributos y reducción de datos transferidos). (Completado 2025-06-09)
    - [x] Documentadas recomendaciones de índices en `DB_INDEX_RECOMMENDATIONS.md`.
    - [x] Implementado manejo de errores centralizado y robusto.

## Fase 3: Desarrollo del Frontend

- [ ] **3.1. Elección de Tecnología Frontend:**
    - [x] Decidir tecnología frontend: React.js (Stack: React 18 + TypeScript, Tailwind CSS, Recharts + Chart.js, React Query + Zustand, React Router, Framer Motion, Vite).
        *   *[x] Considerar también opciones más simples como EJS con Vanilla JS si el dinamismo es limitado (Decisión: Se optó por React.js).* 
    - [x] Configurar el proyecto frontend (Vite para React + TypeScript, Tailwind CSS).

- [x] **3.2. Diseño Básico de la Interfaz (Mockups/Wireframes):**
    - [x] Definir la estructura general del dashboard (Implementado `DashboardLayout` con `Header` y `Sidebar`).
    - [x] Identificar los componentes principales (gráficos, tablas, filtros) (Archivos placeholder `.tsx` creados para todos los componentes de `DESIGN_GUIDE.md`).

- [x] **3.3. Implementación de Componentes de UI:** (Completado)
    - [x] Crear componentes reutilizables (botones, tarjetas, modales) (Sistema completo de tokens CSS implementado, `StatCard` rediseñado, `Header` y `Sidebar` profesionales, componentes UI base completados).
    - [x] Implementar la estructura de navegación (Instalado `react-router-dom`, creadas vistas placeholder, configurado `App.tsx` con rutas, `DashboardLayout.tsx` con `Outlet`, y `Sidebar.tsx` con componentes `<Link>`).

- [x] **3.4. Conexión con API Backend:** (Establecida y funcional para endpoints iniciales)
    - [x] Configurar la comunicación con los endpoints del backend (React Query, Axios, servicio API base, y llamada a `/tickets/count` en `DashboardView` implementados y funcionando; problemas de CORS y formato de datos resueltos).
    - [x] Manejar la carga de datos y los estados (loading, error) (Manejo básico implementado y verificado en `DashboardView` para `/tickets/count`).

- [x] **3.5. Visualización de Datos - Resumen General:** (Completado)
    - [x] Mostrar contadores de tickets (total, abiertos, cerrados, pendientes).
    - [x] Gráfico de tickets por estado (Implementado como barras horizontales animadas con indicadores de color).

- [x] **3.6. Visualización de Datos - Tickets por Sector y Agente:**
    - [x] Gráfico de tickets por sector/sucursal (implementado con barras horizontales y scroll).
    - [x] Gráfico de tickets por agente (implementado y estabilizado).

- [ ] **Fase 3.7: Visualización de Datos - Evolución y Tendencias (Pospuesto)**
    - [ ] Diseñar y desarrollar un nuevo endpoint en el backend para obtener datos de tickets creados vs. cerrados por día/semana/mes.
    - [ ] Crear un componente de gráfico de líneas o áreas en el frontend para visualizar la evolución temporal.

- [ ] **Fase 3.8: Filtros Interactivos (Pospuesto)**
    - [ ] Añadir controles de UI (selectores, date pickers) para filtrar el dashboard por rango de fechas, estado, agente, prioridad, etc.
    - [ ] Conectar los filtros a los endpoints de la API para recargar los datos dinámicamente.

- [ ] **Fase 3.9: Tabla de Tickets Detallada (En Progreso)**
    - [ ] **Prioridad actual:** Implementar la vista de tabla de tickets.
    - [ ] Estructurar el componente principal `TicketsTableView.tsx`.
    - [ ] Desarrollar el componente `DataTable.tsx` para mostrar los datos de los tickets.
    - [ ] Implementar la llamada a la API (`/api/tickets`) para obtener los datos paginados.
    - [ ] Integrar el componente `Pagination.tsx` para la navegación entre páginas.
    - [ ] Integrar el componente `FilterBar.tsx` para la funcionalidad de búsqueda.
    - [ ] Mostrar tickets en una tabla con paginación.
    - [ ] Columnas: Número, Asunto, Usuario, Departamento, Agente, Estado, Prioridad, Fecha Creación, Última Actualización.
    - [ ] Implementar búsqueda dentro de la tabla.
    - [ ] (Opcional) Permitir ordenar por columnas.

- [x] **3.10. Responsividad y Estilos:** (Completado)
    - [x] Asegurar que el dashboard sea usable en diferentes tamaños de pantalla (Responsive design implementado para desktop, tablet y mobile).
    - [x] Aplicar estilos consistentes y una buena experiencia de usuario (Sistema completo de tokens CSS y DESIGN_GUIDE.md implementado).

## Fase 4: Pruebas, Documentación y Despliegue

- [ ] **4.1. Pruebas Unitarias y de Integración (Básicas):**
    - [ ] (Opcional) Escribir pruebas unitarias para funciones críticas del backend.
    - [ ] Probar la integración entre frontend y backend (endpoints).

- [ ] **4.2. Funcionalidades Adicionales (Opcional):**
    - [ ] (Opcional) Exportación de datos de tablas a CSV.
    - [ ] (Más opcional) Exportación a PDF.

- [ ] **4.3. Documentación del Código:**
    - [ ] Comentar funciones y componentes clave en el backend.
    - [ ] Comentar componentes y lógica compleja en el frontend.
    - [ ] Actualizar `README.md` con:
        - [ ] Instrucciones detalladas de instalación de dependencias (backend y frontend).
        - [ ] Configuración de variables de entorno (`.env`).
        - [ ] Comandos para iniciar el backend y el frontend.
        - [ ] Descripción de los endpoints de la API.

- [ ] **4.4. Pruebas Exhaustivas:**
    - [ ] Probar todas las visualizaciones y filtros.
    - [ ] Verificar la exactitud de los datos contra la base de datos de OsTicket.
    - [ ] Probar la funcionalidad de búsqueda y paginación.
    - [ ] Probar en diferentes navegadores (si es relevante).

- [ ] **4.5. Despliegue (Local o Docker):**
    - [ ] Asegurar que la aplicación corra localmente sin problemas.
    - [ ] (Opcional) Crear `Dockerfile` para el backend.
    - [ ] (Opcional) Crear `Dockerfile` para el frontend (o servirlo estáticamente desde el backend).
    - [ ] (Opcional) Crear `docker-compose.yml` para levantar ambos servicios.

## Fase 5: Revisión y Entrega

- [ ] **5.1. Cumplimiento de Requisitos:**
    - [ ] Verificar que todos los puntos del alcance se hayan cumplido.
    - [ ] Confirmar que no se usan datos simulados.
    - [ ] Confirmar que no se almacenan datos localmente en el dashboard.
    - [ ] Confirmar que no se requiere inicio de sesión.
    - [ ] Confirmar que se usan frameworks open-source.

- [ ] **5.2. Limpieza de Código y Optimización:**
    - [ ] Revisar y refactorizar código si es necesario.
    - [ ] Eliminar código comentado o no utilizado.
    - [ ] Optimizar consultas de base de datos si se detectan cuellos de botella.

- [ ] **5.3. Preparación para Entrega:**
    - [ ] Asegurar que el repositorio Git esté actualizado con la última versión estable.
    - [ ] Crear un tag de versión si se considera apropiado.

- [ ] **5.4. Entrega del Proyecto.**
