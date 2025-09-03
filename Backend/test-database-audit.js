const { db } = require('./src/config/db');

/**
 * Script de Auditoría de Integridad de Base de Datos
 * Verifica que la migración del sistema multi-moneda fue exitosa
 */

class DatabaseAuditor {
  constructor() {
    this.auditResults = [];
  }

  async runFullAudit() {
    console.log('🗄️ Iniciando auditoría de integridad de base de datos...\n');
    
    try {
      await this.testTableStructure();
      await this.testUserData();
      await this.testExchangeRates();
      await this.testTransactions();
      await this.testAccounts();
      await this.testSupportedCurrencies();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Error en auditoría de BD:', error.message);
    } finally {
      await db.destroy();
    }
  }

  async testTableStructure() {
    console.log('🏗️ Verificando estructura de tablas...');
    
    try {
      // Verificar que la tabla antigua fue eliminada
      const oldTableExists = await db.schema.hasTable('user_exchange_rates');
      if (!oldTableExists) {
        console.log('✅ Tabla user_exchange_rates eliminada correctamente');
        this.auditResults.push({ test: 'Old Table Removed', status: 'PASS' });
      } else {
        console.log('❌ Tabla user_exchange_rates aún existe');
        this.auditResults.push({ test: 'Old Table Removed', status: 'FAIL' });
      }

      // Verificar que la tabla nueva existe
      const newTableExists = await db.schema.hasTable('user_exchange_rates_pivot');
      if (newTableExists) {
        console.log('✅ Tabla user_exchange_rates_pivot existe');
        this.auditResults.push({ test: 'New Table Exists', status: 'PASS' });
      } else {
        console.log('❌ Tabla user_exchange_rates_pivot no existe');
        this.auditResults.push({ test: 'New Table Exists', status: 'FAIL' });
      }

      // Verificar que supported_currencies existe
      const supportedCurrenciesExists = await db.schema.hasTable('supported_currencies');
      if (supportedCurrenciesExists) {
        console.log('✅ Tabla supported_currencies existe');
        this.auditResults.push({ test: 'Supported Currencies Table', status: 'PASS' });
      } else {
        console.log('❌ Tabla supported_currencies no existe');
        this.auditResults.push({ test: 'Supported Currencies Table', status: 'FAIL' });
      }

    } catch (error) {
      console.log('❌ Error verificando estructura:', error.message);
      this.auditResults.push({ test: 'Table Structure', status: 'FAIL', error: error.message });
    }
  }

