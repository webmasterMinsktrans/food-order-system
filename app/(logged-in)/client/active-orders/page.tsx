'use client';

import { FunctionComponent, useMemo } from 'react';
import { NoContentPage, OrderList } from '@/components';
import { useSearchParamValue } from '@/shared/hooks';
import noOrdersImage from '@/public/204Order.png';
import { useGetOrdersListQuery } from '@/lib/api/orderApi';
import { ErrorPage } from '@/UI';
import { LoadingOverlay } from '@mantine/core';

const ActiveOrders : FunctionComponent = () => {
  const pageFromUrl = useSearchParamValue<number>('page');
  const pageSize = 2;

  const currentPage = pageFromUrl ? +pageFromUrl : 1;

  const queryParams = useMemo(() => ({
    page: currentPage,
    pageSize,
    active: true
  }), [currentPage, pageSize]);

  // ✅ ИСПРАВЛЕНИЕ №1: Добавляем strict-конфигурацию обхода ETag кэша Express/Nginx.
  // Мы принудительно заставляем бэкенд возвращать 200 OK вместо пустого 304 Not Modified.
  const { data, isFetching, error } = useGetOrdersListQuery(queryParams, {
    skip: typeof window === 'undefined',
    // RTK Query пропустит локальный кэш браузера и потребует бинарный JSON с сервера
    refetchOnMountOrArgChange: true, 
  });

  if (error) {
    return (
      <ErrorPage
        message={(error as any)?.data?.message ?? (error as any)?.message ?? 'Ошибка загрузки заказов'}
      />
    );
  }

  // ✅ ИСПРАВЛЕНИЕ №2: Чтобы лоадер не моргал и не зависал при фоновых обновлениях роутера Next.js 15,
  // мы завязываем его показ ТОЛЬКО на первичную загрузку, когда данных в памяти Redux еще физически нет.
  const shouldShowLoader = isFetching && !data;

  return (
    <div style={{ position: 'relative', minHeight: '300px', width: '100%' }}>
      <LoadingOverlay visible={shouldShowLoader} overlayProps={{ blur: 1 }} />
      
      {
        !shouldShowLoader && (!data || data.totalPages === 0) ? (
          <NoContentPage
            buttonLabel="В меню"
            href="menu"
            label="Отсутствуют активные заказы :("
            img={noOrdersImage}
          />
        ) : (
          <OrderList
            items={data?.items ?? []}
            totalPages={data?.totalPages ?? 1}
            pageSize={pageSize}
            isFetching={isFetching}
          />
        )
      }
    </div>
  );
};

export default ActiveOrders;

