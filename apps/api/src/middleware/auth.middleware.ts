// apps/api/src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'No token provided',
            });
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = verifyToken(token);

        // Attach user to request
        req.user = decoded;

        next();
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Token expired') {
                res.status(401).json({
                    success: false,
                    error: 'Token expired',
                });
                return;
            }
            if (error.message === 'Invalid token') {
                res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                });
                return;
            }
        }

        res.status(500).json({
            success: false,
            error: 'Authentication failed',
        });
    }
};

/**
 * Middleware to check if user has required role(s)
 */
export const authorize = (...allowedRoles: Array<'AGENT' | 'ADMIN' | 'OPERATIONS'>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Not authenticated',
            });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                message: `Required role: ${allowedRoles.join(' or ')}`,
            });
            return;
        }

        next();
    };
};

/**
 * Optional authentication - attach user if token exists, but don't fail if missing
 */
export const optionalAuth = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);
            req.user = decoded;
        }

        next();
    } catch {
        // Token invalid or expired, but we don't fail - just continue without user
        next();
    }
};