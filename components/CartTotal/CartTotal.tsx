'use client';

import { Group, Stack, Title, Text, Button } from '@mantine/core';
import { FunctionComponent } from 'react';
import classes from './styles.module.scss';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import { clearCart, selectCartTotalCount, selectCreateOrderArgument, selectFinalPrice, selectFullPrice, selectTotalDiscount } from '@/lib/features/cart/cartSlice';
import { useMakeOrderMutation } from '@/lib/api/orderApi';
import { NotificationService } from '@/shared/services';

interface CartTotalProps {}

const CartTotal: FunctionComponent<CartTotalProps> = () => {
  const fullPrice = useAppSelector(selectFullPrice);
  const totalCount = useAppSelector(selectCartTotalCount);
  const totalDiscount = useAppSelector(selectTotalDiscount);
  const finalPrice = useAppSelector(selectFinalPrice);
  const orderArgs = useAppSelector(selectCreateOrderArgument);
  const dispatch = useAppDispatch();
  const [makeOrder, { isLoading }] = useMakeOrderMutation();

  const makeOrderClick = () => {
    makeOrder(orderArgs).then((res) => {
      // ✅ ИСПРАВЛЕНИЕ №1: Строгий и безопасный перехват ошибок мутации по стандартам Next.js 15
      if ('error' in res || res.error) {
        const errorData = res.error;
        NotificationService.showErrorNotification({
          message: (errorData as any)?.data?.message ?? (errorData as any)?.message ?? 'Ошибка создания заказа.',
        });
        return; // Блокируем дальнейшее выполнение функции
      }

      // ✅ ИСПРАВЛЕНИЕ №2: Код переходит к чтению res.data только будучи уверенным, что ошибки нет
      const data = res.data;
      if (!data) return;

      NotificationService.showSuccessNotification({
        title: `Заказ №${data.number} успешно создан`,
        message: 'Для отслеживания статуса перейдите на страницу активных заказов',
        autoClose: 10000,
      });
      
      dispatch(clearCart());
    });
  };

  return (
    <Stack className={classes.cartTotalContainer} align="center" px="50px" gap="xs" pb="12px" pt="12px">
      <Group justify="space-between" w="100%">
        <Title className={classes.header}>Итого</Title>
        <Title className={classes.header}>
          {`${(finalPrice).toFixed(2)}`} руб.
        </Title>
      </Group>
      <Group justify="space-between" w="100%">
        <Text className={classes.subheader}>{totalCount} позиций</Text>
        <Text className={classes.subheader}>{(fullPrice).toFixed(2)} руб.</Text>
      </Group>
      <Group justify="space-between" w="100%">
        <Text className={classes.subheader}>Скидка</Text>
        <Text className={classes.subheader}>−{(totalDiscount).toFixed(2)} руб.</Text>
      </Group>
      <Button
        className={classes.acceptButton}
        mt="lg"
        onClick={makeOrderClick}
        loading={isLoading}
        disabled={totalCount === 0} // ✅ Защита: кнопка блокируется, если корзина пуста
      >
        Оформить заказ
      </Button>
    </Stack>
  );
};

export default CartTotal;
