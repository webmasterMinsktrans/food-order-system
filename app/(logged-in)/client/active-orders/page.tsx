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

  // ✅ ИСПРАВЛЕНИЕ №1: Стабилизируем параметры. 
  // Если ваш бэкенд Express принимает строку, передаем "true" / "false".
  // Если бэкенд строго требует boolean, оставляем true, но ОБЯЗАТЕЛЬНО добавляем refetchOnMountOrArgChange ниже.
  const queryParams = useMemo(() => ({ 
    page, 
    pageSize, 
    active: true // Передаем легитимный boolean тип
  }), [page, pageSize]);

  // Запрашиваем данные
  const { data, isFetching, error } = useGetOrdersListQuery(queryParams, {
    // ✅ ИСПРАВЛЕНИЕ №2: Этот флаг заставит RTK Query принудительно перепроверить типы 
    // и поднять данные из правильной ветки оперативной памяти Redux, минуя асинхронные задержки Next.js 15
    refetchOnMountOrArgChange: true,
  });

  console.log('МИНСКTРАНС ДЕБАГ:', { data, isFetching, error, pageFromUrl, page });

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
        message={(error as any)?.data?.message ?? (error as any)?.message ?? 'Ошибка загрузки заказов'}
      />
    );
  }

  // ✅ ИСПРАВЛЕНИЕ №3: Лоадер должен гореть ТОЛЬКО тогда, когда идет реальная загрузка
  // И при этом у нас ЕЩЕ НЕТ никаких данных в памяти (!data || !data.items).
  const showLoader = isFetching && (!data || !data.items);

  return (
    <>
      {
        !showLoader && (data?.totalPages === 0 || !data?.items)
        ?
          <NoContentPage
            buttonLabel="В меню"
            href="menu"
            label="Отсутствуют активные заказы :("
            img={noOrdersImage}
          />
        :
          <OrderList
            items={data?.items ?? []}
            totalPages={data?.totalPages ?? 1}
            pageSize={pageSize}
            isFetching={showLoader} // Передаем showLoader
          />
      }
    </>
  );
};

export default ActiveOrders;

