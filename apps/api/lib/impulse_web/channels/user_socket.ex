defmodule ImpulseWeb.UserSocket do
  use Phoenix.Socket

  channel "map:*", ImpulseWeb.MapChannel
  channel "activity:*", ImpulseWeb.ActivityChannel
  channel "user:*", ImpulseWeb.UserChannel

  @impl true
  def connect(%{"token" => token}, socket, _connect_info) do
    case Impulse.Guardian.decode_and_verify(token) do
      {:ok, claims} ->
        case Impulse.Guardian.resource_from_claims(claims) do
          {:ok, user} ->
            {:ok, assign(socket, :current_user, user)}

          _ ->
            :error
        end

      _ ->
        :error
    end
  end

  def connect(_params, _socket, _connect_info), do: :error

  @impl true
  def id(socket), do: "user_socket:#{socket.assigns.current_user.id}"
end
