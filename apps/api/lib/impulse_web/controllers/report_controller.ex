defmodule ImpulseWeb.ReportController do
  use ImpulseWeb, :controller

  alias Impulse.Safety

  def create(conn, %{"reported_id" => reported_id, "reason" => reason} = params) do
    user = conn.assigns.current_user

    attrs = %{
      reported_id: reported_id,
      reason: reason,
      activity_id: params["activity_id"],
      details: params["details"]
    }

    case Safety.create_report(user.id, attrs) do
      {:ok, _report} ->
        conn
        |> put_status(:created)
        |> json(%{message: "Report submitted"})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> put_view(ImpulseWeb.ErrorJSON)
        |> render("422.json", changeset: changeset)
    end
  end
end
