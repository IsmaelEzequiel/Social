defmodule Impulse.Repo.Migrations.AddPendingParticipationStatus do
  use Ecto.Migration

  def up do
    execute "ALTER TYPE participation_status ADD VALUE IF NOT EXISTS 'pending' BEFORE 'joined'"
  end

  def down do
    # Postgres does not support removing enum values; a full migration would be needed
    :ok
  end
end
