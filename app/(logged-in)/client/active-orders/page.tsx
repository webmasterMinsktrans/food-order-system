'use client';

import { FunctionComponent, useEffect, useMemo } from 'react';
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

  const currentPage = pageFromUrl ?? 1;

  const queryParams = useMemo(() => ({
    page: currentPage,
    pageSize,
    active: true
  }), [currentPage, pageSize]);

  // ✅ ИСПРАВЛЕНИЕ №1: Добавляем флаг skip. 
  // Блокирует сетевую активность Node.js на этапе SSR до полной инициализации роутера в браузере.
  const { data, isFetching, error } = useGetOrdersListQuery(queryParams, {
    skip: typeof window === 'undefined'
  });

  const totalPages = data?.totalPages;
  const itemsLength = data?.items?.length;

  useEffect(() => {
    if (totalPages && totalPages !== 0 && itemsLength === 0 && currentPage > totalPages) {
      updateURL(['page'], [totalPages.toString()]);
    }
  }, [totalPages, itemsLength, currentPage, updateURL]);

  if (error) {
    return (
      <ErrorPage
        message={(error as any)?.data?.message ?? (error as any)?.message ?? 'Ошибка загрузки заказов'}
      />
    );
  }

  // ✅ ИСПРАВЛЕНИЕ №2: Условие показа лоадера теперь объединяет статус сетевой загрузки 
  // и серверную проверку. Это гарантирует, что и сервер, и клиент при первой миллисекунде 
  // отрисуют абсолютно идентичную структуру, полностью исключая Hydration Mismatch.
  const shouldShowLoader = isFetching || !data || typeof window === 'undefined';

  if (shouldShowLoader) {
    return (
      // ✅ ИСПРАВЛЕНИЕ №3: Заменяем локальный scss-класс на стабильные инлайн-стили.
      // Это страхует компонент LoadingOverlay от каскадных падений из-за задержки инициализации модулей CSS.
      <div style={{ position: 'relative', minHeight: '200px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <LoadingOverlay visible overlayProps={{ blur: 1 }} />
      </div>
    );
  }

  return (
    <>
      {
        data.totalPages === 0
        ?
          <NoContentPage
            buttonLabel="В меню"
            href="menu"
            label="Отсутствуют активные заказы :("
            img={noOrdersImage}
          />
        :
          <OrderList
            items={data.items}
            totalPages={data.totalPages}
            pageSize={pageSize}
            isFetching={isFetching}
          />
      }
    </>
  );
};

export default ActiveOrders;

