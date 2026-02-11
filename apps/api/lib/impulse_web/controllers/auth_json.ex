defmodule ImpulseWeb.AuthJSON do
  alias Impulse.Accounts.User

  def auth_tokens(%{user: user, access_token: access_token, refresh_token: refresh_token}) do
    %{
      user: user_data(user),
      access_token: access_token,
      refresh_token: refresh_token
    }
  end

  defp user_data(%User{} = user) do
    %{
      id: user.id,
      display_name: user.display_name,
      avatar_preset: user.avatar_preset,
      preferred_presets: user.preferred_presets,
      zone_id: user.zone_id,
      subscription_tier: user.subscription_tier,
      auth_provider: user.auth_provider,
      activities_joined_count: user.activities_joined_count,
      activities_created_count: user.activities_created_count,
      inserted_at: user.inserted_at,
      updated_at: user.updated_at
    }
  end
end
