import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithExpire, transformErrorResponse } from './baseApi';
import { OrderFullInfoDto, OrderMainInfoDto } from '@/shared/types';

export type MakeOrderItem = { id: number, count: number, comment?: string };
export type MakeOrderParams = {
  menuPositions: MakeOrderItem[],
  deliveryDestinationId: number,
};
export type GetActiveOrdersParams = {
  page?: number,
  pageSize?: number,
  active: boolean
};

export const orderApi = createApi({
  reducerPath: 'orderApi',
  // ✅ ИСПРАВЛЕНИЕ №1: Разделяем типы тегов. 
  // Добавляем отдельный независимый тег для общей суммы заказов за месяц.
  tagTypes: ['ActiveOrdersList', 'OrdersTotalSummary'],
  baseQuery: baseQueryWithExpire,
  endpoints: (builder) => ({
    makeOrder: builder.mutation({
      query: (body: MakeOrderParams) => ({
        url: 'order/create',
        body,
        method: 'POST',
      }),
      transformErrorResponse,
      invalidatesTags: (result, error) => {
        if (!error) return ['ActiveOrdersList', 'OrdersTotalSummary']; // Сбрасываем и список, и сумму при создании заказа
        return [];
      },
    }),
        // Найдите getOrdersList внутри вашего файла orderApi.ts и замените его на этот:
    getOrdersList: builder.query({
      query: (params: GetActiveOrdersParams) => {
        if (!params || typeof params.active === 'undefined') {
          return { url: 'order/list' };
        }
        return {
          url: 'order/list',
          params,
        };
      },     
      transformResponse: (res) => {
         console.log('=== ДЕБАГ API: transformResponse ===', {
          rawResponseReceived: !!res,
          hasItems: !!(res as any)?.items,
          itemsLength: (res as any)?.items?.length,
        });
        if (!res) return undefined; 
        return res as {
          items: OrderMainInfoDto[],
          totalPages: number
        };
      },
      transformErrorResponse,
      providesTags: ['ActiveOrdersList'],
    }),

    getOrderInfo: builder.query({
      query: (params: { issued: string, number: number }) => {
        if (!params || !params.issued || !params.number) {
          return { url: 'order/empty' };
        }
        return {
          url: `order/${params.issued}/${params.number}`,
        };
      },
      transformResponse: (res) => res as OrderFullInfoDto,
      transformErrorResponse,
    }),
    cancelOrder: builder.mutation({
      query: (params: { issued: string, number: number }) => ({
        url: `order/cancel/${params.issued}/${params.number}`,
        method: 'DELETE',
      }),
      transformResponse: (res) => res,
      transformErrorResponse,
      invalidatesTags: (result, error) => {
        if (!error) return ['ActiveOrdersList', 'OrdersTotalSummary']; // Сбрасываем кэш при отмене заказа
        return [];
      },
    }),
    getOrdersTotal: builder.query({
      query: (params: { periodStart?: string, periodEnd?: string }) => ({
        url: 'order/total/',
        params,
      }),
      // ✅ ИСПРАВЛЕНИЕ №2: Вешаем на эндпоинт суммы свой собственный независимый тег.
      // Теперь вызов общей суммы больше никогда не сможет принудительно стереть кэш списка реальных заказов!
      providesTags: ['OrdersTotalSummary'],
      
      transformResponse: (res) => res as { totalCount: number, totalPrice: number },
      transformErrorResponse,
    }),
  }),
});

export const {
  useMakeOrderMutation,
  useGetOrdersListQuery,
  useGetOrderInfoQuery,
  useLazyGetOrderInfoQuery,
  useCancelOrderMutation,
  useGetOrdersTotalQuery,
} = orderApi;
