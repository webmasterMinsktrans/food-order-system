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

  // 1. Мемоизируем парсинг периода, чтобы массив не пересоздавался в памяти при каждом рендере
  const periodParam = useMemo(() => {
    return stringToPeriod(period ?? '');
  }, [period]);

  // 2. Стабилизируем и строго типизируем объект параметров для RTK Query
  const queryParams = useMemo(() => {
    // Безопасно преобразуем нативные Date в строки ISO-формата, чтобы удовлетворить тип string в контракте API
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

  // Передаем мемоизированный queryParams вместо создания объекта "на лету"
  const { data, isFetching, error, refetch } = useSearchOrdersQuery(queryParams);

  if (error) {
    return (
      <ErrorPage 
        message={(error as any)?.data?.message ?? (error as any)?.message ?? 'Неизвестная ошибка'} 
        onRetry={refetch}
      />
    );
  }

  // Контролируем показ пустого состояния, чтобы избежать мерцания интерфейса во время фонового fetch
  const hasNoData = !isFetching && data && data.data.length === 0;

  if (isFetching || hasNoData) {
    return (
      <div className={commonClasses.loadingBox}>
        {
          isFetching ?
          <LoadingOverlay visible />
          :
          <>
            <Image src={searchEmpty} width={250} height={250} alt="Nothing found"/>
            <Title order={3}>По вашему запросу ничего не найдено</Title>
          </>
        }
      </div>
    )
  }

  return (
    <>
      <OrdersTable items={data?.data ?? []}/>
      {data && <div className={commonClasses.pagination}><Pagination total={data.totalPages}/></div>}
    </>
  )
};

export default OrdersSearchList;
