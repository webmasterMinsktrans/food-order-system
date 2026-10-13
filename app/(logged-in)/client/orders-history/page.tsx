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

  const showLoader = isFetching && !data;

  return (
    <>
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
    </>
  );
};

export default OrdersHistory;


