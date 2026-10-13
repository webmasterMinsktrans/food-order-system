'use client';

import { FunctionComponent, useEffect, useMemo } from 'react'; // 👈 Добавили useMemo
import { NoContentPage, OrderList } from '@/components';
import { useSearchParamValue, useUpdatePageURL } from '@/shared/hooks'; // 👈 Добавили утилиту обновления URL
import noOrdersImage from '@/public/204Order.png';
import { useGetOrdersListQuery } from '@/lib/api/orderApi';
import { ErrorPage } from '@/UI';

const ActiveOrders : FunctionComponent = () => {
  const pageFromUrl = useSearchParamValue<number>('page');
  const pageSize = 2;
  const { updateURL } = useUpdatePageURL();

  // Вычисляем текущую страницу строго на основе URL (дефолт: 1)
  const currentPage = pageFromUrl ?? 1;

  // ✅ ИСПРАВЛЕНИЕ №1: Стабилизируем объект параметров для RTK Query с помощью useMemo
  const queryParams = useMemo(() => ({
    page: currentPage,
    pageSize,
    active: true
  }), [currentPage, pageSize]);

  // Передаем стабильную ссылку queryParams вместо создания объекта "на лету"
  const { data, isFetching, error } = useGetOrdersListQuery(queryParams);

  // Извлекаем примитивы для безопасного отслеживания в зависимостях эффекта
  const totalPages = data?.totalPages;
  const itemsLength = data?.items?.length;

  // ✅ ИСПРАВЛЕНИЕ №2: Безопасный пересчет страницы при удалении элементов.
  // Вместо изменения локального стейта, мы контролируемо меняем параметр прямо в URL.
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
        isFetching={isFetching}
      />
    }
    </>
  );
};

export default ActiveOrders;
