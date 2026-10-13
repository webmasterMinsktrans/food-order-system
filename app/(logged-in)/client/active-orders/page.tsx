'use client';

import { FunctionComponent, useEffect, useMemo, useTransition } from 'react'; // 👈 Добавили useMemo и useTransition
import { NoContentPage, OrderList } from '@/components';
import { useSearchParamValue, useUpdatePageURL } from '@/shared/hooks'; // 👈 Подключаем утилиту обновления URL
import noOrdersImage from '@/public/204Order.png';
import { useGetOrdersListQuery } from '@/lib/api/orderApi';
import { ErrorPage } from '@/UI';
import { LoadingOverlay } from '@mantine/core';

const ActiveOrders : FunctionComponent = () => {
  const pageFromUrl = useSearchParamValue<number>('page');
  const pageSize = 2;
  const { updateURL } = useUpdatePageURL();
  const [, startTransition] = useTransition(); // Инициализируем хук перехода для React 19

  // Вычисляем текущую страницу строго на основе URL-строки (дефолт: 1)
  const currentPage = pageFromUrl ? +pageFromUrl : 1;

  // ✅ ИСПРАВЛЕНИЕ №1: Стабилизируем объект параметров для RTK Query с помощью useMemo
  const queryParams = useMemo(() => ({
    page: currentPage,
    pageSize,
    active: true
  }), [currentPage, pageSize]);

  // Передаем стабильную ссылку queryParams вместо создания объекта "на лету"
  // Запрос блокируется на сервере, пока Next.js 15 не инициализирует роутер на клиенте
  const { data, isFetching, error } = useGetOrdersListQuery(queryParams, {
    skip: typeof window === 'undefined'
  });

  // Извлекаем примитивы для безопасного отслеживания в зависимостях эффекта
  const totalPages = data?.totalPages;
  const itemsLength = data?.items?.length;

  // ✅ ИСПРАВЛЕНИЕ №2: Безопасный пересчет страницы обернут в startTransition.
  // Это полностью устраняет бесконечный цикл обновлений роутера.
  useEffect(() => {
    if (totalPages && totalPages !== 0 && itemsLength === 0 && currentPage > totalPages) {
      startTransition(() => {
        updateURL(['page'], [totalPages.toString()]);
      });
    }
  }, [totalPages, itemsLength, currentPage, updateURL]);

  if (error) {
    return (
      <ErrorPage
        message={(error as any)?.data?.message ?? (error as any)?.message ?? 'Ошибка загрузки заказов'}
      />
    );
  }

  // ✅ ИСПРАВЛЕНИЕ №3: Лоадер работает в мягком оверлейном режиме, 
  // подстраиваясь под особенности асинхронного обновления контекста роутера в Next.js 15
  const shouldShowLoader = isFetching || !data || typeof window === 'undefined';

  return (
    <div style={{ position: 'relative', minHeight: '300px', width: '100%' }}>
      <LoadingOverlay visible={shouldShowLoader} overlayProps={{ blur: 1 }} />
      
      {
        !shouldShowLoader && (data?.totalPages === 0 || !data?.items) ? (
          <NoContentPage
            buttonLabel="В меню"
            href="menu"
            label="Отсутствуют активные заказы :("
            img={noOrdersImage}
          />
        ) : (
          <OrderList
            items={data?.items ?? []}
            totalPages={data?.totalPages ?? 1}
            pageSize={pageSize}
            isFetching={isFetching}
          />
        )
      }
    </div>
  );
};

export default ActiveOrders;

