import { useState } from 'react';
import { Container } from '@mantine/core';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
export function Unauthenticated() {
  const [view, setView] = useState<'login' | 'register'>('login');

  return (
    <Container size="xs" pt={20}>
      {view === 'login' ? (
        <LoginForm onSwitchMode={() => setView('register')} />
      ) : (
        <RegisterForm onSwitchMode={() => setView('login')} />
      )}
    </Container>
  );
}
