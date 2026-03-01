// apps/api/src/routes/product.routes.ts

import { Router } from 'express';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    addProductField,
    deleteProduct,
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// All users can view products
router.get('/', getProducts);
router.get('/:id', getProductById);

// Only admins can manage products
router.post('/', authorize('ADMIN'), createProduct);
router.put('/:id', authorize('ADMIN'), updateProduct);
router.post('/:id/fields', authorize('ADMIN'), addProductField);
router.delete('/:id', authorize('ADMIN'), deleteProduct);

export default router;