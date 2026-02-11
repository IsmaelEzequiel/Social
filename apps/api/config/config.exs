# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

config :impulse,
  ecto_repos: [Impulse.Repo],
  generators: [timestamp_type: :utc_datetime]

# Oban job queue
config :impulse, Oban,
  repo: Impulse.Repo,
  plugins: [
    Oban.Plugins.Pruner,
    {Oban.Plugins.Cron,
     crontab: [
       # Message cleanup runs every hour
       # {"0 * * * *", Impulse.Chat.Workers.MessageCleanupWorker}
     ]}
  ],
  queues: [default: 10, trust: 5, activities: 5, notifications: 10]

# Guardian JWT auth
config :impulse, Impulse.Guardian,
  issuer: "impulse",
  secret_key: System.get_env("GUARDIAN_SECRET_KEY") || "dev-secret-key-change-in-production"

# Auth0 social login
config :impulse, :auth0,
  domain: System.get_env("AUTH0_DOMAIN") || "your-tenant.auth0.com",
  client_id: System.get_env("AUTH0_CLIENT_ID") || "your-client-id"

# PostGIS types
config :impulse, Impulse.Repo, types: Impulse.PostgresTypes

# Configures the endpoint
config :impulse, ImpulseWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [json: ImpulseWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: Impulse.PubSub,
  live_view: [signing_salt: "/n2fbul2"]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"
