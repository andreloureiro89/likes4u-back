import { Router } from 'express';
import Cart from '../models/Cart.js';

const router = Router();

// POST /cart  (front envia { cartId, order })
router.post('/', async (req, res) => {
  const { cartId, order } = req.body;
  if (!cartId || !order) return res.status(400).json({ error: 'cartId e order são obrigatórios' });

  const now = new Date();
  const TTL_MS = 24 * 60 * 60 * 1000;
  const expiresAt = new Date(now.getTime() + TTL_MS);
  const amount = Number(order.total) || 0;

  try {
    // 1) upsert só para criar o cart (NÃO mexe no subtotal aqui)
    await Cart.updateOne(
      { _id: cartId },
      {
        $setOnInsert: {
          createdAt: now,
          'totals.currency': 'EUR',
          'totals.breakdown': []
        },
        $max: { expiresAt } // renova validade se for maior
      },
      { upsert: true }
    );

    // 2) acrescenta o item e atualiza o subtotal
    const result = await Cart.findOneAndUpdate(
      { _id: cartId },
      {
        $push: { items: order },
        $inc: { 'totals.subtotal': amount }
      },
      { new: true }
    );

    return res.status(201).json({ cartId, totals: result.totals, itemsCount: result.items.length });
  } catch (err) {
    console.error('Erro ao criar/atualizar cart:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});


export default router;