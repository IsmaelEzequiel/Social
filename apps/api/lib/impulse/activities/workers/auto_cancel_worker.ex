defmodule Impulse.Activities.Workers.AutoCancelWorker do
  use Oban.Worker, queue: :activities, max_attempts: 3

  alias Impulse.Repo
  alias Impulse.Activities
  alias Impulse.Activities.Activity

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"activity_id" => activity_id}}) do
    case Repo.get(Activity, activity_id) do
      nil ->
        :ok

      %{status: :open, mode: :planned} = activity ->
        confirmed = Activities.active_participant_count(activity_id)

        if confirmed < activity.min_participants do
          activity
          |> Ecto.Changeset.change(status: :cancelled)
          |> Repo.update()

          Phoenix.PubSub.broadcast(
            Impulse.PubSub,
            "map:activity_updates",
            {:activity_completed, activity_id}
          )
        end

        :ok

      _ ->
        :ok
    end
  end
end
