// apps/api/src/index.ts

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import leadRoutes from './routes/lead.routes';
import partnerRoutes from './routes/partner.routes';
import productRoutes from './routes/product.routes';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4000;

// ════════════════════════════════════════════
// MIDDLEWARE
// ════════════════════════════════════════════

// Security headers
app.use(helmet());

// CORS configuration
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
    app.use((req: Request, _res: Response, next: NextFunction) => {
        console.info(`${req.method} ${req.path}`, {
            body: req.body,
            query: req.query,
        });
        next();
    });
}

// ════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════

// Health check
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/products', productRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
    });
});

// ════════════════════════════════════════════
// ERROR HANDLER
// ════════════════════════════════════════════

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);

    // Prisma errors
    if (err.name === 'PrismaClientKnownRequestError') {
        return res.status(400).json({
            success: false,
            error: 'Database error',
            message: err.message,
        });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            message: err.message,
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Invalid token',
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: 'Token expired',
        });
    }

    // Default error
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

// ════════════════════════════════════════════
// START SERVER
// ════════════════════════════════════════════

app.listen(PORT, () => {
    console.info(`
  ╔════════════════════════════════════════╗
  ║   🚀 Financial CRM API                 ║
  ║                                        ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}              ║
  ║   Port: ${PORT}                           ║
  ║   URL: http://localhost:${PORT}          ║
  ║                                        ║
  ║   Health: http://localhost:${PORT}/health ║
  ║   Leads: http://localhost:${PORT}/api/leads ║
  ╚════════════════════════════════════════╝
  `);
});

export default app;