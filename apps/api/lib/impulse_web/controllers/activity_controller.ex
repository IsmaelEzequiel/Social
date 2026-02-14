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
    user = conn.assigns.current_user
    activities = Activities.list_my_activities(user.id)
    render(conn, :index, activities: activities, current_user_id: user.id)
  end

  def messages_count(conn, _params) do
    user = conn.assigns.current_user
    count = Impulse.Chat.count_unread_for_user_activities(user.id)
    json(conn, %{count: count})
  end

  def mine(conn, _params) do
    user = conn.assigns.current_user
    activities = Activities.list_created_activities(user.id)
    render(conn, :index, activities: activities, current_user_id: user.id)
  end

  def show(conn, %{"id" => id}) do
    case Activities.get_activity(id) do
      nil ->
        conn |> put_status(:not_found) |> json(%{error: "not_found"})

      activity ->
        user = conn.assigns.current_user
        participant_count = Activities.active_participant_count(id)
        participation = Activities.get_participation(user.id, id)
        my_status = if participation, do: participation.status, else: nil

        render(conn, :show,
          activity: activity,
          participant_count: participant_count,
          my_participation_status: my_status
        )
    end
  end

  def delete(conn, %{"id" => activity_id}) do
    user = conn.assigns.current_user

    case Activities.delete_activity(user, activity_id) do
      {:ok, _activity} ->
        Phoenix.PubSub.broadcast(
          Impulse.PubSub,
          "map:activity_updates",
          {:activity_deleted, activity_id}
        )

        json(conn, %{message: "deleted"})

      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{error: "not_found"})

      {:error, :not_owner} ->
        conn |> put_status(:forbidden) |> json(%{error: "not_owner"})
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
        if participation.status == :joined do
          Phoenix.PubSub.broadcast(
            Impulse.PubSub,
            "map:activity_updates",
            {:activity_joined, activity_id, user.id}
          )
        end

        conn
        |> put_status(:ok)
        |> json(%{
          message: to_string(participation.status),
          participation_id: participation.id,
          status: participation.status
        })

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

  def participants(conn, %{"id" => activity_id}) do
    participants = Activities.list_participants(activity_id)

    json(conn, %{
      data:
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
    })
  end

  def pending_participants(conn, %{"id" => activity_id}) do
    user = conn.assigns.current_user
    activity = Activities.get_activity(activity_id)

    cond do
      is_nil(activity) ->
        conn |> put_status(:not_found) |> json(%{error: "not_found"})

      activity.creator_id != user.id ->
        conn |> put_status(:forbidden) |> json(%{error: "not_owner"})

      true ->
        pending = Activities.list_pending_participants(activity_id)

        json(conn, %{
          data:
            Enum.map(pending, fn p ->
              %{
                id: p.id,
                user_id: p.user_id,
                status: p.status,
                display_name: p.user.display_name,
                avatar_preset: p.user.avatar_preset
              }
            end)
        })
    end
  end

  def approve_participant(conn, %{"id" => activity_id, "user_id" => user_id}) do
    owner = conn.assigns.current_user

    case Activities.approve_participant(owner, activity_id, user_id) do
      {:ok, _p} ->
        json(conn, %{message: "approved"})

      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{error: "not_found"})

      {:error, :not_owner} ->
        conn |> put_status(:forbidden) |> json(%{error: "not_owner"})
    end
  end

  def reject_participant(conn, %{"id" => activity_id, "user_id" => user_id}) do
    owner = conn.assigns.current_user

    case Activities.reject_participant(owner, activity_id, user_id) do
      {:ok, _p} ->
        json(conn, %{message: "rejected"})

      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{error: "not_found"})

      {:error, :not_owner} ->
        conn |> put_status(:forbidden) |> json(%{error: "not_owner"})
    end
  end

  defp parse_float(val) when is_binary(val) do
    case Float.parse(val) do
      {f, _} -> f
      :error -> 0.0
    end
  end

  defp parse_float(val) when is_float(val), do: val
  defp parse_float(val) when is_integer(val), do: val * 1.0
  defp parse_float(_), do: 0.0
end
