defmodule Impulse.Chat do
  import Ecto.Query
  alias Impulse.Repo
  alias Impulse.Chat.Message
  alias Impulse.Activities
  alias Impulse.Activities.Participation

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

  def list_messages(activity_id) do
    from(m in Message,
      where: m.activity_id == ^activity_id,
      order_by: [asc: m.inserted_at],
      preload: [:user]
    )
    |> Repo.all()
  end

  def count_messages(activity_id) do
    from(m in Message, where: m.activity_id == ^activity_id)
    |> Repo.aggregate(:count)
  end

  @doc """
  Count unread messages for a specific user in a specific activity.
  Uses the participation's last_read_at timestamp.
  """
  def count_unread_messages(activity_id, user_id) do
    case Repo.get_by(Participation, user_id: user_id, activity_id: activity_id) do
      nil ->
        0

      %{last_read_at: nil} ->
        count_messages(activity_id)

      %{last_read_at: last_read_at} ->
        from(m in Message,
          where: m.activity_id == ^activity_id,
          where: m.inserted_at > ^last_read_at
        )
        |> Repo.aggregate(:count)
    end
  end

  @doc """
  Count total unread messages across all activities the user is participating in.
  """
  def count_unread_for_user_activities(user_id) do
    from(m in Message,
      join: p in Participation,
      on: p.activity_id == m.activity_id,
      where: p.user_id == ^user_id,
      where: p.status in [:joined, :confirmed, :pending],
      where: is_nil(p.last_read_at) or m.inserted_at > p.last_read_at
    )
    |> Repo.aggregate(:count)
  end

  @doc """
  Mark all messages in an activity as read for the given user.
  """
  def mark_as_read(user_id, activity_id) do
    case Repo.get_by(Participation, user_id: user_id, activity_id: activity_id) do
      nil ->
        :ok

      participation ->
        participation
        |> Ecto.Changeset.change(last_read_at: DateTime.utc_now())
        |> Repo.update()

        :ok
    end
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
