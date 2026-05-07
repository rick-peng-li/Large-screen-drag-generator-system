// Mock data generator based on component type and specific key

// Generate RAW data (API-like list) for transformation testing
export function generateRawMockData(componentOrType) {
  const component = typeof componentOrType === 'object' ? componentOrType : {}
  const key = component.key || ''
  
  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
  
  // Charts: Return a list of objects
  if (key.includes('chart')) {
    const categories = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return categories.map(day => ({
      date: day,
      category: 'Electronics',
      value: randomInt(10, 300),
      sales: randomInt(1000, 5000),
      profit: randomInt(100, 1000)
    }))
  }
  
  // Text/Widgets: Return a simple object
  return {
    title: 'Test Data',
    count: randomInt(100, 999),
    status: 'Active',
    updatedAt: new Date().toISOString()
  }
}

export function generateMockData(componentOrType) {
  const timestamp = new Date().toLocaleTimeString()
  
  // Handle both string (type) and object (component instance) inputs
  const type = typeof componentOrType === 'string' ? componentOrType : componentOrType?.type
  const component = typeof componentOrType === 'object' ? componentOrType : {}
  const key = component.key || ''
  
  // Helper to generate random integers
  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
  
  // Helper to generate random series data
  const randomSeriesData = (length, min = 10, max = 300) => 
    Array.from({ length }, () => randomInt(min, max))

  // 1. Specific Component Key Handling
  switch (key) {
    case 'line-chart':
    case 'bar-chart': {
      // Try to preserve existing categories if available
      const existingCategories = component.option?.xAxis?.data || 
                                 component.option?.xAxis?.[0]?.data || 
                                 ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      
      const seriesCount = component.option?.series?.length || 1
      
      return {
        xAxis: {
          data: existingCategories
        },
        series: Array.from({ length: seriesCount }, (_, i) => ({
          name: component.option?.series?.[i]?.name || `Series ${i+1}`,
          type: key === 'line-chart' ? 'line' : 'bar',
          data: randomSeriesData(existingCategories.length)
        }))
      }
    }

    case 'pie-chart':
    case 'funnel-chart': {
      // Try to preserve existing item names
      const existingData = component.option?.series?.[0]?.data || [
        { name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }, { name: 'E' }
      ]
      
      return {
        series: [
          {
            type: key === 'pie-chart' ? 'pie' : 'funnel',
            data: existingData.map(item => ({
              name: item.name,
              value: randomInt(50, 1000)
            }))
          }
        ]
      }
    }

    case 'radar-chart': {
      const indicators = component.option?.radar?.indicator || 
                         component.option?.radar?.[0]?.indicator || 
                         [{ name: 'A', max: 100 }, { name: 'B', max: 100 }, { name: 'C', max: 100 }, { name: 'D', max: 100 }, { name: 'E', max: 100 }]
      
      return {
        series: [
          {
            type: 'radar',
            data: [
              {
                value: indicators.map(ind => randomInt(0, ind.max || 100)),
                name: 'Allocated Budget' // Or keep existing name if accessible
              }
            ]
          }
        ]
      }
    }

    case 'scatter-chart': {
      return {
        series: [
          {
            type: 'scatter',
            data: Array.from({ length: 20 }, () => [
              randomInt(0, 50), // X
              randomInt(0, 50)  // Y
            ])
          }
        ]
      }
    }

    case 'gauge-chart': {
      return {
        series: [
          {
            type: 'gauge',
            data: [
              { value: randomInt(0, 100), name: 'Score' }
            ]
          }
        ]
      }
    }
    
    case 'china-map': {
      // Map data typically requires name/value pairs for regions
      // Since we don't know exact regions without map JSON, we generate generic ones or return empty if unsafe
      // Assuming standard China provinces for demo
      const provinces = ['Beijing', 'Shanghai', 'Guangdong', 'Zhejiang', 'Henan']
      return {
        series: [
          {
            type: 'map',
            data: provinces.map(p => ({ name: p, value: randomInt(0, 1000) }))
          }
        ]
      }
    }

    case 'text-component':
      return {
        content: `Updated Text ${timestamp}`,
        value: randomInt(0, 1000)
      }

    case 'digital-flop':
      return {
        content: new Intl.NumberFormat().format(randomInt(1000, 99999)),
        value: randomInt(1000, 99999)
      }
      
    case 'widget-button':
      return {
        content: `Clicked ${randomInt(1, 100)}`,
        type: ['primary', 'success', 'warning', 'danger'][randomInt(0, 3)]
      }
      
    case 'widget-input':
      return {
        value: `Input Mock ${randomInt(1, 100)}`
      }
      
    case 'widget-date':
      return {
        value: new Date().toISOString()
      }
  }

  // 2. Fallback based on generic Type (if Key not matched or empty)
  switch (type) {
    case 'chart':
      // Generic chart fallback
      return {
        xAxis: { data: ['A', 'B', 'C', 'D', 'E'] },
        series: [{ type: 'bar', data: randomSeriesData(5) }]
      }
    
    case 'text':
      return { content: `Mock Text (${timestamp})` }
      
    case 'widget':
      return { value: randomInt(0, 100) }
      
    default:
      return {
        message: 'Generic Mock Data',
        timestamp,
        random: Math.random()
      }
  }
}
