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

export interface PaginationInfo {
  total_items: number;
  total_pages: number;
  current_page: number;
  items_per_page: number;
}

export interface AdvancedFilters {
  selectedStatuses?: string[];
  dateRange?: [Date | null, Date | null];
  selectedOrganization?: string;
  selectedStaff?: string;
}
