defmodule ImpulseWeb.ActivityController do
  use ImpulseWeb, :controller

  alias Impulse.Activities

  def index(conn, params) do
    activities =
      case params do
        %{"lat" => lat, "lng" => lng, "radius" => radius} ->
          Activities.list_activities_in_radius(
            parse_float(lat),
            parse_float(lng),
            parse_float(radius)
          )

        %{"min_lat" => min_lat, "min_lng" => min_lng, "max_lat" => max_lat, "max_lng" => max_lng} ->
          Activities.list_activities_in_viewport(
            parse_float(min_lat),
            parse_float(min_lng),
            parse_float(max_lat),
            parse_float(max_lng)
          )

        _ ->
          []
      end

    render(conn, :index, activities: activities)
  end

  def upcoming(conn, _params) do
    activities = Activities.list_upcoming()
    render(conn, :index, activities: activities)
  end

  def show(conn, %{"id" => id}) do
    case Activities.get_activity(id) do
      nil ->
        conn |> put_status(:not_found) |> json(%{error: "not_found"})

      activity ->
        participant_count = Activities.active_participant_count(id)
        render(conn, :show, activity: activity, participant_count: participant_count)
    end
  end

  def create(conn, params) do
    user = conn.assigns.current_user

    case Activities.create_activity(user, params) do
      {:ok, activity} ->
        Phoenix.PubSub.broadcast(
          Impulse.PubSub,
          "map:activity_updates",
          {:activity_created, activity}
        )

        conn
        |> put_status(:created)
        |> render(:show, activity: activity, participant_count: 0)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> put_view(ImpulseWeb.ErrorJSON)
        |> render("422.json", changeset: changeset)
    end
  end

  def join(conn, %{"id" => activity_id}) do
    user = conn.assigns.current_user

    case Activities.join_activity(user, activity_id) do
      {:ok, participation} ->
        Phoenix.PubSub.broadcast(
          Impulse.PubSub,
          "map:activity_updates",
          {:activity_joined, activity_id, user.id}
        )

        conn |> put_status(:ok) |> json(%{message: "joined", participation_id: participation.id})

      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{error: "not_found"})

      {:error, :not_joinable} ->
        conn |> put_status(:unprocessable_entity) |> json(%{error: "not_joinable"})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> put_view(ImpulseWeb.ErrorJSON)
        |> render("422.json", changeset: changeset)
    end
  end

  def leave(conn, %{"id" => activity_id}) do
    user = conn.assigns.current_user

    case Activities.leave_activity(user, activity_id) do
      :ok ->
        Phoenix.PubSub.broadcast(
          Impulse.PubSub,
          "map:activity_updates",
          {:activity_left, activity_id, user.id}
        )

        json(conn, %{message: "left"})

      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{error: "not_found"})
    end
  end

  def confirm(conn, %{"id" => activity_id}) do
    user = conn.assigns.current_user

    case Activities.confirm_participation(user, activity_id) do
      {:ok, _p} -> json(conn, %{message: "confirmed"})
      {:error, :not_found} -> conn |> put_status(:not_found) |> json(%{error: "not_found"})
    end
  end

  def feedback(conn, %{"id" => activity_id, "score" => score} = params) do
    user = conn.assigns.current_user

    case Activities.submit_feedback(user, activity_id, score, params["text"]) do
      {:ok, _p} ->
        json(conn, %{message: "feedback_submitted"})

      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{error: "not_found"})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> put_view(ImpulseWeb.ErrorJSON)
        |> render("422.json", changeset: changeset)
    end
  end

  defp parse_float(val) when is_binary(val), do: String.to_float(val)
  defp parse_float(val) when is_number(val), do: val / 1
  defp parse_float(_), do: 0.0
end
