defmodule Impulse.Chat do
  import Ecto.Query
  alias Impulse.Repo
  alias Impulse.Chat.Message
  alias Impulse.Activities

  def send_message(user_id, activity_id, body) do
    activity = Activities.get_activity(activity_id)

    expires_at = calculate_expiry(activity)

    attrs = %{
      user_id: user_id,
      activity_id: activity_id,
      body: body,
      expires_at: expires_at
    }

    %Message{}
    |> Message.changeset(attrs)
    |> Repo.insert()
  end

  def list_messages_after(activity_id, after_time) do
    from(m in Message,
      where: m.activity_id == ^activity_id,
      where: m.inserted_at >= ^after_time,
      order_by: [asc: m.inserted_at],
      preload: [:user]
    )
    |> Repo.all()
  end

  defp calculate_expiry(activity) do
    end_time = DateTime.add(activity.starts_at, activity.duration_minutes * 60, :second)

    buffer_minutes =
      case activity.mode do
        :flash -> 30
        _ -> 60
      end

    DateTime.add(end_time, buffer_minutes * 60, :second)
  end
end
