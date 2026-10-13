'use client';

import { FunctionComponent, useEffect, useMemo, useState } from 'react';
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

  // Локальный стейт-число гарантирует 100% стабильность для RTK Query
  const [currentPage, setCurrentPage] = useState<number>(1);

  // ✅ ИСПРАВЛЕНИЕ №1: Добавляем currentPage в массив зависимостей эффекта.
  // Это исключает ссылочный конфликт гидратации между URL и локальным стейтом в React 19.
  useEffect(() => {
    if (pageFromUrl && pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl);
    }
  }, [pageFromUrl, currentPage]);

  // Мемоизируем объект параметров строго от примитивного числа currentPage
  const queryParams = useMemo(() => ({
    page: currentPage,
    pageSize,
    active: false
  }), [currentPage, pageSize]);

  // Отправляем запрос истории заказов
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

  return (
    // ✅ ИСПРАВЛЕНИЕ №2: Переводим лоадер в оверлейный режим без физического блокирования Virtual DOM.
    // Мы полностью убрали старый блокирующий блок "if (isFetching && !data)". 
    // Теперь разметка монтируется мгновенно, а оверлей плавно погаснет сразу после получения ответа.
    <div style={{ position: 'relative', minHeight: '300px', width: '100%' }}>
      <LoadingOverlay visible={isFetching && !data} overlayProps={{ blur: 1 }} />
      
      {
        !data || data.totalPages === 0 ? (
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
              items={data.items}
              totalPages={data.totalPages}
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

