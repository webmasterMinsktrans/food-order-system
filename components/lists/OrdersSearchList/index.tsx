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

  const periodParam = useMemo(() => {
    return stringToPeriod(period ?? '');
  }, [period]);

  const queryParams = useMemo(() => {
    const startIso = periodParam && periodParam[0] ? dayjs(periodParam[0]).toISOString() : undefined;
    const endIso = periodParam && periodParam[1] ? dayjs(periodParam[1]).toISOString() : undefined;

    return {
      page: page ? +page : 1,
      pageSize,
      sortOrder: order || undefined,
      orderBy: sort || undefined,
      // ✅ Исправление: Если офис не выбран в URL, передаем undefined, чтобы бэкенд Express вернул ВСЕ филиалы по умолчанию
      deliveryDestinationId: office && office !== 'undefined' ? office : undefined,
      periodStart: startIso,
      periodEnd: endIso
    };
  }, [page, order, sort, office, periodParam]);

  // ✅ ИСПРАВЛЕНИЕ: Полностью УБРАЛИ параметр { skip: isOfficeNotSelected }.
  // Запрос улетает на бэкенд сразу же при монтировании страницы в DOM.
  const { data, isFetching, error, refetch } = useSearchOrdersQuery(queryParams);

  if (error) {
    return (
      <ErrorPage 
        message={(error as any)?.data?.message ?? (error as any)?.message ?? 'Неизвестная ошибка'} 
        onRetry={refetch}
      />
    );
  }

  const ordersItems = data?.data ?? [];
  const totalPagesCount = data?.totalPages ?? 1;
  const hasNoData = !isFetching && data && ordersItems.length === 0;

  return (
    <div style={{ position: 'relative', minHeight: '300px', width: '100%' }}>
      {/* Спиннер мягко перекрывает таблицу только во время выполнения запроса */}
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
