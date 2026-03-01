// apps/api/src/routes/partner.routes.ts

import { Router } from 'express';
import {
    getPartners,
    getPartnerById,
    createPartner,
    updatePartner,
    deletePartner,
} from '../controllers/partner.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN')); // Only admins can manage partners

router.get('/', getPartners);
router.get('/:id', getPartnerById);
router.post('/', createPartner);
router.put('/:id', updatePartner);
router.delete('/:id', deletePartner);

export default router;