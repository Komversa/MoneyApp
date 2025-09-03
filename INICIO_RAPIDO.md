# 🚀 MoneyApp - Inicio Rápido

## 📋 Resumen de Características

MoneyApp es un sistema completo de gestión financiera personal que ahora incluye **configuración automática** para nuevos usuarios.

### ✨ **NUEVA CARACTERÍSTICA**: Configuración Automática

**Cada nuevo usuario que se registre automáticamente recibe:**

#### 🏦 **Tipos de Cuenta Preconfigurados (5):**
- Banco
- Cuenta de Ahorros  
- Efectivo
- Inversiones
- Tarjeta de Crédito

#### 📊 **Categorías Preconfiguradas (17):**

**Ingresos (6):**
- Salario
- Freelance
- Inversiones
- Bonificaciones
- Ventas
- Otros Ingresos

**Gastos (11):**
- Comida
- Transporte
- Vivienda
- Servicios Públicos
- Entretenimiento
- Salud
- Educación
- Compras
- Impuestos
- Seguros
- Otros Gastos

#### ⚙️ **Configuración Inicial:**
- Moneda Principal: NIO (Córdoba)
- Moneda Secundaria: USD (Dólar)
- Tasa de Cambio: 36.5
- Tema: Claro

---

## 🛠️ **Instalación y Despliegue**

### **Prerrequisitos:**
- Node.js (v16+)
- PostgreSQL
- Base de datos `moneyapp_db` creada

### **1️⃣ Configuración del Backend:**

```bash
cd Backend

# Instalar dependencias
npm install

# Crear archivo .env
echo "NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=123456
DB_DATABASE=moneyapp_db
JWT_ACCESS_SECRET=e4401b9dfd098646daa03048bf4b92cfe03731d87dc9fad63c815f3dc9d04426e441035f63c1cf699d9feaa56cb462c47d547a9116467c847ed1f4f86a294b75
JWT_REFRESH_SECRET=6b078aa008cea916f05b61ecbddced089994c57f1c2ccf868dce09dfb4681605b67354e3ed696145ef723fca76e7cd685cf4a20ef199c734f30518baa5b7f3f3" > .env

# Ejecutar migraciones
npx knex migrate:latest

# Ejecutar seeders (usuario de prueba)
npx knex seed:run

# Iniciar servidor
npm run dev
```

### **2️⃣ Configuración del Frontend:**

```bash
cd Frontend

# Instalar dependencias
npm install

# Crear archivo .env.local
echo "VITE_API_BASE_URL=http://localhost:3000
NODE_ENV=development" > .env.local

# Iniciar aplicación
npm run dev
```

---

## 🔑 **Usuarios de Prueba**

### **Usuario Preconfigurado:**
- **Email:** admin@example.com
- **Contraseña:** 123456
- **Incluye:** 4 cuentas de ejemplo y 7 transacciones

### **Registro de Nuevos Usuarios:**
1. Ve a http://localhost:5173/registro
2. Regístrate con cualquier email
3. **¡Tu cuenta automáticamente incluirá todos los tipos y categorías!**

---

## 🌐 **URLs del Sistema**

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Registro:** http://localhost:5173/registro
- **Login:** http://localhost:5173/login

---

## 📊 **Funcionalidades Disponibles**

### ✅ **Para Usuarios Nuevos:**
1. **Registro** → Automáticamente recibe tipos y categorías
2. **Dashboard** → Mensaje de bienvenida explicando las características preconfiguradas
3. **Crear Cuentas** → Seleccionar entre 5 tipos preconfigurados
4. **Registrar Transacciones** → Elegir entre 17 categorías preconfiguradas
5. **Configuración** → Modificar tipos, categorías, monedas y tema

### ✅ **Para Usuario de Prueba:**
1. **Dashboard Completo** → Gráficos, resumen, últimas transacciones
2. **4 Cuentas de Ejemplo** → Con saldos realistas en NIO y USD
3. **7 Transacciones** → Ejemplos de ingresos, gastos y transferencias
4. **Lógica Multi-Moneda** → Conversión automática NIO/USD

---

## 🧪 **Probar el Registro Automático**

```bash
# Opcional: Ejecutar script de prueba
cd scripts
npm install axios
node test-registration.js
```

Este script:
1. Registra un usuario de prueba
2. Verifica que reciba todos los tipos de cuenta
3. Verifica que reciba todas las categorías
4. Muestra un reporte completo

---

## 🎯 **Experiencia de Usuario**

### **Flujo para Usuario Nuevo:**
1. **Registro** → 30 segundos
2. **Login** → Dashboard con mensaje informativo
3. **Crear Primera Cuenta** → Seleccionar tipo preconfigurado
4. **Primera Transacción** → Elegir categoría preconfigurada
5. **¡Listo!** → Sistema completamente funcional

### **Sin Configuración Manual:**
- ❌ ~~No más crear tipos de cuenta manualmente~~
- ❌ ~~No más agregar categorías una por una~~  
- ❌ ~~No más configuración inicial compleja~~
- ✅ **¡Todo viene preconfigurado y listo para usar!**

---

## 🔧 **Mantenimiento**

### **Agregar Nuevos Tipos/Categorías por Defecto:**
Editar `Backend/src/api/services/auth.service.js` en la función `register()`:

```javascript
// Agregar nuevo tipo de cuenta
{ user_id: newUser.id, name: 'Nuevo Tipo' }

// Agregar nueva categoría
{ user_id: newUser.id, name: 'Nueva Categoría', type: 'income' }
```

### **Cambiar Configuración por Defecto:**
```javascript
// En user_settings
primary_currency: 'USD',  // Cambiar moneda principal
secondary_currency: 'EUR', // Cambiar moneda secundaria
exchange_rate: 1.1         // Cambiar tasa de cambio
```

---

## 🎉 **¡Tu Sistema Financiero Está Listo!**

MoneyApp ahora proporciona una **experiencia de incorporación perfecta** donde los nuevos usuarios pueden comenzar a gestionar sus finanzas inmediatamente sin necesidad de configuración manual.

**¡Solo regístrate y comienza a usar!** 🚀