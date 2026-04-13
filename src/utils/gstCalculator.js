const calculateGST = (selling_price, gst_percentage) => {
  const gst_multiplier = 1 + gst_percentage / 100;
  const base_price = selling_price / gst_multiplier;
  const gst_amount = selling_price - base_price;
  return {
    selling_price: parseFloat(selling_price.toFixed(2)),
    base_price: parseFloat(base_price.toFixed(2)),
    gst_percentage,
    gst_amount: parseFloat(gst_amount.toFixed(2))
  };
};

const calculateOrderGST = (items) => {
  let subtotal = 0;
  let total_gst = 0;
  const itemsWithGST = items.map((item) => {
    const gst = calculateGST(item.selling_price, item.gst_percentage);
    const item_subtotal = gst.selling_price * item.quantity;
    const item_gst = gst.gst_amount * item.quantity;
    subtotal += item_subtotal;
    total_gst += item_gst;
    return { ...item, ...gst, quantity: item.quantity,
      item_subtotal: parseFloat(item_subtotal.toFixed(2)),
      item_gst: parseFloat(item_gst.toFixed(2)) };
  });
  return { items: itemsWithGST,
    subtotal: parseFloat(subtotal.toFixed(2)),
    total_gst: parseFloat(total_gst.toFixed(2)),
    final_total: parseFloat(subtotal.toFixed(2)) };
};

const calculateItemPrice = (product, quantity) => {
  const subtotal = parseFloat((product.selling_price * quantity).toFixed(2));
  const gstAmount = parseFloat((subtotal * product.gst_percentage / 100).toFixed(2));
  const totalWithGST = parseFloat((subtotal + gstAmount).toFixed(2));
  return { subtotal, gstAmount, totalWithGST };
};

module.exports = { calculateGST, calculateOrderGST, calculateItemPrice };
