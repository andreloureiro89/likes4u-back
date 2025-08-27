import { Router } from 'express';
import Cart from '../models/Cart.js';

const router = Router();

// POST /cart  (front envia { cartId, order })
router.post('/', async (req, res) => {
  const { cartId, order } = req.body;
  if (!cartId || !order) {
    return res.status(400).json({ error: 'cartId e order são obrigatórios' });
  }

  const now = new Date();
  const TTL_MS = 24 * 60 * 60 * 1000;      // 24h
  const newExpiry = new Date(now.getTime() + TTL_MS);
  const amount = Number(order.total) || 0;

  try {
    // 1) cria se não existir (apenas $setOnInsert)
    await Cart.updateOne(
      { _id: cartId },
      {
        $setOnInsert: {
          _id: cartId,
          createdAt: now,
          expiresAt: newExpiry,
          orderList: [],
          totalCart: 0,
        },
      },
      { upsert: true }
    );

    // 2) acrescenta item e atualiza subtotal/TTL (SEM $setOnInsert aqui)
    await Cart.updateOne(
      { _id: cartId },
      {
        $push: { orderList: order },
        $inc:  { totalCart: amount },
        $max:  { expiresAt: newExpiry },
      }
    );

    const doc = await Cart.findById(cartId).lean();
    return res.status(201).json({
      cartId,
      totalCart: doc.totalCart,
      itemsCount: doc.orderList.length,
      expiresAt: doc.expiresAt,
    });
  } catch (err) {
    console.error('Erro ao criar/atualizar cart:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});


// GET /cart/:id  (vai buscar um cart pelo cartId)
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const cart = await Cart.findById(id).lean(); // lean() devolve objeto "simples", não mongoose doc
    if (!cart) {
      return res.status(404).json({ error: 'Carrinho não encontrado' });
    }

    return res.json(cart);
  } catch (err) {
    console.error('Erro ao buscar cart:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// MÉTODO de domínio (usa o model Cart)
async function addServiceToCart(cartId, order) {
  const amount = Number(order?.total) || 0;

  // adiciona item e atualiza o totalCart
  return await Cart.findOneAndUpdate(
    { _id: cartId },
    {
      $push: { orderList: order },
      $inc:  { totalCart: amount }
    },
    { new: true } // devolve o doc atualizado
  ).lean();
}

// ROTA para consumir no front
router.post('/:cartId/items', async (req, res) => {
  try {
    const { cartId } = req.params;
    const order = req.body;

    const doc = await addServiceToCart(cartId, order);
    if (!doc) return res.status(404).json({ error: 'Cart não encontrado' });

    res.json({
      cartId: doc._id,
      itemsCount: doc.orderList.length,
      totalCart: doc.totalCart,
      orderAdded: order
    });
  } catch (err) {
    console.error('Erro a adicionar serviço ao cart:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// DELETE /api/cart/:cartId/:orderId
router.delete('/:cartId/:orderId', async (req, res) => {
  try {
    const { cartId, orderId } = req.params;

    const cart = await Cart.findByIdAndUpdate(
      cartId,
      { $pull: { orderList: { id: orderId } } },
      { new: true }
    );
    if (!cart) return res.status(404).json({ error: 'Carrinho não encontrado' });

    cart.totalCart = cart.orderList.reduce((acc, item) => acc + Number(item.total || 0), 0);
    await cart.save();

    return res.json({ success: true, cart });
  } catch (err) {
    console.error('Erro ao remover serviço:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// DELETE /api/cart/:cartId -> apaga o carrinho inteiro
router.delete('/:cartId', async (req, res) => {
  try {
    const { cartId } = req.params;

    const result = await Cart.findByIdAndDelete(cartId);

    if (!result) {
      return res.status(404).json({ error: 'Carrinho não encontrado' });
    }

    return res.json({ success: true, message: 'Carrinho removido com sucesso' });
  } catch (err) {
    console.error('Erro ao apagar carrinho:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});


export default router;