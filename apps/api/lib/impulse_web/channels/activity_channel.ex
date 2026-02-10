defmodule ImpulseWeb.ActivityChannel do
  use Phoenix.Channel

  alias Impulse.Chat

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

        {:noreply, socket}

      {:error, _changeset} ->
        {:reply, {:error, %{reason: "message_failed"}}, socket}
    end
  end

  def handle_in("chat:history", _payload, socket) do
    activity_id = socket.assigns.activity_id
    joined_at = socket.assigns.joined_at

    messages = Chat.list_messages_after(activity_id, joined_at)

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
end
