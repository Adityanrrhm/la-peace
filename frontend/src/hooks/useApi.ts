import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getApiErrorMessage } from '@/lib/api';
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerListResponse,
  Invoice,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  UpdateInvoiceStatusRequest,
  InvoiceListResponse,
  DueTodayInvoiceResponse,
  FollowUpLog,
  CreateFollowUpLogRequest,
  FollowUpLogListResponse,
  DailySummaryResponse,
} from '@/types/api';

// Query keys
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  customers: {
    list: (params?: { page?: number; page_size?: number; nama?: string }) =>
      ['customers', 'list', params] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
  },
  invoices: {
    list: (params?: { page?: number; page_size?: number; status?: string; customer_id?: string; sort_by?: string; sort_dir?: string }) =>
      ['invoices', 'list', params] as const,
    detail: (id: string) => ['invoices', 'detail', id] as const,
    dueToday: ['invoices', 'due-today'] as const,
  },
  followup: {
    list: (params?: { page?: number; page_size?: number; invoice_id?: string; sumber?: string }) =>
      ['followup', 'list', params] as const,
    byInvoice: (invoiceId: string) => ['followup', 'by-invoice', invoiceId] as const,
  },
  summary: {
    daily: ['summary', 'daily'] as const,
  },
};

// Auth hooks
export function useMe() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const response = await api.get('/auth/me');
      return response.data.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Customer hooks
export function useCustomers(params?: { page?: number; page_size?: number; nama?: string }) {
  return useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: async () => {
      const response = await api.get<CustomerListResponse>('/customers', { params });
      return response.data;
    },
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Customer }>(`/customers/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCustomerRequest) => {
      const response = await api.post<{ success: boolean; data: Customer }>('/customers', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error) => {
      throw new Error(getApiErrorMessage(error));
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCustomerRequest }) => {
      const response = await api.patch<{ success: boolean; data: Customer }>(`/customers/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(id) });
    },
    onError: (error) => {
      throw new Error(getApiErrorMessage(error));
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error) => {
      throw new Error(getApiErrorMessage(error));
    },
  });
}

// Invoice hooks
export function useInvoices(params?: { page?: number; page_size?: number; status?: string; customer_id?: string; sort_by?: string; sort_dir?: string }) {
  return useQuery({
    queryKey: queryKeys.invoices.list(params),
    queryFn: async () => {
      const response = await api.get<InvoiceListResponse>('/invoices', { params });
      return response.data;
    },
  });
}

export function useInvoice(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.invoices.detail(id),
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Invoice }>(`/invoices/${id}`);
      return response.data.data;
    },
    enabled: options?.enabled ?? !!id,
  });
}

export function useDueTodayInvoices() {
  return useQuery({
    queryKey: queryKeys.invoices.dueToday,
    queryFn: async () => {
      const response = await api.get<DueTodayInvoiceResponse>('/invoices/due-today');
      return response.data.data;
    },
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateInvoiceRequest) => {
      const response = await api.post<{ success: boolean; data: Invoice }>('/invoices', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.summary.daily });
    },
    onError: (error) => {
      throw new Error(getApiErrorMessage(error));
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInvoiceRequest }) => {
      const response = await api.patch<{ success: boolean; data: Invoice }>(`/invoices/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.summary.daily });
    },
    onError: (error) => {
      throw new Error(getApiErrorMessage(error));
    },
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: UpdateInvoiceStatusRequest['status'] }) => {
      const response = await api.patch<{ success: boolean; data: Invoice }>(`/invoices/${id}/status`, { status });
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.summary.daily });
    },
    onError: (error) => {
      throw new Error(getApiErrorMessage(error));
    },
  });
}

// Follow-up hooks
export function useFollowUpLogs(params?: { page?: number; page_size?: number; invoice_id?: string; sumber?: string }) {
  return useQuery({
    queryKey: queryKeys.followup.list(params),
    queryFn: async () => {
      const response = await api.get<FollowUpLogListResponse>('/follow-up-logs', { params });
      return response.data;
    },
  });
}

export function useFollowUpLogsByInvoice(invoiceId: string) {
  return useQuery({
    queryKey: queryKeys.followup.byInvoice(invoiceId),
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: FollowUpLog[] }>(`/follow-up-logs/invoice/${invoiceId}`);
      return response.data.data;
    },
    enabled: !!invoiceId,
  });
}

export function useCreateFollowUpLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateFollowUpLogRequest) => {
      const response = await api.post<{ success: boolean; data: FollowUpLog }>('/follow-up-logs', data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['followup'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.followup.byInvoice(variables.invoice_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.summary.daily });
    },
    onError: (error) => {
      throw new Error(getApiErrorMessage(error));
    },
  });
}

// Summary hooks
export function useDailySummary() {
  return useQuery({
    queryKey: queryKeys.summary.daily,
    queryFn: async () => {
      const response = await api.get<DailySummaryResponse>('/summary/daily');
      return response.data.data;
    },
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}