import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"

import { Icon } from "@/components/Icon"
import { MapScreen } from "@/screens/map/MapScreen"
import { ProfileScreen } from "@/screens/profile/ProfileScreen"
import { UpcomingListScreen } from "@/screens/upcoming/UpcomingListScreen"

import type { MainTabParamList } from "./navigationTypes"

const Tab = createBottomTabNavigator<MainTabParamList>()

export const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="MapTab"
        component={MapScreen}
        options={{ title: "Mapa", tabBarIcon: () => <Icon icon="components" /> }}
      />
      <Tab.Screen
        name="UpcomingTab"
        component={UpcomingListScreen}
        options={{ title: "Próximos", tabBarIcon: () => <Icon icon="bell" /> }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: "Perfil", tabBarIcon: () => <Icon icon="clap" /> }}
      />
    </Tab.Navigator>
  )
}
