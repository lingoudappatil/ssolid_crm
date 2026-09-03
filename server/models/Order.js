// server/models/Order.js
import mongoose from 'mongoose';
import Counter from './Counter.js';

const orderSchema = new mongoose.Schema({
  orderId: { type: Number, unique: true, index: true },
  name: { type: String, required: [true, 'Customer name is required'] },
  email: { type: String, required: [true, 'Email is required'] },
  phone: { type: String, required: [true, 'Phone is required'] },
  item: { type: String, required: [true, 'Item name is required'] },
  quantity: { type: Number, required: [true, 'Quantity is required'], min: [1, 'Minimum quantity is 1'] },
  amount: { type: Number, required: [true, 'Amount is required'], min: [0, 'Amount cannot be negative'] },
  createdAt: { type: Date, default: Date.now }
});

// Auto-increment orderId
orderSchema.pre('save', async function(next) {
  try {
    if (this.orderId == null) {
      const counter = await Counter.findOneAndUpdate(
        { id: 'orderId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.orderId = counter.seq;
    }
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model('Order', orderSchema);