import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

export type MaintenanceStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'TECHNICIAN_ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED';
export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type MaintenanceType = 'PREVENTIVE' | 'CORRECTIVE' | 'EMERGENCY';

export interface MaintenanceRequest {
  id: string;
  assetId: string;
  requestedById: string;
  assignedToId?: string | null;
  type: MaintenanceType;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  description: string;
  resolutionNote?: string | null;
  cost?: number | string | null;
  requestedAt: string;
  resolvedAt?: string | null;
  asset: { id: string; tag: string; name: string; status: string };
  requestedBy: { id: string; name: string };
  assignedTo?: { id: string; name: string } | null;
}

export interface MaintenanceFilters {
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  assetId?: string;
  assignedToId?: string;
  type?: MaintenanceType;
}

export interface CreateMaintenancePayload {
  assetId: string;
  type?: MaintenanceType;
  priority?: MaintenancePriority;
  description: string;
}

export interface UpdateMaintenanceStatusPayload {
  id: string;
  status: MaintenanceStatus;
  assignedToId?: string;
  resolutionNote?: string;
}

export interface MaintenanceAssignee {
  id: string;
  name: string;
  role: string;
}

export interface DashboardOverview {
  totalAssets: number;
  assetsAvailable: number;
  assetsAllocated: number;
  assetsReserved: number;
  activeBookings: number;
  pendingReturns: number;
  upcomingReturns: number;
  assetsOverdueForReturn: number;
  pendingMaintenance: number;
  activeMaintenance: number;
}

export interface Activity {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string | null;
  createdAt: string;
  user?: { id: string; name: string } | null;
  displayText: string;
}

export interface AuditListItem {
  id: string;
  title: string;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  conductedBy: { id: string; name: string };
  scheduledDate: string;
  completedDate?: string | null;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string | null;
  itemCount: number;
}

export interface AuditItem {
  id: string;
  assetId: string;
  expectedLocation?: string | null;
  actualLocation?: string | null;
  expectedCondition?: string | null;
  actualCondition?: string | null;
  isVerified: boolean;
  discrepancyNote?: string | null;
  checkedAt?: string | null;
  asset: {
    id: string;
    tag: string;
    name: string;
    location?: string | null;
    condition?: string | null;
    category?: { name: string } | null;
  };
}

export interface Audit extends Omit<AuditListItem, 'itemCount'> {
  items: AuditItem[];
  summary: { totalItems: number; verifiedCount: number; discrepancyCount: number };
}

export interface CreateAuditPayload {
  title: string;
  departmentId?: string | null;
  scheduledDate: string;
  notes?: string;
}

export interface UpdateAuditItemPayload {
  auditId: string;
  itemId: string;
  actualLocation?: string | null;
  actualCondition?: string | null;
  isVerified?: boolean;
  discrepancyNote?: string | null;
}

export interface AuditReport {
  auditId: string;
  title: string;
  totalAssetsAudited: number;
  verifiedCount: number;
  verificationPercentage: number;
  discrepancyCount: number;
  discrepantAssets: Array<{
    auditItemId: string;
    asset: { id: string; tag: string; name: string };
    expectedLocation?: string | null;
    actualLocation?: string | null;
    expectedCondition?: string | null;
    actualCondition?: string | null;
    discrepancyNote?: string | null;
  }>;
}

export type NotificationType = 'ALL' | 'ALERT' | 'APPROVAL' | 'BOOKING' | 'MAINTENANCE' | 'AUDIT';

export interface AppNotification {
  id: string;
  type: Exclude<NotificationType, 'ALL'>;
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  isRead?: boolean;
}

export type ReportType =
  | 'utilization-by-department'
  | 'maintenance-frequency'
  | 'most-used-assets'
  | 'idle-assets'
  | 'assets-due-for-maintenance'
  | 'department-allocation-summary'
  | 'booking-heatmap';

