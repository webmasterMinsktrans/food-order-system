'use client';

import { Button, ButtonProps } from "@mantine/core";
import Link from "next/link";
import { useAppSelector } from "../../shared/hooks";
// Заменили импорт selectUserRole на selectUserInterface
import { selectIsLoggedIn, selectUserInterface } from "../../lib/features/user/userSlice";

interface MainPageButtonProps extends ButtonProps {}

const MainPageButton = (props: MainPageButtonProps) => {
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  // Используем интерфейс, где для админа уже подставлено 'control-panel'
  const userInterface = useAppSelector(selectUserInterface);

  const getLink = () => {
    if (isLoggedIn === undefined) return '';
    // ✅ ИСПРАВЛЕНИЕ №1: Заменили старый путь '/login' на новый безопасный '/sign-in'
    if (isLoggedIn === false || !userInterface) return '/sign-in';
    
    // ✅ ИСПРАВЛЕНИЕ №2: Формируем ссылку на основе безопасного интерфейса
    return `/${userInterface.replaceAll('_', '-')}`;
  }

  return (
    <Link href={getLink()}>
      <Button
        variant="gradient"
        gradient={{ from: 'red', to: 'yellow' }}
        size="xl"
        {...props}
        loading={isLoggedIn === undefined}
      >
        В меню
      </Button>
    </Link>
  );
};

export default MainPageButton;
