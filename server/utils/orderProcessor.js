// server/utils/orderProcessor.js
import mongoose from 'mongoose';
import Order from '../models/Order.js';

// 🔹 MongoDB connection (for testing purpose)
mongoose
  .connect('mongodb://localhost:27017/orderdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

/**
 * Creates and processes a new order with calculations for subtotal, tax, discount, and total amount
 * @param {Object} orderData - The order information
 */
async function processOrder({
  name,
  email,
  phone,
  item,
  quantity,
  price,
  tax,
  discountPercent = 0,
  discountAmount = 0
}) {
  try {
    // ✅ Convert numeric fields
    quantity = Number(quantity);
    price = Number(price);
    tax = Number(tax);
    discountPercent = Number(discountPercent);
    discountAmount = Number(discountAmount);

    // ✅ Input validation
    if (!name || !email || !phone || !item || !quantity || !price || !tax) {
      throw new Error('Missing required parameters: name, email, phone, item, quantity, price, and tax are required');
    }

    if (quantity <= 0 || price <= 0 || tax < 0) {
      throw new Error('Invalid values: quantity and price must be positive, tax must be non-negative');
    }

    // ✅ Basic email and phone validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error('Invalid email format');

    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(phone)) throw new Error('Invalid phone number format');

    if (discountPercent < 0 || discountPercent > 100)
      throw new Error('Invalid discount percentage: must be between 0 and 100');
    if (discountAmount < 0)
      throw new Error('Invalid discount amount: must be non-negative');

    // ✅ Calculations
    const subtotal = quantity * price;
    const percentDiscount = (subtotal * discountPercent) / 100;
    const totalDiscount = percentDiscount + discountAmount;
    const amountAfterDiscount = subtotal - totalDiscount;
    const taxAmount = (amountAfterDiscount * tax) / 100;
    const totalAmount = amountAfterDiscount + taxAmount;

    // ✅ Prepare order details matching schema
    const orderDetails = {
      name,
      email,
      phone,
      item,
      quantity,
      amount: Number(totalAmount.toFixed(2))
    };

    console.log("🧩 Order details before saving:", orderDetails);

    // ✅ Save to MongoDB
    const newOrder = new Order(orderDetails);
    await newOrder.save();

    console.log('\n=== ✅ New Order Created ===');
    console.log('Customer:', name);
    console.log('Item:', item);
    console.log('Subtotal:', subtotal);
    console.log('Discount:', totalDiscount);
    console.log('Tax:', taxAmount);
    console.log('Final Amount:', totalAmount.toFixed(2));
    console.log('============================\n');

    return newOrder;
  } catch (error) {
    console.error('❌ Error processing order:', error.message);
    throw error;
  }
}

// ✅ Example test (run directly with: node orderprocess.js)
if (process.argv[1].includes('orderprocess.js')) {
  (async () => {
    try {
      const order = await processOrder({
        name: "John Doe",
        email: "john@example.com",
        phone: "1234567890",
        item: "Product Name",
        quantity: 5,
        price: 100,
        tax: 18,
        discountPercent: 10,
        discountAmount: 25
      });
      console.log("✅ Order processed successfully:", order);
      mongoose.connection.close();
    } catch (err) {
      console.error("❌ Test failed:", err.message);
      mongoose.connection.close();
    }
  })();
}

export default processOrder;
