# Mockup Visual - Paginación Manual de Transacciones

## Vista por Defecto (Sin Filtros) - Estado Inicial

```
┌─────────────────────────────────────────────────────────────────┐
│                    HISTORIAL DE TRANSACCIONES (40)              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [Transacción 1] - Descripción - $100.00 - 15/12/2024          │
│ [Transacción 2] - Descripción - $250.00 - 14/12/2024          │
│ [Transacción 3] - Descripción - $75.50  - 13/12/2024          │
│ ...                                                             │
│ [Transacción 19] - Descripción - $45.00 - 01/12/2024          │
│ [Transacción 20] - Descripción - $120.00 - 30/11/2024         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    ┌─────────────┐  ┌─────────────┐            │
│                    │ Mostrar Más │  │ Mostrando  │            │
│                    └─────────────┘  │ 20 de 40   │            │
│                                      │transacciones│            │
└─────────────────────────────────────────────────────────────────┘
```

## Vista por Defecto - Estado Expandido (Después de "Mostrar Más")

```
┌─────────────────────────────────────────────────────────────────┐
│                    HISTORIAL DE TRANSACCIONES (40)              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [Transacción 1] - Descripción - $100.00 - 15/12/2024          │
│ [Transacción 2] - Descripción - $250.00 - 14/12/2024          │
│ [Transacción 3] - Descripción - $75.50  - 13/12/2024          │
│ ...                                                             │
│ [Transacción 19] - Descripción - $45.00 - 01/12/2024          │
│ [Transacción 20] - Descripción - $120.00 - 30/11/2024         │
│ [Transacción 21] - Descripción - $89.99 - 29/11/2024          │
│ [Transacción 22] - Descripción - $156.00 - 28/11/2024          │
│ [Transacción 23] - Descripción - $67.50 - 27/11/2024           │
│ [Transacción 24] - Descripción - $234.00 - 26/11/2024          │
│ [Transacción 25] - Descripción - $89.00 - 25/11/2024           │
│ ...                                                             │
│ [Transacción 39] - Descripción - $45.50 - 11/11/2024          │
│ [Transacción 40] - Descripción - $178.00 - 10/11/2024          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│ │Mostrar Menos│  │ Mostrar Más │  │ Mostrando  │             │
│ └─────────────┘  └─────────────┘  │ 40 de 40   │             │
│                                    │transacciones│             │
└─────────────────────────────────────────────────────────────────┘
```

## Vista Filtrada (Con Filtros Activos)

```
┌─────────────────────────────────────────────────────────────────┐
│                    HISTORIAL DE TRANSACCIONES (40)              │
│                    [Filtros: Tipo = Gastos]                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [Gasto 1] - Descripción - $100.00 - 15/12/2024                │
│ [Gasto 2] - Descripción - $250.00 - 14/12/2024                │
│ [Gasto 3] - Descripción - $75.50  - 13/12/2024                │
│ [Gasto 4] - Descripción - $45.00 - 01/12/2024                 │
│ [Gasto 5] - Descripción - $120.00 - 30/11/2024                │
│ [Gasto 6] - Descripción - $89.99 - 29/11/2024                 │
│ [Gasto 7] - Descripción - $156.00 - 28/11/2024                │
│ [Gasto 8] - Descripción - $67.50 - 27/11/2024                 │
│ [Gasto 9] - Descripción - $234.00 - 26/11/2024                │
│ [Gasto 10] - Descripción - $89.00 - 25/11/2024                │
│ [Gasto 11] - Descripción - $45.50 - 11/11/2024                │
│ [Gasto 12] - Descripción - $178.00 - 10/11/2024                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    [NO HAY BOTONES DE PAGINACIÓN]              │
│                    (Los filtros muestran todos los resultados) │
└─────────────────────────────────────────────────────────────────┘
```

## Estados de los Botones

### Botón "Mostrar Más"
- **Visible**: Solo en vista por defecto cuando `visibleTransactions.length < totalCountFromServer`
- **Estado**: Normal o Loading (con spinner)
- **Acción**: Carga siguiente lote de 20 transacciones
- **Posición**: Centro-derecha de la sección de paginación

### Botón "Mostrar Menos"
- **Visible**: Solo en vista por defecto cuando `visibleTransactions.length > 20`
- **Estado**: Normal (outline)
- **Acción**: Vuelve a mostrar solo las primeras 20 transacciones
- **Posición**: Centro-izquierda de la sección de paginación

### Información de Paginación
- **Visible**: Solo en vista por defecto
- **Formato**: "Mostrando X de Y transacciones"
- **Posición**: Centro de la sección de paginación

## Comportamiento Responsivo

### Desktop (lg+)
```
┌─────────────────────────────────────────────────────────────────┐
│ [Mostrar Menos]  [Mostrando 40 de 40 transacciones]  [Mostrar Más] │
└─────────────────────────────────────────────────────────────────┘
```

### Tablet (md)
```
┌─────────────────────────────────────────────────────────────────┐
│                    [Mostrar Menos]                              │
│                    [Mostrando 40 de 40 transacciones]          │
│                    [Mostrar Más]                                │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile (sm-)
```
┌─────────────────────────────────────────────────────────────────┐
│                    [Mostrar Menos]                              │
│                    [Mostrar Más]                                │
│                    Mostrando 40 de 40 transacciones            │
└─────────────────────────────────────────────────────────────────┘
```

## Transiciones y Animaciones

### Aparición de Botones
- **Mostrar Más**: Aparece con fade-in cuando se cargan las primeras 20
- **Mostrar Menos**: Aparece con slide-down cuando se expande más allá de 20
- **Información**: Aparece con fade-in en la carga inicial

### Estados de Loading
- **Mostrar Más**: Muestra spinner y texto "Cargando..." mientras se cargan más transacciones
- **Botón deshabilitado**: Se deshabilita durante la carga para evitar clics múltiples

### Transiciones de Lista
- **Nuevas transacciones**: Aparecen con motion de framer-motion (opacity + y)
- **Transacciones existentes**: Mantienen su posición y estado
