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

  useEffect(() => {
    if (data?.totalPages && data.totalPages !== 0 && data.items.length === 0) {
      setPage(data.totalPages);
    }
  }, [data]);

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

  // ✅ Контролируемый флаг лоадера для истории заказов
  const showSkeletons = isFetching && !data;

  return (
    <>
    {
      data?.totalPages === 0
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
          items={data?.items}
          totalPages={data?.totalPages}
          pageSize={pageSize}
          isFetching={showSkeletons} // Передаем showSkeletons
        />
      </>
    }
    </>
  );
};

export default OrdersHistory;
