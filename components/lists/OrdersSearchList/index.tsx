'use client';

import { useSearchParamValues } from "@/shared/hooks";
import { ErrorPage, Pagination } from "@/UI";
import searchEmpty from '@/public/search_state.gif';
import { LoadingOverlay, Title } from "@mantine/core";
import Image from "next/image";
import { useSearchOrdersQuery } from "@/lib/api/moderatorApi";
import { OrdersTable } from "@/components";
import { stringToPeriod } from "@/shared/helpers";
import { useMemo } from "react"; // 👈 Добавили useMemo
import commonClasses from '../styles.module.scss';

const OrdersSearchList = () => {
  const pageSize = 20;
  const [page, order, sort, office, period] = useSearchParamValues(['page', 'order', 'sort', 'office', 'period']);

  // ✅ ИСПРАВЛЕНИЕ №1: Мемоизируем парсинг периода, чтобы массив не пересоздавался при каждом рендере
  const periodParam = useMemo(() => {
    return stringToPeriod(period ?? '');
  }, [period]);

  // ✅ ИСПРАВЛЕНИЕ №2: Стабилизируем весь объект параметров для RTK Query
  const queryParams = useMemo(() => ({
    page: page ? +page : 1,
    pageSize,
    sortOrder: order,
    orderBy: sort,
    deliveryDestinationId: office,
    periodStart: periodParam[0] ? periodParam[0] : undefined,
    periodEnd: periodParam[1] ? periodParam[1] : undefined
  }), [page, order, sort, office, periodParam]);

  // Передаем мемоизированный queryParams
  const { data, isFetching, error, refetch } = useSearchOrdersQuery(queryParams);

  if (error) {
    return (
      <ErrorPage 
        message={(error as any)?.message ?? 'Неизвестная ошибка'} 
        onRetry={refetch}
      />
    );
  }

  // ✅ ИСПРАВЛЕНИЕ №3: Оптимизируем условие проверки. 
  // Используем data.data для проверки длины, только если данные успешно загружены и не находятся в процессе fetch
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
