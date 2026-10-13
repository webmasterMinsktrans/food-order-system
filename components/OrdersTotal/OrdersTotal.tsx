import { Card, Grid, GridCol, LoadingOverlay, NumberFormatter, Text } from '@mantine/core';
import { FunctionComponent } from 'react';
import classes from './styles.module.scss';
import { useGetOrdersTotalQuery } from '@/lib/api/orderApi';

interface OrdersTotalProps {

}

export const OrdersTotal: FunctionComponent<OrdersTotalProps> = () => {
  const { data, error, isFetching } = useGetOrdersTotalQuery({ });
  return (
    <Card
      shadow="xl"
      className={classes.orderCardWrapper}
      withBorder
      >
        {error && <Text>Ошибка загрузки итогов</Text>}
        <LoadingOverlay visible={isFetching} />
        { !error &&
          <Grid>
            <GridCol span={6}> Общее количество заказов за этот месяц </GridCol>
            <GridCol span={6} fw="bold"> {data?.totalCount} </GridCol>
            <GridCol span={6}> Сумма заказов за месяц </GridCol>
            <GridCol span={6} fw="bold">
              <NumberFormatter
                value={(data?.totalPrice ?? 0) / 100}
                decimalScale={2}
                suffix=" руб."
              />
            </GridCol>
          </Grid>
        }
    </Card>
   );
};
