# PLAN DE PRUEBAS MANUAL - FASE 1: FUNCIONALIDAD NIO-USD

## 📋 **OBJETIVO**
Verificar que el sistema "MoneyApp" funciona correctamente con la arquitectura multi-moneda refactorizada para las monedas **NIO (Córdoba Nicaragüense)** y **USD (Dólar Estadounidense)**.

## 🎯 **COBERTURA DE PRUEBAS**
- ✅ Módulo de Cuentas (Creación en NIO y USD)
- ✅ Módulo de Transacciones (Transferencias bidireccionales)
- ✅ Módulo de Dashboard (Conversiones centralizadas)
- ✅ Reactividad del sistema (Cambios de moneda principal)

---

## 🔧 **CONFIGURACIÓN INICIAL**

### **Pre-requisitos:**
1. **Base de datos migrada** con la nueva tabla `user_exchange_rates`
2. **Usuario de prueba** registrado en el sistema
3. **Backend y Frontend** en ejecución
4. **Consola del navegador** abierta para ver logs detallados

### **Configuración del Usuario de Prueba:**
- **Moneda Principal:** NIO
- **Tasa de Cambio USD:** 36.50 (configurable en Configuración)

---

## 🧪 **CASOS DE PRUEBA**

### **PRUEBA 1: Configurar Tasa de Cambio NIO-USD**

#### **Objetivo:** Establecer la base para conversiones bidireccionales

#### **Pasos:**
1. ✅ Iniciar sesión con usuario de prueba
2. ✅ Ir a **Configuración**
3. ✅ Verificar que **Moneda Principal = NIO**
4. ✅ En sección "Tasas de Cambio", click **"Añadir Moneda"**
5. ✅ Seleccionar **USD** en el dropdown
6. ✅ Ingresar tasa: **36.50**
7. ✅ Click **"Guardar"**

#### **Resultados Esperados:**
- ✅ Toast de éxito: "Tasa de cambio creada exitosamente"
- ✅ USD aparece en la tabla con tasa 36.50
- ✅ **Log en backend:** `INFO: Tasa de cambio creada - USD: 36.50`

---

### **PRUEBA 2: Crear Cuenta en Moneda Principal (NIO)**

#### **Objetivo:** Verificar creación de cuentas en NIO sin problemas

#### **Pasos:**
1. ✅ Ir a **Cuentas**
2. ✅ Click **"Nueva Cuenta"**
3. ✅ Llenar formulario:
   - **Nombre:** Cuenta NIO Principal
   - **Tipo:** Banco
   - **Moneda:** NIO - Córdoba Nicaragüense
   - **Saldo Inicial:** 10000
4. ✅ Click **"Crear Cuenta"**

#### **Resultados Esperados:**
- ✅ Toast de éxito: "Cuenta creada exitosamente"
- ✅ Cuenta aparece en lista con **C$10,000.00**
- ✅ **Log en backend:** Validación exitosa de moneda permitida
- ✅ Cuenta visible en Dashboard

---

### **PRUEBA 3: Crear Cuenta en Moneda Secundaria (USD)**

#### **Objetivo:** Verificar creación de cuentas en USD usando tasas configuradas

#### **Pasos:**
1. ✅ En **Cuentas**, click **"Nueva Cuenta"**
2. ✅ Llenar formulario:
   - **Nombre:** Cuenta USD Secundaria
   - **Tipo:** Banco
   - **Moneda:** USD - Dólar Estadounidense
   - **Saldo Inicial:** 500
3. ✅ Click **"Crear Cuenta"**

#### **Resultados Esperados:**
- ✅ Toast de éxito: "Cuenta creada exitosamente"
- ✅ Cuenta aparece en lista con **$500.00**
- ✅ **Log en backend:** Validación exitosa de moneda con tasa configurada
- ✅ Ambas cuentas visibles en Dashboard

---

### **PRUEBA 4: Verificar Dashboard - Conversiones Automáticas**

#### **Objetivo:** Confirmar que el dashboard convierte correctamente a NIO

#### **Pasos:**
1. ✅ Ir a **Dashboard**
2. ✅ Revisar **Saldo Total**
3. ✅ Verificar logs en consola del navegador
4. ✅ Verificar logs en consola del backend

#### **Resultados Esperados:**
- ✅ **Saldo Total:** C$28,250.00 (10,000 NIO + 500 USD × 36.50)
- ✅ **Log Frontend:** `🎯 Dashboard actualizado exitosamente en NIO`
- ✅ **Log Backend:** 
  ```
  🔄 Conversión Dashboard: 500 USD → NIO
  ✅ Conversión: 500 USD × 36.50 = 18250.00 NIO
  💰 Saldo total en NIO: 28250.00
  ```

