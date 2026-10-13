import { baseApiWithAuth, transformErrorResponse } from "@/lib/api/baseApi";
import { CreateBranchOfficeBody, CreateEmployeeBody, GetOfficeFullInfoListParams, SearchUsersQueryParams, UpdateBranchOfficeBody, UpdateBranchOfficeEmployeesParams, UpdateEmployeeBody, UpdateUserPasswordParams, UpdateUserQueryParams } from "./types";
import { UserMainInfoDto } from "@/shared/types/user";
import { EmployeeFullInfoDto } from "@/shared/types/employee/employee-full-info.dto";
import { OfficeDto, OfficeFullInfoDto, ResponseWithPagination } from "@/shared/types";

export const adminApi = baseApiWithAuth.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    searchUsers : builder.query<ResponseWithPagination<number[]>, SearchUsersQueryParams>({
      query: (params) => {
        if (!params || Object.keys(params).length === 0) {
          return { url: '/user/search' };
        }
        return {
          url: '/user/search',
          params,
        };
      },
      // ✅ ИСПРАВЛЕНИЕ №1: Привязываем тег к списку пользователей для реактивного автообновления таблиц
      providesTags: ['UserList'],
      transformErrorResponse,
    }),
    getUserMainInfo: builder.query<UserMainInfoDto, number>({
      query: (id) => ({
        url: `/user/main-info/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'UserList', id }],
      transformErrorResponse,
    }),
    updateUser: builder.mutation<any, UpdateUserQueryParams>({
      query: ({id, body}) => ({
        url: `/user/update/${id}`,
        method: 'PATCH',
        body
      }),
      // ✅ ИСПРАВЛЕНИЕ №2: Автоматически обновляем таблицы поиска пользователей при изменении их профилей
      invalidatesTags: ['UserList'],
      transformErrorResponse,
    }),
    updateUserPassword: builder.mutation<any, UpdateUserPasswordParams>({
      query: ({id, body}) => ({
        url: `/user/change-password/${id}`,
        method: 'PATCH',
        body
      }),
      // ✅ ИСПРАВЛЕНИЕ №3: Сбрасываем кэш при смене паролей, чтобы обновить статус безопасности учетной записи
      invalidatesTags: ['UserList'],
      transformErrorResponse,
    }),
    searchEmployees : builder.query<ResponseWithPagination<EmployeeFullInfoDto[]>, SearchUsersQueryParams>({
      providesTags: ['EmployeeList'],
      query: (params) => {
        if (!params || Object.keys(params).length === 0) {
          return { url: '/employee/search' };
        }
        return {
          url: '/employee/search',
          params,
        };
      },
      transformErrorResponse,
    }),
    getFullOfficeList: builder.query<OfficeDto[], void>({
      query: () => '/branch-office/all',
      transformErrorResponse,
    }),
    getOfficeFullInfoList: builder.query<ResponseWithPagination<OfficeFullInfoDto[]>, GetOfficeFullInfoListParams>({
      query: (params) => {
        if (!params || Object.keys(params).length === 0) {
          return { url: '/branch-office/all/full-info' };
        }
        return {
          url: '/branch-office/all/full-info',
          params
        };
      },
      providesTags: ['BranchOfficeFullInfo']
    }),
    updateBranchOffice: builder.mutation<any, UpdateBranchOfficeBody>({
      query: (body) => ({
        url: `/branch-office/update`,
        method: 'PATCH',
        body
      }),
      transformErrorResponse,
      invalidatesTags: ['BranchOfficeFullInfo']
    }),
    deleteBranchOffice: builder.mutation<any, number>({
      query: (id) => ({
        url: `/branch-office/delete/${id}`,
        method: 'DELETE',
      }),
      transformErrorResponse,
      invalidatesTags: ['BranchOfficeFullInfo']
    }),
    createBranchOffice: builder.mutation<number, CreateBranchOfficeBody>({
      query: (body) => ({
        url: `/branch-office/create`,
        method: 'POST',
        body,
      }),
      transformErrorResponse,
      invalidatesTags: ['BranchOfficeFullInfo']
    }),
    createEmployee: builder.mutation<number, CreateEmployeeBody>({
      query: (body) => ({
        url: `/employee/create`,
        method: 'POST',
        body,
      }),
      transformErrorResponse,
      invalidatesTags: ['EmployeeList'],
    }),
    updateEmployee: builder.mutation<any, {id: number, body: UpdateEmployeeBody}>({
      query: ({id, body}) => ({
        url: `/employee/update/${id}`,
        method: 'PATCH',
        body
      }),
      transformErrorResponse,
      invalidatesTags: ['EmployeeList']
    }),
    deleteEmployee: builder.mutation<any, number>({
      query: (id) => ({
        url: `/employee/delete/${id}`,
        method: 'DELETE',
      }),
      transformErrorResponse,
      invalidatesTags: ['EmployeeList']
    }),
    updateBranchOfficeEmployees: builder.mutation<any, UpdateBranchOfficeEmployeesParams>({
      query: ({file, ...body}) => {
        if (typeof window === 'undefined' && typeof global.FormData === 'undefined') {
          return { url: '', method: 'POST' };
        }

        const bodyFormData = new FormData();
        bodyFormData.append('file', file as Blob);
        for(let [key, value] of Object.entries(body)){
          if(value !== undefined && value !== null && String(value) !== '')
            bodyFormData.append(key, value?.toString());
        }        
        return ({
          method: "POST",
          url: '/employee/update/list-in-office',
          body: bodyFormData,
          formData: true,
        })
      },
      // ✅ ИСПРАВЛЕНИЕ №4: Автоматически обновляем списки сотрудников в таблицах 
      // сразу после успешного импорта нового Excel/Word-файла на бэкенд
      invalidatesTags: ['EmployeeList'],
      transformErrorResponse,
    }),
  }),
})

export const periodStringFormat = 'YYYY-MM-DD HH:mm';
export const {
  useSearchUsersQuery,
  useGetUserMainInfoQuery,
  useUpdateUserMutation,
  useUpdateUserPasswordMutation,
  useSearchEmployeesQuery,
  useGetFullOfficeListQuery,
  useGetOfficeFullInfoListQuery,
  useUpdateBranchOfficeMutation,
  useDeleteBranchOfficeMutation,
  useCreateBranchOfficeMutation,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useUpdateBranchOfficeEmployeesMutation,
} = adminApi;