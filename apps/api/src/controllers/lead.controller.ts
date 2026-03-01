// apps/api/src/controllers/lead.controller.ts

import { Request, Response } from 'express';
import { PrismaClient, LeadStage, LeadSource, LeadPriority } from '@financial-crm/database';
import { z } from 'zod';

const prisma = new PrismaClient();

// ════════════════════════════════════════════
// VALIDATION SCHEMAS
// ════════════════════════════════════════════

const createLeadSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    phone: z.string().optional(),
    source: z.enum(['WEB', 'REFERRAL', 'LINKEDIN', 'EVENT', 'COLD_CALL', 'OTHER']),
    notes: z.string().optional(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
});

const updateLeadSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    source: z.enum(['WEB', 'REFERRAL', 'LINKEDIN', 'EVENT', 'COLD_CALL', 'OTHER']).optional(),
    stage: z.enum(['NEW', 'CONTACTED', 'MEETING_SCHEDULED', 'PROPOSAL_SENT', 'WON', 'LOST', 'NURTURE']).optional(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
    notes: z.string().optional(),
});

// ════════════════════════════════════════════
// LEAD SCORING LOGIC
// ════════════════════════════════════════════

const calculateLeadScore = (source: LeadSource, daysOld: number): number => {
    let score = 5; // Base score

    // Source scoring
    switch (source) {
        case 'REFERRAL':
            score += 4;
            break;
        case 'WEB':
            score += 2;
            break;
        case 'LINKEDIN':
            score += 3;
            break;
        case 'EVENT':
            score += 3;
            break;
        case 'COLD_CALL':
            score += 1;
            break;
        default:
            score += 1;
    }

    // Recency scoring (newer = higher score)
    if (daysOld <= 1) {
        score += 3;
    } else if (daysOld <= 7) {
        score += 2;
    } else if (daysOld <= 30) {
        score += 1;
    } else {
        score -= 1;
    }

    // Keep score in range 0-10
    return Math.max(0, Math.min(10, score));
};

// ════════════════════════════════════════════
// @route   GET /api/leads
// @desc    Get all leads for current agent
// @access  Private (AGENT, ADMIN)
// ════════════════════════════════════════════

export const getLeads = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authenticated' });
            return;
        }

        const { stage, priority, search, sortBy = 'createdAt', order = 'desc' } = req.query;

        // Build filter based on role
        const where: any = {};

        // Agents only see their own leads
        // Admins see all leads
        if (req.user.role === 'AGENT') {
            where.agentId = req.user.userId;
        }

        // Filter by stage
        if (stage && typeof stage === 'string') {
            where.stage = stage as LeadStage;
        }

        // Filter by priority
        if (priority && typeof priority === 'string') {
            where.priority = priority as LeadPriority;
        }

        // Search by name or email
        if (search && typeof search === 'string') {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const leads = await prisma.lead.findMany({
            where,
            orderBy: {
                [sortBy as string]: order === 'asc' ? 'asc' : 'desc',
            },
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        res.json({
            success: true,
            data: {
                leads,
                total: leads.length,
            },
        });
    } catch (error) {
        console.error('Get leads error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch leads',
        });
    }
};

// ════════════════════════════════════════════
// @route   GET /api/leads/:id
// @desc    Get single lead by ID
// @access  Private (AGENT owns it, or ADMIN)
// ════════════════════════════════════════════

export const getLeadById = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authenticated' });
            return;
        }

        const { id } = req.params;

        const lead = await prisma.lead.findUnique({
            where: { id },
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!lead) {
            res.status(404).json({
                success: false,
                error: 'Lead not found',
            });
            return;
        }

        // Check ownership (agents can only see their own leads)
        if (req.user.role === 'AGENT' && lead.agentId !== req.user.userId) {
            res.status(403).json({
                success: false,
                error: 'Not authorized to view this lead',
            });
            return;
        }

        res.json({
            success: true,
            data: { lead },
        });
    } catch (error) {
        console.error('Get lead by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch lead',
        });
    }
};

// ════════════════════════════════════════════
// @route   POST /api/leads
// @desc    Create new lead
// @access  Private (AGENT, ADMIN)
// ════════════════════════════════════════════

export const createLead = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authenticated' });
            return;
        }

        // Validate input
        const validatedData = createLeadSchema.parse(req.body);

        // Check if lead with this email already exists for this agent
        const existingLead = await prisma.lead.findFirst({
            where: {
                email: validatedData.email,
                agentId: req.user.userId,
            },
        });

        if (existingLead) {
            res.status(409).json({
                success: false,
                error: 'A lead with this email already exists in your pipeline',
            });
            return;
        }

        // Calculate initial lead score
        const daysOld = 0; // New lead
        const score = calculateLeadScore(validatedData.source, daysOld);

        // Create lead
        const lead = await prisma.lead.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                phone: validatedData.phone,
                source: validatedData.source,
                notes: validatedData.notes,
                priority: validatedData.priority || 'MEDIUM',
                score,
                stage: 'NEW',
                agentId: req.user.userId,
                lastContact: new Date(),
            },
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            data: { lead },
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

        console.error('Create lead error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create lead',
        });
    }
};

