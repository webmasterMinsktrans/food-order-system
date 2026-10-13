'use client';

import { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { NoContentPage, OrderList } from '@/components';
import { useSearchParamValue, useUpdatePageURL } from '@/shared/hooks';
import noOrdersImage from '@/public/204Order.png';
import { useGetOrdersListQuery } from '@/lib/api/orderApi';
import { ErrorPage } from '@/UI';
import { LoadingOverlay } from '@mantine/core';

const ActiveOrders : FunctionComponent = () => {
  const pageFromUrl = useSearchParamValue<number>('page');
  const pageSize = 2;
  const { updateURL } = useUpdatePageURL();

  // Локальный стейт-число гарантирует 100% стабильность для RTK Query
  const [currentPage, setCurrentPage] = useState<number>(1);

  // ✅ ИСПРАВЛЕНИЕ №1: Синхронизируем стейт и URL строго с указанием currentPage в зависимостях
  useEffect(() => {
    if (pageFromUrl && pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl);
    }
  }, [pageFromUrl, currentPage]);

  // Мемоизируем параметры
  const queryParams = useMemo(() => ({
    page: currentPage,
    pageSize,
    active: true
  }), [currentPage, pageSize]);

  // Отправляем запрос списка активных заказов
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
        message={(error as any)?.data?.message ?? (error as any)?.message ?? 'Ошибка загрузки заказов'}
      />
    );
  }

  return (
    // ✅ ИСПРАВЛЕНИЕ №2: Оборачиваем контейнер в инлайн-стили с оверлейным LoadingOverlay.
    // Мы убрали блокирующий if (isFetching) return <Loader />.
    // Теперь разметка компонента монтируется мгновенно, связь с кэшем Redux не теряется,
    // а лоадер плавно исчезает сразу после получения бинарного ответа бэкенда Минсктранса.
    <div style={{ position: 'relative', minHeight: '300px', width: '100%' }}>
      <LoadingOverlay visible={isFetching && !data} overlayProps={{ blur: 1 }} />
      
      {
        !data || data.totalPages === 0 ? (
          <NoContentPage
            buttonLabel="В меню"
            href="menu"
            label="Отсутствуют активные заказы :("
            img={noOrdersImage}
          />
        ) : (
          <OrderList
            items={data.items}
            totalPages={data.totalPages}
            pageSize={pageSize}
            isFetching={isFetching}
          />
        )
      }
    </div>
  );
};

export default ActiveOrders;


