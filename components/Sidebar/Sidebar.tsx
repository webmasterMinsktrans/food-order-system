'use client';

import { Flex } from '@mantine/core';
import { IconLogout2 } from '@tabler/icons-react';
import SidebarOption from './SidebarOption';
import { useAppSelector, useLogout } from '@/shared/hooks';
import { roleOptions, commonOptions } from './options';
import { selectUserInterface } from '@/lib/features/user/userSlice';

// 1. Описываем интерфейс, чтобы TypeScript не ругался
interface SidebarProps {
  onLinkClick?: () => void;
}

// 2. Принимаем onLinkClick в параметрах компонента
export default function Sidebar({ onLinkClick }: SidebarProps) {
  const { logout } = useLogout();
  const userInterface = useAppSelector(selectUserInterface);
  
  return (
    <Flex
      direction="column"
      gap={8}
      w="100%"
    >
      {
        roleOptions.map(({ href, label, leftSection }, ind) => 
          userInterface && href.includes(userInterface) ? (
            <SidebarOption 
              leftSection={leftSection} 
              href={href} 
              key={ind}
              onClick={onLinkClick} // 3. Передаем клик для ролевых опций
            >
              {label}
            </SidebarOption>
          ) : null
        )
      }
      {
        commonOptions.map(({ href, label, leftSection }) => (
          <SidebarOption 
            leftSection={leftSection} 
            href={href} 
            key={href}
            onClick={onLinkClick} // 3. Передаем клик для общих опций
          >
            {label}
          </SidebarOption>
        ))
      }
      <SidebarOption
        href="/"
        leftSection={<IconLogout2 size={20} />}
        onClick={() => {
          logout();
          if (onLinkClick) onLinkClick(); // 4. Закрываем меню при выходе из аккаунта
        }}
        replace
      >
        Выйти
      </SidebarOption>
    </Flex>
  );
}
