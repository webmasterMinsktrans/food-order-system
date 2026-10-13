'use client';

import { Button, Divider, Group, Paper, PasswordInput, Stack, Text } from '@mantine/core';
import { FunctionComponent } from 'react';
import { useForm } from '@mantine/form';
import { passwordStrength } from 'check-password-strength';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { useRouter } from 'next/navigation';
import classes from './styles.module.scss';
import { useSearchParamValue } from '@/shared/hooks';
import { NotificationService } from '@/shared/services';
import { useChangePasswordMutation } from '@/lib/api/authApi';

interface FirstAuthFormProps {
  onFormSuccess: () => void,
}

const FirstAuthForm: FunctionComponent<FirstAuthFormProps> = ({ onFormSuccess }) => {
  const router = useRouter();
  const token = useSearchParamValue<string>('token');
  
  const form = useForm({
    mode: 'controlled', // ✅ Гарантирует корректную работу реактивности полей в React 19
    initialValues: {
      newPassword: '',
      newPasswordRepeat: '',
    },
    validate: {
      newPassword: (val) => (passwordStrength(val).id < 2 ?
      'Пароль должен содержать не менее 8 символов, 1 цифру, маленькую и большую буквы и 1 спецсимвол (!№%*&).' : null),
      newPasswordRepeat: (val, { newPassword }) => (val !== newPassword ?
      'Пароли не совпадают' : null),
    },
  });

  const [changePassword, result] = useChangePasswordMutation();

  const onSubmit = form.onSubmit(({ newPassword }) => {
    if (!token) return;
    
    changePassword({ token, newPassword }).then((res) => {
      // ✅ ИСПРАВЛЕНИЕ №1: Строгий и безопасный разбор ответа мутации по стандартам Next.js 15
      if ('error' in res || res.error) {
        const error = res.error;
        if ((error as any).status === 401) {
          NotificationService.showForbiddenNotification({
            title: 'Ссылка изменения пароля недействительна',
            message: 'Запросите новую ссылку для изменения пароля',
          });
          router.replace('/login');
          return;
        }
        NotificationService.showErrorNotification({
          title: 'Ошибка выполнения запроса',
          message: ((error as FetchBaseQueryError).data as any)?.message ?? 'Запрос завершился с ошибкой. Попробуйте еще раз через некоторое время',
        });
      } else {
        onFormSuccess();
      }
    });
  });

  return (
    <Paper
      className={classes.firstAuthFormBox}
      radius="md"
      p="xl"
      withBorder
    >
      <Text className={classes.header} component="div" pb="sm">
        Изменение пароля
      </Text>
      <Text c="dimmed" size="xs" ta="center">
        придумайте новый пароль и нажмите &apos;Далее&apos;
      </Text>
      <Divider my="sm" />
      <form onSubmit={onSubmit}>
        <Stack>
          <PasswordInput
            required
            label="Новый пароль"
            placeholder="**********"
            disabled={result.isLoading}
            // ✅ ИСПРАВЛЕНИЕ №2: Используем стандартный декларативный синтаксис Mantine Form.
            // Это исключает лишние ререндеры инпута при вводе в React 19.
            key={form.key('newPassword')}
            {...form.getInputProps('newPassword')}
          />
          <PasswordInput
            required
            label="Повторите пароль"
            placeholder="**********"
            disabled={result.isLoading}
            key={form.key('newPasswordRepeat')}
            {...form.getInputProps('newPasswordRepeat')}
          />
        </Stack>

        <Group justify="flex-end" mt="xl">
          <Button
            type="submit"
            radius="xl"
            loading={result.isLoading}
          >
            Далее
          </Button>
        </Group>
      </form>
    </Paper>
  );
};

export default FirstAuthForm;
