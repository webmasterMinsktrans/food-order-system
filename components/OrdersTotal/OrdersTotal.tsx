'use client';

import { Card, Grid, GridCol, LoadingOverlay, NumberFormatter, Text } from '@mantine/core';
import { FunctionComponent } from 'react';
import classes from './styles.module.scss';
import { useGetOrdersTotalQuery } from '@/lib/api/orderApi';
import { transformErrorResponse } from '@/lib/api/baseApi';

interface OrdersTotalProps {}

export const OrdersTotal: FunctionComponent<OrdersTotalProps> = () => {
  // ✅ ИСПРАВЛЕНИЕ №1: Передаем undefined вместо пустого объекта-литерала { }.
  // Это полностью ликвидирует бесконечный спам запросами на бэкенд, так как ссылка в памяти больше не пересоздается.
  const { data, error, isFetching } = useGetOrdersTotalQuery(undefined);

  return (
    <Card
      shadow="xl"
      className={classes.orderCardWrapper}
      withBorder
    >
      {error && <Text c="red" ta="center">Ошибка загрузки итогов</Text>}
      <LoadingOverlay visible={isFetching} overlayProps={{ blur: 1 }} />
      
      {!error && (
        <Grid align="center">
          <GridCol span={6}>Общее количество заказов за этот месяц</GridCol>
          <GridCol span={6} fw="bold">
            {/* ✅ Защита: выводим 0 или лоадер, пока данные не доехали с сервера */}
            {isFetching ? '...' : (data?.totalCount ?? 0)}
          </GridCol>
          <GridCol span={6}>Сумма заказов за месяц</GridCol>
          <GridCol span={6} fw="bold">
            <NumberFormatter
              value={isFetching ? 0 : ((data?.totalPrice ?? 0) / 100)}
              decimalScale={2}
              suffix=" руб."
            />
          </GridCol>
        </Grid>
      )}
    </Card>
  );
};
