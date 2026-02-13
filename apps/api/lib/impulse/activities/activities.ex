defmodule Impulse.Activities do
  import Ecto.Query
  alias Impulse.Repo
  alias Impulse.Activities.{Activity, Participation}
  alias Impulse.Accounts

  # --- Create ---

  def create_activity(creator, attrs) do
    location = build_point(attrs["latitude"], attrs["longitude"])

    changeset_attrs =
      attrs
      |> Map.put("creator_id", creator.id)
      |> Map.put("visibility_score", creator.trust_score)

    result =
      %Activity{}
      |> Activity.changeset(changeset_attrs)
      |> Ecto.Changeset.put_change(:location, location)
      |> Repo.insert()

    case result do
      {:ok, activity} ->
        Accounts.increment_counter(creator, :activities_created_count)
        schedule_auto_complete(activity)
        {:ok, Repo.preload(activity, [:creator, :preset])}

      error ->
        error
    end
  end

  # --- Read ---

  def get_activity(id) do
    Activity
    |> Repo.get(id)
    |> Repo.preload([:creator, :preset])
  end

  def list_activities_in_viewport(min_lat, min_lng, max_lat, max_lng, opts \\ []) do
    limit = Keyword.get(opts, :limit, 100)

    envelope =
      "ST_MakeEnvelope(#{min_lng}, #{min_lat}, #{max_lng}, #{max_lat}, 4326)"

    from(a in Activity,
      where: a.status in [:open, :full, :active],
      where: fragment("? && ?", a.location, fragment(^envelope)),
      order_by: [desc: a.visibility_score, asc: a.starts_at],
      limit: ^limit,
      preload: [:creator, :preset]
    )
    |> Repo.all()
  end

  def list_activities_in_radius(lat, lng, radius_meters, opts \\ []) do
    limit = Keyword.get(opts, :limit, 50)
    point = %Geo.Point{coordinates: {lng, lat}, srid: 4326}

    from(a in Activity,
      where: a.status in [:open, :full, :active],
      where:
        fragment("ST_DWithin(?::geography, ?::geography, ?)", a.location, ^point, ^radius_meters),
      order_by: [desc: a.visibility_score, asc: a.starts_at],
      limit: ^limit,
      preload: [:creator, :preset]
    )
    |> Repo.all()
  end

  def list_upcoming(opts \\ []) do
    limit = Keyword.get(opts, :limit, 50)
    now = DateTime.utc_now()

    from(a in Activity,
      where: a.mode == :planned,
      where: a.status in [:open, :full],
      where: a.starts_at > ^now,
      order_by: [asc: a.starts_at],
      limit: ^limit,
      preload: [:creator, :preset]
    )
    |> Repo.all()
  end

  # --- Join / Leave ---

  def join_activity(user, activity_id) do
    activity = get_activity(activity_id)

    cond do
      is_nil(activity) ->
        {:error, :not_found}

      activity.status not in [:open] ->
        {:error, :not_joinable}

      true ->
        initial_status = if activity.requires_approval, do: :pending, else: :joined

        attrs = %{
          user_id: user.id,
          activity_id: activity_id,
          status: initial_status,
          joined_at: DateTime.utc_now()
        }

        case %Participation{} |> Participation.changeset(attrs) |> Repo.insert() do
          {:ok, participation} ->
            unless initial_status == :pending do
              Accounts.increment_counter(user, :activities_joined_count)
              maybe_mark_full(activity)
            end

            {:ok, participation}

          {:error, changeset} ->
            {:error, changeset}
        end
    end
  end

  def leave_activity(user, activity_id) do
    case Repo.get_by(Participation, user_id: user.id, activity_id: activity_id) do
      nil ->
        {:error, :not_found}

      participation ->
        participation
        |> Participation.cancel_changeset()
        |> Repo.update()
        |> case do
          {:ok, _p} ->
            maybe_reopen(activity_id)
            :ok

          error ->
            error
        end
    end
  end

  def confirm_participation(user, activity_id) do
    case Repo.get_by(Participation, user_id: user.id, activity_id: activity_id) do
      nil ->
        {:error, :not_found}

      participation ->
        participation
        |> Participation.confirm_changeset()
        |> Repo.update()
        |> case do
          {:ok, p} ->
            increment_confirmed_count(activity_id)
            {:ok, p}

          error ->
            error
        end
    end
  end

  # --- Approval Workflow ---

  def approve_participant(owner, activity_id, user_id) do
    with {:ok, activity} <- get_owned_activity(owner, activity_id),
         participation when not is_nil(participation) <-
           Repo.get_by(Participation,
             user_id: user_id,
             activity_id: activity_id,
             status: :pending
           ) do
      participation
      |> Participation.approve_changeset()
      |> Repo.update()
      |> case do
        {:ok, p} ->
          user = Accounts.get_user(user_id)
          if user, do: Accounts.increment_counter(user, :activities_joined_count)
          maybe_mark_full(activity)
          {:ok, p}

        error ->
          error
      end
    else
      nil -> {:error, :not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  def reject_participant(owner, activity_id, user_id) do
    with {:ok, _activity} <- get_owned_activity(owner, activity_id),
         participation when not is_nil(participation) <-
           Repo.get_by(Participation,
             user_id: user_id,
             activity_id: activity_id,
             status: :pending
           ) do
      participation
      |> Participation.reject_changeset()
      |> Repo.update()
    else
      nil -> {:error, :not_found}
      {:error, reason} -> {:error, reason}
    end
  end

  # --- Participant Listing ---

  def list_participants(activity_id) do
    from(p in Participation,
      where: p.activity_id == ^activity_id,
      where: p.status in [:joined, :confirmed, :attended],
      preload: [:user],
      order_by: [asc: p.joined_at]
    )
    |> Repo.all()
  end

  def list_pending_participants(activity_id) do
    from(p in Participation,
      where: p.activity_id == ^activity_id,
      where: p.status == :pending,
      preload: [:user],
      order_by: [asc: p.joined_at]
    )
    |> Repo.all()
  end

  def get_participation(user_id, activity_id) do
    Repo.get_by(Participation, user_id: user_id, activity_id: activity_id)
  end

  # --- Feedback ---

  def submit_feedback(user, activity_id, score, text \\ nil) do
    case Repo.get_by(Participation, user_id: user.id, activity_id: activity_id) do
      nil ->
        {:error, :not_found}

      participation ->
        participation
        |> Participation.feedback_changeset(%{feedback_score: score, feedback_text: text})
        |> Repo.update()
    end
  end

  # --- Helpers ---

  defp get_owned_activity(owner, activity_id) do
    case get_activity(activity_id) do
      nil -> {:error, :not_found}
      %{creator_id: creator_id} = activity when creator_id == owner.id -> {:ok, activity}
      _activity -> {:error, :not_owner}
    end
  end

  defp build_point(lat, lng) when is_number(lat) and is_number(lng) do
    %Geo.Point{coordinates: {lng, lat}, srid: 4326}
  end

  defp build_point(lat, lng) when is_binary(lat) and is_binary(lng) do
    build_point(String.to_float(lat), String.to_float(lng))
  end

  defp build_point(_, _), do: %Geo.Point{coordinates: {0, 0}, srid: 4326}

  defp maybe_mark_full(activity) do
    count = active_participant_count(activity.id)

    if count >= activity.max_participants do
      activity
      |> Ecto.Changeset.change(status: :full)
      |> Repo.update()
    end
  end

  defp maybe_reopen(activity_id) do
    activity = get_activity(activity_id)

    if activity && activity.status == :full do
      count = active_participant_count(activity_id)

      if count < activity.max_participants do
        activity
        |> Ecto.Changeset.change(status: :open)
        |> Repo.update()
      end
    end
  end

  defp increment_confirmed_count(activity_id) do
    from(a in Activity, where: a.id == ^activity_id)
    |> Repo.update_all(inc: [confirmed_count: 1])
  end

  def active_participant_count(activity_id) do
    from(p in Participation,
      where: p.activity_id == ^activity_id,
      where: p.status in [:joined, :confirmed, :attended]
    )
    |> Repo.aggregate(:count)
  end

  defp schedule_auto_complete(activity) do
    delay_seconds =
      DateTime.diff(activity.starts_at, DateTime.utc_now()) + activity.duration_minutes * 60

    delay_seconds = max(delay_seconds, 0)

    %{activity_id: activity.id}
    |> Impulse.Activities.Workers.AutoCompleteWorker.new(schedule_in: delay_seconds)
    |> Oban.insert()
  end
end
