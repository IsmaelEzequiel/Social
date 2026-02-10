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
  secret_key: "dev-secret-key-change-in-production"

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
