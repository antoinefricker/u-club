import { PageTitle } from '../components/layout/PageTitle';
import { FormWrapper } from '../components/admin/forms/FormWrapper';
import { AdminSection } from '../components/admin/AdminSection';
import { AccountEditForm } from './AccountEditForm';
import { UserMemberLinks } from '../components/admin/user/UserMemberLinks';
import { UserTeamAssignments } from '../components/admin/user/UserTeamAssignments';

export function AccountPage() {
    return (
        <>
            <PageTitle label="My account" />

            <FormWrapper>
                <AdminSection title="Account details">
                    <AccountEditForm />
                </AdminSection>

                <AdminSection title="Linked members">
                    <UserMemberLinks useUserPointOfView={true} />
                </AdminSection>

                <AdminSection title="Team assignments">
                    <UserTeamAssignments />
                </AdminSection>
            </FormWrapper>
        </>
    );
}
