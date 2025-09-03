/**
 * Script de Prueba para Verificar Cálculos Financieros Corregidos
 * Verifica que los totales se calculen correctamente con conversiones de moneda
 */

const axios = require('axios');

class FinancialCalculationsTester {
  constructor() {
    this.baseURL = 'http://localhost:3000';
    this.token = null;
    this.userId = null;
  }

  async runTests() {
    console.log('🧮 Iniciando pruebas de cálculos financieros...\n');
    
    try {
      await this.authenticate();
      await this.testTransactionStatistics();
      await this.testAccountSummary();
      await this.testDashboardCalculations();
      
      console.log('\n🎉 ¡Todas las pruebas completadas!');
    } catch (error) {
      console.error('❌ Error en pruebas:', error.message);
    }
  }

  async authenticate() {
    console.log('🔐 Autenticando...');
    
    try {
      const response = await axios.post(`${this.baseURL}/api/auth/login`, {
        email: 'admin@example.com',
        password: '123456'
      });
      
      if (response.data.success) {
        this.token = response.data.data.accessToken;
        this.userId = response.data.data.user.id;
        console.log('✅ Autenticación exitosa');
      } else {
        throw new Error('Login falló');
      }
    } catch (error) {
      console.error('❌ Error de autenticación:', error.message);
      throw error;
    }
  }

  async testTransactionStatistics() {
    console.log('\n📊 Probando estadísticas de transacciones...');
    
    try {
      const response = await axios.get(`${this.baseURL}/api/transacciones/estadisticas`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      if (response.data.success) {
        const stats = response.data.data;
        console.log('✅ Estadísticas obtenidas:');
        console.log(`   Período: ${stats.period}`);
        console.log(`   Total Ingresos: ${stats.totalIngresos} ${stats.primaryCurrency || 'NIO'}`);
        console.log(`   Total Gastos: ${stats.totalGastos} ${stats.primaryCurrency || 'NIO'}`);
        console.log(`   Balance: ${stats.balance} ${stats.primaryCurrency || 'NIO'}`);
        
        // Verificar que los totales son números válidos
        if (typeof stats.totalIngresos === 'number' && typeof stats.totalGastos === 'number') {
          console.log('✅ Totales son números válidos');
        } else {
          console.log('⚠️ Totales no son números válidos');
        }
      } else {
        throw new Error('No se obtuvieron estadísticas');
      }
    } catch (error) {
      console.error('❌ Error en estadísticas:', error.response?.status || error.message);
    }
  }

  async testAccountSummary() {
    console.log('\n💼 Probando resumen de cuentas...');
    
    try {
      const response = await axios.get(`${this.baseURL}/api/cuentas/resumen`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      if (response.data.success) {
        const summary = response.data.data;
        console.log('✅ Resumen de cuentas obtenido:');
        console.log(`   Total de cuentas: ${summary.totalAccounts}`);
        console.log(`   Total en moneda principal: ${summary.totalInPrimaryCurrency} ${summary.primaryCurrency}`);
        
        if (summary.totalsByCurrency) {
          console.log('   Totales por moneda:');
          Object.entries(summary.totalsByCurrency).forEach(([currency, amount]) => {
            console.log(`     ${currency}: ${amount}`);
          });
        }
        
        // Verificar que el total es un número válido
        if (typeof summary.totalInPrimaryCurrency === 'number') {
          console.log('✅ Total consolidado es un número válido');
        } else {
          console.log('⚠️ Total consolidado no es un número válido');
        }
      } else {
        throw new Error('No se obtuvo resumen de cuentas');
      }
    } catch (error) {
      console.error('❌ Error en resumen de cuentas:', error.response?.status || error.message);
    }
  }

  async testDashboardCalculations() {
    console.log('\n📈 Probando cálculos del dashboard...');
    
    try {
      const response = await axios.get(`${this.baseURL}/api/dashboard`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      if (response.data.success) {
        const dashboard = response.data.data;
        console.log('✅ Dashboard obtenido:');
        
        if (dashboard.resumen) {
          console.log('   Resumen financiero:');
          console.log(`     Total de cuentas: ${dashboard.resumen.totalCuentas}`);
          console.log(`     Saldo total: ${dashboard.resumen.saldoTotal} ${dashboard.resumen.monedaPrincipal}`);
        }
        
        if (dashboard.estadisticasMensuales) {
          console.log('   Estadísticas mensuales:');
          console.log(`     Ingresos: ${dashboard.estadisticasMensuales.totalIngresos} ${dashboard.estadisticasMensuales.monedaPrincipal}`);
          console.log(`     Gastos: ${dashboard.estadisticasMensuales.totalGastos} ${dashboard.estadisticasMensuales.monedaPrincipal}`);
          console.log(`     Balance: ${dashboard.estadisticasMensuales.balance} ${dashboard.estadisticasMensuales.monedaPrincipal}`);
        }
        
        if (dashboard.ultimasTransacciones) {
          console.log(`   Últimas transacciones: ${dashboard.ultimasTransacciones.length}`);
          
          // Verificar que las transacciones tienen currency_code
          const hasCurrencyCode = dashboard.ultimasTransacciones.every(t => t.currency_code);
          if (hasCurrencyCode) {
            console.log('✅ Todas las transacciones tienen currency_code');
          } else {
            console.log('⚠️ Algunas transacciones no tienen currency_code');
          }
        }
        
        if (dashboard.graficoGastos) {
          console.log(`   Gráfico de gastos: ${dashboard.graficoGastos.totalGastos} ${dashboard.graficoGastos.monedaPrincipal}`);
        }
      } else {
        throw new Error('No se obtuvo dashboard');
      }
    } catch (error) {
      console.error('❌ Error en dashboard:', error.response?.status || error.message);
    }
  }
}

// Ejecutar pruebas
const tester = new FinancialCalculationsTester();
tester.runTests();
