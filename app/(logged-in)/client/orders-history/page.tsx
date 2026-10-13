'use client';

import { FunctionComponent, useMemo } from 'react';
import { NoContentPage, OrderList, OrdersTotal } from '@/components';
import noOrdersImage from '@/public/204Order.png';
import { useSearchParamValue } from '@/shared/hooks';
import { useGetOrdersListQuery } from '@/lib/api/orderApi';
import { ErrorPage } from '@/UI';
import { LoadingOverlay } from '@mantine/core';

const OrdersHistory : FunctionComponent = () => {
  const pageFromUrl = useSearchParamValue<number>('page');
  const pageSize = 2;

  const currentPage = pageFromUrl ? +pageFromUrl : 1;

  const queryParams = useMemo(() => ({
    page: currentPage,
    pageSize,
    active: false
  }), [currentPage, pageSize]);

  // ✅ ИСПРАВЛЕНИЕ №1: Добавляем refetchOnMountOrArgChange для уничтожения 304 ответов Nginx
  const { data, isFetching, error } = useGetOrdersListQuery(queryParams, {
    skip: typeof window === 'undefined',
    refetchOnMountOrArgChange: true,
  });

  if (error) {
    return (
      <ErrorPage
        message={(error as any)?.data?.message ?? (error as any)?.message ?? 'Ошибка загрузки истории заказов'}
      />
    );
  }

  // Спиннер горит только во время первичного fetch-запроса, если кэш пуст
  const shouldShowLoader = isFetching && !data;

  return (
    <div style={{ position: 'relative', minHeight: '300px', width: '100%' }}>
      <LoadingOverlay visible={shouldShowLoader} overlayProps={{ blur: 1 }} />
      
      {
        !shouldShowLoader && (!data || data.totalPages === 0) ? (
          <NoContentPage
            buttonLabel="В меню"
            href="menu"
            label="История заказов отсутствует :("
            img={noOrdersImage}
          />
        ) : (
          <>
            <OrdersTotal />
            <OrderList
              items={data?.items ?? []}
              totalPages={data?.totalPages ?? 1}
              pageSize={pageSize}
              isFetching={isFetching}
            />
          </>
        )
      }
    </div>
  );
};

export default OrdersHistory;
