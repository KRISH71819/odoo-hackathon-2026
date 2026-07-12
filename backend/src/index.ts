import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';

// Routes
import assetRoutes from './modules/asset/asset.routes';
// Uncomment when Member 1/3/4 push their code:
// import authRoutes from './modules/auth/auth.routes';
// import orgRoutes from './modules/organization/org.routes';
// import bookingRoutes from './modules/booking/booking.routes';
// import maintenanceRoutes from './modules/maintenance/maintenance.routes';

const app = express();
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/assets', assetRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/org', orgRoutes);
// app.use('/api/bookings', bookingRoutes);
// app.use('/api/maintenance', maintenanceRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server ready at http://localhost:${PORT}`);
});
