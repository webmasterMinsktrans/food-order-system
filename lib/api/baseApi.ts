import {  BaseQueryFn, FetchArgs, FetchBaseQueryError, FetchBaseQueryMeta,   } from '@reduxjs/toolkit/query';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { startLogout } from '../features/user/userSlice';
import { ErrorDto } from '@/shared/types';
import { getToken, handleRefresh } from '../../shared/actions/cookie-actions';
import { Mutex } from 'async-mutex';
import { RootState } from '../store';
const mutex = new Mutex();

const baseQuery = fetchBaseQuery({ 
  baseUrl: `${process.env.NEXT_PUBLIC_API_BASE}`,     
  prepareHeaders: async (headers, api) => {
    const res = await getToken();
    if (res?.token) {
      headers.set('Authorization', `Bearer ${res?.token}`);
    }
  },
});

export const baseQueryWithExpire:BaseQueryFn<
string | FetchArgs,
unknown,
FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const isLoggedIn = (api.getState() as RootState).user.isLoggedIn;
  await mutex.waitForUnlock();
  let result = await baseQuery(args, api, extraOptions);
  if (result.error &&
      isLoggedIn && 
      (result.error.status === 401)) {
      if (!mutex.isLocked()) {
        const release = await mutex.acquire();
        try{
          const newToken = await handleRefresh();
          if(newToken){
            result = await baseQuery(args, api, extraOptions);
            if(result.error) api.dispatch(startLogout());
          }else{
            api.dispatch(startLogout());
          }
        }catch(err){
          api.dispatch(startLogout());
        }finally{
          release();
        }
      }else{
        await mutex.waitForUnlock()
        result = await baseQuery(args, api, extraOptions)
      }
  }
  return result;
};

export const transformErrorResponse = (response : any) => response.data as ErrorDto;

export const baseApiWithoutAuth = createApi({
  reducerPath: 'baseApiNoToken',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE,
  }),
  endpoints: (builder) => ({}),
});

export const baseApiWithAuth = createApi({
  reducerPath: 'baseApiWithAuth',
  baseQuery: baseQueryWithExpire,
  tagTypes: ['BranchOfficeFullInfo', 'EmployeeList', 'MenuList','Images'],
  endpoints: (builder) => ({}),
});

export const transformFileResponse = async (
  response : any, meta: FetchBaseQueryMeta | undefined, 
  args: any, defaultFilename : string,
) => {
  // ✅ ИСПРАВЛЕНИЕ: Защита от падения сборщика Next.js 15 на сервере (SSR)
  if (typeof window === 'undefined') {
    return { status : 200 };
  }

  const contentDisposition = meta?.response?.headers.get('Content-Disposition');
  const filename = contentDisposition?.slice(contentDisposition.indexOf('=') + 1) ?? defaultFilename;
  
  let anchor = document.createElement("a");
  document.body.appendChild(anchor);			
  let objectUrl = window.URL.createObjectURL(response);
  anchor.href = objectUrl;
  anchor.download = decodeURI(filename ?? '');
  anchor.click();
  window.URL.revokeObjectURL(objectUrl);
  document.body.removeChild(anchor);
  return { status : 200 };
};
