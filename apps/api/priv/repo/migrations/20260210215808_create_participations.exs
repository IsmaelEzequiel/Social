defmodule Impulse.Repo.Migrations.CreateParticipations do
  use Ecto.Migration

  def change do
    create_query =
      "CREATE TYPE participation_status AS ENUM ('joined', 'confirmed', 'attended', 'no_show', 'cancelled')"

    drop_query = "DROP TYPE IF EXISTS participation_status"
    execute(create_query, drop_query)

    create table(:participations, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("gen_random_uuid()")
      add :user_id, references(:users, type: :binary_id, on_delete: :nothing), null: false

      add :activity_id, references(:activities, type: :binary_id, on_delete: :nothing),
        null: false

      add :status, :participation_status, null: false, default: "joined"
      add :joined_at, :utc_datetime, null: false
      add :confirmed_at, :utc_datetime
      add :attended_at, :utc_datetime
      add :feedback_score, :integer
      add :feedback_text, :string, size: 200
    end

    create unique_index(:participations, [:user_id, :activity_id])
    create index(:participations, [:activity_id])
    create index(:participations, [:status])
  end
end
