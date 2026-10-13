'use client';

import { Flex, Stack, StackProps } from '@mantine/core';
import { FunctionComponent, useMemo } from 'react';
import { OrderMainInfoDto } from '@/shared/types';
import OrderCard from '../cards/OrderCard/OrderCard';
import { Pagination } from '@/UI';

interface OrderListProps extends StackProps {
  items?: OrderMainInfoDto[],
  totalPages?: number,
  isFetching?: boolean,
  pageSize: number,
}

export const OrderList: FunctionComponent<OrderListProps> = (props) => {
  const { items, totalPages = 1, isFetching = false, pageSize, ...stackProps } = props;

  // Лог дебага для отслеживания состояний в рантайме
  console.log('=== МИНСКTРАНС: СПИСОК ===', { 
    itemsReceived: !!items, 
    length: items?.length, 
    isFetching 
  });

  // Мемоизируем скелетоны загрузки
  const loadingContent = useMemo(() => {
    return Array.from({ length: pageSize }).map((_, index) => (
      <OrderCard key={`skeleton-${index}`} isLoading />
    ));
  }, [pageSize]);

  // Мемоизируем список реальных заказов
  const renderItems = useMemo(() => {
    if (!items || items.length === 0) return null;
    return items.map((item) => (
      <OrderCard
        key={`${item.number}-${item.issued}`}
        orderMainInfoDto={item}
      />
    ));
  }, [items]);

  // ✅ ИСПРАВЛЕНИЕ №1: Вычисляем реальное наличие данных в памяти браузера.
  // Если массив items существует и в нем есть хотя бы один заказ — флаг становится true.
  const hasLoadedData = !!items && items.length > 0;

  return (
    <Stack gap="xl" align="center" w="100%" {...stackProps}>
      {/* ✅ ИСПРАВЛЕНИЕ №2: Скелетоны показываются ТОЛЬКО тогда, когда идет загрузка 
          И при этом у нас еще нет загруженных данных в памяти (!hasLoadedData).
          Как только бэкенд вернул 304 Not Modified и кэш подставил элементы, скелетоны мгновенно скроются! */}
      {isFetching && !hasLoadedData && loadingContent}
      
      {/* ✅ ИСПРАВЛЕНИЕ №3: Реальные карточки заказов отображаются сразу, как только они 
          появились в массиве items, игнорируя зависший в true служебный флаг isFetching. */}
      {hasLoadedData && renderItems}

      {/* Фолбэк-заглушка на случай, если загрузка завершена, а данных нет совсем */}
      {!isFetching && !hasLoadedData && null}
      
      <Flex w="100%" justify="flex-end" align="flex-end" flex="1 1 auto">
        <Pagination
          total={totalPages}
          boundaries={0}
          gap={4}
          size="sm"
        />
      </Flex>
    </Stack>
  );
};

export default OrderList;

