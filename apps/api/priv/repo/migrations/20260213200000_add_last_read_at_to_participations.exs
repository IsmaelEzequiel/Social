defmodule Impulse.Repo.Migrations.AddLastReadAtToParticipations do
  use Ecto.Migration

  def change do
    alter table(:participations) do
      add :last_read_at, :utc_datetime
    end
  end
end
