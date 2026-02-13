import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import Config from "@/config"
import { useAuth } from "@/context/AuthContext"
import { ActivityDetailScreen } from "@/screens/activity/ActivityDetailScreen"
import { ChatScreen } from "@/screens/activity/ChatScreen"
import { EventRoomScreen } from "@/screens/activity/EventRoomScreen"
import { LiveActivityScreen } from "@/screens/activity/LiveActivityScreen"
import { ErrorBoundary } from "@/screens/ErrorScreen/ErrorBoundary"
import { BadgesScreen } from "@/screens/profile/BadgesScreen"
import { SettingsScreen } from "@/screens/profile/SettingsScreen"
import { SubscriptionScreen } from "@/screens/profile/SubscriptionScreen"
import { TrophiesScreen } from "@/screens/profile/TrophiesScreen"
import { useAppTheme } from "@/theme/context"

import { AuthStack } from "./AuthStack"
import { MainTabs } from "./MainTabs"
import type { AppStackParamList, NavigationProps } from "./navigationTypes"
import { navigationRef, useBackButtonHandler } from "./navigationUtilities"

const exitRoutes = Config.exitRoutes

const Stack = createNativeStackNavigator<AppStackParamList>()

const AppStack = () => {
  const { isAuthenticated } = useAuth()

  const {
    theme: { colors },
  } = useAppTheme()

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: colors.background,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
      initialRouteName={isAuthenticated ? "Main" : "Auth"}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
          <Stack.Screen name="LiveActivity" component={LiveActivityScreen} />
          <Stack.Screen name="EventRoom" component={EventRoomScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Badges" component={BadgesScreen} />
          <Stack.Screen name="Trophies" component={TrophiesScreen} />
          <Stack.Screen name="Subscription" component={SubscriptionScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Auth" component={AuthStack} />
        </>
      )}
    </Stack.Navigator>
  )
}

export const AppNavigator = (props: NavigationProps) => {
  const { navigationTheme } = useAppTheme()

  useBackButtonHandler((routeName) => exitRoutes.includes(routeName))

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} {...props}>
      <ErrorBoundary catchErrors={Config.catchErrors}>
        <AppStack />
      </ErrorBoundary>
    </NavigationContainer>
  )
}
