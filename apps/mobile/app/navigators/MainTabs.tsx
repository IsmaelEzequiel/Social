import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import type { MainTabParamList } from "./navigationTypes"
import { MapScreen } from "@/screens/map/MapScreen"
import { UpcomingListScreen } from "@/screens/upcoming/UpcomingListScreen"
import { ProfileScreen } from "@/screens/profile/ProfileScreen"

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
        options={{ title: "Mapa" }}
      />
      <Tab.Screen
        name="UpcomingTab"
        component={UpcomingListScreen}
        options={{ title: "Próximos" }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: "Perfil" }}
      />
    </Tab.Navigator>
  )
}
