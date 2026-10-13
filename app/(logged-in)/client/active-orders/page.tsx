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

  // Мемоизируем объект параметров для идеальной стабильности ссылок в React 19
  const queryParams = useMemo(() => ({ 
    page, 
    pageSize, 
    active: true 
  }), [page, pageSize]);

  // Запрашиваем данные активных заказов
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

  // ✅ ИСПРАВЛЕНИЕ: Рассчитываем строгий контролируемый флаг для скрытия скелетонов.
  // Серые блоки покажутся ТОЛЬКО тогда, когда идет реальный сетевой запрос (isFetching === true)
  // И при этом в памяти Redux еще нет вообще никаких загруженных данных (!data || !data.items).
  // Во всех остальных случаях (включая статус 304 Not Modified) страница мгновенно отобразит реальные заказы!
  const showSkeletons = isFetching && (!data || !data.items);
   
  console.log('=== МИНСКTРАНС: РОДИТЕЛЬ ===', { 
    hasData: !!data, 
    itemsCount: data?.items?.length, 
    isFetching, 
    error: error ? true : false 
  });
  
  return (
    <>
    {
      data?.totalPages === 0
      ?
        <NoContentPage
          buttonLabel="В меню"
          href="menu"
          label="Отсутствуют active заказы :("
          img={noOrdersImage}
        />
      :
      <OrderList
        items={data?.items ?? []} // Передаем пустой массив в качестве фолбэка, чтобы избежать null в OrderList
        totalPages={data?.totalPages ?? 1}
        pageSize={pageSize}
        // Передаем контролируемый флаг вместо сырого асинхронного isFetching
        isFetching={showSkeletons}
      />
    }
    </>
  );
};

export default ActiveOrders;

