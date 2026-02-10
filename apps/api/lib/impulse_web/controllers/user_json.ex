defmodule ImpulseWeb.UserJSON do
  alias Impulse.Accounts.User

  def user(%{user: user}) do
    %{data: user_data(user)}
  end

  def user_data(%User{} = user) do
    %{
      id: user.id,
      display_name: user.display_name,
      avatar_preset: user.avatar_preset,
      preferred_presets: user.preferred_presets,
      zone_id: user.zone_id,
      subscription_tier: user.subscription_tier,
      activities_joined_count: user.activities_joined_count,
      activities_created_count: user.activities_created_count,
      inserted_at: user.inserted_at,
      updated_at: user.updated_at
    }
  end
end
