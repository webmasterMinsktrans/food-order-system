'use client';

import { FunctionComponent, useMemo } from 'react';
import { NoContentPage, OrderList } from '@/components';
import { useSearchParamValue } from '@/shared/hooks';
import noOrdersImage from '@/public/204Order.png';
import { useGetOrdersListQuery } from '@/lib/api/orderApi';
import { ErrorPage } from '@/UI';

const ActiveOrders : FunctionComponent = () => {
  // Читаем страницу напрямую из URL
  const pageFromUrl = useSearchParamValue<number>('page');
  const pageSize = 2;

  // Если роутер еще инициализируется (null), дефолтом берем 1. Никаких useState!
  const currentPage = pageFromUrl ? +pageFromUrl : 1;

  // ✅ Стабилизируем ссылку на параметры через useMemo. 
  // Теперь при любых микротасках гидратации ссылка в памяти неизменна.
  const queryParams = useMemo(() => ({ 
    page: currentPage, 
    pageSize, 
    active: true 
  }), [currentPage, pageSize]);

  // Запрашиваем данные активных заказов
  const { data, isFetching, error } = useGetOrdersListQuery(queryParams, {
    skip: typeof window === 'undefined',
    refetchOnMountOrArgChange: true, // Гарантирует правильный разбор ответа 304 Not Modified
  });

  if (error) {
    return (
      <ErrorPage
        message={(error as any)?.data?.message ?? (error as any)?.message ?? 'Ошибка загрузки заказов'}
      />
    );
  }

  // Скелетоны лоадера показываются ТОЛЬКО во время первичного fetch-запроса, когда данных в Redux еще нет
  const showLoader = isFetching && !data;

  return (
    <>
      {
        !showLoader && (!data || data.totalPages === 0 || !data.items || data.items.length === 0)
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
            isFetching={showLoader}
          />
      }
    </>
  );
};

export default ActiveOrders;
