'use client';

import { Avatar, Group, GroupProps, Skeleton, Text } from '@mantine/core';
import { FunctionComponent, useMemo } from 'react'; // 👈 Добавили useMemo
import { useRouter } from 'next/navigation';
import classes from './styles.module.scss';
import { useGetOwnInfoQuery } from '@/lib/api/userApi';

interface UserAvatarProps extends GroupProps {}

export const UserAvatar: FunctionComponent<UserAvatarProps> = (props) => {
  const { isLoading, data } = useGetOwnInfoQuery(undefined);
  const router = useRouter();

  // ✅ ИСПРАВЛЕНИЕ №1: Мемоизируем и безопасно вычисляем имя пользователя.
  // Это предотвращает падение с ошибкой TypeError, пока данные летят с сервера.
  const name = useMemo(() => {
    if (!data || !data.employee) return '';
    const surname = data.employee.surname ?? '';
    const firstName = data.employee.name ?? '';
    return `${surname} ${firstName}`.trim();
  }, [data]);

  return (
    <Group
      {...props}
      className={[classes.group, props.className].join(' ')}
      onClick={() => router.push('/profile')}
      style={{ cursor: 'pointer', ...props.style }} // ✅ Полезное улучшение: добавляем курсор-указатель при наведении
    >
      {
        isLoading ? (
          <>
            <Avatar className={classes.groupAvatar} />
            <Skeleton w={150} h={20} radius="xl" />
          </>
        ) : (
          <>
            <Avatar
              className={classes.groupAvatar}
              color="initials"
              name={name || 'Пользователь'} // Подстраховка для Mantine, если имя пустое
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
