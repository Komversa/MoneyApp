const axios = require('axios');

/**
 * Script de Pruebas End-to-End para Sistema Multi-Moneda
 * Verifica flujos completos de usuario con el nuevo sistema de conversión
 */

class E2EAuditor {
  constructor() {
    this.baseURL = 'http://localhost:3000';
    this.token = null;
    this.userId = null;
    this.testResults = [];
    this.testData = {
      accounts: [],
      transactions: []
    };
  }

  async runFullE2EAudit() {
    console.log('🎮 Iniciando pruebas end-to-end...\n');
    
    try {
      await this.setupTestEnvironment();
      await this.testCompleteConfigurationFlow();
      await this.testTransactionLifecycleFlow();
      await this.testCurrencyChangeFlow();
      await this.cleanupTestData();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Error en pruebas E2E:', error.message);
    }
  }

  async setupTestEnvironment() {
    console.log('🔧 Configurando entorno de pruebas...');
    
    try {
      // Login con usuario de prueba
      const loginResponse = await axios.post(`${this.baseURL}/api/auth/login`, {
        email: 'admin@example.com',
        password: '123456'
      });
      
      if (loginResponse.data.success) {
        this.token = loginResponse.data.data.accessToken;
        this.userId = loginResponse.data.data.user.id;
        console.log('✅ Login exitoso para pruebas E2E');
      } else {
        throw new Error('No se pudo hacer login para las pruebas');
      }
    } catch (error) {
      console.log('❌ Error en setup:', error.message);
      throw error;
    }
  }

  async testCompleteConfigurationFlow() {
    console.log('\n⚙️ Probando flujo completo de configuración...');
    
    try {
      // 1. Obtener configuración actual
      const currentConfig = await this.getUserSettings();
      console.log(`✅ Configuración actual: ${currentConfig.primary_currency}`);
      
      // 2. Obtener tasas actuales
      const currentRates = await this.getExchangeRates();
      console.log(`✅ ${currentRates.length} tasas actuales`);
      
      // 3. Verificar que USD y NIO están configurados
      const hasUSD = currentRates.some(r => r.currency_code === 'USD');
      const hasNIO = currentRates.some(r => r.currency_code === 'NIO');
      
      if (hasUSD && hasNIO) {
        console.log('✅ USD y NIO están configurados correctamente');
        this.testResults.push({ test: 'USD and NIO Configuration', status: 'PASS' });
      } else {
        console.log('❌ Faltan USD o NIO en la configuración');
        this.testResults.push({ test: 'USD and NIO Configuration', status: 'FAIL' });
      }
      
      // 4. Verificar que las tasas son correctas
      const usdRate = currentRates.find(r => r.currency_code === 'USD');
      const nioRate = currentRates.find(r => r.currency_code === 'NIO');
      
      if (usdRate && parseFloat(usdRate.rate_to_usd) === 1.0) {
        console.log('✅ Tasa USD es correcta (1.0)');
        this.testResults.push({ test: 'USD Rate Validation', status: 'PASS' });
      } else {
        console.log('❌ Tasa USD incorrecta');
        this.testResults.push({ test: 'USD Rate Validation', status: 'FAIL' });
      }
      
      if (nioRate && parseFloat(nioRate.rate_to_usd) > 0) {
        console.log(`✅ Tasa NIO es válida (${nioRate.rate_to_usd})`);
        this.testResults.push({ test: 'NIO Rate Validation', status: 'PASS' });
      } else {
        console.log('❌ Tasa NIO inválida');
        this.testResults.push({ test: 'NIO Rate Validation', status: 'FAIL' });
      }
      
    } catch (error) {
      console.log('❌ Error en flujo de configuración:', error.message);
      this.testResults.push({ test: 'Configuration Flow', status: 'FAIL', error: error.message });
    }
  }

  async testTransactionLifecycleFlow() {
    console.log('\n💳 Probando flujo de ciclo de vida de transacciones...');
    
    try {
      // 1. Obtener cuentas existentes
      const accounts = await this.getAccounts();
      console.log(`✅ ${accounts.length} cuentas encontradas`);
      
      if (accounts.length === 0) {
        console.log('⚠️ No hay cuentas para probar transacciones');
        this.testResults.push({ test: 'Transaction Lifecycle', status: 'WARNING' });
        return;
      }
      
      // 2. Verificar que las cuentas tienen monedas válidas
      const validAccounts = accounts.filter(a => a.currency === 'USD' || a.currency === 'NIO');
      if (validAccounts.length === accounts.length) {
        console.log('✅ Todas las cuentas tienen monedas válidas');
        this.testResults.push({ test: 'Valid Account Currencies', status: 'PASS' });
      } else {
        console.log('❌ Algunas cuentas tienen monedas inválidas');
        this.testResults.push({ test: 'Valid Account Currencies', status: 'FAIL' });
      }
      
      // 3. Obtener transacciones existentes
      const transactions = await this.getTransactions();
      console.log(`✅ ${transactions.length} transacciones encontradas`);
      
      // 4. Verificar que las transacciones tienen currency_code
      const transactionsWithCurrency = transactions.filter(t => t.currency_code);
      if (transactionsWithCurrency.length === transactions.length) {
        console.log('✅ Todas las transacciones tienen currency_code');
        this.testResults.push({ test: 'Transactions Currency Code', status: 'PASS' });
      } else {
        console.log('❌ Algunas transacciones no tienen currency_code');
        this.testResults.push({ test: 'Transactions Currency Code', status: 'FAIL' });
      }
      
      // 5. Verificar conversiones en transacciones
      const transactionsWithConversion = transactions.filter(t => 
        t.converted_amount !== undefined && t.is_converted !== undefined
      );
      if (transactionsWithConversion.length === transactions.length) {
        console.log('✅ Todas las transacciones tienen conversiones');
        this.testResults.push({ test: 'Transaction Conversions', status: 'PASS' });
      } else {
        console.log('❌ Algunas transacciones no tienen conversiones');
        this.testResults.push({ test: 'Transaction Conversions', status: 'FAIL' });
      }
      
    } catch (error) {
      console.log('❌ Error en flujo de transacciones:', error.message);
      this.testResults.push({ test: 'Transaction Lifecycle', status: 'FAIL', error: error.message });
    }
  }

