defmodule ImpulseWeb.UserController do
  use ImpulseWeb, :controller

  alias Impulse.Accounts
  alias Impulse.Gamification

  def show(conn, _params) do
    user = conn.assigns.current_user
    render(conn, :user, user: user)
  end

  def update(conn, params) do
    user = conn.assigns.current_user

    case Accounts.update_profile(user, params) do
      {:ok, updated_user} ->
        render(conn, :user, user: updated_user)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> put_view(ImpulseWeb.ErrorJSON)
        |> render("422.json", changeset: changeset)
    end
  end

  def badges(conn, _params) do
    user = conn.assigns.current_user
    badges = Gamification.list_badges(user.id)

    json(conn, %{
      data:
        Enum.map(badges, fn b ->
          %{id: b.id, type: b.type, earned_at: b.earned_at}
        end)
    })
  end

  def trophies(conn, _params) do
    user = conn.assigns.current_user
    trophies = Gamification.list_trophies(user.id)

    json(conn, %{
      data:
        Enum.map(trophies, fn t ->
          %{id: t.id, type: t.type, earned_at: t.earned_at}
        end)
    })
  end
end
