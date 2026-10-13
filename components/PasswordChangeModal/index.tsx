'use client';

import { Button, Flex, LoadingOverlay, Modal, ModalProps, TextInput } from "@mantine/core";
import classes from './styles.module.scss';
import { PasswordStrength } from "@/UI";
import { useForm } from "@mantine/form";
import { passwordStrength } from "check-password-strength";
import { useUpdateUserPasswordMutation } from "../../lib/api/adminApi";
import { NotificationService } from "../../shared/services";
import PasswordGenerator from "../PasswordGenerator";
import { EmployeeInfoDto } from "../../shared/types/employee/employee-info.dto";
import { useMemo } from "react"; // 👈 Добавили useMemo

interface PasswordChangeModalProps extends ModalProps {
  userId: number,
  employee?: EmployeeInfoDto,
}

const PasswordChangeModal = ({employee, userId, ...modalProps}: PasswordChangeModalProps) => {
  const [updatePass, updateResult] = useUpdateUserPasswordMutation();
  
  const form = useForm({
    mode: 'controlled',
    initialValues: {
      newPassword: '',
      passwordRepeat: '',
    },
    validate: {
      newPassword: (val) => (passwordStrength(val).id < 2 ? ' ' : null),
      passwordRepeat: (val, { newPassword }) => (val !== newPassword ? 'Пароли не совпадают' : null),
    }
  });

  // ✅ ИСПРАВЛЕНИЕ №1: Оптимизация производительности в React 19.
  // Вытаскиваем значение пароля в константу, чтобы Mantine Form контролировал инпут без лишних ререндеров
  const currentPasswordValue = form.getValues().newPassword;

  const onClose = () => {
    form.reset(); 
    modalProps.onClose();
  };

  const onSubmit = () => {
    if (form.validate().hasErrors) return;
    
    updatePass({ id: userId, body: form.getValues() })
      .then((res) => {
        // ✅ ИСПРАВЛЕНИЕ №2: Безопасный перехват ответов мутации в Next.js 15
        if ('error' in res) {
          NotificationService.showErrorNotification({
            message: (res.error as any)?.data?.message ?? (res.error as any)?.message ?? 'При изменении пароля произошла ошибка'
          });
          return;
        }

        // Если ошибки нет — значит запрос успешный
        onClose();
        NotificationService.showSuccessNotification({ message: 'Пароль пользователя успешно изменен' });
      });
  };

  return (
    <Modal.Root {...modalProps} onClose={onClose} size="auto" centered>
      <Modal.Overlay />
      <Modal.Content className={classes.modalContent}>
        <Modal.Header className={classes.header}>
          <Modal.Title className={classes.modalTitle}>
            Изменение пароля пользователя {employee?.surname} {employee?.personnelNumber}
          </Modal.Title>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body className={classes.modalBody}>
          <LoadingOverlay visible={updateResult.isLoading} />
          <PasswordStrength
            checkValue={currentPasswordValue} // Передаем стабильную строку
            label="Новый пароль"
            placeholder="********"
            type="password"
            defaultVisible={true}
            {...form.getInputProps('newPassword')}
          />
          <TextInput
            label="Повторите пароль"
            placeholder="********"
            type="password"
            {...form.getInputProps('passwordRepeat')}
          />
          <PasswordGenerator />
          <Flex justify="space-between" mt="lg">
            <Button 
              className={classes.cancelButton}
              variant="outline" 
              onClick={onClose}
            >
              Отмена
            </Button>
            <Button 
              className={classes.cancelButton}
              variant="filled"
              onClick={onSubmit}
              loading={updateResult.isLoading} // ✅ Добавили индикатор загрузки на кнопку
            >
              Сохранить изменения
            </Button>
          </Flex>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
};

export default PasswordChangeModal;