---

### **PRUEBA 5: Transferencia USD → NIO**

#### **Objetivo:** Verificar conversión bidireccional en transferencias

#### **Pasos:**
1. ✅ Ir a **Transacciones**
2. ✅ Click **"Nueva Transacción"**
3. ✅ Seleccionar **Tipo:** Transferencia
4. ✅ Configurar:
   - **Cuenta Origen:** Cuenta USD Secundaria
   - **Cuenta Destino:** Cuenta NIO Principal
   - **Monto:** 100 (USD)
   - **Descripción:** Prueba USD a NIO
5. ✅ Click **"Crear Transacción"**

#### **Resultados Esperados:**
- ✅ Toast de éxito: "Transacción creada exitosamente"
- ✅ **Cuenta USD:** Nuevo saldo $400.00 (500 - 100)
- ✅ **Cuenta NIO:** Nuevo saldo C$13,650.00 (10,000 + 100×36.50)
- ✅ **Log Backend:**
  ```
  === CONVERSIÓN MULTI-MONEDA ===
  📊 Monto original: 100 USD
  🎯 Moneda destino: NIO
  ✅ CONVERSIÓN DIRECTA: Secundaria → Principal
  📐 Fórmula: 100 USD × 36.50 = 3650.00 NIO
  🔄 INFO: Transfiriendo 100 USD → 3650.00 NIO
  ```

---

### **PRUEBA 6: Transferencia NIO → USD**

#### **Objetivo:** Verificar conversión inversa NIO a USD

#### **Pasos:**
1. ✅ Crear nueva transferencia:
   - **Cuenta Origen:** Cuenta NIO Principal
   - **Cuenta Destino:** Cuenta USD Secundaria
   - **Monto:** 730 (NIO)
   - **Descripción:** Prueba NIO a USD
2. ✅ Click **"Crear Transacción"**

#### **Resultados Esperados:**
- ✅ **Cuenta NIO:** Nuevo saldo C$12,920.00 (13,650 - 730)
- ✅ **Cuenta USD:** Nuevo saldo $420.00 (400 + 730÷36.50)
- ✅ **Log Backend:**
  ```
  === CONVERSIÓN MULTI-MONEDA ===
  📊 Monto original: 730 NIO
  🎯 Moneda destino: USD
  ✅ CONVERSIÓN DIRECTA: Principal → Secundaria
  📐 Fórmula: 730 NIO ÷ 36.50 = 20.00 USD
  🔄 INFO: Transfiriendo 730 NIO → 20.00 USD
  ```

---

### **PRUEBA 7: Cambio de Moneda Principal NIO → USD**

#### **Objetivo:** Verificar reactividad y recálculo automático

#### **Pasos:**
1. ✅ Ir a **Configuración**
2. ✅ En sección "Moneda Principal", cambiar de **NIO** a **USD**
3. ✅ Click **"Guardar Moneda Principal"**
4. ✅ Verificar logs en consola
5. ✅ Ir a **Dashboard** y verificar cambios

#### **Resultados Esperados:**
- ✅ Toast de éxito: "Moneda principal actualizada exitosamente"
- ✅ **Tasas de cambio actualizadas:** NIO aparece con tasa 0.0274 (1÷36.50)
- ✅ **Dashboard recargado automáticamente**
- ✅ **Saldo Total:** $774.00 (420 USD + 12,920 NIO ÷ 36.50)
- ✅ **Log Frontend:** `🔄 Moneda principal cambió a: USD`
- ✅ **Log Backend:** Operación atómica de cambio de moneda

---

### **PRUEBA 8: Verificar Conversión Inversa en Dashboard**

#### **Objetivo:** Confirmar que todos los cálculos se actualizaron a USD

#### **Pasos:**
1. ✅ En **Dashboard**, verificar todas las cifras
2. ✅ Revisar tarjetas de resumen
3. ✅ Verificar últimas transacciones
4. ✅ Revisar logs de conversión en backend

#### **Resultados Esperados:**
- ✅ **Todas las cifras en USD** (símbolo $)
- ✅ **Saldo Total:** $774.00
- ✅ **Transacciones históricas** mostrando equivalentes en USD
- ✅ **Log Backend:**
  ```
  🔄 Conversión Dashboard: 12920 NIO → USD
  ✅ Conversión: 12920 NIO × 0.0274 = 354.00 USD
  💰 Saldo total en USD: 774.00
  ```

