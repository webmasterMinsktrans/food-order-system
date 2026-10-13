'use client';

import { FunctionComponent, useMemo } from 'react';
import { NoContentPage, OrderList } from '@/components';
import { useSearchParamValue } from '@/shared/hooks';
import noOrdersImage from '@/public/204Order.png';
import { useGetOrdersListQuery } from '@/lib/api/orderApi';
import { ErrorPage } from '@/UI';

const ActiveOrders : FunctionComponent = () => {
  const pageFromUrl = useSearchParamValue<number>('page');
  const pageSize = 2;

  // URL — единственный источник правды, убираем useState, чтобы избежать гонки состояний
  const currentPage = pageFromUrl ? +pageFromUrl : 1;

  const queryParams = useMemo(() => ({ 
    page: currentPage, 
    pageSize, 
    active: true 
  }), [currentPage, pageSize]);

  // ✅ ИСПРАВЛЕНИЕ: Параметр refetchOnMountOrArgChange заставит RTK Query 
  // принудительно выровнять типы кэша и поднять данные, минуя асинхронные задержки роутера.
  const { data, isFetching, error } = useGetOrdersListQuery(queryParams, {
    skip: typeof window === 'undefined',
    refetchOnMountOrArgChange: true, 
  });

  if (error) {
    return (
      <ErrorPage
        message={(error as any)?.data?.message ?? (error as any)?.message ?? 'Ошибка загрузки заказов'}
      />
    );
  }

  // Лоадер горит ТОЛЬКО тогда, когда идет реальная фоновая загрузка И данных в кэше еще нет
  const showLoader = isFetching && !data;

  return (
    <>
      {
        !showLoader && (!data || data.totalPages === 0)
        ?
          <NoContentPage
            buttonLabel="В меню"
            href="menu"
            label="Отсутствуют активные заказы :("
            img={noOrdersImage}
          />
        :
          <OrderList
            items={data?.items ?? []}
            totalPages={data?.totalPages ?? 1}
            pageSize={pageSize}
            isFetching={showLoader}
          />
      }
    </>
  );
};

export default ActiveOrders;
