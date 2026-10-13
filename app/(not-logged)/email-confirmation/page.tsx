'use client';

import { FunctionComponent, useEffect, useRef } from 'react'; // 👈 Добавили useRef
import { useRouter } from 'next/navigation';
import { IconShieldCheck } from '@tabler/icons-react';
import { LoadingOverlay } from '@mantine/core';
import { useSearchParamValue } from '@/shared/hooks';
import { useLazyCheckFirstAuthTokenQuery } from '@/lib/api/authApi';
import { SuccessMessageCard } from '@/components';
import { NotificationService } from '@/shared/services';

interface confirmationPageProps {}

const ConfirmationPage: FunctionComponent<confirmationPageProps> = () => {
  const token = useSearchParamValue<string>('token');
  const router = useRouter();
  const [checkToken, result] = useLazyCheckFirstAuthTokenQuery();
  
  // ✅ ИСПРАВЛЕНИЕ №1: Используем useRef в качестве флага отправки запроса.
  // В отличие от useState, изменение ref не вызывает рендер и обновляется мгновенно,
  // что на 100% защищает от дублирующих запросов в React 19.
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!token) {
      NotificationService.showForbiddenNotification({
        title: 'Ошибка!',
        message: 'Данная страница доступна только по ссылке',
      });
      router.replace('/');
      return;
    }

    // ✅ Проверяем флаг: если запрос уже отправлялся — игнорируем повторные триггеры
    if (hasTriggered.current) return;

    hasTriggered.current = true; // Мгновенно блокируем повторный вход

    checkToken({ token }).then(res => {
      // ✅ ИСПРАВЛЕНИЕ №2: Безопасный разбор ответа мутации/запроса по стандарту Next.js 15
      if ('error' in res || res.error) {
        NotificationService.showErrorNotification({
          title: 'Ошибка! Ссылка активации недействительна!',
          message: 'Время действия ссылки истекло. Повторно войдите в систему для активации аккаунта',
        });
        router.replace('/login');
      }
    });
  }, [token, checkToken, router]); // Добавлены обязательные зависимости для линтера Next.js 15

  return (
    <SuccessMessageCard pos="relative">
      <LoadingOverlay visible={!result.isSuccess} overlayProps={{ blur: 6 }} />
      <SuccessMessageCard.Icon size={100}>
        <IconShieldCheck size={100} stroke={1.5} />
      </SuccessMessageCard.Icon>
      <SuccessMessageCard.Title>
        Аккаунт активирован!
      </SuccessMessageCard.Title>
      <SuccessMessageCard.Text>
        Аккаунт успешно активирован, для просмотра меню войдите в систему
      </SuccessMessageCard.Text>
      <SuccessMessageCard.OkButton redirectLink="/login">
        Далее
      </SuccessMessageCard.OkButton>
    </SuccessMessageCard>
  );
};

export default ConfirmationPage;
