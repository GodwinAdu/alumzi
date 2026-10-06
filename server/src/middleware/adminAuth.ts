import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const requireAdminRole = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        // Check if user has admin role
        if (!decoded.role || !['super_admin', 'admin', 'moderator'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Admin access required' });
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};