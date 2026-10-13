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

  // ✅ ИСПРАВЛЕНИЕ №1: Приводим параметры к строгому строковому или мемоизированному виду.
  // Это гарантирует, что ключ кэша RTK Query совпадет со статусом 304 от бэкенда Минсктранса.
  const queryParams = useMemo(() => ({ 
    page, 
    pageSize, 
    active: true // Если бэкенд строго ждет boolean
  }), [page, pageSize]);

  // Запрашиваем данные активных заказов.
  // Добавляем параметр refetchOnMountOrArgChange, чтобы принудительно заставить 
  // RTK Query поднять данные из правильного локального кэша Redux при статусе 304.
  const { data, isFetching, error } = useGetOrdersListQuery(queryParams, {
    refetchOnMountOrArgChange: true, // 👈 КРИТИЧЕСКИ ВАЖНО ДЛЯ NEXT.JS 15 ПРИ ОТВЕТАХ 304
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
        message={(error as any)?.data?.message ?? (error as any)?.message ?? 'Ошибка загрузки'}
      />
    );
  }

  // ✅ ИСПРАВЛЕНИЕ №2: Если идет загрузка ЛИБО данные ЕЩЕ НЕ ИНИЦИАЛИЗИРОВАЛИСЬ в кэше (!data),
  // принудительно передаем флаг true в OrderList, чтобы скелетоны показывались законно.
  // Как только данные подтянутся из памяти Redux, флаг переключится в false, и renderItems мгновенно отобразится!
  const showLoader = isFetching || !data || !data.items;

  return (
    <>
      {
        data?.totalPages === 0
        ?
          <NoContentPage
            buttonLabel="В меню"
            href="menu"
            label="Отсутствуют активные заказы :("
            img={noOrdersImage}
          />
        :
          <OrderList
            items={data?.items ?? []} // Безопасный фолбэк для мемоизации списка
            totalPages={data?.totalPages ?? 1}
            pageSize={pageSize}
            isFetching={showLoader} // Передаем showLoader
          />
      }
    </>
  );
};

export default ActiveOrders;
