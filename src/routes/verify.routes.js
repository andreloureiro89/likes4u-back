import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { validateSocialUrl } from '../utils/url-validators.js';

const router = Router();

router.post(
  '/validate-url',
  [body('url').isString().isURL({ require_protocol: true })],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ valid: false, errors: errors.array() });
    }

    const { url } = req.body;
    const result = validateSocialUrl(url);
    return res.json(result);
  }
);

export default router;