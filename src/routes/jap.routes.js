import { Router } from 'express';
import { jap } from '../services/jap.client.js';
import Cart from '../models/Cart.js';

const router = Router();


// ⚠️ SÓ USA QUANDO QUISERES CRIAR ENCOMENDA
router.post('/order', async (req, res, next) => {
  try {
    const { service, link, quantity } = req.body; // service = ID numérico da lista
    const data = await jap('add', { service, link, quantity });
    res.json(data); // { order: 123456 } ou erro do fornecedor
  } catch (e) { next(e); }
});

// consultar status de uma encomenda
router.post('/status', async (req, res, next) => {
  try {
    const { order } = req.body;
    const data = await jap('status', { order });
    res.json(data); // { charge: "...", start_count: "...", status: "...", remains: "..." }
  } catch (e) { next(e); }
});

// (opcional) multi-status
router.post('/orders-status', async (req, res, next) => {
  try {
    const { orders } = req.body; // ex: "123,124,125"
    const data = await jap('status', { orders });
    res.json(data); // mapa de orderId -> status, se o fornecedor suportar
  } catch (e) { next(e); }
});


export default router;