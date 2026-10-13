'use client';

import { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { NoContentPage, OrderList } from '@/components';
import { useSearchParamValue } from '@/shared/hooks';
import noOrdersImage from '@/public/204Order.png';
import { useGetOrdersListQuery } from '@/lib/api/orderApi';
import { ErrorPage } from '@/UI';

const ActiveOrders : FunctionComponent = () => {
  const pageFromUrl = useSearchParamValue<number>('page');
  const pageSize = 2;
  const [page, setPage] = useState(pageFromUrl ?? 1);

  const queryParams = useMemo(() => ({ 
    page, 
    pageSize, 
    active: true 
  }), [page, pageSize]);

  const { data, isFetching, error } = useGetOrdersListQuery(queryParams);

  // ✅ ИСПРАВЛЕНИЕ №1: Безопасное извлечение массива заказов с учетом кэша 304 Not Modified.
  // Если RTK Query обернул ответ в дополнительный слой data.data, мы берем его оттуда.
  // Если ответ плоский — берем напрямую из data.items. Это полностью решает проблему length: 0!
  const ordersItems = useMemo(() => {
    if (!data) return [];
    if ('data' in data && Array.isArray((data as any).data?.items)) {
      return (data as any).data.items;
    }
    return data.items ?? [];
  }, [data]);

  // ✅ ИСПРАВЛЕНИЕ №2: Точно так же безопасно извлекаем общее количество страниц
  const totalPagesCount = useMemo(() => {
    if (!data) return 1;
    if ('data' in data && typeof (data as any).data?.totalPages === 'number') {
      return (data as any).data.totalPages;
    }
    return data.totalPages ?? 1;
  }, [data]);

  useEffect(() => {
    if (totalPagesCount && totalPagesCount !== 0 && ordersItems.length === 0) {
      setPage(totalPagesCount);
    }
  }, [totalPagesCount, ordersItems]);

  useEffect(() => {
    const targetPage = pageFromUrl ?? 1;
    if (targetPage !== page) {
      setPage(targetPage);
    }
  }, [pageFromUrl, page]);

  if (error) {
    return (
      <ErrorPage
        message={(error as any)?.message}
      />
    );
  }
  console.log(ordersItems);
  return (
    <>
    {
      totalPagesCount === 0 || (ordersItems.length === 0 && !isFetching)
      ?
        <NoContentPage
          buttonLabel="В меню"
          href="menu"
          label="Отсутствуют активные заказы :("
          img={noOrdersImage}
        />
      :
      <OrderList
        // Передаем очищенный, гарантированно наполненный массив
        items={ordersItems}
        totalPages={totalPagesCount}
        pageSize={pageSize}
        isFetching={isFetching}
      />
    }
    </>
  );
};

export default ActiveOrders;


