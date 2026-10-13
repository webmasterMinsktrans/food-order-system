import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getToken } from '@/shared/actions/cookie-actions';
import { baseApiWithAuth, transformErrorResponse } from './baseApi'; // ✅ ИСПРАВЛЕНИЕ №1: Добавили импорт общего трансформера ошибок
import { UserOwnInfoDto } from '@/shared/types/user';

export const userApi = baseApiWithAuth.injectEndpoints({
  overrideExisting: true, // ✅ ИСПРАВЛЕНИЕ №2: Защита от ошибок дублирования эндпоинтов в Next.js 15 Fast Refresh
  endpoints: (builder) => ({
    getOwnInfo: builder.query<UserOwnInfoDto, undefined>({
      query: () => ({
        url: '/user',
      }),
      transformErrorResponse, // ✅ ИСПРАВЛЕНИЕ №3: Единый стандарт обработки ошибок сессии (например, при 401)
    }),
  }) 
});

export const { useGetOwnInfoQuery } = userApi;
