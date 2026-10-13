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

  // ✅ ИСПРАВЛЕНИЕ №1: Если идет загрузка (включая самую первую долю секунды инициализации),
  // строго возвращаем только лоадер, не допуская ложного рендеринга таблицы или заглушки.
  if (isFetching || !data) {
    return (
      <div className={commonClasses.loadingBox}>
        <LoadingOverlay visible />
      </div>
    );
  }

  // ✅ ИСПРАВЛЕНИЕ №2: Проверка отсутствия данных срабатывает только когда data гарантированно загружен
  const hasNoData = data.data.length === 0;

  if (hasNoData) {
    return (
      <div className={commonClasses.loadingBox}>
        <Image 
          src={searchEmpty} 
          width={250} 
          height={250} 
          alt="Nothing found"
          priority // Ускоряет отрисовку заглушки в Next.js 15
        />
        <Title order={3}>По вашему запросу ничего не найдено</Title>
      </div>
    );
  }

  // Сюда код дойдет только тогда, когда загрузка завершена и в массиве реально есть заказы
  return (
    <>
      <OrdersTable items={data.data}/>
      <div className={commonClasses.pagination}>
        <Pagination total={data.totalPages}/>
      </div>
    </>
  );
};

export default OrdersSearchList;

