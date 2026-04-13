const products = [
    {
      id: 'P001',
      name: 'OPC Cement 53 Grade',
      category: 'Cement',
      unit: 'bag',
      gst_percentage: 28,
      base_price: 351.56,
      selling_price: 450,
      variants: [
        { type: 'brand', value: 'Ultratech' },
        { type: 'brand', value: 'Ambuja' }
      ]
    },
    {
      id: 'P002',
      name: 'TMT Steel Bar',
      category: 'Steel',
      unit: 'kg',
      gst_percentage: 18,
      base_price: 67.80,
      selling_price: 80,
      variants: [
        { type: 'size', value: '8mm' },
        { type: 'size', value: '10mm' },
        { type: 'size', value: '12mm' }
      ]
    },
    {
      id: 'P003',
      name: 'Red Clay Brick',
      category: 'Bricks',
      unit: 'nos',
      gst_percentage: 5,
      base_price: 7.62,
      selling_price: 8,
      variants: [
        { type: 'type', value: 'Standard' },
        { type: 'type', value: 'Heavy Duty' }
      ]
    },
    {
      id: 'P004',
      name: 'River Sand',
      category: 'Sand',
      unit: 'cft',
      gst_percentage: 5,
      base_price: 47.62,
      selling_price: 50,
      variants: []
    },
    {
      id: 'P005',
      name: '20mm Aggregate',
      category: 'Aggregate',
      unit: 'cft',
      gst_percentage: 5,
      base_price: 38.10,
      selling_price: 40,
      variants: [
        { type: 'size', value: '10mm' },
        { type: 'size', value: '20mm' },
        { type: 'size', value: '40mm' }
      ]
    }
  ];
  
  module.exports = products;