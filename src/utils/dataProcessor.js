
/**
 * Data Transformation Utility
 * Supports both Code mode (JavaScript) and Visual mode (Low-code) configuration
 */
export const processData = (rawData, transformationConfig, componentInfo) => {
  if (!transformationConfig || !transformationConfig.enable) {
    return rawData
  }

  const { mode, code, visualConfig } = transformationConfig

  try {
    // Visual Mode
    if (mode === 'visual' && visualConfig) {
      let result = rawData

      // 0. Extract Data from Path (NEW)
      if (visualConfig.dataPath) {
        const path = visualConfig.dataPath.split('.')
        for (const key of path) {
          if (result && result[key] !== undefined) {
            result = result[key]
          } else {
            console.warn(`Data path ${visualConfig.dataPath} not found`)
            return []
          }
        }
      }

      if (!Array.isArray(result)) return result
      
      // Clone to avoid mutating original
      result = [...result]

      // 1. Rename
      if (visualConfig.rename && Object.keys(visualConfig.rename).length > 0) {
        result = result.map(item => {
          const newItem = { ...item }
          Object.keys(visualConfig.rename).forEach(key => {
            if (newItem[key] !== undefined) {
              newItem[visualConfig.rename[key]] = newItem[key]
              delete newItem[key]
            }
          })
          return newItem
        })
      }

      // 2. Filter
      if (visualConfig.filters && visualConfig.filters.length > 0) {
        result = result.filter(item => {
          return visualConfig.filters.every(filter => {
            if (!filter.field) return true
            const val = item[filter.field]
            const target = isNaN(Number(filter.value)) ? filter.value : Number(filter.value)
            
            switch (filter.operator) {
              case '==': return val == target
              case '!=': return val != target
              case '>': return Number(val) > target
              case '<': return Number(val) < target
              case 'includes': return String(val).includes(String(target))
              default: return true
            }
          })
        })
      }

      // 3. Calculation
      if (visualConfig.calculations && visualConfig.calculations.length > 0) {
        result = result.map(item => {
          const newItem = { ...item }
          visualConfig.calculations.forEach(calc => {
            if (calc.targetField && calc.expression) {
              try {
                // Use 'with' to allow direct field access
                const fn = new Function('item', `with(item) { return ${calc.expression} }`)
                newItem[calc.targetField] = fn(item)
              } catch (e) {
                // Fallback to item.field syntax if with fails or simple eval
                try {
                   const fn = new Function('item', `return ${calc.expression}`)
                   newItem[calc.targetField] = fn(item)
                } catch (e2) {
                   console.warn('Calculation failed', e)
                   newItem[calc.targetField] = null
                }
              }
            }
          })
          return newItem
        })
      }

      // 4. Aggregation
      if (visualConfig.aggregation && visualConfig.aggregation.enable) {
        const groupBy = visualConfig.aggregation.groupBy || []
        const metrics = visualConfig.aggregation.metrics || []
        
        if (groupBy.length > 0) {
          const groups = {}
          result.forEach(item => {
            const key = groupBy.map(k => item[k]).join('::')
            if (!groups[key]) groups[key] = []
            groups[key].push(item)
          })
          
          result = Object.keys(groups).map(key => {
            const groupItems = groups[key]
            const representative = groupItems[0]
            const resItem = {}
            
            groupBy.forEach(k => resItem[k] = representative[k])
            
            metrics.forEach(m => {
               if (!m.field) return
               const values = groupItems.map(i => Number(i[m.field]) || 0)
               let val = 0
               switch (m.type) {
                 case 'sum': val = values.reduce((a, b) => a + b, 0); break
                 case 'count': val = values.length; break
                 case 'avg': val = values.reduce((a, b) => a + b, 0) / values.length; break
                 case 'max': val = Math.max(...values); break
                 case 'min': val = Math.min(...values); break
               }
               resItem[m.alias || `${m.field}_${m.type}`] = val
            })
            
            return resItem
          })
        }
      }

      // 5. Mapping
      if (visualConfig.mapping) {
        const { mode, dimension, measure, nameField, valueField } = visualConfig.mapping
        
        // Determine chart type from component info
        let seriesType = 'bar' // default
        if (componentInfo) {
          if (componentInfo.key === 'line-chart') seriesType = 'line'
          else if (componentInfo.key === 'bar-chart') seriesType = 'bar'
          else if (componentInfo.key === 'pie-chart') seriesType = 'pie'
          else if (componentInfo.key === 'radar-chart') seriesType = 'radar'
          else if (componentInfo.key === 'scatter-chart') seriesType = 'scatter'
          else if (componentInfo.key === 'funnel-chart') seriesType = 'funnel'
          else if (componentInfo.key === 'gauge-chart') seriesType = 'gauge'
        }
        
        // Mode 1: Axis (Bar/Line)
        if (mode === 'axis' && dimension && measure) {
          const xData = result.map(item => item[dimension])
          const seriesData = result.map(item => item[measure])
          
          return {
            xAxis: {
              data: xData
            },
            series: [
              {
                data: seriesData,
                type: seriesType 
              }
            ]
          }
        }
        
        // Mode 2: Item (Pie/Scatter/Funnel)
        if (mode === 'item' && nameField && valueField) {
           const seriesData = result.map(item => ({
             name: item[nameField],
             value: Number(item[valueField]) || 0
           }))
           
           return {
             series: [
               {
                 data: seriesData,
                 type: seriesType
               }
             ]
           }
        }
      }

      return result
    } 
    
    // Default: Code Mode
    // Create a function from string. Safety warning: eval/Function is dangerous in prod with untrusted input.
    const fn = new Function('data', code || 'return data')
    const result = fn(rawData)
    
    if (result === undefined) {
       throw new Error('Transformation script returned undefined. Did you forget the "return" statement?')
    }
    return result
  } catch (err) {
    throw new Error(err.message)
  }
}
