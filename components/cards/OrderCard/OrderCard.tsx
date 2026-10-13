'use client';

import { Button, Grid, List, NumberFormatter, Text, CardSection, GridCol, ListItem, Badge, Skeleton } from '@mantine/core';
import { FunctionComponent, useMemo } from 'react'; // 👈 Добавили useMemo
import moment from 'moment';
import { useDisclosure } from '@mantine/hooks';
import { ScalingCard } from '@/UI';
import { OrderMainInfoDto } from '@/shared/types';
import OrderDetailedInfoCard from '../OrderDetailedInfoCard/OrderDetailedInfoCard';
import { useCancelOrder } from '@/shared/hooks';
import { orderStatusColor } from '@/shared/settings';
import classes from './styles.module.scss';

interface OrderCardProps {
  orderMainInfoDto?: OrderMainInfoDto,
  isLoading?: boolean,
}
interface OrderCardContentProps {
  orderMainInfoDto: OrderMainInfoDto,
}

const OrderCard: FunctionComponent<OrderCardProps> = ({
  orderMainInfoDto,
  isLoading = false,
}) => {
  // Если передан флаг isLoading, гарантированно рендерим чистый скелетон
  if (isLoading) {
    return (
      <Skeleton className={classes.orderCardWrapper} data-skeleton/>
    );
  }
  
  if (orderMainInfoDto) {
    return (
      <OrderCardContent orderMainInfoDto={orderMainInfoDto} />
    );
  }
  return null;
};

const OrderCardContent: FunctionComponent<OrderCardContentProps> = ({
  orderMainInfoDto,
}) => {
  const { number, fullPrice, status, issued, orderPositions, canCancel, deliveryDestination } = orderMainInfoDto;
  
  // ✅ ИСПРАВЛЕНИЕ №1: Убираем деструктуризацию "на лету" из deliveryDestination.
  // Заменяем на безопасное чтение через опциональную цепочку ?. с фолбэком на дефолтную строку.
  // Это полностью страхует карточку от TypeError и падения рендеринга.
  const destinationName = deliveryDestination?.name ?? 'Не указано';

  // ✅ ИСПРАВЛЕНИЕ №2: Мемоизируем расчет цены и форматирование даты.
  // Это фиксирует строковые примитивы в памяти Virtual DOM и убирает паразитные ререндеры.
  const total = useMemo(() => fullPrice / 100, [fullPrice]);
  const statusText = status ?? 'создан';

  const formattedDate = useMemo(() => {
    if (!issued) return '';
    const parsed = moment(issued);
    return parsed.isValid() ? parsed.format('DD.MM.YYYY') : '';
  }, [issued]);

  const [opened, { open, close }] = useDisclosure(false);
  const { cancelOrder } = useCancelOrder(number, issued);
  
  const cancelButtonClick = (e: any) => {
    e.stopPropagation();
    if (cancelOrder) cancelOrder();
  };

  // ✅ ИСПРАВЛЕНИЕ №3: Мемоизируем вывод состава заказа.
  // Исключает микро-ошибки индексов внутри циклов .map()
  const positionsList = useMemo(() => {
    if (!orderPositions || !Array.isArray(orderPositions)) return null;
    return (
      <List>
        {orderPositions.map((pos, index) => {
          if (index < 5) {
            return (
              <ListItem key={`${pos.name}-${index}`}>
                <Text lineClamp={1}>{pos.name}</Text>
              </ListItem>
            );
          }
          return null;
        })}
        {orderPositions.length > 5 && (
          <ListItem>
            <Text c="dimmed" fz="sm">
              Еще {orderPositions.length - 5}...
            </Text>
          </ListItem>
        )}
      </List>
    );
  }, [orderPositions]);

  return (
    <>
      <ScalingCard
        className={classes.orderCardWrapper}
        onClick={open}
      >
        <CardSection className={classes.headerSection}>
          <Text className={classes.headerText}>
            <Text span className={classes.italicText}>Заказ №</Text>{' '}
            {number}{' '}
            <Text span className={classes.italicText}>от</Text>{' '}
            {formattedDate}
          </Text>
        </CardSection>
        <CardSection className={classes.bodySection}>
          <Grid>
            <GridCol span={4} className={classes.caption}>
              Сумма заказа
            </GridCol>
            <GridCol span={8} className={classes.informationLabel}>
              <NumberFormatter value={total} decimalScale={2} suffix=" руб." />
            </GridCol>
            <GridCol span={4} className={classes.caption}>
              Место доставки
            </GridCol>
            <GridCol span={8} className={classes.informationLabel}>
              {destinationName}
            </GridCol>
            <GridCol span={4} className={classes.caption}>
              Статус заказа
            </GridCol>
            <GridCol span={8} className={classes.statusContainer}>
              <Badge color={orderStatusColor(statusText)} size="lg">
                {statusText}
              </Badge>
            </GridCol>
            <GridCol span={4} className={classes.caption}>
              Состав заказа
            </GridCol>
            <GridCol span={8}>
              {positionsList}
            </GridCol>
          </Grid>
        </CardSection>
        <CardSection className={classes.bottomSection}>
          <Button
            variant='transparent'
            className={classes.aboutButton}
            onClick={cancelButtonClick}
            disabled={!canCancel}
          >
            Отменить заказ
          </Button>
        </CardSection>
      </ScalingCard>
      <OrderDetailedInfoCard
        opened={opened}
        onClose={close}
        orderNumber={number}
        orderIssued={issued}
      />
    </>
  );
};

export default OrderCard;
