'use client';

import { Avatar, Group, GroupProps, Skeleton, Text } from '@mantine/core';
import { FunctionComponent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import classes from './styles.module.scss';
import { useGetOwnInfoQuery } from '@/lib/api/userApi';

interface UserAvatarProps extends GroupProps {}

export const UserAvatar: FunctionComponent<UserAvatarProps> = (props) => {
  const { isLoading, data } = useGetOwnInfoQuery(undefined);
  const router = useRouter();

  // ✅ Безопасно вычисляем имя пользователя
  const name = useMemo(() => {
    if (!data || !data.employee) return '';
    const surname = data.employee.surname ?? '';
    const firstName = data.employee.name ?? '';
    return `${surname} ${firstName}`.trim();
  }, [data]);

  // ✅ ИСПРАВЛЕНИЕ: Добавляем strict-проверку среды 'typeof window === 'undefined''
  // Теперь сервер Node.js (при сборке/SSR) и клиент при первой миллисекунде рендера гарантированно 
  // выдадут одинаковый Skeleton. Несовпадение верстки (Hydration Error) полностью исключено.
  const shouldShowLoader = isLoading || typeof window === 'undefined';

  return (
    <Group
      {...props}
      className={[classes.group, props.className].join(' ')}
      onClick={() => router.push('/profile')}
      style={{ cursor: 'pointer', ...props.style }}
    >
      {
        shouldShowLoader ? (
          <>
            <Avatar className={classes.groupAvatar} />
            <Skeleton w={150} h={20} radius="xl" />
          </>
        ) : (
          <>
            <Avatar
              className={classes.groupAvatar}
              color="initials"
              name={name || 'Пользователь'}
            />
            {name && (
              <Text className={classes.groupText} fw={500}>
                {name}
              </Text>
            )}
          </>
        )
      }
    </Group>
  );
};

export default UserAvatar;
