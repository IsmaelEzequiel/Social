defmodule Impulse.Trust.Workers.TrustEventWorker do
  use Oban.Worker, queue: :trust, max_attempts: 3

  alias Impulse.Trust

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id, "event_type" => event_type} = args}) do
    reference_id = Map.get(args, "reference_id")
    Trust.record_event(user_id, event_type, reference_id)
    :ok
  end
end
