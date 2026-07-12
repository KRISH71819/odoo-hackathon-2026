import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

// ── Asset Queries ────────────────────────────────────────────

interface AssetFilters {
  search?: string;
  categoryId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export function useAssets(filters: AssetFilters = {}) {
  return useQuery({
    queryKey: ['assets', filters],
    queryFn: () => client.get('/assets', { params: filters }).then((r) => r.data.data),
  });
}

export function useAsset(id: string | undefined) {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: () => client.get(`/assets/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useAllocationHistory(assetId: string | undefined) {
  return useQuery({
    queryKey: ['allocation-history', assetId],
    queryFn: () => client.get(`/assets/${assetId}/allocation-history`).then((r) => r.data.data),
    enabled: !!assetId,
  });
}

// ── Org data helpers (read-only, needed for dropdowns) ──────

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => client.get('/org/categories').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000, // ponytail: cache 5 min, categories rarely change
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => client.get('/org/users').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => client.get('/org/departments').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

// ── Mutations ────────────────────────────────────────────────

function invalidateAssets(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['assets'] });
  qc.invalidateQueries({ queryKey: ['asset'] });
  qc.invalidateQueries({ queryKey: ['allocation-history'] });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => client.post('/assets', data).then((r) => r.data),
    onSuccess: () => invalidateAssets(qc),
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      client.put(`/assets/${id}`, data).then((r) => r.data),
    onSuccess: () => invalidateAssets(qc),
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete(`/assets/${id}`).then((r) => r.data),
    onSuccess: () => invalidateAssets(qc),
  });
}

export function useAllocateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      client.post(`/assets/${id}/allocate`, data).then((r) => r.data),
    onSuccess: () => invalidateAssets(qc),
  });
}

export function useTransferAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      client.post(`/assets/${id}/transfer`, data).then((r) => r.data),
    onSuccess: () => invalidateAssets(qc),
  });
}

export function useReturnAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      client.post(`/assets/${id}/return`, data).then((r) => r.data),
    onSuccess: () => invalidateAssets(qc),
  });
}

export function useApproveAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      client.put(`/assets/allocations/${id}/approve`).then((r) => r.data),
    onSuccess: () => invalidateAssets(qc),
  });
}

export function useRejectAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      client.put(`/assets/allocations/${id}/reject`).then((r) => r.data),
    onSuccess: () => invalidateAssets(qc),
  });
}
