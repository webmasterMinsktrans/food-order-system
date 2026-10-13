'use client';

import { Table, Text } from "@mantine/core";
import { MenuListItem } from "@/shared/types";
import { useState } from "react";
import React from "react";
import MenuInfoModal from "@/components/cards/MenuInfoCard";
import { formatDate } from "@/shared/helpers/formatHelper";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import classes from './styles.module.scss';
import ControlCols from "../SampleTable/ControlCols";
import { useDeleteMenuMutation, useUpdateMenuMutation } from "@/lib/api/moderatorApi";
import { ModalService, NotificationService } from "@/shared/services";

const TableRow = (item: MenuListItem) => {
  const { id, name, relevantFrom, expire, menuPositionsCount, author, providingCanteen, created } = item;
  const [opened, setOpened] = useState(false);
  
  const form = useForm({
    mode: 'controlled', // Гарантирует правильную синхронизацию с инпутами в React 19
    initialValues: {
      relevantFrom: new Date(relevantFrom),
      expire: new Date(expire)
    }
  });

  const [updateMenu] = useUpdateMenuMutation();
  const [deleteMenu] = useDeleteMenuMutation();
  
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  // ✅ ИСПРАВЛЕНИЕ №1: Выносим булево состояние наружу для стабильного вычисления активности кнопок в React 19
  const isFormDirty = form.isDirty();
  const formDirtyFields = form.getDirty();

  const onUpdate = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateMenu({
      id, 
      body: {
        ...form.getValues()
      }
    })
    .then((res) => {
      // ✅ ИСПРАВЛЕНИЕ №2: Безопасный разбор ответа мутации в Next.js 15
      if ('error' in res) {
        NotificationService.showErrorNotification({
          title: 'Ошибка обновления данных меню!',
          message: (res.error as any)?.data?.message ?? (res.error as any)?.message ?? 'Ошибка сервера'
        });
        return;
      }
      
      NotificationService.showSuccessNotification({
        title: `Данные меню ${id} успешно изменены!`,
        message: ''
      });
      form.resetDirty();
    });
  };

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    ModalService.openDeleteModal({
      children: (
        <Text size="sm">
          Вы точно хотите удалить указанный элемент? Удаление меню приведет к <strong>полной потере данных</strong> меню.
        </Text>
      ),
      onConfirm: () => {
        deleteMenu({ id })
        .then(res => {
          if ('data' in res && res.data) {
            NotificationService.showSuccessNotification({ message: `Меню с ID ${id} удалено` });
          } else {
            NotificationService.showErrorNotification({ 
              message: 'Удаление меню невозможно: ' + ((res.error as any)?.data?.message ?? (res.error as any)?.message ?? '') 
            });
          }
        });
      }
    });
  };

  return (
    <React.Fragment>
      <Table.Tr onClick={() => setOpened(true)} w={'100%'}>
        <Table.Td>{id}</Table.Td>
        <Table.Td>{name}</Table.Td>
        <Table.Td>
          <DateTimePicker
            valueFormat="DD MMMM YYYY HH:mm"
            wrapperProps={{
              onClick: stopPropagation
            }}
            {...form.getInputProps('relevantFrom')}
            key={form.key('relevantFrom')}
            className={classes['date-input']}
            data-dirty={formDirtyFields.relevantFrom ? 'true' : null}
          />
        </Table.Td>
        <Table.Td>
          <DateTimePicker
            valueFormat="DD MMMM YYYY HH:mm"
            wrapperProps={{
              onClick: stopPropagation
            }}
            {...form.getInputProps('expire')}
            key={form.key('expire')}
            className={classes['date-input']}
            data-dirty={formDirtyFields.expire ? 'true' : null}
          />
        </Table.Td>
        <Table.Td>{menuPositionsCount}</Table.Td>
        <Table.Td>{providingCanteen.name}</Table.Td>
        <Table.Td>
          {`${author.surname} ${author.name.charAt(0).toUpperCase()}. ${author.patronymic.charAt(0).toUpperCase()}.`}
        </Table.Td>
        <Table.Td>{formatDate(created)}</Table.Td>
        <ControlCols
          onUpdate={onUpdate}
          onDelete={onDelete}
          disabled={{
            update: !isFormDirty // Используем стабильную константу
          }}
        />
      </Table.Tr>
      <MenuInfoModal 
        opened={opened} 
        onClose={() => setOpened(false)} 
        menuId={id} 
      />
    </React.Fragment>    
  );
};

export default TableRow;
