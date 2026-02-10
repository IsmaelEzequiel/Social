defmodule ImpulseWeb.DeviceController do
  use ImpulseWeb, :controller

  alias Impulse.Repo
  alias Impulse.Safety.DeviceRecord

  def create(conn, params) do
    user = conn.assigns.current_user

    attrs = %{
      user_id: user.id,
      fingerprint: params["fingerprint"],
      platform: params["platform"],
      push_token: params["push_token"],
      last_seen_at: DateTime.utc_now()
    }

    case %DeviceRecord{} |> DeviceRecord.changeset(attrs) |> Repo.insert() do
      {:ok, _record} ->
        conn
        |> put_status(:created)
        |> json(%{message: "Device registered"})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> put_view(ImpulseWeb.ErrorJSON)
        |> render("422.json", changeset: changeset)
    end
  end
end
