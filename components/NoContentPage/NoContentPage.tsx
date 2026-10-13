'use client';

import { Box, Button, Flex, Title } from '@mantine/core';
import Link from 'next/link';
import { FunctionComponent } from 'react';
import { StaticImport } from 'next/dist/shared/lib/get-img-props';
import { ImageWithFallback } from '@/UI';
import classes from './styles.module.scss';

interface EmptyDishListProps {
  label: string,
  buttonLabel?: string,
  href?: string,
  img: string | StaticImport,
  size?: 'sm' | 'md',
}

const NoContentPage: FunctionComponent<EmptyDishListProps> = ({ 
  label, 
  buttonLabel, 
  href, 
  img, 
  size = 'md' 
}) => {
  return (
    <Flex direction="column" gap="48px" justify="flex-start" align="center">
      <Box className={classes.noDishPicture} data-size={size}>
        <ImageWithFallback
          sizes="(max-width: 460px) 300px 300px, (max-width: 564px) 400px 400px, (min-width: 565px) 500px 500px"
          src={img}
          alt="menu is empty"
          fill
          priority
        />
      </Box>
      <Flex direction="column" gap="16px" align="center">
        <Title order={3} ta="center">
          {label}
        </Title>
        {
          buttonLabel && href && (
            /* ✅ ИСПРАВЛЕНИЕ: Избавляемся от вложенности <a> и <button>.
               Передаем Link Next.js как базовый компонент для кнопки Mantine.
               Это генерирует валидный чистый HTML-тег <a> со стилями кнопки, 
               что полностью ликвидирует сбой гидратации (client-side exception). */
            <Button 
              component={Link} 
              href={href} 
              replace 
              size="md" 
              radius="xl"
            >
              {buttonLabel}
            </Button>
          )
        }
      </Flex>
    </Flex>
  );
};

export default NoContentPage;
