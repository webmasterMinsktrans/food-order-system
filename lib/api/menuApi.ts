import { DishCategoryDto, MenuPositionDto, OfficeDto } from '@/shared/types';
import { baseApiWithAuth, transformErrorResponse } from './baseApi'; // ✅ Добавили импорт общего трансформера ошибок

export type GetActualMenuQueryParams = {
  page?: number,
  pageSize?: number,
  dishCategoryId?: string,
  productType?: string,
  destinationOfficeId: number,
};

export const menuApi = baseApiWithAuth.injectEndpoints({
  overrideExisting: true, // Гарантирует корректную перезапись эндпоинтов в Next.js 15 Fast Refresh
  endpoints: (builder) => ({
    getActualMenu: builder.query({
      query: (params: GetActualMenuQueryParams) => {
        // ✅ ИСПРАВЛЕНИЕ: Предохранитель от бесконечного цикла Next.js 15 при пустых/асинхронных параметрах
        if (!params || Object.keys(params).length === 0 || !params.destinationOfficeId) {
          return { url: '/menu/actual' };
        }
        
        return {
          url: '/menu/actual',
          params, // Передаем стабильный объект напрямую без деструктуризации ...params
        };
      },
      transformResponse: (res) => res as {
        items: MenuPositionDto[],
        totalPages: number
      },
      transformErrorResponse, // ✅ Используем единый стандарт обработки ошибок
    }),
    getMenuCategories: builder.query({
      query: () => ({
        url: '/menu/actual/menu-categories',
      }),
      transformResponse: (res) => res as DishCategoryDto[],
      transformErrorResponse,
    }),
    getDeliveryPoints: builder.query({
      query: () => ({
        url: '/branch-office/delivery-points',
      }),
      transformResponse: (res) => res as OfficeDto[],
      transformErrorResponse,
    }),
  })
});

export const { 
  useGetActualMenuQuery,
  useGetMenuCategoriesQuery,
  useGetDeliveryPointsQuery 
} = menuApi;
