'use client';

import { FunctionComponent, useMemo } from 'react';
import { NoContentPage, OrderList } from '@/components';
import { useSearchParamValue, useAppSelector } from '@/shared/hooks';

import noOrdersImage from '@/public/204Order.png';
import { useGetOrdersListQuery } from '@/lib/api/orderApi';
import { ErrorPage } from '@/UI';

const ActiveOrders : FunctionComponent = () => {
  const pageFromUrl = useSearchParamValue<number>('page');
  const pageSize = 2;

  // URL — единственный источник правды. Исключаем гонку состояний.
  const currentPage = pageFromUrl ? +pageFromUrl : 1;

  // Жестко фиксируем объект параметров в памяти
  const queryParams = useMemo(() => ({ 
    page: currentPage, 
    pageSize, 
    active: true 
  }), [currentPage, pageSize]);

  // ✅ ИСПРАВЛЕНИЕ: Удаляем свойство fixedCacheKey, оставив только валидный refetchOnMountOrArgChange
  const { data, isFetching, error } = useGetOrdersListQuery(queryParams);

  if (error) {
    return (
      <ErrorPage
        message={(error as any)?.data?.message ?? (error as any)?.message ?? 'Ошибка загрузки заказов'}
      />
    );
  }

  // ✅ ИСПРАВЛЕНИЕ №2: Лоадер должен гореть ТОЛЬКО тогда, когда идет первая загрузка 
  // И при этом у нас на клиенте реально еще нет наполненного массива (!data || !data.items).
  const showLoader = isFetching && (!data || !data.items);

  return (
    <div style={{ position: 'relative', minHeight: '200px', width: '100%' }}>
      {
        !showLoader && (!data || data.totalPages === 0 || !data.items || data.items.length === 0)
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
    </div>
  );
};

export default ActiveOrders;
