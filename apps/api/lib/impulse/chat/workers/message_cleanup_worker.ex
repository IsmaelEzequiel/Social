defmodule Impulse.Chat.Workers.MessageCleanupWorker do
  use Oban.Worker, queue: :default, max_attempts: 3

  import Ecto.Query
  alias Impulse.Repo
  alias Impulse.Chat.Message

  @impl Oban.Worker
  def perform(_job) do
    now = DateTime.utc_now()

    {count, _} =
      from(m in Message, where: m.expires_at < ^now)
      |> Repo.delete_all()

    if count > 0 do
      require Logger
      Logger.info("MessageCleanupWorker: deleted #{count} expired messages")
    end

    :ok
  end
end
