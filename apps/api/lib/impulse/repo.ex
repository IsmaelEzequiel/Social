defmodule Impulse.Repo do
  use Ecto.Repo,
    otp_app: :impulse,
    adapter: Ecto.Adapters.Postgres
end
