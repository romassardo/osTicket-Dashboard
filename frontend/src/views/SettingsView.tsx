import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Switch } from "../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { useTheme } from "../context/ThemeContext";
import { useConfig } from "../context/ConfigContext";
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Holiday {
  id: number;
  name: string;
  date: string; // YYYY-MM-DD
}

const FERIADOS_2026: Omit<Holiday, 'id'>[] = [
  { date: '2026-01-01', name: 'Año Nuevo' },
  { date: '2026-02-16', name: 'Carnaval' },
  { date: '2026-02-17', name: 'Carnaval' },
  { date: '2026-03-24', name: 'Día Nacional de la Memoria por la Verdad y la Justicia' },
  { date: '2026-04-02', name: 'Día del Veterano y de los Caídos en la Guerra de Malvinas' },
  { date: '2026-04-03', name: 'Viernes Santo' },
  { date: '2026-05-01', name: 'Día del Trabajador' },
  { date: '2026-05-25', name: 'Día de la Revolución de Mayo' },
  { date: '2026-06-17', name: 'Paso a la Inmortalidad del Gral. Martín Miguel de Güemes' },
  { date: '2026-06-20', name: 'Paso a la Inmortalidad del Gral. Manuel Belgrano' },
  { date: '2026-07-09', name: 'Día de la Independencia' },
  { date: '2026-08-17', name: 'Paso a la Inmortalidad del Gral. José de San Martín' },
  { date: '2026-10-12', name: 'Día del Respeto a la Diversidad Cultural' },
  { date: '2026-11-23', name: 'Día de la Soberanía Nacional' },
  { date: '2026-12-08', name: 'Inmaculada Concepción de María' },
  { date: '2026-12-25', name: 'Navidad' },
];

function formatHolidayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function useHolidays() {
  const [holidays, setHolidays] = React.useState<Holiday[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchHolidays = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/holidays');
      if (!res.ok) throw new Error('Error al cargar feriados');
      const data = await res.json();
      setHolidays(data.holidays || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

  const addHoliday = async (name: string, date: string) => {
    const res = await fetch('/api/holidays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, date }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Error al agregar feriado');
    }
    await fetchHolidays();
  };

  const deleteHoliday = async (id: number) => {
    const res = await fetch(`/api/holidays/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Error al eliminar feriado');
    }
    await fetchHolidays();
  };

  return { holidays, loading, error, addHoliday, deleteHoliday, fetchHolidays };
}

const SettingsView: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { config, updateConfig, resetConfig, saveConfig, isDirty } = useConfig();
  const [showSaveSuccess, setShowSaveSuccess] = React.useState(false);
  const { holidays, loading: holidaysLoading, error: holidaysError, addHoliday, deleteHoliday } = useHolidays();
  const [newHolidayName, setNewHolidayName] = React.useState('');
  const [newHolidayDate, setNewHolidayDate] = React.useState('');
  const [holidayActionError, setHolidayActionError] = React.useState<string | null>(null);
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);

  const handleSaveConfig = () => {
    saveConfig();
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleAddHoliday = async () => {
    if (!newHolidayName.trim() || !newHolidayDate) {
      setHolidayActionError('Completá el nombre y la fecha del feriado.');
      return;
    }
    setHolidayActionError(null);
    setLoadingAction('add');
    try {
      await addHoliday(newHolidayName.trim(), newHolidayDate);
      setNewHolidayName('');
      setNewHolidayDate('');
    } catch (e: any) {
      setHolidayActionError(e.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    setHolidayActionError(null);
    setLoadingAction(`del-${id}`);
    try {
      await deleteHoliday(id);
    } catch (e: any) {
      setHolidayActionError(e.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleLoadFeriados2026 = async () => {
    setHolidayActionError(null);
    setLoadingAction('seed');
    const existingDates = new Set(holidays.map(h => h.date));
    const toAdd = FERIADOS_2026.filter(f => !existingDates.has(f.date));
    try {
      for (const f of toAdd) {
        await addHoliday(f.name, f.date);
      }
    } catch (e: any) {
      setHolidayActionError(e.message);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
                  Configuración
                </h1>
                <p style={{ marginTop: '0.35rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Personaliza tu experiencia en el dashboard de OsTicket.
                </p>
              </div>
              {isDirty && (
                <div className="flex items-center gap-2" style={{ background: 'var(--accent-primary-glow)', color: 'var(--accent-primary-light)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-active)' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Cambios sin guardar</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Appearance Settings */}
          <Card className="" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <CardHeader>
              <CardTitle className="text-lg font-medium font-display">
                Tema y Apariencia
              </CardTitle>
              <CardDescription style={{ color: 'var(--text-muted)' }}>
                Configura el aspecto visual del dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium mb-3 block" style={{ color: 'var(--text-primary)' }}>
                  Selector de tema
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => setTheme('light')}
                    className="flex items-center justify-center gap-2 h-10"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Claro
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => setTheme('dark')}
                    className="flex items-center justify-center gap-2 h-10"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    Oscuro
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    onClick={() => setTheme('system')}
                    className="flex items-center justify-center gap-2 h-10"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Sistema
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Settings */}
          <Card className="" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <CardHeader>
              <CardTitle className="text-lg font-medium font-display">
                Dashboard y Métricas
              </CardTitle>
              <CardDescription style={{ color: 'var(--text-muted)' }}>
                Configura la visualización y actualización de datos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Auto Refresh */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-refresh" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Actualización automática
                  </Label>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Actualizar datos del dashboard automáticamente
                  </p>
                </div>
                <Switch
                  id="auto-refresh"
                  checked={config.autoRefresh}
                  onCheckedChange={(checked) => updateConfig({ autoRefresh: checked })}
                />
              </div>

              {/* Refresh Interval */}
              {config.autoRefresh && (
                <div className="pl-4" style={{ borderLeft: '2px solid var(--border-default)' }}>
                  <div className="space-y-2">
                    <Label htmlFor="refresh-interval" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Intervalo de actualización
                    </Label>
                    <Select 
                      value={config.refreshInterval.toString()} 
                      onValueChange={(value) => updateConfig({ refreshInterval: parseInt(value) })}
                    >
                      <SelectTrigger className="w-48" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                        <SelectItem value="10">10 segundos</SelectItem>
                        <SelectItem value="30">30 segundos</SelectItem>
                        <SelectItem value="60">1 minuto</SelectItem>
                        <SelectItem value="300">5 minutos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Table Size */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="table-size" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Registros por página
                  </Label>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Número predeterminado de tickets en tablas
                  </p>
                </div>
                <Select 
                  value={config.defaultTableSize.toString()} 
                  onValueChange={(value) => updateConfig({ defaultTableSize: parseInt(value) })}
                >
                  <SelectTrigger className="w-48" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                    <SelectItem value="25">25 registros</SelectItem>
                    <SelectItem value="50">50 registros</SelectItem>
                    <SelectItem value="100">100 registros</SelectItem>
                    <SelectItem value="200">200 registros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Export Settings */}
          <Card className="" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <CardHeader>
              <CardTitle className="text-lg font-medium font-display">
                Exportación de Datos
              </CardTitle>
              <CardDescription style={{ color: 'var(--text-muted)' }}>
                Configura las opciones de exportación de reportes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="export-format" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Formato de exportación
                  </Label>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Formato predeterminado para descargar reportes
                  </p>
                </div>
                <Select 
                  value={config.defaultExportFormat} 
                  onValueChange={(value) => updateConfig({ defaultExportFormat: value as 'xlsx' | 'csv' })}
                >
                  <SelectTrigger className="w-48" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                    <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                    <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Holidays Management */}
          <Card style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-medium font-display">Feriados</CardTitle>
                  <CardDescription style={{ color: 'var(--text-muted)' }}>
                    Los feriados son excluidos del cálculo de SLA. Horario laboral: Lun–Vie 8:30–17:30.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={handleLoadFeriados2026}
                  disabled={loadingAction === 'seed'}
                  style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}
                >
                  {loadingAction === 'seed' ? 'Cargando...' : 'Cargar feriados 2026'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new holiday */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Nombre</Label>
                  <input
                    type="text"
                    value={newHolidayName}
                    onChange={e => setNewHolidayName(e.target.value)}
                    placeholder="Ej: Día del Trabajador"
                    maxLength={60}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
                    onKeyDown={e => e.key === 'Enter' && handleAddHoliday()}
                  />
                </div>
                <div style={{ width: 160 }}>
                  <Label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Fecha</Label>
                  <input
                    type="date"
                    value={newHolidayDate}
                    onChange={e => setNewHolidayDate(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
                <Button
                  onClick={handleAddHoliday}
                  disabled={loadingAction === 'add'}
                  className="flex items-center gap-1"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <PlusIcon className="w-4 h-4" />
                  Agregar
                </Button>
              </div>

              {holidayActionError && (
                <p style={{ color: 'var(--error)', fontSize: '0.8125rem' }}>{holidayActionError}</p>
              )}

              {/* Holiday list */}
              {holidaysLoading ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Cargando feriados...</p>
              ) : holidaysError ? (
                <p style={{ color: 'var(--error)', fontSize: '0.8125rem' }}>{holidaysError}</p>
              ) : holidays.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontStyle: 'italic' }}>
                  No hay feriados configurados. Usá el botón "Cargar feriados 2026" para agregar los días oficiales.
                </p>
              ) : (
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  {holidays.map((h, idx) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between"
                      style={{
                        padding: '0.6rem 1rem',
                        borderBottom: idx < holidays.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        background: idx % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent-primary)', minWidth: 80 }}>
                          {formatHolidayDate(h.date)}
                        </span>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{h.name}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteHoliday(h.id)}
                        disabled={loadingAction === `del-${h.id}`}
                        title="Eliminar feriado"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', opacity: loadingAction === `del-${h.id}` ? 0.4 : 1, transition: 'color 150ms ease' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--error)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <CardHeader>
              <CardTitle className="text-lg font-medium font-display">
                Estado del Sistema
              </CardTitle>
              <CardDescription style={{ color: 'var(--text-muted)' }}>
                Información del estado actual del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Conexión a base de datos</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium" style={{ color: 'var(--success)' }}>Conectado</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>API del servidor</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium" style={{ color: 'var(--success)' }}>Operativo</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Última sincronización</span>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Hace 2 minutos</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
              onClick={resetConfig}
            >
              Restablecer
            </Button>
            <Button 
              onClick={handleSaveConfig}
              disabled={!isDirty}
              className={!isDirty ? "opacity-50 cursor-not-allowed" : ""}
            >
              {isDirty ? "Guardar cambios" : "Sin cambios"}
            </Button>
            
            {/* Feedback de guardado exitoso */}
            {showSaveSuccess && (
              <div className="fixed top-4 right-4 z-50" style={{ background: 'var(--bg-secondary)', color: 'var(--success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--success)', boxShadow: 'var(--shadow-lg)' }}>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Configuración guardada correctamente</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
