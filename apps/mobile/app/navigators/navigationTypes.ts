import { ComponentProps } from "react"
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs"
import {
  CompositeScreenProps,
  NavigationContainer,
  NavigatorScreenParams,
} from "@react-navigation/native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"

// Auth Stack (unauthenticated)
export type AuthStackParamList = {
  AuthMethod: undefined
  PhoneEntry: undefined
  CodeVerification: { phone: string; countryCode: string }
  ProfileSetup: undefined
}

// Main Tab Navigator
export type MainTabParamList = {
  MapTab: undefined
  UpcomingTab: undefined
  ProfileTab: undefined
}

// App Stack Navigator (root)
export type AppStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>
  Main: NavigatorScreenParams<MainTabParamList>
  ActivityDetail: { activityId: string }
  LiveActivity: { activityId: string }
  Chat: { activityId: string }
  Badges: undefined
  Trophies: undefined
  Subscription: undefined
  Settings: undefined
}

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, T>,
  AppStackScreenProps<keyof AppStackParamList>
>

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  AppStackScreenProps<keyof AppStackParamList>
>

export interface NavigationProps
  extends Partial<ComponentProps<typeof NavigationContainer<AppStackParamList>>> {}
