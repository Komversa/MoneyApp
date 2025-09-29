# 🚀 Guía de Despliegue Gratuito - MoneyApp

## 📋 Resumen de Servicios Gratuitos

| Servicio | Plan Gratuito | Uso |
|----------|---------------|-----|
| **Neon** | 3 DBs, 0.5GB | Base de datos PostgreSQL |
| **Render** | 750h/mes | Backend Node.js |
| **Vercel** | Ilimitado | Frontend React |

---

## 🗄️ Paso 1: Configurar Base de Datos (Neon)

### 1.1 Crear cuenta en Neon
1. Ve a [neon.tech](https://neon.tech)
2. Regístrate con GitHub
3. Crea un nuevo proyecto

### 1.2 Configurar Base de Datos

#### Opción A: Usar Neon (Recomendado)
1. Copia la **Connection String** que te proporciona Neon
2. Ejecuta el script de configuración:
   ```bash
   node scripts/switch-db-config.js neon
   ```
3. Ejecuta las migraciones:
   ```bash
   cd Backend
   npm run migrate
   npm run seed
   ```

#### Opción B: Usar PostgreSQL Local
1. Instala PostgreSQL: https://www.postgresql.org/download/windows/
2. Crea la base de datos: `CREATE DATABASE moneyapp_db;`
3. Configura la contraseña del usuario `postgres`
4. Ejecuta el script de configuración:
   ```bash
   node scripts/switch-db-config.js local
   ```
5. Ejecuta las migraciones:
   ```bash
   cd Backend
   npm run migrate
   npm run seed
   ```

#### Cambiar entre configuraciones
```bash
# Para usar Neon
node scripts/switch-db-config.js neon

# Para usar PostgreSQL local
node scripts/switch-db-config.js local
```

---

## ⚙️ Paso 2: Desplegar Backend (Render)

### 2.1 Preparar Repositorio
1. Sube tu código a GitHub
2. Asegúrate de que el repositorio sea público (para plan gratuito)

### 2.2 Crear Servicio en Render
1. Ve a [render.com](https://render.com)
2. Conecta tu cuenta de GitHub
3. Crea un **Web Service**
4. Selecciona tu repositorio
5. Configura:
   - **Name**: `moneyapp-backend`
   - **Root Directory**: `Backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

### 2.3 Configurar Variables de Entorno
En Render, agrega estas variables:
```
NODE_ENV=production
DATABASE_URL=tu-connection-string-de-neon
JWT_SECRET=tu-super-secret-jwt-key
FRONTEND_URL=https://tu-frontend.vercel.app
TZ=America/Managua
```

**⚠️ IMPORTANTE**: La variable `TZ` controla la zona horaria del servidor. Esto es crítico para que las transacciones programadas se ejecuten a la hora correcta. Usa el formato de zona horaria IANA:
- `America/Managua` - Nicaragua
- `America/Guatemala` - Guatemala
- `America/Mexico_City` - México
- `America/Costa_Rica` - Costa Rica
- Ver más zonas en: [Lista de zonas horarias](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

### 2.4 Desplegar
1. Haz clic en **Create Web Service**
2. Render construirá y desplegará automáticamente
3. Anota la URL: `https://moneyapp-backend.onrender.com`

---

## 🎨 Paso 3: Desplegar Frontend (Vercel)

### 3.1 Preparar Frontend
1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu cuenta de GitHub
3. Importa tu repositorio

### 3.2 Configurar Proyecto
1. **Framework Preset**: Vite
2. **Root Directory**: `Frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`

### 3.3 Configurar Variables de Entorno
En Vercel, agrega:
```
VITE_API_URL=https://moneyapp-backend.onrender.com
```

### 3.4 Desplegar
1. Haz clic en **Deploy**
2. Vercel construirá y desplegará automáticamente
3. Tu app estará en: `https://tu-app.vercel.app`

---

## 🔧 Paso 4: Configuración Final

### 4.1 Actualizar CORS en Backend
En Render, actualiza la variable:
```
FRONTEND_URL=https://tu-app.vercel.app
```

### 4.2 Probar la Aplicación
1. Ve a tu URL de Vercel
2. Registra un usuario
3. Prueba todas las funcionalidades

---

## 📊 Monitoreo y Mantenimiento

### Render (Backend)
- **Logs**: Disponibles en el dashboard de Render
- **Uptime**: 99.9% garantizado
- **Escalado**: Automático

### Vercel (Frontend)
- **Analytics**: Incluidos en el plan gratuito
- **Performance**: CDN global automático
- **Deployments**: Automáticos desde GitHub

### Neon (Base de Datos)
- **Monitoreo**: Dashboard en tiempo real
- **Backups**: Automáticos
- **Escalado**: Manual desde dashboard

---

## 🚨 Solución de Problemas Comunes

### Error de CORS
- Verifica que `FRONTEND_URL` en Render coincida con tu URL de Vercel
- Asegúrate de que no haya espacios extra en las variables

### Error de Base de Datos
- Verifica que `DATABASE_URL` esté correcta
- Ejecuta las migraciones manualmente si es necesario

### Error de Build
- Revisa los logs en Render/Vercel
- Verifica que todas las dependencias estén en `package.json`

### Transacciones Programadas en Hora Incorrecta
- **Causa**: Zona horaria no configurada (servidor usa UTC por defecto)
- **Solución**: Agrega la variable `TZ=America/Managua` en Render
- **Verificación**: Ejecuta `npm run verify-timezone` en el backend local
- **Documentación completa**: Ver `CONFIGURACION_ZONA_HORARIA.md`

---

## 💰 Costos

**Total: $0 USD/mes**

- Neon: Gratis (0.5GB)
- Render: Gratis (750h/mes)
- Vercel: Gratis (ilimitado)

---

## 🔄 Despliegue Automático

Una vez configurado, cada vez que hagas push a GitHub:
1. Render detectará cambios y redeployará el backend
2. Vercel detectará cambios y redeployará el frontend
3. Todo será automático

---

## 📞 Soporte

- **Neon**: [docs.neon.tech](https://docs.neon.tech)
- **Render**: [render.com/docs](https://render.com/docs)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