  async testUserData() {
    console.log('\n👤 Verificando datos de usuarios...');
    
    try {
      // Verificar que hay usuarios
      const users = await db('users').select('id', 'email');
      if (users.length > 0) {
        console.log(`✅ ${users.length} usuarios encontrados`);
        this.auditResults.push({ test: 'Users Exist', status: 'PASS' });
        
        // Verificar configuración de usuarios
        const userSettings = await db('user_settings').select('user_id', 'primary_currency');
        if (userSettings.length > 0) {
          console.log(`✅ ${userSettings.length} configuraciones de usuario encontradas`);
          this.auditResults.push({ test: 'User Settings Exist', status: 'PASS' });
          
          // Verificar que no hay secondary_currency ni exchange_rate
          const hasOldFields = await db.schema.hasColumn('user_settings', 'secondary_currency');
          if (!hasOldFields) {
            console.log('✅ Campo secondary_currency eliminado correctamente');
            this.auditResults.push({ test: 'Old Fields Removed', status: 'PASS' });
          } else {
            console.log('❌ Campo secondary_currency aún existe');
            this.auditResults.push({ test: 'Old Fields Removed', status: 'FAIL' });
          }
        } else {
          console.log('⚠️ No hay configuraciones de usuario');
          this.auditResults.push({ test: 'User Settings Exist', status: 'WARNING' });
        }
      } else {
        console.log('❌ No hay usuarios en la base de datos');
        this.auditResults.push({ test: 'Users Exist', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Error verificando usuarios:', error.message);
      this.auditResults.push({ test: 'User Data', status: 'FAIL', error: error.message });
    }
  }

  async testExchangeRates() {
    console.log('\n💱 Verificando tasas de cambio...');
    
    try {
      // Verificar tasas en la nueva tabla
      const exchangeRates = await db('user_exchange_rates_pivot')
        .select('user_id', 'currency_code', 'rate_to_usd');
      
      if (exchangeRates.length > 0) {
        console.log(`✅ ${exchangeRates.length} tasas de cambio encontradas`);
        this.auditResults.push({ test: 'Exchange Rates Exist', status: 'PASS' });
        
        // Verificar que USD siempre tiene rate_to_usd = 1.0
        const usdRates = exchangeRates.filter(rate => rate.currency_code === 'USD');
        const usdRateValid = usdRates.every(rate => parseFloat(rate.rate_to_usd) === 1.0);
        
        if (usdRateValid) {
          console.log('✅ Todas las tasas USD son 1.0');
          this.auditResults.push({ test: 'USD Rate Validation', status: 'PASS' });
        } else {
          console.log('❌ Algunas tasas USD no son 1.0');
          this.auditResults.push({ test: 'USD Rate Validation', status: 'FAIL' });
        }
        
        // Verificar que no hay tasas duplicadas por usuario
        const userRates = await db('user_exchange_rates_pivot')
          .select('user_id', 'currency_code')
          .groupBy('user_id', 'currency_code')
          .havingRaw('COUNT(*) > 1');
        
        if (userRates.length === 0) {
          console.log('✅ No hay tasas duplicadas');
          this.auditResults.push({ test: 'No Duplicate Rates', status: 'PASS' });
        } else {
          console.log('❌ Hay tasas duplicadas');
          this.auditResults.push({ test: 'No Duplicate Rates', status: 'FAIL' });
        }
      } else {
        console.log('⚠️ No hay tasas de cambio');
        this.auditResults.push({ test: 'Exchange Rates Exist', status: 'WARNING' });
      }
    } catch (error) {
      console.log('❌ Error verificando tasas:', error.message);
      this.auditResults.push({ test: 'Exchange Rates', status: 'FAIL', error: error.message });
    }
  }

  async testTransactions() {
    console.log('\n💳 Verificando transacciones...');
    
    try {
      // Verificar que hay transacciones
      const transactions = await db('transactions').select('id', 'currency_code', 'amount');
      
      if (transactions.length > 0) {
        console.log(`✅ ${transactions.length} transacciones encontradas`);
        this.auditResults.push({ test: 'Transactions Exist', status: 'PASS' });
        
        // Verificar que todas las transacciones tienen currency_code
        const transactionsWithoutCurrency = transactions.filter(t => !t.currency_code);
        if (transactionsWithoutCurrency.length === 0) {
          console.log('✅ Todas las transacciones tienen currency_code');
          this.auditResults.push({ test: 'Transactions Currency Code', status: 'PASS' });
        } else {
          console.log(`❌ ${transactionsWithoutCurrency.length} transacciones sin currency_code`);
          this.auditResults.push({ test: 'Transactions Currency Code', status: 'FAIL' });
        }
        
        // Verificar que los currency_code son válidos
        const validCurrencies = await db('supported_currencies').select('code');
        const validCurrencyCodes = validCurrencies.map(c => c.code);
        
        const invalidCurrencyCodes = transactions.filter(t => 
          t.currency_code && !validCurrencyCodes.includes(t.currency_code)
        );
        
        if (invalidCurrencyCodes.length === 0) {
          console.log('✅ Todos los currency_code son válidos');
          this.auditResults.push({ test: 'Valid Currency Codes', status: 'PASS' });
        } else {
          console.log(`❌ ${invalidCurrencyCodes.length} transacciones con currency_code inválido`);
          this.auditResults.push({ test: 'Valid Currency Codes', status: 'FAIL' });
        }
      } else {
        console.log('⚠️ No hay transacciones');
        this.auditResults.push({ test: 'Transactions Exist', status: 'WARNING' });
      }
    } catch (error) {
      console.log('❌ Error verificando transacciones:', error.message);
      this.auditResults.push({ test: 'Transactions', status: 'FAIL', error: error.message });
    }
  }

  async testAccounts() {
    console.log('\n🏦 Verificando cuentas...');
    
    try {
      // Verificar que hay cuentas
      const accounts = await db('accounts').select('id', 'name', 'currency', 'current_balance');
      
      if (accounts.length > 0) {
        console.log(`✅ ${accounts.length} cuentas encontradas`);
        this.auditResults.push({ test: 'Accounts Exist', status: 'PASS' });
        
        // Verificar que todas las cuentas tienen currency válida
        const validCurrencies = await db('supported_currencies').select('code');
        const validCurrencyCodes = validCurrencies.map(c => c.code);
        
        const invalidCurrencyAccounts = accounts.filter(a => 
          !validCurrencyCodes.includes(a.currency)
        );
        
        if (invalidCurrencyAccounts.length === 0) {
          console.log('✅ Todas las cuentas tienen moneda válida');
          this.auditResults.push({ test: 'Valid Account Currencies', status: 'PASS' });
        } else {
          console.log(`❌ ${invalidCurrencyAccounts.length} cuentas con moneda inválida`);
          this.auditResults.push({ test: 'Valid Account Currencies', status: 'FAIL' });
        }
      } else {
        console.log('⚠️ No hay cuentas');
        this.auditResults.push({ test: 'Accounts Exist', status: 'WARNING' });
      }
    } catch (error) {
      console.log('❌ Error verificando cuentas:', error.message);
      this.auditResults.push({ test: 'Accounts', status: 'FAIL', error: error.message });
    }
  }

  async testSupportedCurrencies() {
    console.log('\n🌍 Verificando monedas soportadas...');
    
    try {
      // Verificar que hay monedas soportadas
      const supportedCurrencies = await db('supported_currencies')
        .select('code', 'name', 'symbol');
      
      if (supportedCurrencies.length > 0) {
        console.log(`✅ ${supportedCurrencies.length} monedas soportadas`);
        this.auditResults.push({ test: 'Supported Currencies Exist', status: 'PASS' });
        
        // Verificar que USD y NIO están incluidos
        const hasUSD = supportedCurrencies.some(c => c.code === 'USD');
        const hasNIO = supportedCurrencies.some(c => c.code === 'NIO');
        
        if (hasUSD && hasNIO) {
          console.log('✅ USD y NIO están incluidos en monedas soportadas');
          this.auditResults.push({ test: 'USD and NIO Supported', status: 'PASS' });
        } else {
          console.log('❌ Faltan USD o NIO en monedas soportadas');
          this.auditResults.push({ test: 'USD and NIO Supported', status: 'FAIL' });
        }
        
        // Mostrar monedas soportadas
        console.log('📋 Monedas soportadas:');
        supportedCurrencies.forEach(currency => {
          console.log(`   - ${currency.code}: ${currency.name} (${currency.symbol})`);
        });
      } else {
        console.log('❌ No hay monedas soportadas');
        this.auditResults.push({ test: 'Supported Currencies Exist', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Error verificando monedas soportadas:', error.message);
      this.auditResults.push({ test: 'Supported Currencies', status: 'FAIL', error: error.message });
    }
  }

  printResults() {
    console.log('\n📊 RESULTADOS DE LA AUDITORÍA DE BASE DE DATOS');
    console.log('===============================================');
    
    const passed = this.auditResults.filter(r => r.status === 'PASS').length;
    const failed = this.auditResults.filter(r => r.status === 'FAIL').length;
    const warnings = this.auditResults.filter(r => r.status === 'WARNING').length;
    
    this.auditResults.forEach(result => {
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
      console.log('\n🎉 ¡La base de datos está en perfecto estado!');
    } else {
      console.log('\n⚠️ Hay problemas de integridad que necesitan atención');
    }
  }
}

// Ejecutar auditoría
const auditor = new DatabaseAuditor();
auditor.runFullAudit();
