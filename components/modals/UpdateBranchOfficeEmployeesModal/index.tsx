'use client';

import { Button, FileInput, Group, LoadingOverlay, Modal, ModalProps, Stack } from "@mantine/core";
import { OfficeSelect } from "@/components";
import { useForm } from "@mantine/form";
import { useUpdateBranchOfficeEmployeesMutation } from "@/lib/api/adminApi";
import commonClasses from '../styles.module.scss';
import { IconFile } from "@tabler/icons-react";
import { NotificationService } from "@/shared/services";

interface UpdateBranchOfficeEmployeesModalProps extends ModalProps {}

const UpdateBranchOfficeEmployeesModal = ({ ...modalProps }: UpdateBranchOfficeEmployeesModalProps) => {
  const form = useForm({
    mode: 'uncontrolled', // Оптимальный режим работы для React 19
    initialValues: {
      officeId: undefined as undefined | number,
      file: null as File | null, // Стандартный браузерный тип
    },
    validate: {
      file: (val) => {
        if (!val) return 'Файл не добавлен';
        
        // ✅ ИСПРАВЛЕНИЕ №1: Чистый нативный JavaScript вместо серверного модуля 'path'
        const ext = val.name.substring(val.name.lastIndexOf('.')).toLowerCase();
        if (ext !== '.txt') return 'Некорректный формат файла. Выберите текстовый документ (.txt)';
        
        return null;
      },
      officeId: (val) => (val !== undefined && val !== null && !isNaN(val)) ? null : 'Выберите филиал',
    }
  });

  const [triggerUpdate, updateResult] = useUpdateBranchOfficeEmployeesMutation();

  const onClose = () => {
    form.reset();
    modalProps.onClose();
  };

  const onSubmit = () => {
    if (form.validate().hasErrors) return;
    const values = form.getValues();
    
    triggerUpdate({
      officeId: values.officeId ?? -1,
      file: values.file!
    })
    .then((res) => {
      // ✅ ИСПРАВЛЕНИЕ №2: Строгий перехват ответов мутации по стандарту Next.js 15
      if ('error' in res) {
        NotificationService.showErrorNotification({
          message: 'При обновлении списка сотрудников произошла ошибка: ' + ((res.error as any)?.data?.message ?? (res.error as any)?.message ?? '')
        });
        return;
      }

      const data = res.data;
      if (data) {
        NotificationService.showSuccessNotification({
          title: 'Список пользователей филиала обновлен.',
          message: (
            <>
              Добавлено пользователей: {data?.created}.<br />
              Пользователей активировано: {data?.active} <br />
              Пользователей уволено: {data?.inactive}
            </>
          ),
          autoClose: 10000,
        });
        onClose();
      }
    });
  };

  return (
    <Modal.Root 
      {...modalProps} 
      size="auto" 
      centered
      onClose={onClose}
    >
      <Modal.Overlay />
      <Modal.Content miw={500}>
        <Modal.Header className={commonClasses.modalHeader}>
          <Modal.Title className={commonClasses.modalTitle}>
            Обновление сотрудников филиала
          </Modal.Title>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          <LoadingOverlay visible={updateResult.isLoading} />
          <Stack>
            <OfficeSelect
              label={'Выберите филиал'}
              key={form.key('officeId')}
              {...form.getInputProps('officeId')}
              officeType='all'
              unselectable="off"
            />
            <FileInput
              label="Добавьте TXT-файл сотрудников"
              placeholder="sample.txt"
              withAsterisk
              leftSection={<IconFile />}
              accept=".txt"
              disabled={updateResult.isLoading}
              key={form.key('file')}
              {...form.getInputProps('file')}
            />
            <Group justify="space-between" mt="md">
              <Button variant="outline" onClick={onClose} disabled={updateResult.isLoading}>
                Отмена
              </Button>
              <Button 
                onClick={onSubmit}
                loading={updateResult.isLoading} // ✅ Блокировка от повторных отправлений файла
              >
                Обновить список
              </Button>
            </Group>
          </Stack>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
};

export default UpdateBranchOfficeEmployeesModal;
