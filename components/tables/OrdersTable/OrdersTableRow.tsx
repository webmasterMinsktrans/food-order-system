'use client';

import React, { useMemo } from "react";
import { NumberFormatter, Table } from "@mantine/core";
import { SearchOrderItemDto } from "@/lib/api/moderatorApi/types";
import { formatDate } from "@/shared/helpers/formatHelper";
import dayjs from "dayjs";

interface OrdersTableRowParams {
  item: SearchOrderItemDto,
  onClick?: () => void,
}

const OrdersTableRow = React.memo(({ item, onClick }: OrdersTableRowParams) => {
  const {
    id,
    number,
    issued,
    created,
    clientName,
    clientPersonnelNumber,
    updated,
    status,
    orderPositionsCount,
    fullPrice,
    deliveryDestination
  } = item;

  // ✅ ИСПРАВЛЕНИЕ №1: Мемоизируем строку номера и даты заказа
  const formattedIssued = useMemo(() => {
    if (!issued) return `${number}-`;
    return `${number}-${dayjs(issued).format('DD.MM.YYYY')}`;
  }, [number, issued]);

  // ✅ ИСПРАВЛЕНИЕ №2: Мемоизируем вычисление стоимости (копейки в рубли)
  const formattedPrice = useMemo(() => {
    return fullPrice / 100;
  }, [fullPrice]);

  // ✅ ИСПРАВЛЕНИЕ №3: Мемоизируем форматирование дат изменений и создания
  const formattedUpdated = useMemo(() => formatDate(updated), [updated]);
  const formattedCreated = useMemo(() => formatDate(created), [created]);

  return (
    <Table.Tr onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <Table.Td>{id}</Table.Td>
      <Table.Td>{formattedIssued}</Table.Td>
      <Table.Td>{clientName} ({clientPersonnelNumber})</Table.Td>
      <Table.Td>        
        <NumberFormatter value={formattedPrice} decimalScale={2}/>
      </Table.Td>
      <Table.Td>{orderPositionsCount}</Table.Td>
      <Table.Td>{status}</Table.Td>
      <Table.Td>{deliveryDestination?.name ?? '-'}</Table.Td>
      <Table.Td>{formattedUpdated}</Table.Td>
      <Table.Td>{formattedCreated}</Table.Td>
    </Table.Tr> 
  );
});

OrdersTableRow.displayName = 'OrdersTableRow';

export default OrdersTableRow;
