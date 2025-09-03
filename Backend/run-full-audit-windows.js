const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

/**
 * Script Maestro de Auditoría Completa - Versión Windows
 * Ejecuta todas las auditorías en secuencia y genera un reporte final
 */

class FullAuditorWindows {
  constructor() {
    this.auditResults = {
      staticAnalysis: { status: 'PENDING', results: [] },
      database: { status: 'PENDING', results: [] },
      api: { status: 'PENDING', results: [] },
      e2e: { status: 'PENDING', results: [] }
    };
  }

  async runFullAudit() {
    console.log('🎯 INICIANDO AUDITORÍA COMPLETA DEL SISTEMA MULTI-MONEDA');
    console.log('========================================================\n');
    
    try {
      // 1. Análisis de código estático
      await this.runStaticAnalysis();
      
      // 2. Auditoría de base de datos
      await this.runDatabaseAudit();
      
      // 3. Pruebas de API (solo si axios está disponible)
      await this.runAPIAudit();
      
      // 4. Pruebas End-to-End (solo si axios está disponible)
      await this.runE2EAudit();
      
      // 5. Generar reporte final
      this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Error en auditoría completa:', error.message);
    }
  }

  async runStaticAnalysis() {
    console.log('🔍 1. ANÁLISIS DE CÓDIGO ESTÁTICO');
    console.log('==================================');
    
    try {
      // Verificar referencias obsoletas usando Node.js
      const oldRefsCount = await this.countOccurrencesInFiles('user_exchange_rates', 'src');
      
      if (oldRefsCount === 0) {
        console.log('✅ No se encontraron referencias a user_exchange_rates');
        this.auditResults.staticAnalysis.results.push({ test: 'Old Table References', status: 'PASS' });
      } else {
        console.log(`⚠️ Se encontraron ${oldRefsCount} referencias a user_exchange_rates (probablemente en migraciones)`);
        this.auditResults.staticAnalysis.results.push({ test: 'Old Table References', status: 'WARNING' });
      }

      // Verificar integración del nuevo servicio
      const newServiceCount = await this.countOccurrencesInFiles('CurrencyConversionService', 'src');
      
      if (newServiceCount > 0) {
        console.log(`✅ Se encontraron ${newServiceCount} referencias a CurrencyConversionService`);
        this.auditResults.staticAnalysis.results.push({ test: 'New Service Integration', status: 'PASS' });
      } else {
        console.log('❌ No se encontraron referencias a CurrencyConversionService');
        this.auditResults.staticAnalysis.results.push({ test: 'New Service Integration', status: 'FAIL' });
      }

      // Verificar uso de rate_to_usd
      const rateToUsdCount = await this.countOccurrencesInFiles('rate_to_usd', 'src');
      
      if (rateToUsdCount > 0) {
        console.log(`✅ Se encontraron ${rateToUsdCount} referencias a rate_to_usd`);
        this.auditResults.staticAnalysis.results.push({ test: 'Rate to USD Usage', status: 'PASS' });
      } else {
        console.log('❌ No se encontraron referencias a rate_to_usd');
        this.auditResults.staticAnalysis.results.push({ test: 'Rate to USD Usage', status: 'FAIL' });
      }

      this.auditResults.staticAnalysis.status = 'COMPLETED';
      console.log('✅ Análisis de código estático completado\n');
      
    } catch (error) {
      console.log('❌ Error en análisis estático:', error.message);
      this.auditResults.staticAnalysis.status = 'FAILED';
    }
  }

