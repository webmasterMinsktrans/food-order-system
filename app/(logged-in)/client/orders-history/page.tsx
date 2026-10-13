'use client';

import { FunctionComponent, useMemo } from 'react';
import { NoContentPage, OrderList, OrdersTotal } from '@/components';
import noOrdersImage from '@/public/204Order.png';
import { useSearchParamValue } from '@/shared/hooks';
import { useGetOrdersListQuery } from '@/lib/api/orderApi';
import { ErrorPage } from '@/UI';

const OrdersHistory : FunctionComponent = () => {
  const pageFromUrl = useSearchParamValue<number>('page');
  const pageSize = 2;

  const currentPage = pageFromUrl ? +pageFromUrl : 1;

  const queryParams = useMemo(() => ({ 
    page: currentPage, 
    pageSize, 
    active: false 
  }), [currentPage, pageSize]);

  // ✅ ИСПРАВЛЕНИЕ: Мы удалили 'fixedCacheKey', оставив только валидный 'refetchOnMountOrArgChange'.
  // С исправленным baseApi.ts этот хук будет мгновенно забирать данные из кэша и гасить лоадер.
  const { data, isFetching, error } = useGetOrdersListQuery(queryParams, {
    refetchOnMountOrArgChange: true,
  });

  if (error) {
    return (
      <ErrorPage
        message={(error as any)?.data?.message ?? (error as any)?.message ?? 'Ошибка загрузки истории заказов'}
      />
    );
  }

  const showLoader = isFetching && !data;

  return (
    <div style={{ 
  position: 'relative', 
  minHeight: '200px', 
  width: '100%', 
  display: 'flex', 
  flexDirection: 'column', 
  justifyContent: 'flex-start', 
  alignItems: 'center', 
  gap: '10px'
}}>

      {
        !showLoader && (!data || data.totalPages === 0 || !data.items || data.items.length === 0)
        ?
          <NoContentPage
            buttonLabel="В меню"
            href="menu"
            label="История заказов отсутствует :("
            img={noOrdersImage}
          />
        :
          <>
            <OrdersTotal />
            <OrderList
              items={data?.items ?? []}
              totalPages={data?.totalPages ?? 1}
              pageSize={pageSize}
              isFetching={showLoader}
            />
          </>
      }
    </div>
  );
};

export default OrdersHistory;


