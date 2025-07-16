import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { useTheme } from "../contexts/ThemeContext";
import { useConfig } from "../contexts/ConfigContext";

const SettingsView: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { config, updateConfig, resetConfig, saveConfig, isDirty } = useConfig();
  const [showSaveSuccess, setShowSaveSuccess] = React.useState(false);

  const handleSaveConfig = () => {
    saveConfig();
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Configuración
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Personaliza tu experiencia en el dashboard de OsTicket.
                </p>
              </div>
              {isDirty && (
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-sm font-medium">Cambios sin guardar</span>
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
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
                Tema y Apariencia
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Configura el aspecto visual del dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-gray-900 dark:text-white mb-3 block">
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
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
                Dashboard y Métricas
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Configura la visualización y actualización de datos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Auto Refresh */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-refresh" className="text-sm font-medium text-gray-900 dark:text-white">
                    Actualización automática
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
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
                <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                  <div className="space-y-2">
                    <Label htmlFor="refresh-interval" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Intervalo de actualización
                    </Label>
                    <Select 
                      value={config.refreshInterval.toString()} 
                      onValueChange={(value) => updateConfig({ refreshInterval: parseInt(value) })}
                    >
                      <SelectTrigger className="w-48 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
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
                  <Label htmlFor="table-size" className="text-sm font-medium text-gray-900 dark:text-white">
                    Registros por página
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Número predeterminado de tickets en tablas
                  </p>
                </div>
                <Select 
                  value={config.defaultTableSize.toString()} 
                  onValueChange={(value) => updateConfig({ defaultTableSize: parseInt(value) })}
                >
                  <SelectTrigger className="w-48 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
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
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
                Exportación de Datos
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Configura las opciones de exportación de reportes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="export-format" className="text-sm font-medium text-gray-900 dark:text-white">
                    Formato de exportación
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Formato predeterminado para descargar reportes
                  </p>
                </div>
                <Select 
                  value={config.defaultExportFormat} 
                  onValueChange={(value) => updateConfig({ defaultExportFormat: value as 'xlsx' | 'csv' })}
                >
                  <SelectTrigger className="w-48 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                    <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                    <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
                Estado del Sistema
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Información del estado actual del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Conexión a base de datos</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Conectado</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">API del servidor</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Operativo</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Última sincronización</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Hace 2 minutos</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              className="border-gray-300 dark:border-gray-600"
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
              <div className="fixed top-4 right-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg border border-green-200 dark:border-green-800 shadow-lg z-50">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Configuración guardada correctamente</span>
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
