defmodule ImpulseWeb.Router do
  use ImpulseWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
    plug Corsica, origins: "*", allow_headers: :all
  end

  pipeline :authenticated do
    plug ImpulseWeb.Plugs.AuthPlug
  end

  # Public routes (no auth required)
  scope "/api/v1", ImpulseWeb do
    pipe_through :api

    post "/auth/request-code", AuthController, :request_code
    post "/auth/verify", AuthController, :verify
    post "/auth/refresh", AuthController, :refresh
    post "/auth/social", AuthController, :social_login

    get "/presets", PresetController, :index

    # Stripe webhook (needs raw body, separate from auth)
    post "/webhooks/stripe", WebhookController, :stripe
  end

  # Authenticated routes
  scope "/api/v1", ImpulseWeb do
    pipe_through [:api, :authenticated]

    # User profile
    get "/me", UserController, :show
    patch "/me", UserController, :update
    get "/me/badges", UserController, :badges
    get "/me/trophies", UserController, :trophies

    # Activities
    get "/activities", ActivityController, :index
    get "/activities/upcoming", ActivityController, :upcoming
    post "/activities", ActivityController, :create
    get "/activities/:id", ActivityController, :show
    post "/activities/:id/join", ActivityController, :join
    delete "/activities/:id/leave", ActivityController, :leave
    post "/activities/:id/confirm", ActivityController, :confirm
    post "/activities/:id/feedback", ActivityController, :feedback
    get "/activities/:id/participants", ActivityController, :participants
    get "/activities/:id/participants/pending", ActivityController, :pending_participants
    post "/activities/:id/participants/:user_id/approve", ActivityController, :approve_participant
    post "/activities/:id/participants/:user_id/reject", ActivityController, :reject_participant

    # Reports
    post "/reports", ReportController, :create

    # Devices
    post "/devices", DeviceController, :create

    # Subscriptions
    post "/subscriptions", SubscriptionController, :create
    delete "/subscriptions", SubscriptionController, :delete
  end

  # Enable LiveDashboard and dev auth bypass in development
  if Application.compile_env(:impulse, :dev_routes) do
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through [:fetch_session, :protect_from_forgery]
      live_dashboard "/dashboard", metrics: ImpulseWeb.Telemetry
    end

    # Dev-only: bypass SMS verification for testing
    scope "/api/v1/dev", ImpulseWeb do
      pipe_through :api
      post "/auth/login", DevAuthController, :login
    end
  end
end
