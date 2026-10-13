'use client';

import { Button, Checkbox, Group, LoadingOverlay, Modal, ModalProps, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import officeTypes, { officeTypeOptions } from "@/shared/types/branch-office/office-types";
import { Select } from "@/UI";
import commonClasses from '../styles.module.scss';
import { useCreateBranchOfficeMutation } from "../../../lib/api/adminApi";
import { NotificationService } from "../../../shared/services";
import OfficeSelect from "../../OfficeSelect/OfficeSelect";
import { useEffect, useState } from "react";

interface CreateBranchOfficeModalProps extends ModalProps {}

const CreateBranchOfficeModal = ({ ...modalProps }: CreateBranchOfficeModalProps) => {
  const form = useForm({
    mode: 'uncontrolled', // Оптимальный режим работы для React 19
    initialValues: {
      name: '',
      address: '',
      officeType: 'branch' as officeTypes,
      isAvailable: true,
      servingCanteenId: undefined as number | undefined,
    },
    validate: {
      name: (val) => val.length >= 5 ? null : 'Минимальная длина 5 символов',
      address: (val) => val.length >= 5 ? null : 'Минимальная длина 5 символов',
    }
  });

  const [canteenEnabled, setCanteenEnabled] = useState(true);
  const [triggerCreate, createResult] = useCreateBranchOfficeMutation();

  // ✅ ИСПРАВЛЕНИЕ №1: Переносим подписку watch внутрь useEffect для изоляции side-effects в React 19
  useEffect(() => {
    const subscription = form.watch('officeType', ({ value }) => {
      setCanteenEnabled(value === 'branch');
      if (value !== 'branch') {
        form.setFieldValue('servingCanteenId', undefined);
      }
    });
    return () => subscription.unsubscribe(); // Очищаем подписку при размонтировании
  }, [form]);

  const onClose = () => {
    form.reset(); 
    setCanteenEnabled(true);
    modalProps.onClose();
  };

  const onCancel = () => {
    onClose();
  };

  const onSubmit = () => {
    if (form.validate().hasErrors) return;
    const values = form.getValues();
    
    triggerCreate({
      ...values
    }).then((res) => {
      // ✅ ИСПРАВЛЕНИЕ №2: Безопасный перехват ответов мутации по стандарту Next.js 15
      if ('error' in res) {
        NotificationService.showErrorNotification({
          message: 'При создании филиала произошла непредвиденная ошибка: ' + ((res.error as any)?.data?.message ?? (res.error as any)?.message ?? '')
        });
        return;
      }

      if (res.data) {
        NotificationService.showSuccessNotification({ message: `Филиал с id ${res.data} создан` });
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
            Добавление нового филиала
          </Modal.Title>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          <LoadingOverlay visible={createResult.isLoading} />
          <Stack>
            <TextInput
              label={'Название'}
              placeholder="Администрация"
              key={form.key('name')}
              {...form.getInputProps('name')}
            />
            <TextInput
              label={'Адрес'}
              placeholder="ул. Уличная, 22"
              key={form.key('address')}
              {...form.getInputProps('address')}
            />
            <Select
              label={'Тип филиала'}
              data={officeTypeOptions}
              key={form.key('officeType')}
              {...form.getInputProps('officeType')}
            />
            <OfficeSelect
              label={'Обслуживающая столовая'}
              key={form.key('servingCanteenId')}
              {...form.getInputProps('servingCanteenId')}
              officeType='canteen'
              disabled={!canteenEnabled}
            />
            <Checkbox
              label={'Филиал доступен'}
              key={form.key('isAvailable')}
              {...form.getInputProps('isAvailable')}
            />
            <Group justify="space-between" mt="md">
              <Button variant="outline" onClick={onCancel}>
                Отмена
              </Button>
              <Button onClick={onSubmit} loading={createResult.isLoading}>
                Создать
              </Button>
            </Group>
          </Stack>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
};

export default CreateBranchOfficeModal;
