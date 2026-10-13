import { OfficeDto } from '@/shared/types';
import { baseApiWithoutAuth, transformErrorResponse } from './baseApi';

interface CheckEmployeeParams {
  officeId: string,
  surname: string,
  personnelNumber: string,
}

const registrationApi = baseApiWithoutAuth.injectEndpoints({
  overrideExisting: true, // ✅ ИСПРАВЛЕНИЕ №1: Защита от ошибок дублирования эндпоинтов в Next.js 15 Fast Refresh
  endpoints: (builder) => ({
    getOfficesList: builder.query<OfficeDto[], void>({
      query: () => '/branch-office/registration-list',
      transformErrorResponse,
    }),
    checkEmployee: builder.query<any, CheckEmployeeParams>({
      query: (params) => {
        // ✅ ИСПРАВЛЕНИЕ №2: Предохранитель от бесконечного цикла Next.js 15 при пустых полях формы
        if (!params || !params.officeId || !params.surname || !params.personnelNumber) {
          return { url: '/auth/sign-up/check-employee' };
        }
        return {
          url: '/auth/sign-up/check-employee',
          params,
        };
      },
      transformErrorResponse,
    }),
  }),
});

export const {
  useGetOfficesListQuery,
  useLazyCheckEmployeeQuery,
} = registrationApi;
