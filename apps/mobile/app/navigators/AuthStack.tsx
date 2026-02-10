import { createNativeStackNavigator } from "@react-navigation/native-stack"
import type { AuthStackParamList } from "./navigationTypes"
import { PhoneEntryScreen } from "@/screens/auth/PhoneEntryScreen"
import { CodeVerificationScreen } from "@/screens/auth/CodeVerificationScreen"
import { ProfileSetupScreen } from "@/screens/auth/ProfileSetupScreen"

const Stack = createNativeStackNavigator<AuthStackParamList>()

export const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
      <Stack.Screen name="CodeVerification" component={CodeVerificationScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  )
}
