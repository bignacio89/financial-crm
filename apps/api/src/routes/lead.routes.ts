// apps/api/src/routes/lead.routes.ts

import { Router } from 'express';
import {
    getLeads,
    getLeadById,
    createLead,
    updateLead,
    deleteLead,
    getLeadStats,
} from '../controllers/lead.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/leads/stats
 * @desc    Get lead statistics
 * @access  Private (AGENT, ADMIN)
 */
router.get('/stats', authorize('AGENT', 'ADMIN'), getLeadStats);

/**
 * @route   GET /api/leads
 * @desc    Get all leads for current agent
 * @access  Private (AGENT, ADMIN)
 */
router.get('/', authorize('AGENT', 'ADMIN'), getLeads);

/**
 * @route   GET /api/leads/:id
 * @desc    Get single lead by ID
 * @access  Private (AGENT owns it, or ADMIN)
 */
router.get('/:id', authorize('AGENT', 'ADMIN'), getLeadById);

/**
 * @route   POST /api/leads
 * @desc    Create new lead
 * @access  Private (AGENT, ADMIN)
 */
router.post('/', authorize('AGENT', 'ADMIN'), createLead);

/**
 * @route   PUT /api/leads/:id
 * @desc    Update lead
 * @access  Private (AGENT owns it, or ADMIN)
 */
router.put('/:id', authorize('AGENT', 'ADMIN'), updateLead);

/**
 * @route   DELETE /api/leads/:id
 * @desc    Delete lead
 * @access  Private (AGENT owns it, or ADMIN)
 */
router.delete('/:id', authorize('AGENT', 'ADMIN'), deleteLead);

export default router;