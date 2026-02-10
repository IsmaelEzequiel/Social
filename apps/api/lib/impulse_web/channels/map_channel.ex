defmodule ImpulseWeb.MapChannel do
  use Phoenix.Channel

  alias Impulse.Activities

  @impl true
  def join("map:" <> _city_id, _payload, socket) do
    Phoenix.PubSub.subscribe(Impulse.PubSub, "map:activity_updates")
    {:ok, socket}
  end

  @impl true
  def handle_in(
        "viewport:update",
        %{"min_lat" => min_lat, "min_lng" => min_lng, "max_lat" => max_lat, "max_lng" => max_lng},
        socket
      ) do
    activities = Activities.list_activities_in_viewport(min_lat, min_lng, max_lat, max_lng)

    activity_data =
      Enum.map(activities, fn a ->
        {lng, lat} = a.location.coordinates

        %{
          id: a.id,
          title: a.title,
          mode: a.mode,
          status: a.status,
          latitude: lat,
          longitude: lng,
          starts_at: a.starts_at,
          duration_minutes: a.duration_minutes,
          max_participants: a.max_participants,
          participant_count: Activities.active_participant_count(a.id),
          preset: %{id: a.preset.id, name: a.preset.name, icon: a.preset.icon},
          creator: %{display_name: a.creator.display_name, avatar_preset: a.creator.avatar_preset}
        }
      end)

    push(socket, "activities:list", %{activities: activity_data})
    {:noreply, socket}
  end

  @impl true
  def handle_info({:activity_created, activity}, socket) do
    {lng, lat} = activity.location.coordinates

    push(socket, "activity:created", %{
      id: activity.id,
      title: activity.title,
      mode: activity.mode,
      latitude: lat,
      longitude: lng,
      starts_at: activity.starts_at,
      preset: %{name: activity.preset.name, icon: activity.preset.icon}
    })

    {:noreply, socket}
  end

  def handle_info({:activity_joined, activity_id, user_id}, socket) do
    count = Activities.active_participant_count(activity_id)

    push(socket, "activity:joined", %{
      activity_id: activity_id,
      user_id: user_id,
      participant_count: count
    })

    {:noreply, socket}
  end

  def handle_info({:activity_left, activity_id, user_id}, socket) do
    count = Activities.active_participant_count(activity_id)

    push(socket, "activity:left", %{
      activity_id: activity_id,
      user_id: user_id,
      participant_count: count
    })

    {:noreply, socket}
  end

  def handle_info({:activity_completed, activity_id}, socket) do
    push(socket, "activity:completed", %{activity_id: activity_id})
    {:noreply, socket}
  end

  def handle_info(_, socket), do: {:noreply, socket}
end
