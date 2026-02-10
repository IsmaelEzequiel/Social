import Config

# Configure your database
#
# The MIX_TEST_PARTITION environment variable can be used
# to provide built-in test partitioning in CI environment.
# Run `mix help test` for more information.
config :impulse, Impulse.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "impulse_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: System.schedulers_online() * 2,
  types: Impulse.PostgresTypes

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :impulse, ImpulseWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "hKROzEnfuu/WbEYuxE5pPnPQ0HBbqcS+LP0txD7kiw0B6U4co0utjlRhoauo/y/k",
  server: false

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime

# Oban: use inline testing mode
config :impulse, Oban, testing: :inline
