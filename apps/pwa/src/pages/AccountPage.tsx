import { Title } from '@mantine/core';
import { PageTitle } from '../components/layout/PageTitle';
import { FormWrapper } from '../components/admin/forms/FormWrapper';
import { AccountEditForm } from './AccountEditForm';
import { UserMemberLinks } from '../components/admin/user/UserMemberLinks';
import { UserTeamAssignments } from '../components/admin/user/UserTeamAssignments';

export function AccountPage() {
    return (
        <>
            <PageTitle label="My account" />

            <FormWrapper>
                <Title order={3} mt="xl" mb="md">
                    Account details
                </Title>
                <AccountEditForm />
            </FormWrapper>

            <FormWrapper>
                <Title order={3} mt="xl" mb="md">
                    Family & members
                </Title>
                <UserMemberLinks useUserPointOfView={true} />
            </FormWrapper>

            <FormWrapper>
                <Title order={3} mt="xl" mb="md">
                    Team assignments
                </Title>
                <UserTeamAssignments />
            </FormWrapper>
        </>
    );
}
