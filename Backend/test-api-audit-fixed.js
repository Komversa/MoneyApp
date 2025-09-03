const axios = require('axios');

/**
 * Script de Auditoría de API Corregido para Sistema Multi-Moneda
 * Verifica que todos los endpoints funcionen correctamente con el nuevo CurrencyConversionService
 */

class APIAuditorFixed {
  constructor() {
    this.baseURL = 'http://localhost:3000';
    this.token = null;
    this.userId = null;
    this.testResults = [];
  }

  async runFullAudit() {
    console.log('🔍 Iniciando auditoría completa de API (CORREGIDA)...\n');
    
    try {
      await this.testAuthentication();
      await this.testCurrenciesAPI();
      await this.testSettingsAPI();
      await this.testTransactionsAPI();
      await this.testDashboardAPI();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Error en auditoría:', error.message);
    }
  }

  async testAuthentication() {
    console.log('🔐 Probando autenticación...');
    
    try {
      const response = await axios.post(`${this.baseURL}/api/auth/login`, {
        email: 'admin@example.com',
        password: '123456'
      });
      
      if (response.data.success) {
        this.token = response.data.data.accessToken;
        this.userId = response.data.data.user.id;
        console.log('✅ Login exitoso');
        this.testResults.push({ test: 'Authentication', status: 'PASS' });
      } else {
        throw new Error('Login falló');
      }
    } catch (error) {
      console.log('❌ Login falló:', error.message);
      this.testResults.push({ test: 'Authentication', status: 'FAIL', error: error.message });
    }
  }

  async testCurrenciesAPI() {
    console.log('\n💰 Probando API de monedas...');
    
    try {
      // Test 1: Obtener monedas soportadas
      const currenciesResponse = await axios.get(`${this.baseURL}/api/currencies`);
      if (currenciesResponse.data.success && currenciesResponse.data.data.length > 0) {
        console.log('✅ Monedas soportadas obtenidas:', currenciesResponse.data.data.length);
        this.testResults.push({ test: 'Get Supported Currencies', status: 'PASS' });
      } else {
        throw new Error('No se obtuvieron monedas soportadas');
      }

      // Test 2: Obtener tasas de usuario (requiere autenticación)
      if (this.token) {
        try {
          const ratesResponse = await axios.get(`${this.baseURL}/api/currencies/user/rates`, {
            headers: { Authorization: `Bearer ${this.token}` }
          });
          
          if (ratesResponse.data.success) {
            console.log('✅ Tasas de usuario obtenidas:', ratesResponse.data.data.length);
            this.testResults.push({ test: 'Get User Exchange Rates', status: 'PASS' });
          } else {
            throw new Error('No se obtuvieron tasas de usuario');
          }
        } catch (error) {
          console.log('❌ Error obteniendo tasas de usuario:', error.response?.status || error.message);
          this.testResults.push({ test: 'Get User Exchange Rates', status: 'FAIL', error: error.message });
        }
      }
    } catch (error) {
      console.log('❌ Error en API de monedas:', error.message);
      this.testResults.push({ test: 'Currencies API', status: 'FAIL', error: error.message });
    }
  }

