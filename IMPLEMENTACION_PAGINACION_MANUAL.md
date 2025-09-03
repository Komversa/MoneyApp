# Implementación de Paginación Manual para Historial de Transacciones

## Resumen de la Solución

Se ha implementado un sistema de paginación manual y reversible para la vista por defecto del historial de transacciones, manteniendo intacto el funcionamiento de los filtros existentes.

## Lógica de Vistas

### Vista por Defecto (Sin Filtros)
- **Carga inicial**: Solo las primeras 20 transacciones
- **Paginación manual**: Botones "Mostrar más" y "Mostrar menos"
- **Estado**: `isDefaultView = true`
- **Transacciones visibles**: `visibleTransactions` (array que se renderiza)
- **Transacciones totales**: `allFetchedTransactions` (array que almacena todas las cargadas)

### Vista Filtrada (Con Filtros Activos)
- **Carga completa**: Todas las transacciones que coincidan con el filtro
- **Sin paginación**: Los botones de paginación desaparecen
- **Estado**: `isDefaultView = false`
- **Transacciones visibles**: `transacciones` (array del filtro)

## Flujo de Funcionamiento

### 1. Carga Inicial
```
Usuario entra a la página → isDefaultView = true → Carga primeras 20 transacciones
```

### 2. Aplicar Filtros
```
Usuario aplica filtros → isDefaultView = false → Botones desaparecen → Muestra todas las coincidencias
```

### 3. Limpiar Filtros
```
Usuario limpia filtros → isDefaultView = true → Vuelve a mostrar primeras 20 → Botones reaparecen
```

### 4. Mostrar Más (Vista por Defecto)
```
Usuario hace clic en "Mostrar más" → Carga siguiente lote de 20 → Concatena a visibleTransactions
```

### 5. Mostrar Menos (Vista por Defecto)
```
Usuario hace clic en "Mostrar menos" → Resetea a primeras 20 → No hace llamada a API
```

## Estados del Componente

```javascript
// Estados para paginación manual (vista por defecto)
const [allFetchedTransactions, setAllFetchedTransactions] = useState([])
const [visibleTransactions, setVisibleTransactions] = useState([])
const [currentPage, setCurrentPage] = useState(1)
const [totalCountFromServer, setTotalCountFromServer] = useState(0)
const [isDefaultView, setIsDefaultView] = useState(true)
```

## Funciones Clave

### `handleShowMore()`
- Incrementa `currentPage`
- Llama a la API con `limit=20` y `offset` calculado
- Concatena nuevos resultados a `allFetchedTransactions` y `visibleTransactions`

### `handleShowLess()`
- Resetea `currentPage` a 1
- Actualiza `visibleTransactions` con slice de los primeros 20 de `allFetchedTransactions`
- No hace llamada a la API

### `aplicarFiltros()`
- Detecta si hay filtros activos
- Cambia `isDefaultView` a `false` si hay filtros
- Llama a la API con filtros aplicados

### `limpiarFiltros()`
- Resetea todos los filtros
- Cambia `isDefaultView` a `true`
- Vuelve a cargar primeras 20 transacciones

## Renderizado Condicional

### Botones de Paginación
```jsx
{/* Solo se muestran en vista por defecto */}
{isDefaultView && (
  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
    {/* Botón "Mostrar menos" - solo cuando hay más de 20 */}
    {visibleTransactions.length > 20 && (
      <button onClick={handleShowLess}>Mostrar Menos</button>
    )}
    
    {/* Botón "Mostrar más" - solo cuando hay más disponibles */}
    {visibleTransactions.length < totalCountFromServer && (
      <button onClick={handleShowMore}>Mostrar Más</button>
    )}
  </div>
)}
```

### Transacciones a Renderizar
```jsx
{/* Usa visibleTransactions en vista por defecto, transacciones en vista filtrada */}
{(isDefaultView ? visibleTransactions : transacciones)
  .filter(/* filtro de búsqueda */)
  .map(/* renderizado */)}
```

## Ventajas de la Implementación

1. **Separación clara**: Vista por defecto y vista filtrada funcionan independientemente
2. **Eficiencia**: Solo carga 20 transacciones inicialmente
3. **Reversibilidad**: "Mostrar menos" no requiere llamada a API
4. **Persistencia**: El conteo total siempre muestra el número real del servidor
5. **UX consistente**: Los filtros funcionan exactamente igual que antes

## Consideraciones Técnicas

- **Backend**: Modificado para devolver `totalItems` en la respuesta
- **Frontend**: Hook modificado para manejar estados duales
- **API**: Mantiene compatibilidad con paginación existente
- **Performance**: Evita cargar todas las transacciones en vista por defecto
