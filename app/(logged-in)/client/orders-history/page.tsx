'use client';

import { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { NoContentPage, OrderList, OrdersTotal } from '@/components';
import noOrdersImage from '@/public/204Order.png';
import { useSearchParamValue } from '@/shared/hooks';
import { useGetOrdersListQuery } from '@/lib/api/orderApi';
import { ErrorPage } from '@/UI';

const OrdersHistory : FunctionComponent = () => {
  const pageFromUrl = useSearchParamValue<number>('page');
  const pageSize = 2;
  const [page, setPage] = useState(pageFromUrl ?? 1);

  const queryParams = useMemo(() => ({ 
    page, 
    pageSize, 
    active: false 
  }), [page, pageSize]);

  const { data, isFetching, error } = useGetOrdersListQuery(queryParams);

  // ✅ Безопасное извлечение массива для истории заказов при ответах 304
  const ordersItems = useMemo(() => {
    if (!data) return [];
    if ('data' in data && Array.isArray((data as any).data?.items)) {
      return (data as any).data.items;
    }
    return data.items ?? [];
  }, [data]);

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

  return (
    <>
    {
      totalPagesCount === 0 || (ordersItems.length === 0 && !isFetching)
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
          items={ordersItems}
          totalPages={totalPagesCount}
          pageSize={pageSize}
          isFetching={isFetching}
        />
      </>
    }
    </>
  );
};

export default OrdersHistory;

