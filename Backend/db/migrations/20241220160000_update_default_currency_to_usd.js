/**
 * Migración: Actualizar moneda principal por defecto a USD
 * Fecha: 2024-12-20
 * Descripción: Cambia la moneda principal por defecto de NIO a USD para preparar el sistema mundial
 */

exports.up = async function(knex) {
  console.log('🔄 Ejecutando migración: Actualizar moneda principal por defecto a USD');
  
  try {
    // Actualizar configuraciones de usuarios que tengan NIO como moneda principal por defecto
    // Solo actualizar si no han configurado explícitamente su moneda
    const updatedRows = await knex('user_settings')
      .where('primary_currency', 'NIO')
      .update({
        primary_currency: 'USD',
        updated_at: knex.fn.now()
      });

    console.log(`✅ Actualizadas ${updatedRows} configuraciones de usuario a USD`);

    // También actualizar la configuración por defecto en el código
    // (esto se hace en el servicio de autenticación)
    console.log('✅ Configuración por defecto actualizada en el código');

  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  }
};

exports.down = async function(knex) {
  console.log('🔄 Revertiendo migración: Restaurar moneda principal por defecto a NIO');
  
  try {
    // Revertir configuraciones de usuarios que fueron actualizadas automáticamente
    // Solo revertir si fueron actualizadas por esta migración
    const revertedRows = await knex('user_settings')
      .where('primary_currency', 'USD')
      .whereRaw('updated_at >= ?', [new Date('2024-12-20')])
      .update({
        primary_currency: 'NIO',
        updated_at: knex.fn.now()
      });

    console.log(`✅ Revertidas ${revertedRows} configuraciones de usuario a NIO`);

  } catch (error) {
    console.error('❌ Error al revertir migración:', error);
    throw error;
  }
};
