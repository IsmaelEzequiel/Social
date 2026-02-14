defmodule ImpulseWeb.ActivityJSON do
  alias Impulse.Activities.Activity

  def index(%{activities: activities, current_user_id: user_id}) do
    %{
      data:
        Enum.map(activities, fn a ->
          participant_count = Impulse.Activities.active_participant_count(a.id)
          message_count = Impulse.Chat.count_unread_messages(a.id, user_id)

          activity_data(a)
          |> Map.put(:participant_count, participant_count)
          |> Map.put(:message_count, message_count)
        end)
    }
  end

  def index(%{activities: activities}) do
    %{
      data:
        Enum.map(activities, fn a ->
          participant_count = Impulse.Activities.active_participant_count(a.id)

          activity_data(a)
          |> Map.put(:participant_count, participant_count)
        end)
    }
  end

  def show(%{activity: activity, participant_count: count} = assigns) do
    data =
      activity_data(activity)
      |> Map.put(:participant_count, count)
      |> maybe_put_participation_status(assigns)

    %{data: data}
  end

  def show(%{activity: activity} = assigns) do
    data =
      activity_data(activity)
      |> maybe_put_participation_status(assigns)

    %{data: data}
  end

  defp activity_data(%Activity{} = a) do
    {lng, lat} = a.location.coordinates
    now = DateTime.utc_now()

    ends_at = DateTime.add(a.starts_at, a.duration_minutes * 60, :second)
    time_until_start_minutes = max(0, DateTime.diff(a.starts_at, now, :second) / 60) |> round()
    time_remaining_minutes = max(0, DateTime.diff(ends_at, now, :second) / 60) |> round()

    %{
      id: a.id,
      creator_id: a.creator_id,
      mode: a.mode,
      preset_id: a.preset_id,
      title: a.title,
      location: %{latitude: lat, longitude: lng},
      location_name: a.location_name,
      starts_at: a.starts_at,
      ends_at: ends_at,
      duration_minutes: a.duration_minutes,
      max_participants: a.max_participants,
      min_participants: a.min_participants,
      status: a.status,
      visibility_score: a.visibility_score,
      confirmed_count: a.confirmed_count,
      requires_approval: a.requires_approval,
      time_until_start_minutes: time_until_start_minutes,
      time_remaining_minutes: time_remaining_minutes,
      inserted_at: a.inserted_at,
      creator: maybe_creator(a),
      preset: maybe_preset(a)
    }
  end

  defp maybe_put_participation_status(data, %{my_participation_status: status})
       when not is_nil(status) do
    Map.put(data, :my_participation_status, status)
  end

  defp maybe_put_participation_status(data, _assigns), do: data

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
