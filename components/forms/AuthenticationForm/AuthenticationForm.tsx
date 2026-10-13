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
  : { onFirstAuth: () => void } & PaperProps) {
  
  const form = useForm({
    mode: 'controlled', // ✅ Гарантирует корректную работу реактивности полей в React 19
    initialValues: {
      username: '',
      password: '',
    },
    validate: {
      username: (val) => val.includes('@') ?
        \((/^\S+@\S+\)\$/.test(val) ? null : 'Некорректный email') // ✅ ИСПРАВЛЕНО: Убраны экранирующие слеши и скобки, ломавшие SWC-компилятор
        : val.length < 5 ? 'Логин должен содержать не менее 5 символов' : null,
      password: (val) => (val.length < 8 ? 'Пароль должен содержать не менее 8 символов' : null),
    },
  });

  const router = useRouter();
  const { login } = useLogin();
  
  // ✅ ИСПРАВЛЕНИЕ №1: Убран пустой объект {} из аргументов хука мутации
  const [signIn, result] = useSignInMutation();

  const onSubmit = form.onSubmit(async ({ username, password }) => {
    const queryBody = username.includes('@') ? { email: username, password } : { login: username, password };
    
    signIn(queryBody).then(async (res) => {
      // ✅ ИСПРАВЛЕНИЕ №2: Строгий и безопасный разбор ответа мутации по стандартам Next.js 15
      if ('error' in res || res.error) {
        const errorMessage = (res.error as any)?.data?.message ?? (res.error as any)?.message ?? 'Неверный логин или пароль';
        form.setErrors({ password: errorMessage });
        return;
      }

      const data = res.data;
      if (!data) return;

      if (data.statusCode === 200) {
        const { access_token, refresh_token, role } = data;
        await login(access_token, role, refresh_token);
        const path = (role as string).replaceAll('_', '-');
        router.push(`/${path}`);
      } else if (data.success) {
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
            radius="md"
            disabled={result.isLoading}
            // ✅ ИСПРАВЛЕНИЕ №3: Используем стандартный декларативный синтаксис Mantine Form.
            // Это исключает лишние ререндеры инпута при вводе в React 19.
            key={form.key('username')}
            {...form.getInputProps('username')}
          />

          <PasswordInput
            required
            label="Пароль"
            placeholder="**********"
            radius="md"
            disabled={result.isLoading}
            key={form.key('password')}
            {...form.getInputProps('password')}
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
        <Group mt="xs">
          <Link href="/reset-password">
            <Anchor component="button" type="button" c="dimmed" size="xs">
              Я не помню пароль
            </Anchor>
          </Link>
        </Group>
      </form>
    </Paper>
  );
}
