import demoEn from "./demo-en"

const en = {
  welcomeScreen: {
    postscript:
      "psst  — This probably isn't what your app looks like. (Unless your designer handed you these screens, and in that case, ship it!)",
    readyForLaunch: "Your app, almost ready for launch!",
    exciting: "(ohh, this is exciting!)",
    letsGo: "Let's go!",
  },
  errorScreen: {
    title: "Something went wrong!",
    friendlySubtitle:
      "This is the screen that your users will see in production when an error is thrown. You'll want to customize this message (located in `app/i18n/en.ts`) and probably the layout as well (`app/screens/ErrorScreen`). If you want to remove this entirely, check `app/app.tsx` for the <ErrorBoundary> component.",
    reset: "RESET APP",
    traceTitle: "Error from %{name} stack",
  },
  emptyStateComponent: {
    generic: {
      heading: "So empty... so sad",
      content: "No data found yet. Try clicking the button to refresh or reload the app.",
      button: "Let's try this again",
    },
  },

  errors: {
    invalidEmail: "Invalid email address.",
  },
  loginScreen: {
    logIn: "Log In",
    enterDetails:
      "Enter your details below to unlock top secret info. You'll never guess what we've got waiting. Or maybe you will; it's not rocket science here.",
    emailFieldLabel: "Email",
    passwordFieldLabel: "Password",
    emailFieldPlaceholder: "Enter your email address",
    passwordFieldPlaceholder: "Super secret password here",
    tapToLogIn: "Tap to log in!",
    hint: "Hint: you can use any email address and your favorite password :)",
  },
  demoNavigator: {
    componentsTab: "Components",
    debugTab: "Debug",
    communityTab: "Community",
    podcastListTab: "Podcast",
  },
  demoCommunityScreen: {
    title: "Connect with the community",
    tagLine:
      "Plug in to Infinite Red's community of React Native engineers and level up your app development with us!",
    joinUsOnSlackTitle: "Join us on Slack",
    joinUsOnSlack:
      "Wish there was a place to connect with React Native engineers around the world? Join the conversation in the Infinite Red Community Slack! Our growing community is a safe space to ask questions, learn from others, and grow your network.",
    joinSlackLink: "Join the Slack Community",
    makeIgniteEvenBetterTitle: "Make Ignite even better",
    makeIgniteEvenBetter:
      "Have an idea to make Ignite even better? We're happy to hear that! We're always looking for others who want to help us build the best React Native tooling out there. Join us over on GitHub to join us in building the future of Ignite.",
    contributeToIgniteLink: "Contribute to Ignite",
    theLatestInReactNativeTitle: "The latest in React Native",
    theLatestInReactNative: "We're here to keep you current on all React Native has to offer.",
    reactNativeRadioLink: "React Native Radio",
    reactNativeNewsletterLink: "React Native Newsletter",
    reactNativeLiveLink: "React Native Live",
    chainReactConferenceLink: "Chain React Conference",
    hireUsTitle: "Hire Infinite Red for your next project",
    hireUs:
      "Whether it's running a full project or getting teams up to speed with our hands-on training, Infinite Red can help with just about any React Native project.",
    hireUsLink: "Send us a message",
  },
  demoShowroomScreen: {
    jumpStart: "Components to jump start your project!",
    lorem2Sentences:
      "Nulla cupidatat deserunt amet quis aliquip nostrud do adipisicing. Adipisicing excepteur elit laborum Lorem adipisicing do duis.",
    demoHeaderTxExample: "Yay",
    demoViaTxProp: "Via `tx` Prop",
    demoViaSpecifiedTxProp: "Via `{{prop}}Tx` Prop",
  },
  demoDebugScreen: {
    howTo: "HOW TO",
    title: "Debug",
    tagLine:
      "Congratulations, you've got a very advanced React Native app template here.  Take advantage of this boilerplate!",
    reactotron: "Send to Reactotron",
    reportBugs: "Report Bugs",
    demoList: "Demo List",
    demoPodcastList: "Demo Podcast List",
    androidReactotronHint:
      "If this doesn't work, ensure the Reactotron desktop app is running, run adb reverse tcp:9090 tcp:9090 from your terminal, and reload the app.",
    iosReactotronHint:
      "If this doesn't work, ensure the Reactotron desktop app is running and reload app.",
    macosReactotronHint:
      "If this doesn't work, ensure the Reactotron desktop app is running and reload app.",
    webReactotronHint:
      "If this doesn't work, ensure the Reactotron desktop app is running and reload app.",
    windowsReactotronHint:
      "If this doesn't work, ensure the Reactotron desktop app is running and reload app.",
  },
  demoPodcastListScreen: {
    title: "React Native Radio episodes",
    onlyFavorites: "Only Show Favorites",
    favoriteButton: "Favorite",
    unfavoriteButton: "Unfavorite",
    accessibility: {
      cardHint:
        "Double tap to listen to the episode. Double tap and hold to {{action}} this episode.",
      switch: "Switch on to only show favorites",
      favoriteAction: "Toggle Favorite",
      favoriteIcon: "Episode not favorited",
      unfavoriteIcon: "Episode favorited",
      publishLabel: "Published {{date}}",
      durationLabel: "Duration: {{hours}} hours {{minutes}} minutes {{seconds}} seconds",
    },
    noFavoritesEmptyState: {
      heading: "This looks a bit empty",
      content:
        "No favorites have been added yet. Tap the heart on an episode to add it to your favorites!",
    },
  },

  common: {
    ok: "OK!",
    cancel: "Cancel",
    back: "Back",
    logOut: "Log Out",
    loading: "Loading...",
    retry: "Try again",
    save: "Save",
    confirm: "Confirm",
    delete: "Delete",
    send: "Send",
    error: "Error",
    failedAction: "Action failed. Try again.",
  },
  map: {
    title: "Map",
    createActivity: "Create activity",
    noActivities: "No activities nearby",
    join: "Join",
    leave: "Leave",
    full: "Full",
    participants: "{{count}} participants",
    startsIn: "Starts in {{time}}",
    endsIn: "Ends in {{time}}",
    radiusFilter: {
      label: "Radius",
      km1: "1 km",
      km5: "5 km",
      km10: "10 km",
      km25: "25 km",
    },
    empty: {
      title: "Nothing happening nearby",
      subtitle: "Be the first! Tap + to create an activity",
    },
  },
  activity: {
    flash: "Flash",
    planned: "Planned",
    requestToJoin: "Request to Join",
    pendingApproval: "Pending Approval",
    create: {
      title: "New Activity",
      choosePreset: "What?",
      chooseLocation: "Where?",
      chooseTime: "When?",
      chooseParticipants: "How many?",
      duration: "Duration",
      minutes: "{{count}} min",
      create: "Create activity",
      createFlash: "Create Flash",
      now: "Now",
      endsAt: "Ends at ~{{time}}",
      includingYou: "{{count}} people including you",
      currentLocation: "Current location",
    },
    detail: {
      creator: "Created by {{name}}",
      spotsLeft: "{{count}} spots left",
      confirmed: "{{count}} confirmed",
      startingNow: "Starting now",
      enterLive: "Enter live",
    },
    chat: {
      placeholder: "Message...",
      ephemeralNotice: "Messages are deleted after the activity",
    },
    feedback: {
      title: "How was it?",
      submit: "Submit",
      thankYou: "Thanks for the feedback!",
      doAgain: "Would you do this again?",
      yes: "Yes",
      maybe: "Maybe",
      no: "No",
      done: "Done",
    },
  },
  eventRoom: {
    tabs: {
      chat: "Chat",
      participants: "Participants",
    },
    report: {
      button: "Report",
      title: "Report Activity",
      submitted: "Report submitted",
      reasonPlaceholder: "Reason...",
    },
    participants: {
      pending: "Pending Requests",
      approve: "Approve",
      reject: "Reject",
      empty: "No participants yet",
      pendingEmpty: "No pending requests",
    },
    pendingApproval: "Waiting for owner approval...",
  },
  myEvents: {
    title: "My Events",
    empty: "You haven't created any events yet",
    deleteTitle: "Delete Event",
    deleteConfirm: "Are you sure you want to delete \"{{title}}\"?",
  },
  upcoming: {
    title: "Upcoming",
    empty: "No upcoming activities",
    confirm: "Confirm",
  },
  profile: {
    title: "Profile",
    activitiesJoined: "Joined",
    activitiesCreated: "Created",
    badges: "Badges",
    trophies: "Trophies",
    subscription: "Impulse Pro",
    settings: "Settings",
  },
  subscription: {
    title: "Impulse Pro",
    price: "$4.99/month",
    subscribe: "Subscribe",
    cancel: "Cancel subscription",
    benefits: {
      unlimitedPlanned: "Unlimited planned activities",
      extendedDuration: "Up to 6 hour duration",
      priorityVisibility: "Priority map visibility",
    },
  },

  ...demoEn,
}

export default en
export type Translations = typeof en
