'use client';

import { FunctionComponent, useEffect, useMemo, useState } from 'react'; // 👈 Вернули useState
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

  // ✅ ИСПРАВЛЕНИЕ №1: Базируем пагинацию на локальном стейте-числе.
  // Это гарантирует 100% стабильность для RTK Query, так как у числа нет скрытых ссылок в памяти.
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Синхронизируем страницу из URL в стейт только тогда, когда URL реально изменился
  useEffect(() => {
    if (pageFromUrl && pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl);
    }
  }, [pageFromUrl]);

  // ✅ ИСПРАВЛЕНИЕ №2: Мемоизируем объект строго от примитивного числа currentPage
  const queryParams = useMemo(() => ({
    page: currentPage,
    pageSize,
    active: true
  }), [currentPage, pageSize]);

  // Отправляем запрос. Убираем 'skip', чтобы клиент сразу начал стягивать данные
  const { data, isFetching, error } = useGetOrdersListQuery(queryParams);

  const totalPages = data?.totalPages;
  const itemsLength = data?.items?.length;

  // Автоматический откат страницы, если все элементы на ней были удалены/отменены
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

  // ✅ ИСПРАВЛЕНИЕ №3: Лоадер должен гореть ТОЛЬКО тогда, когда идет реальная сетевая загрузка (isFetching) 
  // И при этом у нас ЕЩЕ НЕТ никаких старых закэшированных данных (!data).
  // Это убирает вечное залипание спиннера при инициализации страниц в Next.js 15.
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

