'use client';

import { FunctionComponent, useState } from 'react';
import { Stepper } from '@mantine/core';
import { IconMailForward } from '@tabler/icons-react';
import { AuthenticationForm, SuccessMessageCard } from '@/components';
import classes from './styles.module.scss';

interface SignInProps {}
const SignIn: FunctionComponent<SignInProps> = () => {
  const [active, setActive] = useState(0);
  return (
  <Stepper
    active={active}
    styles={{ steps: { display: 'none' }, content: { padding: 0 } }}
  >
    <Stepper.Step>
      <AuthenticationForm
        className={classes.signInFormBox}
        onFirstAuth={() => setActive(1)}
      />
    </Stepper.Step>
    <Stepper.Step>
      <SuccessMessageCard className={classes.signInFormBox}>
        <SuccessMessageCard.Icon size={100}>
          <IconMailForward size={100} stroke={1} />
        </SuccessMessageCard.Icon>
        <SuccessMessageCard.Title>
          Спасибо за вход!<br />
        </SuccessMessageCard.Title>
        <SuccessMessageCard.Text>
          Для верификации в системе необходимо подтвердить email привязанный к аккаунту
          Вам на почту направлено письмо активации,
          перейдите по ссылке в письме для окончания регистрации
        </SuccessMessageCard.Text>
        <SuccessMessageCard.OkButton redirectLink="/">
          На главную
        </SuccessMessageCard.OkButton>
      </SuccessMessageCard>
    </Stepper.Step>
  </Stepper>
);
};
export default SignIn;
