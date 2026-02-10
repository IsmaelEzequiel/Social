defmodule Impulse.Activities.Workers.AutoCompleteWorker do
  use Oban.Worker, queue: :activities, max_attempts: 3

  alias Impulse.Repo
  alias Impulse.Activities.Activity

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"activity_id" => activity_id}}) do
    case Repo.get(Activity, activity_id) do
      nil ->
        :ok

      %{status: :active} = activity ->
        activity
        |> Ecto.Changeset.change(status: :completed)
        |> Repo.update()

        Phoenix.PubSub.broadcast(
          Impulse.PubSub,
          "map:activity_updates",
          {:activity_completed, activity_id}
        )

        :ok

      %{status: status} when status in [:open, :full] ->
        # Check min participants
        participant_count = Impulse.Activities.active_participant_count(activity_id)
        activity = Repo.get(Activity, activity_id)

        if participant_count >= activity.min_participants do
          activity
          |> Ecto.Changeset.change(status: :active)
          |> Repo.update()

          # Schedule completion at end of duration
          delay = activity.duration_minutes * 60

          %{activity_id: activity_id}
          |> __MODULE__.new(schedule_in: delay)
          |> Oban.insert()
        else
          activity
          |> Ecto.Changeset.change(status: :cancelled)
          |> Repo.update()
        end

        :ok

      _ ->
        :ok
    end
  end
end
