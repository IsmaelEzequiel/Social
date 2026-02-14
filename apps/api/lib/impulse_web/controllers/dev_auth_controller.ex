defmodule ImpulseWeb.DevAuthController do
  @moduledoc """
  Dev-only controller to bypass SMS verification.
  Only available when :dev_routes is enabled.

  Usage:
    POST /api/v1/dev/auth/login
    Body: {"phone": "+5511999999999"}

  Returns JWT access + refresh tokens for the user.
  """
  use ImpulseWeb, :controller

  alias Impulse.Accounts
  alias Impulse.Guardian

  def login(conn, %{"phone" => phone}) do
    phone_hash = :crypto.hash(:sha256, phone) |> Base.encode16(case: :lower)

    case Accounts.get_user_by_phone_hash(phone_hash) do
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{
          error: "user_not_found",
          message: "No user with that phone. Run mix run priv/repo/seeds.exs first."
        })

      user ->
        {:ok, access_token, _} = Guardian.encode_and_sign(user, %{}, ttl: {7, :day})

        {:ok, refresh_token, _} =
          Guardian.encode_and_sign(user, %{"typ" => "refresh"}, ttl: {30, :day})

        json(conn, %{
          user: %{
            id: user.id,
            display_name: user.display_name,
            avatar_preset: user.avatar_preset,
            subscription_tier: user.subscription_tier,
            status: user.status
          },
          access_token: access_token,
          refresh_token: refresh_token
        })
    end
  end
end
