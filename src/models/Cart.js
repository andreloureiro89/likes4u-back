import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  id:        { type: String, required: true },  // uuid do front
  categoria: { type: String },
  comments:  { type: [String], default: [] },
  link:      { type: String, required: true, trim: true },
  quantity:  { type: Number, required: true },
  service:   { type: String },
  total:     { type: Number, required: true },
}, { _id: false });

const CartSchema = new mongoose.Schema({
  _id:        { type: String, required: true },       // cartId (ex.: c_xxx)
  orderList:  { type: [OrderItemSchema], default: [] },
  totalCart:  { type: Number, default: 0 },
  createdAt:  { type: Date, default: () => new Date() },
  expiresAt:  { type: Date, required: true },
}, { versionKey: false });

// TTL: apaga quando chegar a expiresAt
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Cart', CartSchema);