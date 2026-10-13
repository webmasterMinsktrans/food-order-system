'use client';

import { Button, Divider, Group, Paper, Stack, Text, TextInput } from '@mantine/core';
import { FunctionComponent } from 'react';
import { useForm } from '@mantine/form';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';
import classes from './styles.module.scss';
import { NotificationService } from '@/shared/services';
import { useResetPasswordMutation } from '@/lib/api/authApi';

interface FirstAuthFormProps {
  onFormSuccess: () => void,
}

const ResetPasswordForm: FunctionComponent<FirstAuthFormProps> = ({
   onFormSuccess,
}) => {
  const form = useForm({
    mode: 'controlled', // ✅ Гарантирует корректную работу реактивности полей в React 19
    initialValues: {
      username: '', // ✅ Очищено: удалены лишние неиспользуемые поля password
    },
    validate: {
      username: (val) => val.includes('@') ?
      (/^\S+@\S+$/.test(val) ? null : 'Некорректный email')
      : val.length < 5 ? 'Логин должен содержать не менее 5 символов' : null,
    },
  });

  const [resetPassword, result] = useResetPasswordMutation();

  const onSubmit = form.onSubmit(({ username }) => {
    const body = username.includes('@') ? { email: username } : { login: username };
    
    resetPassword(body).then((res) => {
      // ✅ ИСПРАВЛЕНИЕ №1: Строгий и безопасный разбор ответа мутации по стандартам Next.js 15
      if ('error' in res || res.error) {
        const error = res.error;
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
      <Text className={classes.header} component="div" pb="xs">
        Восстановление пароля
      </Text>
      <Text c="dimmed" size="xs" ta="center">
        для смены пароля введите свой логин или email и нажмите далее
      </Text>
      <Divider my="sm" />
      <form onSubmit={onSubmit}>
        <Stack>
          <TextInput
            required
            label="Логин или email"
            placeholder="test@minsktrans.by"
            disabled={result.isLoading}
            // ✅ ИСПРАВЛЕНИЕ №2: Используем стандартный декларативный синтаксис Mantine Form.
            // Это исключает лишние ререндеры инпута при вводе в React 19.
            key={form.key('username')}
            {...form.getInputProps('username')}
          />
        </Stack>

        <Group justify="space-between" mt="xl">
          <Link href="/login">
            <Button
              type="button" // Изменено на button, чтобы клик не вызывал ложный reset формы
              radius="xl"
              variant="transparent"
            >
              Назад
            </Button>
          </Link>
          <Button
            type="submit"
            radius="xl"
            loading={result.isLoading}
            rightSection={<IconChevronRight size={16} />}
          >
            Далее
          </Button>
        </Group>
      </form>
    </Paper>
  );
};

export default ResetPasswordForm;
