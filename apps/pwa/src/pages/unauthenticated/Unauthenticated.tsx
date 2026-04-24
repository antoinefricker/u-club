import { useState } from 'react';
import { Container } from '@mantine/core';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
export function Unauthenticated() {
    const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');

    return (
        <Container size="xs" pt={20}>
            {view === 'login' ? (
                <LoginForm
                    onSwitchMode={() => setView('register')}
                    onForgotPassword={() => setView('forgot')}
                />
            ) : view === 'register' ? (
                <RegisterForm onSwitchMode={() => setView('login')} />
            ) : (
                <ForgotPasswordForm onSwitchMode={() => setView('login')} />
            )}
        </Container>
    );
}
