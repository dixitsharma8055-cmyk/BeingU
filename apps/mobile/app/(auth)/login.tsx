import { Redirect } from 'expo-router';

// Phone-number sign-in and sign-up are the same flow in BeingU: a one-time code creates or opens the account.
export default function LoginRedirect() {
  return <Redirect href="/(auth)/phone" />;
}
