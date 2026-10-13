import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithExpire, transformErrorResponse } from './baseApi';
import { OrderFullInfoDto, OrderMainInfoDto } from '@/shared/types';

export type MakeOrderItem = {id: number, count:number, comment?:string};
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
  tagTypes: ['ActiveOrdersList'],
  baseQuery: baseQueryWithExpire,
  endpoints: (builder) => ({
    makeOrder: builder.mutation({ // ✅ ИСПРАВЛЕНИЕ №1: Убраны лишние скобки вызова функции в builder.mutation
      query: (body: MakeOrderParams) => ({
        url: 'order/create',
        body,
        method: 'POST',
      }),
      transformErrorResponse,
      invalidatesTags: (result, error) => {
        if (!error) return ['ActiveOrdersList'];
        return [];
      },
    }),
    getOrdersList: builder.query({
      query: (params: GetActiveOrdersParams) => {
        // ✅ ИСПРАВЛЕНИЕ №2: Предохранитель от бесконечного цикла Next.js 15 при асинхронных params из URL
        if (!params || typeof params.active === 'undefined') {
          return { url: 'order/list' };
        }
        return {
          url: 'order/list',
          params,
        };
      },
      transformResponse: (res) => res as {
        items: OrderMainInfoDto[],
        totalPages: number
      },
      transformErrorResponse,
      providesTags: ['ActiveOrdersList'],
    }),
    getOrderInfo: builder.query({
      query: (params: { issued: string, number: number }) => {
        // ✅ ИСПРАВЛЕНИЕ №3: Защита от неинициализированных параметров во время SSR гидратации
        if (!params || !params.issued || !params.number) {
          return { url: 'order/empty' };
        }
        return {
          url: `order/${params.issued}/${params.number}`,
        }; // Дублирование params внутрь GET-запроса удалено, так как данные уже есть в самом URL пути
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
        if (!error) return ['ActiveOrdersList'];
        return [];
      },
    }),
    getOrdersTotal: builder.query({
      query: (params: { periodStart?: string, periodEnd?: string }) => ({
        url: 'order/total/',
        params,
      }),
      providesTags: ['ActiveOrdersList'],
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
