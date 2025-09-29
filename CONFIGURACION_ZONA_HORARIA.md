# Configuración de Zona Horaria en Producción

## 🎯 Problema Resuelto

En desarrollo, el backend usa la zona horaria del sistema local, pero en producción (Render) usa **UTC por defecto**. Esto causa:
- ✅ Transacciones programadas ejecutándose en horas incorrectas
- ✅ Fechas mostradas con diferencia de 6 horas (UTC vs América Central)
- ✅ Inconsistencias entre lo que muestra el frontend y lo que ejecuta el backend

## 🔧 Solución Implementada

Se agregó soporte para la variable de entorno `TZ` que controla la zona horaria del servidor Node.js y del scheduler de transacciones programadas.

### Cambios realizados:

1. **`Backend/env.example`**: Agregada variable `TZ` con documentación
2. **`Backend/src/api/services/scheduled-transactions.service.js`**: Scheduler ahora lee `process.env.TZ`
3. Logs mejorados para mostrar zona horaria activa en cada ejecución

## 📋 Configuración en Render

### Paso 1: Acceder a tu servicio en Render

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Selecciona tu servicio de backend (ej: `moneyapp-backend`)
3. Ve a la pestaña **Environment**

### Paso 2: Agregar variable de entorno TZ

Agrega la siguiente variable de entorno:

```
Key: TZ
Value: America/Managua
```

**Zonas horarias comunes para Centroamérica:**
- `America/Managua` - Nicaragua (UTC-6)
- `America/Guatemala` - Guatemala (UTC-6)
- `America/Tegucigalpa` - Honduras (UTC-6)
- `America/San_Salvador` - El Salvador (UTC-6)
- `America/Costa_Rica` - Costa Rica (UTC-6)
- `America/Panama` - Panamá (UTC-5)
- `America/Mexico_City` - México Central (UTC-6)

**Otras zonas horarias:**
- `America/New_York` - Este de EE.UU. (UTC-5/-4)
- `America/Los_Angeles` - Oeste de EE.UU. (UTC-8/-7)
- `America/Bogota` - Colombia (UTC-5)
- `America/Lima` - Perú (UTC-5)
- `America/Santiago` - Chile (UTC-3/-4)
- `America/Buenos_Aires` - Argentina (UTC-3)

[Lista completa de zonas horarias IANA](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

### Paso 3: Aplicar cambios

1. Haz clic en **Save Changes**
2. Render automáticamente **redesplegará** tu servicio con la nueva configuración
3. Espera a que el deploy termine (verás el estado en la pestaña **Events**)

### Paso 4: Verificar configuración

Una vez que el servicio esté activo, verifica los logs:

1. Ve a la pestaña **Logs** en Render
2. Busca las líneas de inicio del scheduler:

```
⏰ Configurando scheduler con zona horaria: America/Managua
✅ Scheduler de transacciones programadas iniciado en zona horaria: America/Managua
```

3. Cuando el scheduler se ejecute (cada hora), verás:

```
🔄 Ejecutando scheduler de transacciones programadas...
🌍 Zona horaria actual: America/Managua
🕐 Hora del servidor: [fecha y hora en tu zona horaria]
```

## 🧪 Pruebas

### Verificar que la zona horaria está configurada correctamente:

1. **Endpoint de salud**:
   ```bash
   curl https://tu-backend.onrender.com/health
   ```
   
   Verifica que el `timestamp` esté en tu zona horaria esperada.

2. **Crear una transacción programada**:
   - Crea una transacción programada para ejecutarse en 1 hora
   - Verifica en los logs de Render que se ejecute a la hora correcta según tu zona horaria

3. **Revisar fechas en el frontend**:
   - Las fechas de transacciones deben mostrarse correctamente
   - Las transacciones programadas deben mostrar la hora correcta de próxima ejecución

## 🔍 Debugging

Si las fechas siguen siendo incorrectas:

### 1. Verificar variable de entorno en Render

```bash
# En los logs de Render al iniciar, busca:
⏰ Configurando scheduler con zona horaria: [tu zona horaria]
```

Si muestra `UTC` o algo diferente a lo que configuraste, la variable `TZ` no se aplicó correctamente.

### 2. Verificar formato de zona horaria

La zona horaria debe usar el formato **IANA** (ej: `America/Managua`), NO:
- ❌ `CST` (abreviaciones)
- ❌ `GMT-6` (offsets)
- ❌ `Central Standard Time` (nombres descriptivos)
- ✅ `America/Managua` (formato IANA correcto)

### 3. Verificar que el servicio se redesplego

Después de agregar la variable `TZ`, Render debe redesplegar automáticamente. Si no lo hizo:
1. Ve a **Manual Deploy** > **Deploy latest commit**
2. Espera a que termine el deploy
3. Verifica los logs nuevamente

## 📝 Notas Importantes

1. **La variable `TZ` afecta TODO el proceso Node.js**, incluyendo:
   - `new Date()` sin argumentos
   - `Date.now()`
   - Scheduler de `node-cron`
   - Cualquier librería que use fechas del sistema

2. **PostgreSQL/Neon mantiene su propia zona horaria** (generalmente UTC):
   - Las fechas se almacenan en UTC en la base de datos (recomendado)
   - Node.js las convierte a tu zona horaria local al leerlas
   - Esto es el comportamiento correcto y esperado

3. **El frontend usa la zona horaria del navegador del usuario**:
   - `new Date()` en el navegador usa la zona horaria local del usuario
   - Esto es correcto y permite que usuarios en diferentes zonas horarias vean fechas en su hora local

## 🚀 Despliegue

Después de hacer commit de estos cambios:

```bash
git add .
git commit -m "fix: Configurar zona horaria con variable TZ para producción"
git push origin main
```

Render detectará el push y redesplegar automáticamente.

**IMPORTANTE**: No olvides agregar la variable `TZ` en Render como se describe arriba.

## ✅ Checklist de Configuración

- [ ] Variable `TZ` agregada en Render Environment
- [ ] Servicio redesplegar en Render
- [ ] Logs muestran la zona horaria correcta
- [ ] Transacciones programadas se ejecutan a la hora correcta
- [ ] Fechas en el frontend se muestran correctamente
- [ ] Endpoint `/health` muestra timestamp correcto

## 📞 Soporte

Si después de seguir estos pasos sigues teniendo problemas:
1. Revisa los logs de Render para errores
2. Verifica que la variable `TZ` esté exactamente como se indica
3. Confirma que el servicio se redesplego después de agregar la variable
