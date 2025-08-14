import { Router } from 'express';
import { jap } from '../services/jap.client.js';

const router = Router();

// ✅ NÃO gasta saldo
router.get('/balance', async (_req, res, next) => {
  try {
    const data = await jap('balance');
    res.json(data); // { balance: "123.45", currency: "USD" }
  } catch (e) { next(e); }
});

// ✅ NÃO gasta saldo
router.get('/services', async (_req, res, next) => {
  try {
    const data = await jap('services');
    res.json(data); // array de serviços
  } catch (e) { next(e); }
});

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

// pedir refill de uma ordem
router.post('/refill', async (req, res, next) => {
  try {
    const { order } = req.body;
    const data = await jap('refill', { order });
    res.json(data); // { refill: <id> } ou erro do fornecedor
  } catch (e) { next(e); }
});

// estado de um refill
router.post('/refill-status', async (req, res, next) => {
  try {
    const { refill } = req.body;
    const data = await jap('refill_status', { refill });
    res.json(data); // { status: 'Completed' | 'In progress' | ... }
  } catch (e) { next(e); }
});

// lista de refills de uma ordem
router.post('/refills', async (req, res, next) => {
  try {
    const { order } = req.body;
    const data = await jap('refills', { order });
    res.json(data); // array com histórico dos refills
  } catch (e) { next(e); }
});

// cancelar uma ordem
router.post('/cancel', async (req, res, next) => {
  try {
    const { order } = req.body;
    const data = await jap('cancel', { order });
    res.json(data); // { success: true/false } ou mensagem do fornecedor
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