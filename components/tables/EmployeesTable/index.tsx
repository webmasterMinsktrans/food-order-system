'use client';

import { ActionIcon, Table, Text, TextInput } from "@mantine/core";
import React, { useMemo } from "react"; // 👈 Добавили useMemo
import SampleTable from "../SampleTable";
import { EmployeeFullInfoDto } from "@/shared/types/employee/employee-full-info.dto";
import { formatDate, formatFullName } from "@/shared/helpers/formatHelper";
import { useForm } from "@mantine/form";
import { Select } from "@/UI";
import OfficeSelect from "../../OfficeSelect/OfficeSelect";
import { useDeleteEmployeeMutation, useUpdateEmployeeMutation } from "../../../lib/api/adminApi";
import { ModalService, NotificationService } from "../../../shared/services";
import classes from '../styles.module.scss';
import ControlCols from "../SampleTable/ControlCols";

interface EmployeesTableProps {
  items: EmployeeFullInfoDto[];
}

const EmployeesTable = ({ items }: EmployeesTableProps) => {
  const THead = () => {
    return (
      <Table.Tr>
        <Table.Th>ID</Table.Th>
        <Table.Th>ФИО</Table.Th>
        <Table.Th>Табельный номер</Table.Th>
        <Table.Th>Статус</Table.Th>
        <Table.Th>Филиал</Table.Th>
        <Table.Th>Изменен</Table.Th>
        <Table.Th>Создан</Table.Th>
        <Table.Th></Table.Th>
        <Table.Th></Table.Th>
      </Table.Tr>
    );
  };

  return (
    <SampleTable
      headerContent={<THead />}
      items={items}
      makeRow={(item) => <TableRow item={item} key={item.id} />}
      className=""
    />
  );
};

const TableRow = ({ item }: { item: EmployeeFullInfoDto }) => {
  const { id, personnelNumber, active, office, changed, created } = item;
  
  const form = useForm({
    mode: 'controlled', // Оптимальный режим работы для React 19
    initialValues: {
      fullname: formatFullName(item) ?? '',
      personnelNumber: personnelNumber ?? '',
      active: active ? '1' : '0',
      officeId: office?.id?.toString() ?? ''
    },
    validate: {
      fullname: (val) => val.trim().split(/\s+/).length === 3 && val.trim().split(/\s+/).every((entry) => entry.length >= 2) ? null : 'ФИО должно состоять из 3 слов по 2 символа в каждом',
      personnelNumber: val => isNaN(+val) ? 'Значение должно быть числом' : null,
    },
    transformValues: ({ fullname, personnelNumber, active, officeId }) => {
      const parts = fullname.trim().split(/\s+/);
      return {
        surname: parts[0] || '',
        name: parts[1] || '',
        patronymic: parts[2] || '',
        personnelNumber: `${+personnelNumber}`,
        active: active === '1',
        officeId,
      };
    }
  });

  const [triggerUpdate, updateResult] = useUpdateEmployeeMutation();
  const [triggerDelete, deleteResult] = useDeleteEmployeeMutation();

  // ✅ ИСПРАВЛЕНИЕ №1: Выносим булево состояние загрязненности в константу для стабильного рендера кнопок
  const isFormDirty = form.isDirty();

  const onUpdate = () => {
    if (form.validate().hasErrors) return;
    const values = form.getTransformedValues();
    const dirty = form.getDirty();

    triggerUpdate({
      id,
      body: {
        ...values,
        personnelNumber: dirty.personnelNumber ? values.personnelNumber : undefined,
        officeId: dirty.officeId ? +values.officeId : undefined,
      }
    })
    .then((res) => {
      // ✅ ИСПРАВЛЕНИЕ №2: Безопасный и строгий перехват ответов мутации по стандарту Next.js 15
      if ('error' in res) {
        NotificationService.showErrorNotification({
          message: 'Ошибка обновления данных: ' + ((res.error as any)?.data?.message ?? (res.error as any)?.message ?? '')
        });
        return;
      }

      if (res.data) {
        NotificationService.showSuccessNotification({ message: 'Данные сотрудника обновлены' });
        form.resetDirty();
      }
    });
  };

  const onDelete = () => {
    ModalService.openDeleteModal({
      children: (
        <Text size="sm">
          Вы точно хотите удалить указанный элемент? Удаление сотрудника будет невозможно, в случае если на него содержатся ссылки других элементов базы данных. В общем случае возможно удалить только недавно созданного сотрудника.
        </Text>
      ),
      onConfirm: () => {
        triggerDelete(id).then(res => {
          if ('error' in res) {
            NotificationService.showErrorNotification({
              message: 'Удаление сотрудника невозможно: ' + ((res.error as any)?.data?.message ?? (res.error as any)?.message ?? '')
            });
            return;
          }

          if (res.data) {
            NotificationService.showSuccessNotification({ message: `Сотрудник с ID ${id} удален` });
          }
        });
      }
    });
  };

  return (
    <Table.Tr>
      <Table.Td>{id}</Table.Td>
      <Table.Td>
        <TextInput
          {...form.getInputProps('fullname')}
        />
      </Table.Td>
      <Table.Td>
        <TextInput
          {...form.getInputProps('personnelNumber')}
          maw={120}
        />
      </Table.Td>
      <Table.Td>
        <Select
          data={[{ label: 'Работает', value: '1' }, { label: 'Уволен', value: '0' }]}
          {...form.getInputProps('active')}
          maw={120}
        />
      </Table.Td>
      <Table.Td>
        <OfficeSelect
          officeType='all'
          {...form.getInputProps('officeId')}
          unselectable='off'
        />
      </Table.Td>
      <Table.Td>{formatDate(changed)}</Table.Td>
      <Table.Td>{formatDate(created)}</Table.Td>
      <ControlCols
        onDelete={onDelete}
        onUpdate={onUpdate}
        disabled={{
          update: !isFormDirty // Используем стабильную переменную вместо прямого вызова метода
        }}
      />
    </Table.Tr> 
  );
};

export default EmployeesTable;
