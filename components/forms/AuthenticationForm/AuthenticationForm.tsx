'use client';

import {
  TextInput,
  PasswordInput,
  Text,
  Paper,
  Group,
  PaperProps,
  Button,
  Anchor,
  Stack,
  Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLogin } from '@/shared/hooks';
import { useSignInMutation } from '@/lib/api/authApi';

export function AuthenticationForm({ onFirstAuth, ...props }
  :{ onFirstAuth: () => void } & PaperProps) {
  const form = useForm({
    initialValues: {
      username: '',
      password: '',
    },
    validate: {
      username: (val) => val.includes('@') ?
      (/^\S+@\S+$/.test(val) ? null : 'Некорректный email')
      : val.length < 5 ? 'Логин должен содержать не менее 5 символов' : null,
      password: (val) => (val.length < 8 ? 'Пароль должен содержать не менее 8 символов' : null),
    },
  });
  const router = useRouter();
  const { login } = useLogin();
  const [signIn, result] = useSignInMutation({});
  const onSubmit = form.onSubmit(async ({ username, password }) => {
    const queryBody = username.includes('@') ? { email: username, password } : { login: username, password };
    signIn(queryBody).then(async (res) => {
      if (res.error) {
        // eslint-disable-next-line prefer-destructuring
        const error: any = res.error;
        const errorMessage = (res.error as any).message ?? 'Неизвестная ошибка авторизации';
        form.setErrors({ password: errorMessage });
      } else if (res.data.statusCode === 200) {
        const {access_token, refresh_token, role} = res.data;
        await login(access_token, role, refresh_token);
        const path = (res.data?.role as string).replaceAll('_', '-');
        router.push(`/${path}`);
      } else if (res.data.success) {
        onFirstAuth();
      }
    });
  });
  return (
    <Paper
      radius="md"
      p="xl"
      withBorder
      {...props}
    >
      <Text size="lg" fw={500}>
        Добро пожаловать в систему заказа питания
      </Text>
      <Divider
        label="для заказа войдите в свой аккаунт"
        labelPosition="center"
        my="sm"
      />
      <form onSubmit={onSubmit}>
        <Stack>
          <TextInput
            required
            label="Логин или email"
            placeholder="hello@minsktrans.by"
            value={form.values.username}
            onChange={(event) => form.setFieldValue('username', event.currentTarget.value)}
            error={form.errors.username}
            radius="md"
            disabled={result.isLoading}
          />

          <PasswordInput
            required
            label="Пароль"
            placeholder="**********"
            value={form.values.password}
            onChange={(event) => form.setFieldValue('password', event.currentTarget.value)}
            error={form.errors.password}
            radius="md"
            disabled={result.isLoading}
          />
        </Stack>

        <Group justify="space-between" mt="xl">
          <Link href="/sign-up">
            <Anchor component="button" type="button" c="dimmed" size="xs">
              Зарегистрироваться
            </Anchor>
          </Link>
          <Button type="submit" radius="xl" loading={result.isLoading || result.isSuccess}>
            Войти
          </Button>
        </Group>
        <Link href="/reset-password">
          <Anchor component="button" type="button" c="dimmed" size="xs">
            Я не помню пароль
          </Anchor>
        </Link>
      </form>
    </Paper>
  );
}
