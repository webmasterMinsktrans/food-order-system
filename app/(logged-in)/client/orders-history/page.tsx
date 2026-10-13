'use client';

import { FunctionComponent, useEffect, useMemo, useState } from 'react'; // 👈 Вернули useState
import { NoContentPage, OrderList, OrdersTotal } from '@/components';
import noOrdersImage from '@/public/204Order.png';
import { useSearchParamValue, useUpdatePageURL } from '@/shared/hooks';
import { useGetOrdersListQuery } from '@/lib/api/orderApi';
import { ErrorPage } from '@/UI';
import { LoadingOverlay } from '@mantine/core';

const OrdersHistory : FunctionComponent = () => {
  const pageFromUrl = useSearchParamValue<number>('page');
  const pageSize = 2;
  const { updateURL } = useUpdatePageURL();

  // ✅ ИСПРАВЛЕНИЕ №1: Базируем пагинацию на локальном стейте-числе
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Синхронизируем страницу из URL в стейт
  useEffect(() => {
    if (pageFromUrl && pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl);
    }
  }, [pageFromUrl]);

  // ✅ ИСПРАВЛЕНИЕ №2: Мемоизируем объект строго от примитивного числа currentPage
  const queryParams = useMemo(() => ({
    page: currentPage,
    pageSize,
    active: false
  }), [currentPage, pageSize]);

  // Отправляем запрос истории
  const { data, isFetching, error } = useGetOrdersListQuery(queryParams);

  const totalPages = data?.totalPages;
  const itemsLength = data?.items?.length;

  // Автоматический откат страницы при удалении элементов
  useEffect(() => {
    if (totalPages && totalPages !== 0 && itemsLength === 0 && currentPage > totalPages) {
      updateURL(['page'], [totalPages.toString()]);
      setCurrentPage(totalPages);
    }
  }, [totalPages, itemsLength, currentPage, updateURL]);

  if (error) {
    return (
      <ErrorPage
        message={(error as any)?.data?.message ?? (error as any)?.message ?? 'Ошибка загрузки истории заказов'}
      />
    );
  }

  // ✅ ИСПРАВЛЕНИЕ №3: Лоадер горит строго во время первой загрузки (isFetching && !data)
  if (isFetching && !data) {
    return (
      <div style={{ position: 'relative', minHeight: '200px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <LoadingOverlay visible overlayProps={{ blur: 1 }} />
      </div>
    );
  }

  return (
    <>
      {
        !data || data.totalPages === 0
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
            items={data.items}
            totalPages={data.totalPages}
            pageSize={pageSize}
            isFetching={isFetching}
          />
        </>
      }
    </>
  );
};

export default OrdersHistory;
