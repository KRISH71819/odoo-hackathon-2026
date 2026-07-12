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

const maintenanceKeys = {
  all: ['maintenance'] as const,
  list: (filters: MaintenanceFilters) => ['maintenance', filters] as const,
};

export function useMaintenanceRequests(filters: MaintenanceFilters = {}) {
  return useQuery({
    queryKey: maintenanceKeys.list(filters),
    queryFn: (): Promise<MaintenanceRequest[]> =>
      client.get('/maintenance', { params: filters }).then((response) => response.data.data),
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
