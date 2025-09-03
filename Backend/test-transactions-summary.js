/**
 * Script de Prueba Específico para Resumen de Transacciones
 * Verifica que los totales se calculen correctamente con conversiones de moneda
 */

const axios = require('axios');

class TransactionSummaryTester {
  constructor() {
    this.baseURL = 'http://localhost:3000';
    this.token = null;
    this.userId = null;
  }

  async runTests() {
    console.log('🧮 Iniciando pruebas específicas de resumen de transacciones...\n');
    
    try {
      await this.authenticate();
      await this.testTransactionSummary();
      await this.testTransactionStatistics();
      
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

  async testTransactionSummary() {
    console.log('\n📊 Probando resumen de transacciones (endpoint /resumen)...');
    
    try {
      const response = await axios.get(`${this.baseURL}/api/transacciones/resumen`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      if (response.data.success) {
        const summary = response.data.data.summary;
        console.log('✅ Resumen de transacciones obtenido:');
        console.log(`   Total Ingresos: ${summary.totalIncome} ${summary.primaryCurrency}`);
        console.log(`   Total Gastos: ${summary.totalExpenses} ${summary.primaryCurrency}`);
        console.log(`   Balance: ${summary.balanceNeto} ${summary.primaryCurrency}`);
        
        // Verificar que los totales son números válidos
        if (typeof summary.totalIncome === 'number' && typeof summary.totalExpenses === 'number') {
          console.log('✅ Totales son números válidos');
          
          // Verificar que el balance es consistente
          const calculatedBalance = summary.totalIncome - summary.totalExpenses;
          if (Math.abs(calculatedBalance - summary.balanceNeto) < 0.01) {
            console.log('✅ Balance calculado correctamente');
          } else {
            console.log('⚠️ Balance no coincide con el cálculo');
          }
        } else {
          console.log('⚠️ Totales no son números válidos');
        }
      } else {
        throw new Error('No se obtuvo resumen de transacciones');
      }
    } catch (error) {
      console.error('❌ Error en resumen de transacciones:', error.response?.status || error.message);
      if (error.response?.data) {
        console.error('   Detalles:', error.response.data);
      }
    }
  }

  async testTransactionStatistics() {
    console.log('\n📈 Probando estadísticas de transacciones (endpoint /estadisticas)...');
    
    try {
      const response = await axios.get(`${this.baseURL}/api/transacciones/estadisticas`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      if (response.data.success) {
        const stats = response.data.data.estadisticas;
        console.log('✅ Estadísticas obtenidas:');
        console.log(`   Período: ${stats.period}`);
        console.log(`   Total Ingresos: ${stats.totalIngresos} ${stats.primaryCurrency}`);
        console.log(`   Total Gastos: ${stats.totalGastos} ${stats.primaryCurrency}`);
        console.log(`   Balance: ${stats.balance} ${stats.primaryCurrency}`);
        
        // Verificar que los totales son números válidos
        if (typeof stats.totalIngresos === 'number' && typeof stats.totalGastos === 'number') {
          console.log('✅ Totales son números válidos');
          
          // Verificar que el balance es consistente
          const calculatedBalance = stats.totalIngresos - stats.totalGastos;
          if (Math.abs(calculatedBalance - stats.balance) < 0.01) {
            console.log('✅ Balance calculado correctamente');
          } else {
            console.log('⚠️ Balance no coincide con el cálculo');
          }
        } else {
          console.log('⚠️ Totales no son números válidos');
        }
      } else {
        throw new Error('No se obtuvieron estadísticas');
      }
    } catch (error) {
      console.error('❌ Error en estadísticas:', error.response?.status || error.message);
      if (error.response?.data) {
        console.error('   Detalles:', error.response.data);
      }
    }
  }

  async testIndividualTransactions() {
    console.log('\n💳 Probando transacciones individuales...');
    
    try {
      const response = await axios.get(`${this.baseURL}/api/transacciones?limit=5`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      if (response.data.success) {
        const transactions = response.data.data.transactions;
        console.log(`✅ Transacciones obtenidas: ${transactions.length}`);
        
        // Verificar que las transacciones tienen currency_code
        const hasCurrencyCode = transactions.every(t => t.currency_code);
        if (hasCurrencyCode) {
          console.log('✅ Todas las transacciones tienen currency_code');
          
          // Mostrar algunas transacciones como ejemplo
          transactions.slice(0, 3).forEach((t, index) => {
            console.log(`   Transacción ${index + 1}:`);
            console.log(`     Tipo: ${t.type}`);
            console.log(`     Monto: ${t.original_amount} ${t.original_currency}`);
            console.log(`     Convertido: ${t.converted_amount} ${t.primary_currency}`);
            console.log(`     Conversión aplicada: ${t.is_converted ? 'Sí' : 'No'}`);
          });
        } else {
          console.log('⚠️ Algunas transacciones no tienen currency_code');
        }
      } else {
        throw new Error('No se obtuvieron transacciones');
      }
    } catch (error) {
      console.error('❌ Error en transacciones individuales:', error.response?.status || error.message);
    }
  }
}

// Ejecutar pruebas
const tester = new TransactionSummaryTester();
tester.runTests();
