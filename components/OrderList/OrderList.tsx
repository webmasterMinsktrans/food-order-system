'use client';

import { Flex, Stack, StackProps } from '@mantine/core';
import { FunctionComponent, useMemo } from 'react'; // 👈 Добавили useMemo
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

  // ✅ ИСПРАВЛЕНИЕ №1: Мемоизируем скелетоны загрузки.
  // Теперь массив пустых карточек создается строго один раз при изменении pageSize,
  // что полностью убирает паразитные каскадные ререндеры в React 19.
  const loadingContent = useMemo(() => {
    return Array.from({ length: pageSize }).map((_, index) => (
      <OrderCard key={`skeleton-${index}`} isLoading />
    ));
  }, [pageSize]);

  // ✅ ИСПРАВЛЕНИЕ №2: Мемоизируем список реальных заказов,
  // чтобы зафиксировать ссылки на дочерние карточки в памяти Virtual DOM.
  const renderItems = useMemo(() => {
    if (!items) return null;
    return items.map((item) => (
      <OrderCard
        key={`${item.number}-${item.issued}`}
        orderMainInfoDto={item}
      />
    ));
  }, [items]);

  return (
    <Stack gap="xl" align="center" w="100%" {...stackProps}>
      {/* Если идет фоновое обновление данных — плавно показываем стабильные скелетоны */}
      {isFetching && loadingContent}
      
      {/* Сюда управление перейдет мгновенно, как только данные будут получены от API */}
      {!isFetching && renderItems}
      
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
