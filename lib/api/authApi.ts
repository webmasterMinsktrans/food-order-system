import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { CookieService } from '@/shared/services';
import { transformErrorResponse } from './baseApi';

export interface SignUpParams {
  password: string,
  login: string,
  email: string,
  surname: string,
  officeId: string,
  personnelNumber: string,
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_BASE}/auth`,
    prepareHeaders: async (headers) => {
      const token = CookieService.getCurrentUser()?.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    },
  }),
  endpoints: (builder) => ({
    signIn: builder.mutation({
      query: ({ email, login, password }) => ({
        url: '/sign-in',
        method: 'POST',
        body: { email, login, password },
      }),
      transformErrorResponse, // ✅ ИСПРАВЛЕНИЕ №1: Используем единый типизированный трансформер ошибок из baseApi
    }),
    checkFirstAuthToken: builder.query({
      query: (params: { token: string }) => {
        // ✅ ИСПРАВЛЕНИЕ №2: Предохранитель от бесконечного цикла Next.js 15 при пустом токене во время гидратации
        if (!params || !params.token) {
          return { url: '/check-first-auth-token' };
        }
        return {
          url: '/check-first-auth-token',
          params,
        };
      },
      transformErrorResponse,
    }),
    changeCredentials: builder.mutation({
      query: (({ token, ...body }: { token : string, newLogin : string, newPassword: string }) => ({
        url: '/change-credentials',
        method: 'PATCH',
        params: { token },
        body,
      })),
      transformErrorResponse,
    }),
    resetPassword: builder.mutation({
      query: (body: { email?: string, login?: string }) => ({
        url: '/reset-password',
        method: 'POST',
        body,
      }),
      transformErrorResponse,
    }),
    changePassword: builder.mutation({
      query: (({ token, ...body }: { token : string, newPassword: string }) => ({
        url: '/change-password',
        method: 'PATCH',
        params: { token },
        body,
      })),
      transformErrorResponse,
    }),
    signUp: builder.mutation<any, SignUpParams>({
      query: (body) => ({
        url: '/sign-up',
        method: 'POST',
        body,
      }),
      transformErrorResponse,
    }),
  }),
});

export const {
  useSignInMutation,
  useLazyCheckFirstAuthTokenQuery,
  useChangeCredentialsMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useSignUpMutation,
} = authApi;
