'use client';

import { ModalProps } from '@mantine/core';
import React, { FunctionComponent, useEffect, useMemo, useCallback } from 'react'; // 👈 Добавили useMemo и useCallback
import { useMediaQuery } from '@mantine/hooks';
import { OrderDetailedContext } from './context/OrderDetailedContext';
import DesktopModal from './Desktop/DesktopModal';
import { useLazyGetOrderInfoQuery } from '@/lib/api/orderApi';
import MobileOrderModal from './Mobile/MobileModal';
import dayjs from 'dayjs'; // ✅ ИСПРАВЛЕНИЕ №1: Заменили тяжелый moment на dayjs, который уже есть в проекте

interface OrderDetailedInfoCardProps extends ModalProps {
  orderNumber: number,
  orderIssued: string,
}

const OrderDetailedInfoCard: FunctionComponent<OrderDetailedInfoCardProps> =
  ({ orderNumber, orderIssued, ...modalProps }) => {
  const matches = useMediaQuery('(min-width: 48em)');
  const [trigger, { data, error, isFetching }] = useLazyGetOrderInfoQuery();

  // ✅ ИСПРАВЛЕНИЕ №2: Мемоизируем параметры запроса
  const queryArgs = useMemo(() => ({
    number: orderNumber,
    issued: orderIssued
  }), [orderNumber, orderIssued]);

  const isOpened = modalProps.opened;

  // ✅ ИСПРАВЛЕНИЕ №3: Синхронизируем зависимости эффекта строго по правилам React 19
  useEffect(() => {
    if (isOpened && queryArgs.number && queryArgs.issued) {
      trigger(queryArgs);
    }
  }, [isOpened, queryArgs, trigger]);

  // ✅ ИСПРАВЛЕНИЕ №4: Стабилизируем ссылку на функцию повтора запроса через useCallback
  const handleRetry = useCallback(() => {
    if (queryArgs.number && queryArgs.issued) {
      trigger(queryArgs);
    }
  }, [queryArgs, trigger]);

  const issuedLabel = useMemo(() => {
    return data?.issued ? dayjs(data.issued).format('DD.MM.YYYY') : '';
  }, [data?.issued]);

  const contextValue = useMemo(() => ({
    IsLoading: isFetching,
    error: error as any,
    order: data,
    issuedLabel,
  }), [isFetching, error, data, issuedLabel]);

  return (
    <OrderDetailedContext.Provider value={contextValue}>
      {
      matches ?
        <DesktopModal
          onRetry={handleRetry} // Передаем стабильную ссылку
          {...modalProps}
        />
      :
        <MobileOrderModal 
          onRetry={handleRetry}
          {...modalProps} 
        />
      }
    </OrderDetailedContext.Provider>
  );
};

export default OrderDetailedInfoCard;
