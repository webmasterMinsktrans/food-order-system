'use client';

import { AppShell, Burger, Divider, Group, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Image from 'next/image';
import { Sidebar, UserAvatar } from '@/components';
import logo2 from '@/app/icon.png';
import classes from './styles.module.scss';
import Link from 'next/link';

function ResponsiveSizes({ children, className }: { children: any, className?: string }) {
  const [opened, { toggle }] = useDisclosure();
  
  return (
    <AppShell
      header={{ height: { base: 50, sm: 70, md: 70, lg: 70 } }}
      navbar={{
        width: { base: 200, md: 300, lg: 400 },
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
      className={classes.bodyColor}
    >
      <AppShell.Header className={classes.header}>
        <Group align="center" justify="space-between" h="100%" px="md">
          
          {/* Мобильная кнопка меню (слева на экранах < sm) */}
          <Group hiddenFrom="sm" h="100%">
            <Burger opened={opened} onClick={toggle} size="sm" />
          </Group>

          {/* Кликабельный логотип и название */}
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            {/* Версия для десктопа */}
            <Group visibleFrom="sm" pl="md" align="center">
              <Image src={logo2} alt="Логотип" width={40} height={40} />
              <Title order={3} pt={7}>Заказ питания</Title>
            </Group>
            
            {/* Версия для мобильных (только иконка, чтобы не ломать шапку) */}
            <Group hiddenFrom="sm" align="center">
              
            </Group>
          </Link>

          {/* Профиль пользователя (справа, скрыт на мобильных по вашей логике) */}
          <UserAvatar visibleFrom="sm" pl="lg" />
          
        </Group>
      </AppShell.Header>

      <AppShell.Navbar className={classes.navbar}>
        <AppShell.Section>
          {/* <Divider my="md" pb="md" /> */}
        </AppShell.Section>
        
        <AppShell.Section grow>
          <Sidebar onLinkClick={toggle} />
        </AppShell.Section>
        
        <AppShell.Section>
          <Divider my="md" />
          <Text className={classes.bottomText} size="xs" ta="center" px="sm" c="dimmed">
            © Государственное предприятие &quot;Минсктранс&quot;, 2024
          </Text>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main className={className}>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}

export default ResponsiveSizes;
