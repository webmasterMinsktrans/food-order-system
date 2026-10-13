'use client';

import { OfficeFullInfoDto } from "@/shared/types";
import { ActionIcon, Button, Checkbox, Table, Text, TextInput } from "@mantine/core";
import SampleTable from "../SampleTable";
import { formatDate } from "@/shared/helpers/formatHelper";
import { useForm } from "@mantine/form";
import { IconDeviceFloppy, IconPlus, IconTrash } from "@tabler/icons-react";
import classes from './styles.module.scss';
import { useDeleteBranchOfficeMutation, useUpdateBranchOfficeMutation } from "@/lib/api/adminApi";
import { ModalService, NotificationService } from "@/shared/services";
import { useDisclosure } from "@mantine/hooks";
import CreateBranchOfficeModal from "../../modals/CreateBranchOfficeModal";
import { typesLabels } from "@/shared/types/branch-office/office-types";

interface BranchesTableProps {
  items: OfficeFullInfoDto[]
}

const BranchesTable = ({ items }: BranchesTableProps) => {
  const THead = () => {
    return (
      <Table.Tr>
        <Table.Th>ID</Table.Th>
        <Table.Th>Название</Table.Th>
        <Table.Th>Адрес</Table.Th>
        <Table.Th>Тип</Table.Th>
        <Table.Th>Доступен</Table.Th>
        <Table.Th>Столовая</Table.Th>
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
      extraRows={<AddRowButton />}
    />
  );
};

const TableRow = ({ item }: { item: OfficeFullInfoDto }) => {
  const { id, name, address, officeType, changed, created, isAvailable, servingCanteen } = item;
  
  const form = useForm({
    mode: 'uncontrolled', // Оптимальный режим работы для React 19
    initialValues: {
      name: name ?? '',
      address: address ?? '',
      isAvailable: !!isAvailable,
    },
    validate: {
      name: (val) => val.length >= 5 ? null : 'Минимальная длина 5 символов',
      address: (val) => val.length >= 5 ? null : 'Минимальная длина 5 символов',
    }
  });

  const [triggerUpdate, updateResult] = useUpdateBranchOfficeMutation();
  const [triggerDelete, deleteResult] = useDeleteBranchOfficeMutation();

  // ✅ ИСПРАВЛЕНИЕ №1: Выносим состояние загрязненности в константу для стабильного рендера кнопок
  const isFormDirty = form.isDirty();

  const updateOffice = () => {
    if (form.validate().hasErrors) return;
    const values = form.getValues();
    
    triggerUpdate({
      officeId: id,
      ...values,
    }).then((res) => {
      // ✅ ИСПРАВЛЕНИЕ №2: Безопасный перехват ошибок мутации по стандартам Next.js 15
      if ('error' in res) {
        NotificationService.showErrorNotification({
          message: 'При изменении данных филиала произошла ошибка: ' + ((res.error as any)?.data?.message ?? (res.error as any)?.message ?? '')
        });
        return;
      }

      if (res.data) {
        NotificationService.showSuccessNotification({ message: 'Данные филиала успешно изменены' });
        form.resetDirty();
      }
    });
  };

  const deleteClicked = () => {
    ModalService.openDeleteModal({
      children: (
        <Text size="sm">
          Вы точно хотите удалить указанный элемент? Удаление филиала будет невозможно, в случае если на него содержатся ссылки других элементов базы данных. В общем случае возможно удалить только недавно созданный филиал.
        </Text>
      ),
      onConfirm: () => {
        triggerDelete(id).then(res => {
          if ('error' in res) {
            NotificationService.showErrorNotification({
              message: 'Удаление филиала невозможно: ' + ((res.error as any)?.data?.message ?? (res.error as any)?.message ?? '')
            });
            return;
          }

          if (res.data) {
            NotificationService.showSuccessNotification({ message: 'Филиал удален' });
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
          key={form.key('name')}
          {...form.getInputProps('name')}
        />
      </Table.Td>
      <Table.Td>
        <TextInput
          key={form.key('address')}
          {...form.getInputProps('address')}
        />
      </Table.Td>
      <Table.Td>{typesLabels[officeType]}</Table.Td>
      <Table.Td>
        <Checkbox
          key={form.key('isAvailable')}
          {...form.getInputProps('isAvailable')}
          // ✅ ИСПРАВЛЕНИЕ №3: В режиме uncontrolled проп defaultChecked больше не нужен,
          // так как состояние полностью инициализируется и синхронизируется через initialValues.isAvailable
        />
      </Table.Td>
      <Table.Td>{servingCanteen ? servingCanteen.name : '-'}</Table.Td>
      <Table.Td>{formatDate(changed)}</Table.Td>
      <Table.Td>{formatDate(created)}</Table.Td> 
      <Table.Td>
        <ActionIcon 
          className={classes.saveBtn}
          size={24} 
          variant='transparent' 
          disabled={!isFormDirty} // Используем стабильную константу вместо вызова метода напрямую
          loading={updateResult.isLoading} // ✅ Индикатор сетевой загрузки на кнопке сохранения
          onClick={updateOffice}
        >
          <IconDeviceFloppy size={24}/>
        </ActionIcon>
      </Table.Td>
      <Table.Td> 
        <ActionIcon 
          size={24} 
          variant='transparent' 
          loading={deleteResult.isLoading} // ✅ Индикатор сетевой загрузки на кнопке удаления
          onClick={deleteClicked}
        >
          <IconTrash size={24}/>
        </ActionIcon>
      </Table.Td> 
    </Table.Tr> 
  );
};

const AddRowButton = () => {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <Table.Tr>
      <Table.Td colSpan={10}>
        <Button 
          variant="transparent"
          fullWidth
          leftSection={<IconPlus />}
          onClick={open}
        >
          Создать филиал
        </Button>
        <CreateBranchOfficeModal
          opened={opened}
          onClose={close}
        />
      </Table.Td>
    </Table.Tr>
  );
};

export default BranchesTable;
