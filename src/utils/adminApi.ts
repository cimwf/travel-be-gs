import { callCloudFunction } from '@/utils/cloudbase';
import { useAuthStore } from '@/stores/auth';

type ApiResult<T = Record<string, unknown>> = T & { success: boolean; error?: string };

const adminId = () => useAuthStore.getState().user?.id || '';

export async function adminCall<T = Record<string, unknown>>(action: string, data: Record<string, unknown> = {}) {
  return callCloudFunction<ApiResult<T>>(action, { adminId: adminId(), ...data });
}

export async function adminList<T>(resource: string, params: Record<string, unknown> = {}) {
  return adminCall<{ items?: T[]; total?: number }>('admin/dataList', { resource, ...params });
}

export const adminGet = <T>(resource: string, id: string) =>
  adminCall<{ item?: T }>('admin/dataGet', { resource, id });

export const adminCreate = (resource: string, payload: Record<string, unknown>) =>
  adminCall('admin/dataCreate', { resource, payload });

export const adminUpdate = (resource: string, id: string, payload: Record<string, unknown>) =>
  adminCall('admin/dataUpdate', { resource, id, payload });

export const adminDelete = (resource: string, id: string) =>
  adminCall('admin/dataDelete', { resource, id });

export const adminBatchCreate = (resource: string, items: Record<string, unknown>[]) =>
  adminCall<{ count?: number }>('admin/dataBatchCreate', { resource, items });
