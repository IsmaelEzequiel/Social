defmodule Impulse.Notifications do
  @moduledoc """
  Push notification service using FCM (Android) and APNs (iOS).
  Sends notifications via Oban workers for reliability.
  """

  alias Impulse.Repo
  alias Impulse.Notifications.PushWorker

  import Ecto.Query

  def send_to_user(user_id, title, body, data \\ %{}) do
    %{user_id: user_id, title: title, body: body, data: data}
    |> PushWorker.new(queue: :notifications)
    |> Oban.insert()
  end

  def send_to_activity_participants(activity_id, title, body, data \\ %{}) do
    user_ids =
      from(p in Impulse.Activities.Participation,
        where: p.activity_id == ^activity_id and p.status in [:joined, :confirmed],
        select: p.user_id
      )
      |> Repo.all()

    Enum.each(user_ids, fn user_id ->
      send_to_user(user_id, title, body, data)
    end)
  end

  def get_push_tokens(user_id) do
    from(d in Impulse.Safety.DeviceRecord,
      where: d.user_id == ^user_id and not is_nil(d.push_token),
      select: %{token: d.push_token, platform: d.platform}
    )
    |> Repo.all()
  end
end