---

### **PRUEBA 9: Crear Nueva Cuenta con USD como Principal**

#### **Objetivo:** Verificar funcionalidad con USD como moneda base

#### **Pasos:**
1. ✅ Crear cuenta con moneda principal (USD):
   - **Nombre:** Cuenta USD Principal
   - **Saldo Inicial:** 1000
2. ✅ Crear cuenta con moneda secundaria (NIO):
   - **Nombre:** Cuenta NIO Secundaria
   - **Saldo Inicial:** 3650

#### **Resultados Esperados:**
- ✅ Ambas cuentas creadas exitosamente
- ✅ **Dashboard actualizado:** Nuevo saldo total $1874.00
- ✅ **Cálculo:** 774 + 1000 + (3650÷36.50) = $1874.00

---

### **PRUEBA 10: Transferencia con USD como Base**

#### **Objetivo:** Verificar conversiones con USD como moneda principal

#### **Pasos:**
1. ✅ Transferir $50 USD → NIO:
   - **Origen:** Cuenta USD Principal
   - **Destino:** Cuenta NIO Secundaria
   - **Monto:** 50
2. ✅ Verificar conversión y saldos

#### **Resultados Esperados:**
- ✅ **Cuenta USD Principal:** $950.00 (1000 - 50)
- ✅ **Cuenta NIO Secundaria:** C$5,475.00 (3650 + 50×36.50)
- ✅ **Dashboard inalterado:** $1874.00 (transferencia interna)

---

## 📊 **VERIFICACIÓN DE LOGS**

### **Backend Logs Esperados:**
```
🏦 === DASHBOARD MULTI-MONEDA FASE 1 ===
💰 === RESUMEN FINANCIERO ===
🔄 === CONVERSIÓN INDIVIDUAL DE SALDOS ===
=== CONVERSIÓN MULTI-MONEDA ===
✅ CONVERSIÓN DIRECTA: Principal → Secundaria
✅ CONVERSIÓN DIRECTA: Secundaria → Principal
```

### **Frontend Logs Esperados:**
```
🎯 === CARGA DASHBOARD FRONTEND ===
💰 Moneda principal actual: [NIO/USD]
✅ Datos recibidos del backend
🎉 Dashboard actualizado exitosamente
🔄 Moneda principal cambió a: [USD/NIO]
```

---

## ✅ **CRITERIOS DE ACEPTACIÓN**

### **FUNCIONALIDAD BÁSICA:**
- [ ] ✅ Creación de cuentas en NIO y USD sin errores
- [ ] ✅ Configuración de tasas de cambio funcional
- [ ] ✅ Dashboard muestra saldos convertidos correctamente

### **CONVERSIONES BIDIRECCIONALES:**
- [ ] ✅ Transferencia USD → NIO: Correcto cálculo (monto × tasa)
- [ ] ✅ Transferencia NIO → USD: Correcto cálculo (monto ÷ tasa)
- [ ] ✅ Precisión numérica en todas las operaciones

### **CAMBIO DE MONEDA PRINCIPAL:**
- [ ] ✅ Operación atómica sin pérdida de datos
- [ ] ✅ Recálculo automático de todas las tasas
- [ ] ✅ Dashboard reactivo al cambio
- [ ] ✅ Frontend actualizado automáticamente

### **LOGGING Y DEBUGGING:**
- [ ] ✅ Logs detallados en backend para cada conversión
- [ ] ✅ Logs informativos en frontend
- [ ] ✅ Sin errores en consola del navegador
- [ ] ✅ Sin errores en logs del servidor

---

## 🚀 **PRÓXIMOS PASOS FASE 2**

Una vez que la **Fase 1 NIO-USD** sea 100% funcional:

1. **Expandir a EUR** (Euro)
2. **Añadir MXN** (Peso Mexicano)
3. **Probar conversiones triangulares** (EUR → MXN vía NIO/USD)
4. **Testing automatizado** con Jest/Cypress
5. **Optimización de performance** para múltiples monedas

---

## 📝 **NOTAS DE EJECUCIÓN**

**Fecha de Prueba:** _____________  
**Ejecutado por:** _____________  
**Resultado General:** ✅ APROBADO / ❌ RECHAZADO  

**Observaciones:**
_________________________________________________
_________________________________________________
_________________________________________________

**Incidencias Encontradas:**
_________________________________________________
_________________________________________________
_________________________________________________
