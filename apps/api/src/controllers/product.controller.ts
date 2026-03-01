// apps/api/src/controllers/product.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@financial-crm/database';
import { z } from 'zod';

const prisma = new PrismaClient();

// ════════════════════════════════════════════
// VALIDATION SCHEMAS
// ════════════════════════════════════════════

const productFieldSchema = z.object({
    fieldName: z.string().min(1),
    fieldLabel: z.string().min(1),
    fieldType: z.enum(['text', 'number', 'date', 'currency', 'select', 'textarea', 'checkbox', 'email', 'phone']),
    isRequired: z.boolean().default(false),
    displayOrder: z.number().int().min(0).default(0),
    fieldSection: z.string().optional(),
    validationRules: z.record(z.any()).optional(),
    fieldOptions: z.array(z.any()).optional(),
    defaultValue: z.string().optional(),
    helpText: z.string().optional(),
    placeholder: z.string().optional(),
});

const createProductSchema = z.object({
    partnerId: z.string().uuid(),
    name: z.string().min(2),
    productType: z.string().min(2),
    description: z.string().optional(),
    minInitialAmount: z.number().optional(),
    maxInitialAmount: z.number().optional(),
    minPeriodicAmount: z.number().optional(),
    allowedFractionation: z.array(z.string()).default([]),
    consultingFeeAmount: z.number().min(0).default(0),
    allowFeeFinancing: z.boolean().default(false),
    maxFeeInstallments: z.number().int().min(1).max(12).optional(),
    commissionUpfrontPct: z.number().min(0).max(100).optional(),
    commissionRecurringPct: z.number().min(0).max(100).optional(),
    requiresMedicalQuestionnaire: z.boolean().default(false),
    requiresFinancialPlanning: z.boolean().default(false),
    fields: z.array(productFieldSchema).optional(),
});

const updateProductSchema = createProductSchema.partial().omit({ fields: true });

// ════════════════════════════════════════════
// @route   GET /api/products
// @desc    Get all products with filters
// @access  Private
// ════════════════════════════════════════════

export const getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { partnerId, productType, isActive } = req.query;

        const where: any = {};

        if (partnerId) where.partnerId = partnerId as string;
        if (productType) where.productType = productType as string;
        if (isActive !== undefined) where.isActive = isActive === 'true';

        const products = await prisma.product.findMany({
            where,
            include: {
                partner: {
                    select: {
                        id: true,
                        name: true,
                        partnerType: true,
                        logoUrl: true,
                    },
                },
                fields: {
                    orderBy: {
                        displayOrder: 'asc',
                    },
                },
            },
            orderBy: [
                { partner: { name: 'asc' } },
                { name: 'asc' },
            ],
        });

        res.json({
            success: true,
            data: { products },
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products',
        });
    }
};

// ════════════════════════════════════════════
// @route   GET /api/products/:id
// @desc    Get single product with all fields
// @access  Private
// ════════════════════════════════════════════

export const getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                partner: true,
                fields: {
                    orderBy: {
                        displayOrder: 'asc',
                    },
                },
            },
        });

        if (!product) {
            res.status(404).json({
                success: false,
                error: 'Product not found',
            });
            return;
        }

        res.json({
            success: true,
            data: { product },
        });
    } catch (error) {
        console.error('Get product by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch product',
        });
    }
};

// ════════════════════════════════════════════
// @route   POST /api/products
// @desc    Create new product with fields
// @access  Private (ADMIN only)
// ════════════════════════════════════════════

