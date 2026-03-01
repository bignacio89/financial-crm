// apps/api/src/controllers/auth.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@financial-crm/database';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';

const prisma = new PrismaClient();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public (or Admin only in production)
 */
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, name, role } = req.body;

        // Validation
        if (!email || !password || !name) {
            res.status(400).json({
                success: false,
                error: 'Email, password, and name are required',
            });
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({
                success: false,
                error: 'Invalid email format',
            });
            return;
        }

        // Validate password strength
        if (password.length < 8) {
            res.status(400).json({
                success: false,
                error: 'Password must be at least 8 characters',
            });
            return;
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            res.status(409).json({
                success: false,
                error: 'User already exists with this email',
            });
            return;
        }

        // Validate role
        const validRoles = ['AGENT', 'ADMIN', 'OPERATIONS'];
        const userRole = role || 'AGENT';

        if (!validRoles.includes(userRole)) {
            res.status(400).json({
                success: false,
                error: 'Invalid role. Must be AGENT, ADMIN, or OPERATIONS',
            });
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: userRole,
                canWaiverFees: false, // Default: cannot waive fees
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                canWaiverFees: true,
                isActive: true,
                createdAt: true,
            },
        });

        // Generate JWT
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        res.status(201).json({
            success: true,
            data: {
                user,
                token,
            },
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register user',
        });
    }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            res.status(400).json({
                success: false,
                error: 'Email and password are required',
            });
            return;
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
                name: true,
                role: true,
                canWaiverFees: true,
                isActive: true,
                createdAt: true,
            },
        });

        if (!user) {
            res.status(401).json({
                success: false,
                error: 'Invalid credentials',
            });
            return;
        }

        // Check if user is active
        if (!user.isActive) {
            res.status(403).json({
                success: false,
                error: 'Account is deactivated. Please contact administrator.',
            });
            return;
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                error: 'Invalid credentials',
            });
            return;
        }

        // Generate JWT
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            data: {
                user: userWithoutPassword,
                token,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to login',
        });
    }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
export const getCurrentUser = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Not authenticated',
            });
            return;
        }

        // Fetch fresh user data from database
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                canWaiverFees: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }

        if (!user.isActive) {
            res.status(403).json({
                success: false,
                error: 'Account is deactivated',
            });
            return;
        }

        res.json({
            success: true,
            data: {
                user,
            },
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user data',
        });
    }
};

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
export const refreshToken = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Not authenticated',
            });
            return;
        }

        // Verify user still exists and is active
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
            },
        });

        if (!user || !user.isActive) {
            res.status(403).json({
                success: false,
                error: 'User not found or deactivated',
            });
            return;
        }

        // Generate new token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        res.json({
            success: true,
            data: {
                token,
            },
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to refresh token',
        });
    }
};