  async testSettingsAPI() {
    console.log('\n⚙️ Probando API de configuración...');
    
    if (!this.token) {
      console.log('⚠️ Saltando pruebas de configuración - no hay token');
      return;
    }

    try {
      // Test 1: Obtener tipos de cuenta
      const tiposCuentaResponse = await axios.get(`${this.baseURL}/api/configuracion/tipos-cuenta`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      if (tiposCuentaResponse.data.success) {
        console.log('✅ Tipos de cuenta obtenidos:', tiposCuentaResponse.data.data.length);
        this.testResults.push({ test: 'Get Account Types', status: 'PASS' });
      } else {
        throw new Error('No se obtuvieron tipos de cuenta');
      }

      // Test 2: Obtener categorías
      const categoriasResponse = await axios.get(`${this.baseURL}/api/configuracion/categorias`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      if (categoriasResponse.data.success) {
        console.log('✅ Categorías obtenidas:', categoriasResponse.data.data.length);
        this.testResults.push({ test: 'Get Categories', status: 'PASS' });
      } else {
        throw new Error('No se obtuvieron categorías');
      }

      // Test 3: Obtener tasas de cambio
      const tasasResponse = await axios.get(`${this.baseURL}/api/configuracion/tasas-cambio`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      if (tasasResponse.data.success) {
        console.log('✅ Tasas de cambio obtenidas:', tasasResponse.data.data.length);
        this.testResults.push({ test: 'Get Exchange Rates', status: 'PASS' });
      } else {
        throw new Error('No se obtuvieron tasas de cambio');
      }
    } catch (error) {
      console.log('❌ Error en API de configuración:', error.response?.status || error.message);
      this.testResults.push({ test: 'Settings API', status: 'FAIL', error: error.message });
    }
  }

  async testTransactionsAPI() {
    console.log('\n💳 Probando API de transacciones...');
    
    if (!this.token) {
      console.log('⚠️ Saltando pruebas de transacciones - no hay token');
      return;
    }

    try {
      // Test 1: Obtener transacciones
      const transactionsResponse = await axios.get(`${this.baseURL}/api/transacciones`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      if (transactionsResponse.data.success) {
        const transactions = transactionsResponse.data.data;
        console.log('✅ Transacciones obtenidas:', transactions.length);
        
        // Verificar que las transacciones tienen currency_code
        if (Array.isArray(transactions)) {
          const hasCurrencyCode = transactions.every(t => t.currency_code);
          if (hasCurrencyCode) {
            console.log('✅ Todas las transacciones tienen currency_code');
            this.testResults.push({ test: 'Transactions with Currency Code', status: 'PASS' });
          } else {
            console.log('⚠️ Algunas transacciones no tienen currency_code');
            this.testResults.push({ test: 'Transactions with Currency Code', status: 'WARNING' });
          }
        } else {
          console.log('⚠️ La respuesta no es un array de transacciones');
          this.testResults.push({ test: 'Transactions with Currency Code', status: 'WARNING' });
        }
        
        this.testResults.push({ test: 'Get Transactions', status: 'PASS' });
      } else {
        throw new Error('No se obtuvieron transacciones');
      }
    } catch (error) {
      console.log('❌ Error en API de transacciones:', error.response?.status || error.message);
      this.testResults.push({ test: 'Transactions API', status: 'FAIL', error: error.message });
    }
  }

  async testDashboardAPI() {
    console.log('\n📊 Probando API de dashboard...');
    
    if (!this.token) {
      console.log('⚠️ Saltando pruebas de dashboard - no hay token');
      return;
    }

    try {
      // Test 1: Obtener dashboard completo
      const dashboardResponse = await axios.get(`${this.baseURL}/api/dashboard`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      if (dashboardResponse.data.success) {
        console.log('✅ Dashboard obtenido');
        
        // Verificar estructura del dashboard
        const dashboard = dashboardResponse.data.data;
        const hasResumen = dashboard.resumen;
        const hasTransacciones = dashboard.ultimasTransacciones;
        const hasEstadisticas = dashboard.estadisticasMensuales;
        const hasGrafico = dashboard.graficoGastos;
        
        if (hasResumen && hasTransacciones && hasEstadisticas && hasGrafico) {
          console.log('✅ Estructura del dashboard completa');
          this.testResults.push({ test: 'Dashboard Structure', status: 'PASS' });
        } else {
          console.log('⚠️ Estructura del dashboard incompleta');
          this.testResults.push({ test: 'Dashboard Structure', status: 'WARNING' });
        }
        
        this.testResults.push({ test: 'Get Dashboard', status: 'PASS' });
      } else {
        throw new Error('No se obtuvo dashboard');
      }
    } catch (error) {
      console.log('❌ Error en API de dashboard:', error.response?.status || error.message);
      this.testResults.push({ test: 'Dashboard API', status: 'FAIL', error: error.message });
    }
  }

  printResults() {
    console.log('\n📊 RESULTADOS DE LA AUDITORÍA DE API (CORREGIDA)');
    console.log('=================================================');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const warnings = this.testResults.filter(r => r.status === 'WARNING').length;
    
    this.testResults.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${status} ${result.test}: ${result.status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('\n📈 RESUMEN:');
    console.log(`✅ Exitosos: ${passed}`);
    console.log(`❌ Fallidos: ${failed}`);
    console.log(`⚠️ Advertencias: ${warnings}`);
    
    if (failed === 0) {
      console.log('\n🎉 ¡Todas las pruebas críticas pasaron!');
    } else {
      console.log('\n⚠️ Hay problemas que necesitan atención');
    }
  }
}

// Ejecutar auditoría
const auditor = new APIAuditorFixed();
auditor.runFullAudit();
