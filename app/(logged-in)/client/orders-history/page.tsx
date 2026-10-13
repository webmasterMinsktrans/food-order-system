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

  // Добавляем refetchOnMountOrArgChange для синхронизации кэша истории
  const { data, isFetching, error } = useGetOrdersListQuery(queryParams, {
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (data?.totalPages && data.totalPages !== 0 && data.items?.length === 0) {
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
        message={(error as any)?.data?.message ?? (error as any)?.message ?? 'Ошибка загрузки истории заказов'}
      />
    );
  }

  const showLoader = isFetching && (!data || !data.items);

  return (
    <>
      {
        !showLoader && (data?.totalPages === 0 || !data?.items)
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
    </>
  );
};

export default OrdersHistory;

