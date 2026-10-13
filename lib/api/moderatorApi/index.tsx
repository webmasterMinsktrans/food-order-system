import { baseApiWithAuth, transformErrorResponse, transformFileResponse } from "../baseApi";
import { ImageDto, ImageTagDto, MenuInfoDto, MenuListDto, OfficeDto } from "@/shared/types";
import { CreateMenuFromDocxDto, SearchImageTagDto, UploadImagesDto, ExportOrdersDocxDto, GetMenuListParams, SearchOrdersParams, SearchOrderItemDto, UpdateMenuParams, SearchImageParams, UpdateImageTagsParams, DeleteImagesParams } from "./types";
import { ResponseWithPagination } from "@/shared/types";
import { ImageFullInfoDto } from "@/shared/types/image/image-full-info.dto";

export const moderatorApi = baseApiWithAuth.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getCanteenList: builder.query<OfficeDto[], void>({
      query: () => '/branch-office/canteen-list',
      transformErrorResponse,
    }),
    uploadWordMenu: builder.mutation<{ menu: any }, CreateMenuFromDocxDto>({
      query: ({ file, ...body }) => {
        // Безопасная изоляция для SSR сборщика Next.js 15
        if (typeof window === 'undefined' && typeof global.FormData === 'undefined') {
          return { url: '', method: 'POST' };
        }

        const bodyFormData = new FormData();
        bodyFormData.append('file', file);
        for (let [key, value] of Object.entries(body)) {
          if (value !== undefined && value !== null && value !== '')
            bodyFormData.append(key, value?.toString());
        }        
        return ({
          method: "POST",
          url: '/menu/create/from-file/word',
          body: bodyFormData,
          formData: true,
        });
      },
      transformErrorResponse,
    }),
    searchImageTags: builder.query<ImageTagDto[], SearchImageTagDto>({
      query: (params) => {
        // ✅ ИСПРАВЛЕНИЕ №1: Защита от бесконечного цикла рендеринга Next.js 15
        if (!params || Object.keys(params).length === 0) {
          return { url: '/image-tag/search' };
        }
        return {
          url: '/image-tag/search',
          params,
        };
      },
      transformErrorResponse,
    }),
    uploadImages: builder.mutation<Array<ImageDto>, UploadImagesDto>({
      query: ({ files, ...body }) => {
        // Безопасная изоляция для SSR сборщика Next.js 15
        if (typeof window === 'undefined' && typeof global.FormData === 'undefined') {
          return { url: '', method: 'POST' };
        }

        const bodyFormData = new FormData();
        files.forEach((file) => bodyFormData.append('files', file as Blob));
        for (let [key, value] of Object.entries(body)) {
          if (value !== undefined && value !== null && value !== '')
            bodyFormData.append(key, JSON.stringify(value));
        }        
        return ({
          method: "POST",
          url: '/image/upload',
          body: bodyFormData,
          formData: true,
        });
      },
      invalidatesTags: ['Images'],
      transformErrorResponse,
    }),
    orderExportDocx: builder.query<any, ExportOrdersDocxDto>({
      query: (params) => {
        // ✅ ИСПРАВЛЕНИЕ №2: Защита от зацикливания ленивого/обычного query-вызова при выгрузке файлов
        if (!params || Object.keys(params).length === 0) {
          return { url: '/order/actual/export-list/docx' };
        }
        return {
          url: '/order/actual/export-list/docx',
          params,
          responseHandler: (res: Response) => res.status === 200 ? res.blob() : res.json(),
        };
      },
      transformResponse: (response, meta, args) =>
        transformFileResponse(response, meta as any, args, 'default.docx'),
      transformErrorResponse,
    }),
    getMenuList: builder.query<MenuListDto, GetMenuListParams>({
      query: (params) => {
        // ✅ ИСПРАВЛЕНИЕ №3: Защита от бесконечного рендеринга на главной странице списков меню модератора
        if (!params || Object.keys(params).length === 0) {
          return { url: '/menu/list' };
        }
        return {
          url: '/menu/list',
          params,
        };
      },
      providesTags: ['MenuList'],
      transformErrorResponse,
    }),
    getMenuById: builder.query<MenuInfoDto, { id: number }>({
      query: ({ id }) => {
        // Защита от неинициализированных числовых ID (NaN/undefined) во время SSR гидратации
        if (!id || isNaN(id)) {
          return { url: '/menu/0' };
        }
        return {
          url: `/menu/${id}`,
        };
      },
      transformErrorResponse,
    }),
    searchOrders: builder.query<ResponseWithPagination<SearchOrderItemDto[]>, SearchOrdersParams>({
      query: (params) => {
        if (!params || Object.keys(params).length === 0) {
          return { url: '/order/search' };
        }
        return {
          url: `/order/search`,
          params,
        };
      },
      transformErrorResponse,
    }),
    updateMenu: builder.mutation<any, UpdateMenuParams>({
      query: ({ id, body }) => ({
        url: `/menu/${id}`,
        method: 'PATCH',
        body
      }),
      transformErrorResponse,
    }),
    deleteMenu: builder.mutation<any, { id: number }>({
      query: ({ id }) => ({
        url: `/menu/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MenuList'],
      transformErrorResponse,
    }),
    getImageList: builder.query<ResponseWithPagination<ImageFullInfoDto[]>, SearchImageParams>({
      query: (params) => {
        if (!params || Object.keys(params).length === 0) {
          return { url: '/image/list' };
        }
        return {
          url: `/image/list`,
          params,
        };
      },
      providesTags: ['Images'],
      transformErrorResponse,
    }),
    updateImageTags: builder.mutation<any, UpdateImageTagsParams>({
      query: ({ id, body }) => ({
        url: `/image/${id}/update/tags`,
        method: 'PATCH',
        body
      }),
      transformErrorResponse,
    }),
    deleteImages: builder.mutation<any, DeleteImagesParams>({
      query: ({ body }) => ({
        url: `/image/delete`,
        method: 'DELETE',
        body
      }),
      invalidatesTags: ['Images'],
      transformErrorResponse,
    }),
    deleteImagesTags: builder.mutation<any, DeleteImagesParams>({
      query: ({ body }) => ({
        url: `/image/tags/clear`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['Images'],
      transformErrorResponse,
    }),
  }),
});

export const periodStringFormat = 'YYYY-MM-DD HH:mm';
export const {
  useGetCanteenListQuery,
  useUploadWordMenuMutation,
  useSearchImageTagsQuery,
  useUploadImagesMutation,
  useLazyOrderExportDocxQuery,
  useGetMenuListQuery,
  useLazyGetMenuListQuery,
  useGetMenuByIdQuery,
  useSearchOrdersQuery,
  useUpdateMenuMutation,
  useDeleteMenuMutation,
  useGetImageListQuery,
  useUpdateImageTagsMutation,
  useDeleteImagesMutation,
  useDeleteImagesTagsMutation,
} = moderatorApi;
