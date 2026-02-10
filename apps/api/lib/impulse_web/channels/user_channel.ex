defmodule ImpulseWeb.UserChannel do
  use Phoenix.Channel

  @impl true
  def join("user:" <> user_id, _payload, socket) do
    if socket.assigns.current_user.id == user_id do
      {:ok, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end
end
