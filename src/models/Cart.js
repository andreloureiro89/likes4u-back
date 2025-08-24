import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
  serviceId: { type: Number, required: true },
  quantity:  { type: Number, required: true },
  link:      { type: String, required: true, trim: true },
  comments:  { type: [String], default: [] },
  orderId:   { type: String, required: true }
}, { _id: false });

const CartSchema = new mongoose.Schema({
  // usa um UUID gerado pelo servidor como _id (string)
  _id:        { type: String, required: true },
  status:     { type: String, enum: ['draft','submitted'], default: 'draft' },
  items:      { type: [ItemSchema], default: [] },
  totals: {
    subtotal: { type: Number, default: 0 },
    currency: { type: String, default: 'EUR' },
    breakdown:{ type: [{ serviceId: Number, lineTotal: Number }], default: [] }
  },
  createdAt:  { type: Date, default: () => new Date() },
  // TTL index: apaga sozinho quando chegar esta data
  expiresAt:  { type: Date, required: true },
}, { versionKey: false });

// TTL: assim que "expiresAt" é atingido, o Mongo apaga o doc
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Cart', CartSchema);