export const createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const validatedData = createProductSchema.parse(req.body);

        // Verify partner exists
        const partner = await prisma.partner.findUnique({
            where: { id: validatedData.partnerId },
        });

        if (!partner) {
            res.status(404).json({
                success: false,
                error: 'Partner not found',
            });
            return;
        }

        // Check for duplicate product name within same partner
        const existingProduct = await prisma.product.findFirst({
            where: {
                partnerId: validatedData.partnerId,
                name: validatedData.name,
            },
        });

        if (existingProduct) {
            res.status(409).json({
                success: false,
                error: 'Product with this name already exists for this partner',
            });
            return;
        }

        // Create product with fields in a transaction
        const product = await prisma.product.create({
            data: {
                partnerId: validatedData.partnerId,
                name: validatedData.name,
                productType: validatedData.productType,
                description: validatedData.description,
                minInitialAmount: validatedData.minInitialAmount,
                maxInitialAmount: validatedData.maxInitialAmount,
                minPeriodicAmount: validatedData.minPeriodicAmount,
                allowedFractionation: validatedData.allowedFractionation,
                consultingFeeAmount: validatedData.consultingFeeAmount,
                allowFeeFinancing: validatedData.allowFeeFinancing,
                maxFeeInstallments: validatedData.maxFeeInstallments,
                commissionUpfrontPct: validatedData.commissionUpfrontPct,
                commissionRecurringPct: validatedData.commissionRecurringPct,
                requiresMedicalQuestionnaire: validatedData.requiresMedicalQuestionnaire,
                requiresFinancialPlanning: validatedData.requiresFinancialPlanning,
                isActive: true,
                fields: validatedData.fields
                    ? {
                        create: validatedData.fields.map((field) => ({
                            fieldName: field.fieldName,
                            fieldLabel: field.fieldLabel,
                            fieldType: field.fieldType,
                            isRequired: field.isRequired,
                            displayOrder: field.displayOrder,
                            fieldSection: field.fieldSection,
                            validationRules: field.validationRules,
                            fieldOptions: field.fieldOptions,
                            defaultValue: field.defaultValue,
                            helpText: field.helpText,
                            placeholder: field.placeholder,
                        })),
                    }
                    : undefined,
            },
            include: {
                partner: true,
                fields: {
                    orderBy: {
                        displayOrder: 'asc',
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            data: { product },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
            return;
        }

        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create product',
        });
    }
};

// ════════════════════════════════════════════
// @route   PUT /api/products/:id
// @desc    Update product (without fields)
// @access  Private (ADMIN only)
// ════════════════════════════════════════════

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const existingProduct = await prisma.product.findUnique({
            where: { id },
        });

        if (!existingProduct) {
            res.status(404).json({
                success: false,
                error: 'Product not found',
            });
            return;
        }

        const validatedData = updateProductSchema.parse(req.body);

        // Check for duplicate name if name is changing
        if (validatedData.name && validatedData.name !== existingProduct.name) {
            const duplicateProduct = await prisma.product.findFirst({
                where: {
                    partnerId: existingProduct.partnerId,
                    name: validatedData.name,
                    id: { not: id },
                },
            });

            if (duplicateProduct) {
                res.status(409).json({
                    success: false,
                    error: 'Product with this name already exists for this partner',
                });
                return;
            }
        }

        const product = await prisma.product.update({
            where: { id },
            data: validatedData,
            include: {
                partner: true,
                fields: {
                    orderBy: {
                        displayOrder: 'asc',
                    },
                },
            },
        });

        res.json({
            success: true,
            data: { product },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
            return;
        }

        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update product',
        });
    }
};

// ════════════════════════════════════════════
// @route   POST /api/products/:id/fields
// @desc    Add field to product
// @access  Private (ADMIN only)
// ════════════════════════════════════════════

export const addProductField = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            res.status(404).json({
                success: false,
                error: 'Product not found',
            });
            return;
        }

        const validatedData = productFieldSchema.parse(req.body);

        const field = await prisma.productField.create({
            data: {
                productId: id,
                ...validatedData,
            },
        });

        res.status(201).json({
            success: true,
            data: { field },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
            return;
        }

        console.error('Add product field error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add field',
        });
    }
};

// ════════════════════════════════════════════
// @route   DELETE /api/products/:id
// @desc    Delete product (soft delete)
// @access  Private (ADMIN only)
// ════════════════════════════════════════════

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const existingProduct = await prisma.product.findUnique({
            where: { id },
        });

        if (!existingProduct) {
            res.status(404).json({
                success: false,
                error: 'Product not found',
            });
            return;
        }

        // Soft delete - mark as inactive
        await prisma.product.update({
            where: { id },
            data: { isActive: false },
        });

        res.json({
            success: true,
            message: 'Product deactivated successfully',
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete product',
        });
    }
};