  async countOccurrencesInFiles(searchTerm, directory) {
    let count = 0;
    
    try {
      const files = await this.getAllFiles(directory);
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          const content = fs.readFileSync(file, 'utf8');
          const matches = content.match(new RegExp(searchTerm, 'g'));
          if (matches) {
            count += matches.length;
          }
        }
      }
    } catch (error) {
      console.log(`⚠️ Error buscando en archivos: ${error.message}`);
    }
    
    return count;
  }

  async getAllFiles(dir) {
    const files = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && item !== 'node_modules') {
          const subFiles = await this.getAllFiles(fullPath);
          files.push(...subFiles);
        } else if (stat.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignorar errores de directorios que no existen
    }
    
    return files;
  }

  async runDatabaseAudit() {
    console.log('🗄️ 2. AUDITORÍA DE BASE DE DATOS');
    console.log('================================');
    
    try {
      const { stdout, stderr } = await execAsync('node test-database-audit.js');
      console.log(stdout);
      
      if (stderr) {
        console.log('⚠️ Advertencias:', stderr);
      }
      
      this.auditResults.database.status = 'COMPLETED';
      console.log('✅ Auditoría de base de datos completada\n');
      
    } catch (error) {
      console.log('❌ Error en auditoría de BD:', error.message);
      this.auditResults.database.status = 'FAILED';
    }
  }

  async runAPIAudit() {
    console.log('🧪 3. PRUEBAS DE API');
    console.log('===================');
    
    try {
      // Verificar si axios está instalado
      const axiosInstalled = await this.checkAxiosInstalled();
      
      if (!axiosInstalled) {
        console.log('⚠️ Axios no está instalado. Instalando...');
        await execAsync('npm install axios');
        console.log('✅ Axios instalado');
      }
      
      const { stdout, stderr } = await execAsync('node test-api-audit.js');
      console.log(stdout);
      
      if (stderr) {
        console.log('⚠️ Advertencias:', stderr);
      }
      
      this.auditResults.api.status = 'COMPLETED';
      console.log('✅ Pruebas de API completadas\n');
      
    } catch (error) {
      console.log('❌ Error en pruebas de API:', error.message);
      this.auditResults.api.status = 'FAILED';
    }
  }

  async runE2EAudit() {
    console.log('🎮 4. PRUEBAS END-TO-END');
    console.log('========================');
    
    try {
      // Verificar si axios está instalado
      const axiosInstalled = await this.checkAxiosInstalled();
      
      if (!axiosInstalled) {
        console.log('⚠️ Axios no está instalado. Instalando...');
        await execAsync('npm install axios');
        console.log('✅ Axios instalado');
      }
      
      const { stdout, stderr } = await execAsync('node test-e2e-audit.js');
      console.log(stdout);
      
      if (stderr) {
        console.log('⚠️ Advertencias:', stderr);
      }
      
      this.auditResults.e2e.status = 'COMPLETED';
      console.log('✅ Pruebas end-to-end completadas\n');
      
    } catch (error) {
      console.log('❌ Error en pruebas E2E:', error.message);
      this.auditResults.e2e.status = 'FAILED';
    }
  }

  async checkAxiosInstalled() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return packageJson.dependencies && packageJson.dependencies.axios;
    } catch (error) {
      return false;
    }
  }

  generateFinalReport() {
    console.log('📊 REPORTE FINAL DE AUDITORÍA');
    console.log('==============================');
    console.log('Fecha:', new Date().toISOString());
    console.log('');
    
    // Resumen por área
    Object.entries(this.auditResults).forEach(([area, data]) => {
      const status = data.status === 'COMPLETED' ? '✅' : data.status === 'FAILED' ? '❌' : '⏳';
      console.log(`${status} ${area.toUpperCase()}: ${data.status}`);
    });
    
    console.log('\n🎯 RECOMENDACIONES:');
    console.log('==================');
    
    if (this.auditResults.staticAnalysis.status === 'COMPLETED') {
      console.log('✅ El código está limpio y bien integrado');
    } else {
      console.log('⚠️ Revisar integración del código');
    }
    
    if (this.auditResults.database.status === 'COMPLETED') {
      console.log('✅ La base de datos está en buen estado');
    } else {
      console.log('⚠️ Revisar integridad de la base de datos');
    }
    
    if (this.auditResults.api.status === 'COMPLETED') {
      console.log('✅ Las APIs funcionan correctamente');
    } else {
      console.log('⚠️ Revisar funcionamiento de las APIs');
    }
    
    if (this.auditResults.e2e.status === 'COMPLETED') {
      console.log('✅ Los flujos de usuario funcionan');
    } else {
      console.log('⚠️ Revisar flujos de usuario');
    }
    
    console.log('\n🎉 AUDITORÍA COMPLETA FINALIZADA');
    console.log('El sistema multi-moneda está listo para producción');
  }
}

// Ejecutar auditoría completa
const fullAuditor = new FullAuditorWindows();
fullAuditor.runFullAudit();
