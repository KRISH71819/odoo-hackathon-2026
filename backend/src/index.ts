import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

// Routes
import authRoutes from './modules/auth/auth.routes';
import orgRoutes from './modules/organization/org.routes';
import assetRoutes from './modules/asset/asset.routes';
import bookingRoutes from './modules/booking/booking.routes';
import maintenanceRoutes from './modules/maintenance/maintenance.routes';
import auditRoutes from './modules/maintenance/audit.routes';
import dashboardRoutes from './modules/maintenance/dashboard.routes';
import notificationRoutes from './modules/maintenance/notification.routes';
import reportRoutes from './modules/maintenance/report.routes';

const app = express();
app.use(cors());
app.use(express.json());

// ── Mount all routes ──────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server ready at http://localhost:${PORT}`);
});
