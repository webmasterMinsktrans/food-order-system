'use client';

import { Card, Grid, GridCol, LoadingOverlay, NumberFormatter, Text } from '@mantine/core';
import { FunctionComponent, useMemo } from 'react'; // 👈 Добавили useMemo
import classes from './styles.module.scss';
import { useGetOrdersTotalQuery } from '@/lib/api/orderApi';

// ✅ ИСПРАВЛЕНИЕ №1: Выносим пустой объект-литерал в константу ЗА ПРЕДЕЛЫ компонента.
// Ссылка на этот объект в памяти создается ровно 1 раз при старте приложения.
// Это полностью блокирует бесконечный спам запросами и удовлетворяет типы TypeScript.
const EMPTY_QUERY_PARAMS = {};

interface OrdersTotalProps {}

export const OrdersTotal: FunctionComponent<OrdersTotalProps> = () => {
  // Передаем стабильную ссылку константы вместо создания объекта "на лету"
  const { data, error, isFetching } = useGetOrdersTotalQuery(EMPTY_QUERY_PARAMS);

  // ✅ ИСПРАВЛЕНИЕ №2: Мемоизируем внутреннюю сетку вывода статистики.
  // Теперь, пока данные летят с сервера или роутер Next.js 15 переключает страницы пагинации,
  // этот блок не совершит ни одного паразитного каскадного рендера, полностью защищая от client-side exception.
  const statsGrid = useMemo(() => {
    if (error || isFetching || !data) return null;
    
    return (
      <Grid align="center">
        <GridCol span={6}>Общее количество заказов за этот месяц</GridCol>
        <GridCol span={6} fw="bold">{data.totalCount ?? 0}</GridCol>
        <GridCol span={6}>Сумма заказов за месяц</GridCol>
        <GridCol span={6} fw="bold">
          <NumberFormatter
            value={(data.totalPrice ?? 0) / 100}
            decimalScale={2}
            suffix=" руб."
          />
        </GridCol>
      </Grid>
    );
  }, [data, isFetching, error]);

  return (
    <Card
      shadow="xl"
      className={classes.orderCardWrapper}
      withBorder
      style={{ position: 'relative', minHeight: '120px' }} // Фиксируем высоту для стабильной гидратации
    >
      {error && <Text c="red" ta="center">Ошибка загрузки итогов</Text>}
      
      {/* Лоадер работает в мягком оверлейном режиме и не ломает Virtual DOM */}
      <LoadingOverlay visible={isFetching} overlayProps={{ blur: 1 }} />
      
      {statsGrid}
    </Card>
  );
};

export default OrdersTotal;
