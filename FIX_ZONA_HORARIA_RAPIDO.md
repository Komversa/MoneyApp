# ⚡ Fix Rápido: Zona Horaria en Producción

## 🎯 Problema
Las transacciones programadas se ejecutan en horas incorrectas en producción (Render) porque el servidor usa UTC en lugar de tu zona horaria local.

## ✅ Solución en 3 Pasos

### 1️⃣ Hacer commit de los cambios del código

```bash
git add .
git commit -m "fix: Configurar zona horaria con variable TZ para producción"
git push origin main
```

### 2️⃣ Configurar variable TZ en Render

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Selecciona tu servicio backend
3. Ve a **Environment** (menú lateral izquierdo)
4. Haz clic en **Add Environment Variable**
5. Agrega:
   - **Key**: `TZ`
   - **Value**: `America/Managua` (o tu zona horaria)
6. Haz clic en **Save Changes**

**Zonas horarias comunes:**
- `America/Managua` - Nicaragua
- `America/Guatemala` - Guatemala
- `America/Mexico_City` - México
- `America/Costa_Rica` - Costa Rica
- `America/Bogota` - Colombia

### 3️⃣ Verificar en los logs

Después de que Render redespliegue (automático), verifica los logs:

Busca estas líneas al inicio:
```
⏰ Configurando scheduler con zona horaria: America/Managua
✅ Scheduler de transacciones programadas iniciado en zona horaria: America/Managua
```

Cuando el scheduler se ejecute (cada hora):
```
🔄 Ejecutando scheduler de transacciones programadas...
🌍 Zona horaria actual: America/Managua
🕐 Hora del servidor: [tu hora local]
```

## ✅ ¡Listo!

Ahora tu backend usará la zona horaria correcta y las transacciones programadas se ejecutarán a la hora esperada.

---

📖 **Documentación completa**: Ver `CONFIGURACION_ZONA_HORARIA.md`