// ════════════════════════════════════════════
// @route   PUT /api/leads/:id
// @desc    Update lead
// @access  Private (AGENT owns it, or ADMIN)
// ════════════════════════════════════════════

export const updateLead = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authenticated' });
            return;
        }

        const { id } = req.params;

        // Check if lead exists
        const existingLead = await prisma.lead.findUnique({
            where: { id },
        });

        if (!existingLead) {
            res.status(404).json({
                success: false,
                error: 'Lead not found',
            });
            return;
        }

        // Check ownership
        if (req.user.role === 'AGENT' && existingLead.agentId !== req.user.userId) {
            res.status(403).json({
                success: false,
                error: 'Not authorized to update this lead',
            });
            return;
        }

        // Validate input
        const validatedData = updateLeadSchema.parse(req.body);

        // If email is being changed, check for duplicates
        if (validatedData.email && validatedData.email !== existingLead.email) {
            const duplicateLead = await prisma.lead.findFirst({
                where: {
                    email: validatedData.email,
                    agentId: existingLead.agentId,
                    id: { not: id },
                },
            });

            if (duplicateLead) {
                res.status(409).json({
                    success: false,
                    error: 'A lead with this email already exists in your pipeline',
                });
                return;
            }
        }

        // Update lastContact if stage is being changed
        const updateData: any = { ...validatedData };
        if (validatedData.stage && validatedData.stage !== existingLead.stage) {
            updateData.lastContact = new Date();
        }

        // Recalculate score if source changed
        if (validatedData.source && validatedData.source !== existingLead.source) {
            const daysOld = Math.floor(
                (Date.now() - existingLead.createdAt.getTime()) / (1000 * 60 * 60 * 24)
            );
            updateData.score = calculateLeadScore(validatedData.source, daysOld);
        }

        const lead = await prisma.lead.update({
            where: { id },
            data: updateData,
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        res.json({
            success: true,
            data: { lead },
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

        console.error('Update lead error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update lead',
        });
    }
};

// ════════════════════════════════════════════
// @route   DELETE /api/leads/:id
// @desc    Delete lead
// @access  Private (AGENT owns it, or ADMIN)
// ════════════════════════════════════════════

export const deleteLead = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authenticated' });
            return;
        }

        const { id } = req.params;

        // Check if lead exists
        const existingLead = await prisma.lead.findUnique({
            where: { id },
        });

        if (!existingLead) {
            res.status(404).json({
                success: false,
                error: 'Lead not found',
            });
            return;
        }

        // Check ownership
        if (req.user.role === 'AGENT' && existingLead.agentId !== req.user.userId) {
            res.status(403).json({
                success: false,
                error: 'Not authorized to delete this lead',
            });
            return;
        }

        await prisma.lead.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Lead deleted successfully',
        });
    } catch (error) {
        console.error('Delete lead error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete lead',
        });
    }
};

// ════════════════════════════════════════════
// @route   GET /api/leads/stats
// @desc    Get lead statistics for current agent
// @access  Private (AGENT, ADMIN)
// ════════════════════════════════════════════

export const getLeadStats = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authenticated' });
            return;
        }

        const where: any = {};
        if (req.user.role === 'AGENT') {
            where.agentId = req.user.userId;
        }

        const [
            totalLeads,
            newLeads,
            contacted,
            meetings,
            proposals,
            won,
            lost,
            byPriority,
        ] = await Promise.all([
            prisma.lead.count({ where }),
            prisma.lead.count({ where: { ...where, stage: 'NEW' } }),
            prisma.lead.count({ where: { ...where, stage: 'CONTACTED' } }),
            prisma.lead.count({ where: { ...where, stage: 'MEETING_SCHEDULED' } }),
            prisma.lead.count({ where: { ...where, stage: 'PROPOSAL_SENT' } }),
            prisma.lead.count({ where: { ...where, stage: 'WON' } }),
            prisma.lead.count({ where: { ...where, stage: 'LOST' } }),
            prisma.lead.groupBy({
                by: ['priority'],
                where,
                _count: true,
            }),
        ]);

        const conversionRate = totalLeads > 0 ? ((won / totalLeads) * 100).toFixed(2) : '0';

        res.json({
            success: true,
            data: {
                total: totalLeads,
                byStage: {
                    new: newLeads,
                    contacted,
                    meetings,
                    proposals,
                    won,
                    lost,
                },
                byPriority: byPriority.reduce((acc, item) => {
                    acc[item.priority.toLowerCase()] = item._count;
                    return acc;
                }, {} as Record<string, number>),
                conversionRate: `${conversionRate}%`,
            },
        });
    } catch (error) {
        console.error('Get lead stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch lead statistics',
        });
    }
};