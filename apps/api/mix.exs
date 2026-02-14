defmodule Impulse.MixProject do
  use Mix.Project

  # Load .env file into system environment (dev/test only)
  if File.exists?(".env") and Mix.env() in [:dev, :test] do
    File.read!(".env")
    |> String.split("\n")
    |> Enum.each(fn line ->
      line = String.trim(line)

      unless line == "" or String.starts_with?(line, "#") do
        case String.split(line, "=", parts: 2) do
          [key, value] ->
            System.put_env(String.trim(key), String.trim(value))

          _ ->
            :skip
        end
      end
    end)
  end

  def project do
    [
      app: :impulse,
      version: "0.1.0",
      elixir: "~> 1.14",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps()
    ]
  end

  # Configuration for the OTP application.
  #
  # Type `mix help compile.app` for more information.
  def application do
    [
      mod: {Impulse.Application, []},
      extra_applications: [:logger, :runtime_tools]
    ]
  end

  # Specifies which paths to compile per environment.
  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  # Specifies your project dependencies.
  #
  # Type `mix help deps` for examples and options.
  defp deps do
    [
      {:phoenix, "~> 1.7.14"},
      {:phoenix_ecto, "~> 4.5"},
      {:ecto_sql, "~> 3.10"},
      {:postgrex, ">= 0.0.0"},
      {:phoenix_live_dashboard, "~> 0.8.3"},
      {:telemetry_metrics, "~> 1.0"},
      {:telemetry_poller, "~> 1.0"},
      {:gettext, "~> 0.20"},
      {:jason, "~> 1.2"},
      {:dns_cluster, "~> 0.1.1"},
      {:bandit, "~> 1.5"},

      # Auth
      {:guardian, "~> 2.3"},

      # Background jobs
      {:oban, "~> 2.18"},

      # Geospatial
      {:geo_postgis, "~> 3.6"},

      # Payments
      {:stripity_stripe, "~> 3.2"},

      # HTTP client (for Twilio)
      {:req, "~> 0.5"},

      # CORS
      {:corsica, "~> 2.1"}
    ]
  end

  # Aliases are shortcuts or tasks specific to the current project.
  # For example, to install project dependencies and perform other setup tasks, run:
  #
  #     $ mix setup
  #
  # See the documentation for `Mix` for more info on aliases.
  defp aliases do
    [
      setup: ["deps.get", "ecto.setup"],
      "ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
      "ecto.reset": ["ecto.drop", "ecto.setup"],
      test: ["ecto.create --quiet", "ecto.migrate --quiet", "test"]
    ]
  end
end
