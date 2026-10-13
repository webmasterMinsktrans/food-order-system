'use client';

import { useSearchParamValues } from "@/shared/hooks";
import { ErrorPage, Pagination } from "@/UI";
import searchEmpty from '@/public/search_state.gif';
import { LoadingOverlay, Title } from "@mantine/core";
import Image from "next/image";
import { useSearchOrdersQuery } from "@/lib/api/moderatorApi";
import { OrdersTable } from "@/components";
import { stringToPeriod } from "@/shared/helpers";
import { useMemo } from "react";
import dayjs from "dayjs"; 
import commonClasses from '../styles.module.scss';

const OrdersSearchList = () => {
  const pageSize = 20;
  const [page, order, sort, office, period] = useSearchParamValues(['page', 'order', 'sort', 'office', 'period']);

  // Мемоизируем парсинг периода
  const periodParam = useMemo(() => {
    return stringToPeriod(period ?? '');
  }, [period]);

  // Стабилизируем и строго типизируем объект параметров для RTK Query
  const queryParams = useMemo(() => {
    const startIso = periodParam && periodParam[0] ? dayjs(periodParam[0]).toISOString() : undefined;
    const endIso = periodParam && periodParam[1] ? dayjs(periodParam[1]).toISOString() : undefined;

    return {
      page: page ? +page : 1,
      pageSize,
      sortOrder: order || undefined,
      orderBy: sort || undefined,
      deliveryDestinationId: office || undefined,
      periodStart: startIso,
      periodEnd: endIso
    };
  }, [page, order, sort, office, periodParam]);

  // Проверяем, пуст ли параметр офиса (филиала)
  const isOfficeNotSelected = !office || office === '' || office === 'undefined';

  // Отправляем запрос списка заказов модератора
  const { data, isFetching, error, refetch } = useSearchOrdersQuery(
    queryParams,
    { skip: isOfficeNotSelected }
  );

  if (error) {
    return (
      <ErrorPage 
        message={(error as any)?.data?.message ?? (error as any)?.message ?? 'Неизвестная ошибка'} 
        onRetry={refetch}
      />
    );
  }

  // Если филиал ещё не выбран в фильтре — показываем аккуратное приглашение к действию
  if (isOfficeNotSelected) {
    return (
      <div className={commonClasses.loadingBox} style={{ paddingTop: '60px' }}>
        <Title order={4} c="dimmed" ta="center" style={{ fontWeight: 500 }}>
          Для просмотра списка заказов выберите филиал в фильтре выше
        </Title>
      </div>
    );
  }

  // ✅ ИСПРАВЛЕНИЕ №1: Безопасное извлечение массива данных и тоталов с защитой от undefined.
  // Это полностью страхует страницу от падения TypeError во время асинхронных ререндеров Next.js 15.
  const ordersItems = data?.data ?? [];
  const totalPagesCount = data?.totalPages ?? 1;

  // ✅ ИСПРАВЛЕНИЕ №2: Рассчитываем флаг мягкого оверлейного лоадера.
  // Спиннер будет гореть только тогда, когда идет первичный запрос, а в памяти Redux еще нет данных.
  const isDataLoading = isFetching && !data;
  const hasNoData = !isFetching && data && ordersItems.length === 0;

  return (
    // ✅ ИСПРАВЛЕНИЕ №3: Оборачиваем весь рендер в контейнер с относительным позиционированием.
    // Мы полностью убрали блокирующий "if (isFetching || !data) return ...".
    // Теперь разметка стабильна, а LoadingOverlay перекрывает контейнер, не разрушая связи Virtual DOM!
    <div style={{ position: 'relative', minHeight: '300px', width: '100%' }}>
      <LoadingOverlay visible={isFetching || !data} overlayProps={{ blur: 1 }} />
      
      {
        hasNoData ? (
          <div className={commonClasses.loadingBox}>
            <Image 
              src={searchEmpty} 
              width={250} 
              height={250} 
              alt="Nothing found"
              priority 
            />
            <Title order={3}>По вашему запросу ничего не найдено</Title>
          </div>
        ) : (
          // Отрисовываем контент, передавая безопасный массив ordersItems
          <>
            <OrdersTable items={ordersItems} />
            {ordersItems.length > 0 && (
              <div className={commonClasses.pagination}>
                <Pagination total={totalPagesCount} />
              </div>
            )}
          </>
        )
      }
    </div>
  );
};

export default OrdersSearchList;
