// frontend/src/types/index.ts

export interface SectorName {
  value: string;
}

export interface TransporteName {
  value: string;
}

export interface Cdata {
  subject: string;
  sector: string; // Este es el ID del sector/sucursal
  transporte?: string;
  SectorName?: SectorName; // Objeto que contiene el nombre del sector
  TransporteName?: TransporteName; // Objeto que contiene el nombre del transporte
  dataValues?: {
    transporteName?: string; // Nombre del transporte agregado por post-procesamiento del backend
    sectorName?: string; // Nombre del sector agregado por post-procesamiento del backend
  };
}

export interface User {
  id: number;
  name: string;
  default_email_id: number;
}

export interface Status {
  id: number;
  name: string;
  state: string;
}

export interface Priority {
  priority_id: number;
  priority: string;
  priority_color: string;
}

export interface Staff {
  staff_id: number;
  firstname: string;
  lastname: string;
  name?: string; // Nombre completo (campo virtual del backend)
}

export interface Ticket {
  id: number;
  ticket_id: number;
  number: string;
  user_id: number;
  user_email_id: number;
  status_id: number;
  dept_id: number;
  priority_id: number;
  topic_id: number;
  staff_id: number;
  team_id: number | null;
  isoverdue: number;
  isanswered: number;
  duedate: string | null;
  est_duedate: string | null;
  reopened: string | null;
  closed: string | null;
  lastupdate: string;
  created: string;
  updated: string;
  user?: User;
  status?: Status;
  priority?: Priority;
  staff?: Staff; // Alias para la relación con el agente asignado
  AssignedStaff?: Staff; // Relación con el agente asignado (nombre usado en el backend)
  // department?: Department; // Eliminado, ya que 'sector' viene de cdata
  cdata: Cdata; // Estructura anidada para el asunto y sector
}

export interface TicketDetail extends Ticket {
  // Campos adicionales que devuelve el endpoint de detalle
  subject?: string; // Campo directo del ticket
  status?: Status;
  priority?: Priority;
  AssignedStaff?: Staff;
  user?: User;
  department?: {
    id: number;
    name: string;
  };
  topic?: {
    topic_id: number;
    topic: string;
  };
  customFields?: Array<{
    field_name: string;
    field_value: string;
    field_type: string;
  }>;
  threads?: Array<{
    entry_id: number;
        thread_id: number;
    pid: number;
    staff_id?: number;
    user_id?: number;
    poster: string;
    title: string;
    body: string;
    format: string;
    created: string;
    updated: string;
    staff_firstname?: string;
    staff_lastname?: string;
    user_name?: string;
  }>;
  stats?: {
    totalThreads: number;
    lastActivity: string;
  };
}

export interface PaginationInfo {
  total_items: number;
  total_pages: number;
  current_page: number;
  items_per_page: number;
}

export interface AdvancedFilters {
  selectedStatuses?: string[];
  dateRange?: [Date | null, Date | null];

  selectedSector?: string;
  selectedStaff?: string;
}

// ==================== SLA TYPES ====================

export interface SLAStats {
  departamento: string;
  agente: string;
  staff_id: number;
  anio: number;
  mes: number;
  mes_nombre: string;
  total_tickets: number;
  tickets_sla_cumplido: number;
  tickets_sla_vencido: number;
  porcentaje_sla_cumplido: number;
  tiempo_promedio_primera_respuesta: string; // Formato: "Xd HH:MM"
  tiempo_promedio_resolucion: string; // Formato: "Xd HH:MM"
  tiempo_primera_respuesta_segundos?: number;
  tiempo_resolucion_segundos?: number;
}

export interface SLASummary {
  total_tickets: number;
  tickets_cumplidos: number;
  tickets_vencidos: number;
  porcentaje_cumplimiento: number;
  avg_tiempo_primera_respuesta: number; // En segundos
  avg_tiempo_resolucion: number; // En segundos
  tiempo_promedio_primera_respuesta: string; // Formato: "Xd HH:MM"
  tiempo_promedio_resolucion: string; // Formato: "Xd HH:MM"
}

export interface TicketEnRiesgo {
  ticket_id: number;
  number: string;
  agente_asignado: string;
  nombre_sla: string;
  fecha_creacion: string;
  ultima_actualizacion?: string;
  sla_horas: number;
  horas_transcurridas: number;
  horas_restantes: number;
  priority_id: number;
  prioridad_nombre: string;
  horas_desde_ultima_actividad: number;
  porcentaje_consumido: number; // % del SLA utilizado (0-100+)
}

export interface AgenteConProblema {
  staff_id: number;
  agente: string;
  total_tickets: number;
  tickets_cumplidos: number;
  tickets_vencidos: number;
  porcentaje_cumplimiento: number;
}

export interface TendenciaNegativa {
  agente: string;
  mes_actual: string;
  porcentaje_mes_actual: number;
  mes_anterior: string;
  porcentaje_mes_anterior: number;
  diferencia: number;
}

export interface SLAAlerts {
  resumen: {
    total_tickets_abiertos: number;
    tickets_vencidos: number;        // >100% SLA
    tickets_criticos: number;        // 90-100% SLA
    tickets_en_riesgo: number;       // 70-90% SLA
  };
  tickets_vencidos: TicketEnRiesgo[];     // >100% SLA
  tickets_criticos: TicketEnRiesgo[];     // 90-100% SLA
  tickets_en_riesgo: TicketEnRiesgo[];    // 70-90% SLA
  agentes_bajo_rendimiento: AgenteConProblema[];
  tendencias_negativas: TendenciaNegativa[];
}
