defmodule Impulse.Repo.Migrations.CreateTrustEvents do
  use Ecto.Migration

  def change do
    create table(:trust_events, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("gen_random_uuid()")
      add :user_id, references(:users, type: :binary_id, on_delete: :nothing), null: false
      add :event_type, :string, size: 30, null: false
      add :delta, :float, null: false
      add :score_after, :float, null: false
      add :reference_id, :binary_id

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create index(:trust_events, [:user_id])
    create index(:trust_events, [:user_id, :inserted_at])
    create index(:trust_events, [:event_type])
  end
end
