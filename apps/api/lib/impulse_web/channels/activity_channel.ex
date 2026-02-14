defmodule ImpulseWeb.ActivityChannel do
  use Phoenix.Channel

  alias Impulse.Chat
  alias Impulse.Activities

  @impl true
  def join("activity:" <> activity_id, _payload, socket) do
    socket = assign(socket, :activity_id, activity_id)
    socket = assign(socket, :joined_at, DateTime.utc_now())
    {:ok, socket}
  end

  @impl true
  def handle_in("chat:message", %{"body" => body}, socket) do
    user = socket.assigns.current_user
    activity_id = socket.assigns.activity_id

    case Chat.send_message(user.id, activity_id, body) do
      {:ok, message} ->
        broadcast!(socket, "chat:message", %{
          id: message.id,
          user_id: user.id,
          display_name: user.display_name,
          avatar_preset: user.avatar_preset,
          body: message.body,
          inserted_at: message.inserted_at
        })

        Chat.mark_as_read(user.id, activity_id)
        {:noreply, socket}

      {:error, _changeset} ->
        {:reply, {:error, %{reason: "message_failed"}}, socket}
    end
  end

  def handle_in("chat:history", _payload, socket) do
    user = socket.assigns.current_user
    activity_id = socket.assigns.activity_id

    messages = Chat.list_messages(activity_id)

    # Mark messages as read for this user
    Chat.mark_as_read(user.id, activity_id)

    message_data =
      Enum.map(messages, fn m ->
        %{
          id: m.id,
          user_id: m.user_id,
          display_name: m.user.display_name,
          avatar_preset: m.user.avatar_preset,
          body: m.body,
          inserted_at: m.inserted_at
        }
      end)

    {:reply, {:ok, %{messages: message_data}}, socket}
  end

  def handle_in("chat:read", _payload, socket) do
    user = socket.assigns.current_user
    activity_id = socket.assigns.activity_id
    Chat.mark_as_read(user.id, activity_id)
    {:reply, {:ok, %{}}, socket}
  end

  def handle_in("participants:list", _payload, socket) do
    activity_id = socket.assigns.activity_id
    participants = Activities.list_participants(activity_id)

    data =
      Enum.map(participants, fn p ->
        %{
          id: p.id,
          user_id: p.user_id,
          status: p.status,
          joined_at: p.joined_at,
          display_name: p.user.display_name,
          avatar_preset: p.user.avatar_preset
        }
      end)

    {:reply, {:ok, %{participants: data}}, socket}
  end

  def handle_in("participant:approve", %{"user_id" => user_id}, socket) do
    owner = socket.assigns.current_user
    activity_id = socket.assigns.activity_id

    case Activities.approve_participant(owner, activity_id, user_id) do
      {:ok, participation} ->
        user = Impulse.Accounts.get_user(user_id)

        broadcast!(socket, "participant:joined", %{
          user_id: user_id,
          display_name: user && user.display_name,
          avatar_preset: user && user.avatar_preset,
          participation_id: participation.id
        })

        {:reply, {:ok, %{message: "approved"}}, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: to_string(reason)}}, socket}
    end
  end

  def handle_in("participant:reject", %{"user_id" => user_id}, socket) do
    owner = socket.assigns.current_user
    activity_id = socket.assigns.activity_id

    case Activities.reject_participant(owner, activity_id, user_id) do
      {:ok, _participation} ->
        broadcast!(socket, "participant:rejected", %{user_id: user_id})
        {:reply, {:ok, %{message: "rejected"}}, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: to_string(reason)}}, socket}
    end
  end
end
