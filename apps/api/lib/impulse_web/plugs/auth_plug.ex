defmodule ImpulseWeb.Plugs.AuthPlug do
  @moduledoc "Verifies JWT Bearer token and assigns current_user."
  import Plug.Conn
  import Phoenix.Controller, only: [json: 2]

  def init(opts), do: opts

  def call(conn, _opts) do
    with ["Bearer " <> token] <- get_req_header(conn, "authorization"),
         {:ok, claims} <- Impulse.Guardian.decode_and_verify(token),
         {:ok, user} <- Impulse.Guardian.resource_from_claims(claims) do
      conn
      |> assign(:current_user, user)
      |> assign(:jwt_claims, claims)
    else
      _ ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "unauthorized", message: "Invalid or missing authentication token"})
        |> halt()
    end
  end
end
