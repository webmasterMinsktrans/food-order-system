'use client';

import { FunctionComponent, useEffect, useMemo } from 'react'; // 👈 Добавили useMemo
import { NoContentPage, OrderList, OrdersTotal } from '@/components';
import noOrdersImage from '@/public/204Order.png';
import { useSearchParamValue, useUpdatePageURL } from '@/shared/hooks'; // 👈 Добавили утилиту обновления URL
import { useGetOrdersListQuery } from '@/lib/api/orderApi';
import { ErrorPage } from '@/UI';

const OrdersHistory : FunctionComponent = () => {
  const pageFromUrl = useSearchParamValue<number>('page');
  const pageSize = 2;
  const { updateURL } = useUpdatePageURL();

  // Вычисляем текущую страницу строго на основе адресной строки URL (дефолт: 1)
  const currentPage = pageFromUrl ?? 1;

  // ✅ ИСПРАВЛЕНИЕ №1: Стабилизируем объект параметров для RTK Query с помощью useMemo
  const queryParams = useMemo(() => ({
    page: currentPage,
    pageSize,
    active: false
  }), [currentPage, pageSize]);

  // Передаем стабильную ссылку queryParams вместо создания объекта "на лету"
  const { data, isFetching, error } = useGetOrdersListQuery(queryParams);

  // Извлекаем примитивы для безопасного отслеживания в зависимостях эффекта
  const totalPages = data?.totalPages;
  const itemsLength = data?.items?.length;

  // ✅ ИСПРАВЛЕНИЕ №2: Безопасный откат страницы.
  // Вместо изменения локального стейта, мы контролируемо меняем параметр прямо в URL.
  useEffect(() => {
    if (totalPages && totalPages !== 0 && itemsLength === 0 && currentPage > totalPages) {
      updateURL(['page'], [totalPages.toString()]);
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
    <>
    {
      data?.totalPages === 0
      ?
        <NoContentPage
          buttonLabel="В меню"
          href="menu"
          label="История заказов отсутствует :("
          img={noOrdersImage}
        />
      :
      <>
        <OrdersTotal />
        <OrderList
          items={data?.items}
          totalPages={data?.totalPages}
          pageSize={pageSize}
          isFetching={isFetching}
        />
      </>
    }
    </>
  );
};

export default OrdersHistory;
