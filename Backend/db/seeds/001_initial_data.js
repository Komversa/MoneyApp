/**
 * Seeder para datos iniciales de desarrollo
 * Crea tipos de cuenta y categorías predeterminadas para facilitar las pruebas
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Solo ejecutar en entorno de desarrollo
  if (process.env.NODE_ENV === 'production') {
    console.log('🚫 Seeder omitido: No se ejecuta en producción');
    return;
  }

  try {
    console.log('🌱 Ejecutando seeder de datos iniciales...');

    // Buscar usuario de ejemplo (debe existir desde pasos anteriores)
    const exampleUser = await knex('users')
      .where({ email: 'admin@example.com' })
      .first();

    if (!exampleUser) {
      console.log('⚠️  Usuario admin@example.com no encontrado. Saltando seeder.');
      return;
    }

    const userId = exampleUser.id;

    // Limpiar datos existentes del usuario de ejemplo
    await knex('categories').where({ user_id: userId }).del();
    await knex('account_types').where({ user_id: userId }).del();

    /**
     * TIPOS DE CUENTA PREDETERMINADOS
     */
    const accountTypesData = [
      { user_id: userId, name: 'Banco' },
      { user_id: userId, name: 'Cuenta de Ahorros' },
      { user_id: userId, name: 'Efectivo' },
      { user_id: userId, name: 'Inversiones' }
    ];

    await knex('account_types').insert(accountTypesData);
    console.log('✅ Tipos de cuenta creados:', accountTypesData.length);

    /**
     * CATEGORÍAS PREDETERMINADAS
     */
    const categoriesData = [
      // Categorías de INGRESOS
      { user_id: userId, name: 'Salario', type: 'income' },
      { user_id: userId, name: 'Freelance', type: 'income' },
      { user_id: userId, name: 'Inversiones', type: 'income' },
      { user_id: userId, name: 'Bonificaciones', type: 'income' },
      { user_id: userId, name: 'Ventas', type: 'income' },
      { user_id: userId, name: 'Otros Ingresos', type: 'income' },

      // Categorías de GASTOS
      { user_id: userId, name: 'Comida', type: 'expense' },
      { user_id: userId, name: 'Transporte', type: 'expense' },
      { user_id: userId, name: 'Vivienda', type: 'expense' },
      { user_id: userId, name: 'Servicios Públicos', type: 'expense' },
      { user_id: userId, name: 'Entretenimiento', type: 'expense' },
      { user_id: userId, name: 'Salud', type: 'expense' },
      { user_id: userId, name: 'Educación', type: 'expense' },
      { user_id: userId, name: 'Compras', type: 'expense' },
      { user_id: userId, name: 'Impuestos', type: 'expense' },
      { user_id: userId, name: 'Seguros', type: 'expense' },
      { user_id: userId, name: 'Otros Gastos', type: 'expense' }
    ];

    await knex('categories').insert(categoriesData);
    console.log('✅ Categorías creadas:', categoriesData.length);

    // Resumen de datos creados
    const incomeCategories = categoriesData.filter(cat => cat.type === 'income').length;
    const expenseCategories = categoriesData.filter(cat => cat.type === 'expense').length;

    console.log('');
    console.log('🎉 ================================');
    console.log('   SEEDER COMPLETADO EXITOSAMENTE');
    console.log('🎉 ================================');
    console.log(`👤 Usuario: ${exampleUser.email}`);
    console.log(`🏦 Tipos de cuenta: ${accountTypesData.length}`);
    console.log(`📈 Categorías de ingresos: ${incomeCategories}`);
    console.log(`📉 Categorías de gastos: ${expenseCategories}`);
    console.log(`📊 Total categorías: ${categoriesData.length}`);
    console.log('🎉 ================================');

  } catch (error) {
    console.error('❌ Error ejecutando seeder:', error.message);
    throw error;
  }
};