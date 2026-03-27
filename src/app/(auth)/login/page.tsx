import { LoginForm } from '@/features/auth/components/login-form';
import { getOAuthProviders } from '@/features/auth/queries/get-oauth-providers';

export default async function LoginPage() {
  const providers = await getOAuthProviders();
  return <LoginForm oauthProviders={providers} />;
}
