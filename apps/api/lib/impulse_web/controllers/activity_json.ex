defmodule ImpulseWeb.ActivityJSON do
  alias Impulse.Activities.Activity

  def index(%{activities: activities}) do
    %{data: Enum.map(activities, &activity_data/1)}
  end

  def show(%{activity: activity, participant_count: count}) do
    %{data: activity_data(activity) |> Map.put(:participant_count, count)}
  end

  def show(%{activity: activity}) do
    %{data: activity_data(activity)}
  end

  defp activity_data(%Activity{} = a) do
    {lng, lat} = a.location.coordinates

    %{
      id: a.id,
      creator_id: a.creator_id,
      mode: a.mode,
      preset_id: a.preset_id,
      title: a.title,
      location: %{latitude: lat, longitude: lng},
      location_name: a.location_name,
      starts_at: a.starts_at,
      duration_minutes: a.duration_minutes,
      max_participants: a.max_participants,
      min_participants: a.min_participants,
      status: a.status,
      visibility_score: a.visibility_score,
      confirmed_count: a.confirmed_count,
      inserted_at: a.inserted_at,
      creator: maybe_creator(a),
      preset: maybe_preset(a)
    }
  end

  defp maybe_creator(%{creator: %Ecto.Association.NotLoaded{}}), do: nil

  defp maybe_creator(%{creator: creator}) do
    %{
      id: creator.id,
      display_name: creator.display_name,
      avatar_preset: creator.avatar_preset
    }
  end

  defp maybe_preset(%{preset: %Ecto.Association.NotLoaded{}}), do: nil

  defp maybe_preset(%{preset: preset}) do
    %{
      id: preset.id,
      name: preset.name,
      icon: preset.icon
    }
  end
end
