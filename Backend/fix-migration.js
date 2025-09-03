/**
 * Script para corregir la migración fallida
 * Ejecutar con: node fix-migration.js
 */

const knex = require('knex');
const config = require('./knexfile');

async function fixMigration() {
  const db = knex(config.development);
  
  try {
    console.log('🔧 === CORRIGIENDO MIGRACIÓN FALLIDA ===\n');

    // 1. Verificar el estado actual de las migraciones
    console.log('1. Verificando estado de migraciones...');
    
    const migrations = await db.migrate.currentVersion();
    console.log('✅ Versión actual de migración:', migrations);

    // 2. Verificar si las tablas fueron creadas parcialmente
    console.log('\n2. Verificando estado de las tablas...');
    
    const [accountsHasCategory, debtDetailsExists] = await Promise.all([
      db.schema.hasColumn('accounts', 'account_category'),
      db.schema.hasTable('debt_details')
    ]);

    console.log('   - accounts.account_category:', accountsHasCategory ? '✅ Existe' : '❌ No existe');
    console.log('   - debt_details tabla:', debtDetailsExists ? '✅ Existe' : '❌ No existe');

    // 3. Si las tablas están parcialmente creadas, hacer rollback
    if (accountsHasCategory || debtDetailsExists) {
      console.log('\n3. Haciendo rollback de la migración fallida...');
      
      try {
        await db.migrate.rollback();
        console.log('✅ Rollback exitoso');
      } catch (rollbackError) {
        console.log('⚠️ Error en rollback automático, limpiando manualmente...');
        
        // Limpiar manualmente si el rollback falla
        if (debtDetailsExists) {
          await db.schema.dropTableIfExists('debt_details');
          console.log('✅ Tabla debt_details eliminada');
        }
        
        if (accountsHasCategory) {
          await db.schema.alterTable('accounts', (table) => {
            table.dropIndex(['user_id', 'account_category']);
            table.dropColumn('account_category');
          });
          console.log('✅ Columna account_category eliminada');
        }
      }
    }

    // 4. Ejecutar la migración corregida
    console.log('\n4. Ejecutando migración corregida...');
    
    const [batchNo, migrations_applied] = await db.migrate.latest();
    
    if (migrations_applied.length > 0) {
      console.log(`✅ Migraciones aplicadas (batch ${batchNo}):`);
      migrations_applied.forEach(migration => {
        console.log(`   - ${migration}`);
      });
    } else {
      console.log('ℹ️ No hay migraciones pendientes');
    }

    // 5. Verificar que todo esté funcionando correctamente
    console.log('\n5. Verificando integridad de la base de datos...');
    
    const [finalAccountsHasCategory, finalDebtDetailsExists] = await Promise.all([
      db.schema.hasColumn('accounts', 'account_category'),
      db.schema.hasTable('debt_details')
    ]);

    if (finalAccountsHasCategory && finalDebtDetailsExists) {
      console.log('✅ Migración completada exitosamente');
      
      // Verificar que las cuentas existentes tienen la categoría por defecto
      const accountsWithoutCategory = await db('accounts')
        .whereNull('account_category')
        .count('* as count')
        .first();

      if (parseInt(accountsWithoutCategory.count) === 0) {
        console.log('✅ Todas las cuentas tienen categoría asignada');
      } else {
        console.log(`⚠️ ${accountsWithoutCategory.count} cuentas sin categoría, asignando por defecto...`);
        
        await db('accounts')
          .whereNull('account_category')
          .update({ account_category: 'asset' });
          
        console.log('✅ Categorías por defecto asignadas');
      }
      
      // Mostrar distribución de categorías
      const categoryDistribution = await db('accounts')
        .select('account_category')
        .count('* as count')
        .groupBy('account_category');

      console.log('\n📊 Distribución de categorías:');
      categoryDistribution.forEach(category => {
        console.log(`   ${category.account_category}: ${category.count} cuentas`);
      });

    } else {
      console.log('❌ La migración no se completó correctamente');
    }

    console.log('\n🎉 === CORRECCIÓN COMPLETADA ===');

  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
  } finally {
    await db.destroy();
  }
}

// Ejecutar la corrección
fixMigration().catch(console.error);
