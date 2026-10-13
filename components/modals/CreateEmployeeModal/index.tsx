'use client';

import { Button, Checkbox, Group, LoadingOverlay, Modal, ModalProps, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useCreateEmployeeMutation } from "@/lib/api/adminApi";
import { NotificationService } from "@/shared/services";
import OfficeSelect from "../../OfficeSelect/OfficeSelect";
import commonClasses from '../styles.module.scss';

interface CreateEmployeeModalProps extends ModalProps {}

const CreateEmployeeModal = ({ ...modalProps }: CreateEmployeeModalProps) => {
  const form = useForm({
    mode: 'uncontrolled', // Оптимальный режим для React 19
    initialValues: {
      name: '',
      surname: '',
      patronymic: '',
      personnelNumber: '',
      active: true,
      officeId: '',
    },
    validate: {
      name: (val) => val.length >= 2 ? null : 'Минимальная длина 2 символа',
      surname: (val) => val.length >= 2 ? null : 'Минимальная длина 2 символа',
      patronymic: (val) => val.length >= 2 ? null : 'Минимальная длина 2 символа',
      personnelNumber: (val) => !val ? 'Установите табельный номер' : null,
      officeId: (val) => !val ? 'Установите филиал' : null
    }
  });

  const [triggerCreate, createResult] = useCreateEmployeeMutation();

  const onClose = () => {
    form.reset(); 
    modalProps.onClose();
  };

  const onCancel = () => {
    onClose();
  };

  const onSubmit = () => {
    if (form.validate().hasErrors) return;
    const values = form.getValues();
    
    triggerCreate({
      ...values,
      officeId: +values.officeId
    }).then((res) => {
      // ✅ ИСПРАВЛЕНИЕ №1: Безопасный и строгий перехват ответов мутации по стандартам Next.js 15
      if ('error' in res) {
        NotificationService.showErrorNotification({
          message: 'При создании сотрудника произошла непредвиденная ошибка: ' + ((res.error as any)?.data?.message ?? (res.error as any)?.message ?? '')
        });
        return;
      }

      if (res.data) {
        NotificationService.showSuccessNotification({ message: `Сотрудник с id ${res.data} создан` });
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
            Добавление нового сотрудника
          </Modal.Title>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          <LoadingOverlay visible={createResult.isLoading} />
          <Stack>
            <TextInput
              label={'Фамилия'}
              placeholder="Иванов"
              key={form.key('surname')}
              {...form.getInputProps('surname')}
            />
            <TextInput
              label={'Имя'}
              placeholder="Иван"
              key={form.key('name')}
              {...form.getInputProps('name')}
            />
            <TextInput
              label={'Отчество'}
              placeholder="Иванович"
              key={form.key('patronymic')}
              {...form.getInputProps('patronymic')}
            />
            <TextInput
              label={'Табельный номер'}
              placeholder="41231"
              key={form.key('personnelNumber')}
              {...form.getInputProps('personnelNumber')}
            />
            <OfficeSelect
              label={'Филиал'}
              key={form.key('officeId')}
              {...form.getInputProps('officeId')}
              officeType='all'
            />
            <Checkbox
              label={'Активен'}
              key={form.key('active')}
              {...form.getInputProps('active')}
              // ✅ ИСПРАВЛЕНИЕ №2: Удален проп defaultChecked. 
              // В режиме uncontrolled начальное состояние полностью берется из initialValues.active (true).
            />
            <Group justify="space-between" mt="md">
              <Button variant="outline" onClick={onCancel}>
                Отмена
              </Button>
              <Button 
                onClick={onSubmit}
                loading={createResult.isLoading} // ✅ Блокировка кнопки от повторных кликов при отправке
              >
                Создать
              </Button>
            </Group>
          </Stack>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
};

export default CreateEmployeeModal;