  async testCurrencyChangeFlow() {
    console.log('\n🔄 Probando flujo de cambio de moneda principal...');
    
    try {
      // 1. Obtener configuración actual
      const currentConfig = await this.getUserSettings();
      const originalCurrency = currentConfig.primary_currency;
      console.log(`✅ Moneda actual: ${originalCurrency}`);
      
      // 2. Cambiar moneda principal (USD ↔ NIO)
      const newCurrency = originalCurrency === 'USD' ? 'NIO' : 'USD';
      await this.changePrimaryCurrency(newCurrency);
      console.log(`✅ Moneda cambiada a: ${newCurrency}`);
      
      // 3. Verificar que el cambio se aplicó
      const updatedConfig = await this.getUserSettings();
      if (updatedConfig.primary_currency === newCurrency) {
        console.log('✅ Cambio de moneda aplicado correctamente');
        this.testResults.push({ test: 'Currency Change Applied', status: 'PASS' });
      } else {
        console.log('❌ Cambio de moneda no se aplicó');
        this.testResults.push({ test: 'Currency Change Applied', status: 'FAIL' });
      }
      
      // 4. Verificar que el dashboard se actualiza
      const dashboard = await this.getDashboard();
      if (dashboard.resumen && dashboard.resumen.monedaPrincipal === newCurrency) {
        console.log('✅ Dashboard actualizado con nueva moneda');
        this.testResults.push({ test: 'Dashboard Currency Update', status: 'PASS' });
      } else {
        console.log('❌ Dashboard no se actualizó');
        this.testResults.push({ test: 'Dashboard Currency Update', status: 'FAIL' });
      }
      
      // 5. Restaurar moneda original
      await this.changePrimaryCurrency(originalCurrency);
      console.log(`✅ Moneda restaurada a: ${originalCurrency}`);
      
    } catch (error) {
      console.log('❌ Error en flujo de cambio de moneda:', error.message);
      this.testResults.push({ test: 'Currency Change Flow', status: 'FAIL', error: error.message });
    }
  }

  async cleanupTestData() {
    console.log('\n🧹 Limpiando datos de prueba...');
    // En este caso no creamos datos de prueba, solo verificamos los existentes
    console.log('✅ Limpieza completada');
  }

  // Métodos auxiliares para hacer requests
  async getUserSettings() {
    const response = await axios.get(`${this.baseURL}/api/configuracion`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return response.data.data;
  }

  async getExchangeRates() {
    const response = await axios.get(`${this.baseURL}/api/configuracion/rates`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return response.data.data;
  }

  async getAccounts() {
    const response = await axios.get(`${this.baseURL}/api/cuentas`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return response.data.data;
  }

  async getTransactions() {
    const response = await axios.get(`${this.baseURL}/api/transacciones`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return response.data.data;
  }

  async getDashboard() {
    const response = await axios.get(`${this.baseURL}/api/dashboard`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return response.data.data;
  }

  async changePrimaryCurrency(currency) {
    const response = await axios.patch(`${this.baseURL}/api/configuracion/moneda-principal`, {
      primaryCurrency: currency
    }, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return response.data;
  }

  printResults() {
    console.log('\n📊 RESULTADOS DE LAS PRUEBAS END-TO-END');
    console.log('=======================================');
    
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
    
    console.log('\n📈 RESUMEN E2E:');
    console.log(`✅ Exitosos: ${passed}`);
    console.log(`❌ Fallidos: ${failed}`);
    console.log(`⚠️ Advertencias: ${warnings}`);
    
    if (failed === 0) {
      console.log('\n🎉 ¡Todas las pruebas end-to-end pasaron!');
    } else {
      console.log('\n⚠️ Hay problemas en los flujos de usuario');
    }
  }
}

// Ejecutar auditoría E2E
const e2eAuditor = new E2EAuditor();
e2eAuditor.runFullE2EAudit();
