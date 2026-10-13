'use client';

import { FunctionComponent, useEffect, useMemo, useState } from 'react'; // 👈 Добавили useMemo
import { NoContentPage, OrderList } from '@/components';
import { useSearchParamValue } from '@/shared/hooks';
import noOrdersImage from '@/public/204Order.png';
import { useGetOrdersListQuery } from '@/lib/api/orderApi';
import { ErrorPage } from '@/UI';

const ActiveOrders : FunctionComponent = () => {
  const pageFromUrl = useSearchParamValue<number>('page');
  const pageSize = 2;
  const [page, setPage] = useState(pageFromUrl ?? 1);

  // ✅ ИСПРАВЛЕНИЕ №1: Мемоизируем объект параметров для RTK Query.
  // Теперь ссылка на объект в памяти будет железобетонно стабильной. 
  // Это полностью блокирует бесконечный сброс кэша и прекращает вечную загрузку.
  const queryParams = useMemo(() => ({ 
    page, 
    pageSize, 
    active: true 
  }), [page, pageSize]);

  // Передаем стабильный queryParams вместо создания объекта "на лету"
  const { data, isFetching, error } = useGetOrdersListQuery(queryParams);

  useEffect(() => {
    if (data?.totalPages && data.totalPages !== 0 && data.items.length === 0) {
      setPage(data.totalPages);
    }
  }, [data]);

  // ✅ ИСПРАВЛЕНИЕ №2: Добавляем строгое условие проверки.
  // Метод setPage выполнится ТОЛЬКО если страница из URL реально отличается от текущего стейта.
  // Это исключает холостые каскадные ререндеры при асинхронном старте роутера Next.js 15.
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
        items={data?.items}
        totalPages={data?.totalPages}
        pageSize={pageSize}
        // Передаем флаг сетевого префетчинга
        isFetching={isFetching}
      />
    }
    </>
  );
};

export default ActiveOrders;

