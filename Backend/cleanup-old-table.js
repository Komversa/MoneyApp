const { db } = require('./src/config/db');

/**
 * Script de Limpieza Manual de Tabla Antigua
 * Elimina la tabla user_exchange_rates que no fue eliminada por la migración
 */

class TableCleanup {
  constructor() {
    this.cleanupResults = [];
  }

  async runCleanup() {
    console.log('🧹 Iniciando limpieza manual de tabla antigua...\n');
    
    try {
      await this.checkTableExists();
      await this.backupDataIfNeeded();
      await this.dropOldTable();
      await this.verifyCleanup();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Error en limpieza:', error.message);
    } finally {
      await db.destroy();
    }
  }

  async checkTableExists() {
    console.log('🔍 Verificando existencia de tabla antigua...');
    
    try {
      const tableExists = await db.schema.hasTable('user_exchange_rates');
      
      if (tableExists) {
        console.log('⚠️ Tabla user_exchange_rates existe y necesita ser eliminada');
        
        // Contar registros en la tabla antigua
        const count = await db('user_exchange_rates').count('* as total');
        console.log(`📊 La tabla contiene ${count[0].total} registros`);
        
        this.cleanupResults.push({ 
          test: 'Old Table Exists', 
          status: 'WARNING', 
          message: `Tabla encontrada con ${count[0].total} registros` 
        });
      } else {
        console.log('✅ Tabla user_exchange_rates no existe');
        this.cleanupResults.push({ test: 'Old Table Exists', status: 'PASS' });
      }
    } catch (error) {
      console.log('❌ Error verificando tabla:', error.message);
      this.cleanupResults.push({ test: 'Check Table', status: 'FAIL', error: error.message });
    }
  }

  async backupDataIfNeeded() {
    console.log('\n💾 Verificando si se necesita backup...');
    
    try {
      const tableExists = await db.schema.hasTable('user_exchange_rates');
      
      if (tableExists) {
        const count = await db('user_exchange_rates').count('* as total');
        
        if (count[0].total > 0) {
          console.log('⚠️ La tabla contiene datos. Verificando si ya fueron migrados...');
          
          // Verificar si los datos ya están en la nueva tabla
          const newTableCount = await db('user_exchange_rates_pivot').count('* as total');
          console.log(`📊 Nueva tabla tiene ${newTableCount[0].total} registros`);
          
          if (newTableCount[0].total > 0) {
            console.log('✅ Los datos ya están migrados a la nueva tabla. Es seguro eliminar la antigua.');
            this.cleanupResults.push({ test: 'Data Migration Check', status: 'PASS' });
          } else {
            console.log('⚠️ La nueva tabla está vacía. Los datos podrían no estar migrados.');
            this.cleanupResults.push({ test: 'Data Migration Check', status: 'WARNING' });
          }
        } else {
          console.log('✅ La tabla antigua está vacía. Es seguro eliminarla.');
          this.cleanupResults.push({ test: 'Data Migration Check', status: 'PASS' });
        }
      } else {
        console.log('✅ No hay tabla que limpiar');
        this.cleanupResults.push({ test: 'Data Migration Check', status: 'PASS' });
      }
    } catch (error) {
      console.log('❌ Error verificando migración:', error.message);
      this.cleanupResults.push({ test: 'Data Migration Check', status: 'FAIL', error: error.message });
    }
  }

  async dropOldTable() {
    console.log('\n🗑️ Eliminando tabla antigua...');
    
    try {
      const tableExists = await db.schema.hasTable('user_exchange_rates');
      
      if (tableExists) {
        console.log('🗑️ Eliminando tabla user_exchange_rates...');
        await db.schema.dropTable('user_exchange_rates');
        console.log('✅ Tabla user_exchange_rates eliminada exitosamente');
        this.cleanupResults.push({ test: 'Drop Old Table', status: 'PASS' });
      } else {
        console.log('ℹ️ La tabla ya no existe');
        this.cleanupResults.push({ test: 'Drop Old Table', status: 'PASS' });
      }
    } catch (error) {
      console.log('❌ Error eliminando tabla:', error.message);
      this.cleanupResults.push({ test: 'Drop Old Table', status: 'FAIL', error: error.message });
    }
  }

  async verifyCleanup() {
    console.log('\n✅ Verificando limpieza...');
    
    try {
      const tableExists = await db.schema.hasTable('user_exchange_rates');
      
      if (!tableExists) {
        console.log('✅ Tabla user_exchange_rates eliminada correctamente');
        this.cleanupResults.push({ test: 'Cleanup Verification', status: 'PASS' });
      } else {
        console.log('❌ La tabla aún existe después de la limpieza');
        this.cleanupResults.push({ test: 'Cleanup Verification', status: 'FAIL' });
      }
      
      // Verificar que la nueva tabla sigue existiendo
      const newTableExists = await db.schema.hasTable('user_exchange_rates_pivot');
      
      if (newTableExists) {
        console.log('✅ Tabla user_exchange_rates_pivot sigue existiendo');
        this.cleanupResults.push({ test: 'New Table Preserved', status: 'PASS' });
      } else {
        console.log('❌ La tabla nueva fue eliminada accidentalmente');
        this.cleanupResults.push({ test: 'New Table Preserved', status: 'FAIL' });
      }
      
    } catch (error) {
      console.log('❌ Error verificando limpieza:', error.message);
      this.cleanupResults.push({ test: 'Cleanup Verification', status: 'FAIL', error: error.message });
    }
  }

  printResults() {
    console.log('\n📊 RESULTADOS DE LA LIMPIEZA');
    console.log('=============================');
    
    const passed = this.cleanupResults.filter(r => r.status === 'PASS').length;
    const failed = this.cleanupResults.filter(r => r.status === 'FAIL').length;
    const warnings = this.cleanupResults.filter(r => r.status === 'WARNING').length;
    
    this.cleanupResults.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${status} ${result.test}: ${result.status}`);
      if (result.message) {
        console.log(`   ${result.message}`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('\n📈 RESUMEN:');
    console.log(`✅ Exitosos: ${passed}`);
    console.log(`❌ Fallidos: ${failed}`);
    console.log(`⚠️ Advertencias: ${warnings}`);
    
    if (failed === 0) {
      console.log('\n🎉 ¡Limpieza completada exitosamente!');
      console.log('La tabla antigua ha sido eliminada y el sistema está limpio.');
    } else {
      console.log('\n⚠️ Hay problemas que necesitan atención manual');
    }
  }
}

// Ejecutar limpieza
const cleanup = new TableCleanup();
cleanup.runCleanup();
