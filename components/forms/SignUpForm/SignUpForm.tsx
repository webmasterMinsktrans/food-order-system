'use client';

import { Button, Card, Divider, Group, Stepper, Title } from '@mantine/core';
import { FunctionComponent, useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import { passwordStrength } from 'check-password-strength';
import { IconUsers } from '@tabler/icons-react';
import classes from './styles.module.scss';
import OfficeSelect from '../../OfficeSelect/OfficeSelect';
import { SignUpFormValues } from './types';
import EmployeeInput from './EmployeeInput';
import { useLazyCheckEmployeeQuery } from '@/lib/api/registrationApi';
import { NotificationService } from '@/shared/services';
import { ErrorDto } from '@/shared/types';
import CredentialsInput from './CredentialsInput';
import { useSignUpMutation } from '@/lib/api/authApi';
import { SuccessMessageCard } from '@/components/cards/SuccessMessageCard/SuccessMessageCard';

interface SignUpFormProps {}

export const SignUpForm: FunctionComponent<SignUpFormProps> = () => {
  const [active, setActive] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<SignUpFormValues>({
    mode: 'uncontrolled', // Оптимальный режим работы для React 19
    initialValues: {
      office: '',
      surname: '',
      personnelNumber: '',
      login: '',
      email: '',
      password: '',
      passwordRepeat: '',
    },
    validate: (values) => {
      if (active === 0) {
        return {
          office: values.office.length === 0 ? 'Выберите филиал' : null,
        };
      }
      if (active === 1) {
        return {
          surname: values.surname.length < 3
            ? 'Фамилия должна содержать минимум 3 символа'
            : null,
          personnelNumber: values.personnelNumber.length < 3
            ? 'Табельный номер должен содержать минимум 3 символа' // ✅ Исправлена опечатка
            : null,
        };
      }
      if (active === 2) {
        return {
          login: values.login.length < 5 || values.login.includes('@') ?
            'Логин должен содержать не менее 5 символов и не должен содержать символ @' : null,
          password: passwordStrength(values.password).id < 2 ?
            'Пароль должен содержать не менее 8 символов, 1 цифру, маленькую и большую буквы и 1 спецсимвол (!№%*&).' : null,
          passwordRepeat: values.password !== values.passwordRepeat ?
            'Пароли не совпадают' : null,
          email: /^\S+@\S+$/.test(values.email) ? null : 'Некорректный email',
        };
      }
      return {};
    },
    transformValues: (values) => ({
      ...values,
      surname: values.surname.trim(),
    })
  });

  const [trigger, checkResult] = useLazyCheckEmployeeQuery();
  const [signUp, signUpResult] = useSignUpMutation();

  const nextStep = () => {
    if (form.validate().hasErrors) {
      return;
    }
    if (active === 1) {
      const { office, surname, personnelNumber } = form.getTransformedValues();
      trigger({ 
        officeId: office, 
        surname, 
        personnelNumber 
      });
      return;
    }
    if (active === 2) {
      const { passwordRepeat, office, ...body } = form.getTransformedValues();
      signUp({ officeId: office, ...body });
      return;
    }
    setActive((current) => current < 3 ? current + 1 : current);
  };
  
  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));

  // ✅ ИСПРАВЛЕНИЕ №1: Извлекаем примитивы из checkResult для стабильных зависимостей useEffect в React 19
  const isCheckSuccess = checkResult.isSuccess;
  const isCheckError = checkResult.isError;
  const isCheckFetching = checkResult.isFetching;
  const checkErrorData = checkResult.error;

  useEffect(() => {
    if (!isCheckFetching && isCheckSuccess) {
      setActive(2);
    } else if (isCheckError) {
      NotificationService.showErrorNotification({
        message: (checkErrorData as ErrorDto)?.message ?? 'Ошибка! Сотрудника с указанными данными не существует',
        autoClose: 15000,
      });
    }
  }, [isCheckSuccess, isCheckError, isCheckFetching, checkErrorData]);

  // ✅ ИСПРАВЛЕНИЕ №2: Извлекаем примитивы из signUpResult
  const isSignUpSuccess = signUpResult.isSuccess;
  const isSignUpError = signUpResult.isError;
  const isSignUpLoading = signUpResult.isLoading;
  const signUpErrorData = signUpResult.error;

  useEffect(() => {
    if (isSignUpSuccess && !isSignUpLoading) {
      setActive(3);
    } else if (isSignUpError) {
      NotificationService.showErrorNotification({
        message: (signUpErrorData as ErrorDto)?.message ?? 'Ошибка регистрационной записи',
        autoClose: 15000,
      });
    }
  }, [isSignUpSuccess, isSignUpError, isSignUpLoading, signUpErrorData]);

  return (
    <Card className={classes.signUpContainer}>
      <Title order={2} ta="center">Регистрация</Title>
      <Divider my="md" visibleFrom="sm" />
      <Stepper
        active={active}
        classNames={{ steps: classes.steps }}
      >
        <Stepper.Step label="Первый шаг" description="Выбор филиала">
          <OfficeSelect 
            inputProps={form.getInputProps('office')} 
            inputKey={form.key('office')} 
            setLoading={setIsLoading} 
          />
        </Stepper.Step>
        <Stepper.Step
          label="Второй шаг"
          description="Выбор сотрудника"
          loading={isCheckFetching}
        >
          <EmployeeInput form={form} />
        </Stepper.Step>
        <Stepper.Step label="Третий шаг" description="Создание аккаунта">
          <CredentialsInput form={form} />
        </Stepper.Step>
        <Stepper.Completed>
          <SuccessMessageCard>
            <SuccessMessageCard.Icon size={100}>
              <IconUsers size={100} stroke={1.5} />
            </SuccessMessageCard.Icon>
            <SuccessMessageCard.Title>
              Аккаунт создан!
            </SuccessMessageCard.Title>
            <SuccessMessageCard.Text>
              Аккаунт успешно создан.
              <strong className={classes.importantText}>
                Вам на электронную почту было направлено письмо для подтверждения email.
              </strong>
              Для окончания Регистрации в системе следуйте инструкциям в письме.<br />
              В случае если письмо не пришло войдите в систему с вашим логином и паролем для повторной отправки письма.
            </SuccessMessageCard.Text>
            <SuccessMessageCard.OkButton redirectLink="/">
              На главную
            </SuccessMessageCard.OkButton>
          </SuccessMessageCard>
        </Stepper.Completed>
      </Stepper>
      <Divider my="md" display={active === 3 ? 'none' : 'default'} />
      <Group justify="flex-end" style={{ justifySelf: 'flex-end' }}>
        {active !== 0 && active !== 3 && (
          <Button variant="default" onClick={prevStep} disabled={isCheckFetching}>
            Назад
          </Button>
        )}
        {
          active !== 3 &&
          <Button
            onClick={nextStep}
            loading={isLoading || isCheckFetching || isSignUpLoading}
          >
            Далее
          </Button>
        }
      </Group>
    </Card>
  );
};
