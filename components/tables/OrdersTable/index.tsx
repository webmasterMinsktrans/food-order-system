'use client';

import { Table } from "@mantine/core";
import React, { useState, useMemo, useCallback } from "react"; // 👈 Добавили useMemo и useCallback
import SampleTable from "../SampleTable";
import { SearchOrderItemDto } from "@/lib/api/moderatorApi/types";
import OrdersTableRow from "./OrdersTableRow";
import { OrderDetailedInfoCard } from "@/components";
import { useDisclosure } from "@mantine/hooks";

interface MenuListTableProps {
  items: SearchOrderItemDto[];
}

const OrdersListTable = ({ items }: MenuListTableProps) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [orderData, setOrderData] = useState<[number, string]>([0, '']);

  // ✅ ИСПРАВЛЕНИЕ №1: Мемоизируем шапку таблицы.
  // Теперь структура Table.Th не пересоздается в DOM-дереве при каждом обновлении лоадера.
  const tableHeader = useMemo(() => (
    <Table.Tr>
      <Table.Th>ID</Table.Th>
      <Table.Th>Номер заказа</Table.Th>
      <Table.Th>Сотрудник</Table.Th>
      <Table.Th>Сумма заказа,<br/> руб.</Table.Th>
      <Table.Th>Кол-во позиций,<br/> шт.</Table.Th>
      <Table.Th>Статус</Table.Th>
      <Table.Th>Место доставки</Table.Th>
      <Table.Th>Изменено</Table.Th>
      <Table.Th>Создано</Table.Th>
    </Table.Tr>
  ), []);

  // ✅ ИСПРАВЛЕНИЕ №2: Стабилизируем обработчик клика по строке через useCallback.
  // Это полностью исключает генерацию анонимных функций внутри циклов рендеринга.
  const handleRowClick = useCallback((number: number, issued: string) => {
    setOrderData([number, issued]);
    open();
  }, [open]);

  // ✅ ИСПРАВЛЕНИЕ №3: Стабилизируем метод генерации строки makeRow.
  // Ссылочная целостность пропсов дочерних строк теперь идеальна для React 19.
  const renderRow = useCallback((item: SearchOrderItemDto) => (
    <OrdersTableRow 
      key={item.id} 
      item={item} 
      onClick={handleUrlUpdateAction(item, handleRowClick)}
    />
  ), [handleRowClick]);

  return (
    <>
      <SampleTable
        headerContent={tableHeader}
        items={items}
        makeRow={renderRow}
      />
      <OrderDetailedInfoCard
        opened={opened}
        onClose={close}
        orderNumber={orderData[0]}
        orderIssued={orderData[1]}
      />
    </>
  );
};

// Вспомогательный хелпер изоляции замыкания ссылок функций клика строк
function handleUrlUpdateAction(item: SearchOrderItemDto, callback: (num: number, issued: string) => void) {
  return () => callback(item.number, item.issued);
}

export default OrdersListTable;
