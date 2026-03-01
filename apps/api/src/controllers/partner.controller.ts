// apps/api/src/controllers/partner.controller.ts

import { Request, Response } from 'express';
import { PrismaClient, PartnerType } from '@financial-crm/database';
import { z } from 'zod';

const prisma = new PrismaClient();

// ════════════════════════════════════════════
// VALIDATION SCHEMAS
// ════════════════════════════════════════════

const createPartnerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    partnerType: z.enum(['INSURANCE', 'BROKER', 'FUND']),
    logoUrl: z.string().url().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    apiAvailable: z.boolean().optional(),
});

const updatePartnerSchema = z.object({
    name: z.string().min(2).optional(),
    partnerType: z.enum(['INSURANCE', 'BROKER', 'FUND']).optional(),
    logoUrl: z.string().url().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    isActive: z.boolean().optional(),
    apiAvailable: z.boolean().optional(),
});

// ════════════════════════════════════════════
// @route   GET /api/partners
// @desc    Get all partners
// @access  Private (ADMIN only)
// ════════════════════════════════════════════

export const getPartners = async (req: Request, res: Response): Promise<void> => {
    try {
        const { isActive } = req.query;

        const where: any = {};
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        const partners = await prisma.partner.findMany({
            where,
            include: {
                products: {
                    select: {
                        id: true,
                        name: true,
                        productType: true,
                        isActive: true,
                    },
                },
                _count: {
                    select: {
                        products: true,
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });

        res.json({
            success: true,
            data: { partners },
        });
    } catch (error) {
        console.error('Get partners error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch partners',
        });
    }
};

// ════════════════════════════════════════════
// @route   GET /api/partners/:id
// @desc    Get single partner by ID
// @access  Private (ADMIN only)
// ════════════════════════════════════════════

export const getPartnerById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const partner = await prisma.partner.findUnique({
            where: { id },
            include: {
                products: {
                    include: {
                        fields: true,
                    },
                },
            },
        });

        if (!partner) {
            res.status(404).json({
                success: false,
                error: 'Partner not found',
            });
            return;
        }

        res.json({
            success: true,
            data: { partner },
        });
    } catch (error) {
        console.error('Get partner by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch partner',
        });
    }
};

// ════════════════════════════════════════════
// @route   POST /api/partners
// @desc    Create new partner
// @access  Private (ADMIN only)
// ════════════════════════════════════════════

export const createPartner = async (req: Request, res: Response): Promise<void> => {
    try {
        const validatedData = createPartnerSchema.parse(req.body);

        // Check if partner with this name already exists
        const existingPartner = await prisma.partner.findUnique({
            where: { name: validatedData.name },
        });

        if (existingPartner) {
            res.status(409).json({
                success: false,
                error: 'Partner with this name already exists',
            });
            return;
        }

        const partner = await prisma.partner.create({
            data: {
                name: validatedData.name,
                partnerType: validatedData.partnerType,
                logoUrl: validatedData.logoUrl,
                contactEmail: validatedData.contactEmail,
                contactPhone: validatedData.contactPhone,
                apiAvailable: validatedData.apiAvailable || false,
                isActive: true,
            },
        });

        res.status(201).json({
            success: true,
            data: { partner },
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

        console.error('Create partner error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create partner',
        });
    }
};

// ════════════════════════════════════════════
// @route   PUT /api/partners/:id
// @desc    Update partner
// @access  Private (ADMIN only)
// ════════════════════════════════════════════

export const updatePartner = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const existingPartner = await prisma.partner.findUnique({
            where: { id },
        });

        if (!existingPartner) {
            res.status(404).json({
                success: false,
                error: 'Partner not found',
            });
            return;
        }

        const validatedData = updatePartnerSchema.parse(req.body);

        // Check for name uniqueness if name is being changed
        if (validatedData.name && validatedData.name !== existingPartner.name) {
            const duplicatePartner = await prisma.partner.findUnique({
                where: { name: validatedData.name },
            });

            if (duplicatePartner) {
                res.status(409).json({
                    success: false,
                    error: 'Partner with this name already exists',
                });
                return;
            }
        }

        const partner = await prisma.partner.update({
            where: { id },
            data: validatedData,
        });

        res.json({
            success: true,
            data: { partner },
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

        console.error('Update partner error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update partner',
        });
    }
};

// ════════════════════════════════════════════
// @route   DELETE /api/partners/:id
// @desc    Delete partner (soft delete - mark as inactive)
// @access  Private (ADMIN only)
// ════════════════════════════════════════════

export const deletePartner = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const existingPartner = await prisma.partner.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        products: true,
                    },
                },
            },
        });

        if (!existingPartner) {
            res.status(404).json({
                success: false,
                error: 'Partner not found',
            });
            return;
        }

        // Check if partner has products
        if (existingPartner._count.products > 0) {
            // Soft delete - mark as inactive
            await prisma.partner.update({
                where: { id },
                data: { isActive: false },
            });

            res.json({
                success: true,
                message: 'Partner deactivated (has existing products)',
            });
            return;
        }

        // Hard delete if no products
        await prisma.partner.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Partner deleted successfully',
        });
    } catch (error) {
        console.error('Delete partner error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete partner',
        });
    }
};