export interface UtilizationByDepartmentRow { department: string; allocatedCount: number; percentage: number; }
export interface MaintenanceFrequencyRow { assetTag: string; assetName: string; category: string; requestCount: number; lastRequestDate: string | null; }
export interface MostUsedAssetRow { assetTag: string; assetName: string; bookingCount: number; totalHours: number; }
export interface IdleAssetRow { assetTag: string; assetName: string; category: string; idleDays: number; }
export interface AssetDueForMaintenanceRow { assetTag: string; assetName: string; reason: string; dueDate: string; }
export interface DepartmentAllocationRow { department: string; categories: Array<{ name: string; count: number }>; totalAssets: number; }
export interface BookingHeatmapCell { dayOfWeek: number; hour: number; count: number; }

const auditKeys = {
  all: ['audits'] as const,
  detail: (id: string) => ['audits', id] as const,
};

const notificationKeys = {
  all: ['notifications'] as const,
  list: (filters: NotificationFilters) => ['notifications', filters] as const,
};

const maintenanceKeys = {
  all: ['maintenance'] as const,
  list: (filters: MaintenanceFilters) => ['maintenance', filters] as const,
};

const reportKeys = {
  data: (reportType: ReportType) => ['reports', reportType] as const,
};

export function useMaintenanceRequests(filters: MaintenanceFilters = {}) {
  return useQuery({
    queryKey: maintenanceKeys.list(filters),
    queryFn: (): Promise<MaintenanceRequest[]> =>
      client.get('/maintenance', { params: filters }).then((response) => response.data.data),
  });
}

export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: (): Promise<DashboardOverview> => client.get('/dashboard/overview').then((response) => response.data.data),
  });
}

export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: ['dashboard', 'recent-activity', limit],
    queryFn: (): Promise<Activity[]> =>
      client.get('/dashboard/recent-activity', { params: { limit } }).then((response) => response.data.data),
  });
}

export function useReportData<T>(reportType: ReportType) {
  return useQuery({
    queryKey: reportKeys.data(reportType),
    queryFn: (): Promise<T> => client.get(`/reports/${reportType}`).then((response) => response.data.data),
  });
}

export function useMaintenanceAssignees() {
  return useQuery({
    queryKey: ['maintenance', 'assignees'],
    queryFn: (): Promise<MaintenanceAssignee[]> =>
      client.get('/maintenance/assignees').then((response) => response.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMaintenancePayload) =>
      client.post('/maintenance', data).then((response) => response.data.data as MaintenanceRequest),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceKeys.all }),
  });
}

export function useUpdateMaintenanceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateMaintenanceStatusPayload) =>
      client.put(`/maintenance/${id}/status`, data).then((response) => response.data.data as MaintenanceRequest),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceKeys.all }),
  });
}

export function useAudits() {
  return useQuery({
    queryKey: auditKeys.all,
    queryFn: (): Promise<AuditListItem[]> => client.get('/audits').then((response) => response.data.data),
  });
}

export function useAudit(id: string | undefined) {
  return useQuery({
    queryKey: auditKeys.detail(id ?? ''),
    queryFn: (): Promise<Audit> => client.get(`/audits/${id}`).then((response) => response.data.data),
    enabled: Boolean(id),
  });
}

export function useCreateAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAuditPayload) => client.post('/audits', data).then((response) => response.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: auditKeys.all }),
  });
}

export function useUpdateAuditItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ auditId, itemId, ...data }: UpdateAuditItemPayload) =>
      client.put(`/audits/${auditId}/items/${itemId}`, data).then((response) => response.data.data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: auditKeys.detail(variables.auditId) });
      queryClient.invalidateQueries({ queryKey: auditKeys.all });
    },
  });
}

export function useGenerateAuditReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (auditId: string): Promise<AuditReport> =>
      client.post(`/audits/${auditId}/generate-report`).then((response) => response.data.data),
    onSuccess: (_result, auditId) => {
      queryClient.invalidateQueries({ queryKey: auditKeys.detail(auditId) });
      queryClient.invalidateQueries({ queryKey: auditKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useNotifications(filters: NotificationFilters = {}) {
  return useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: (): Promise<{ notifications: AppNotification[]; unreadCount: number }> =>
      client.get('/notifications', { params: filters }).then((response) => response.data.data),
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.put(`/notifications/${id}/read`).then((response) => response.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => client.put('/notifications/read-all').then((response) => response.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
