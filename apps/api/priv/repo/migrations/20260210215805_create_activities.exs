defmodule Impulse.Repo.Migrations.CreateActivities do
  use Ecto.Migration

  def up do
    create_query = "CREATE TYPE activity_mode AS ENUM ('flash', 'planned', 'recurring')"
    drop_query = "DROP TYPE IF EXISTS activity_mode"
    execute(create_query, drop_query)

    create_query =
      "CREATE TYPE activity_status AS ENUM ('open', 'full', 'active', 'completed', 'cancelled')"

    drop_query = "DROP TYPE IF EXISTS activity_status"
    execute(create_query, drop_query)

    create table(:activities, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("gen_random_uuid()")
      add :creator_id, references(:users, type: :binary_id, on_delete: :nothing), null: false
      add :mode, :activity_mode, null: false
      add :preset_id, references(:presets, type: :binary_id, on_delete: :nothing), null: false
      add :title, :string, size: 60, null: false
      add :location_name, :string, size: 100
      add :starts_at, :utc_datetime, null: false
      add :duration_minutes, :integer, null: false
      add :max_participants, :integer, null: false
      add :min_participants, :integer, null: false, default: 3
      add :status, :activity_status, null: false, default: "open"
      add :visibility_score, :float, null: false
      add :confirmed_count, :integer, null: false, default: 0
      add :recurring_rule, :map

      timestamps(type: :utc_datetime, updated_at: false)
    end

    execute("SELECT AddGeometryColumn('activities', 'location', 4326, 'POINT', 2)")
    execute("ALTER TABLE activities ALTER COLUMN location SET NOT NULL")
    execute("CREATE INDEX idx_activities_location ON activities USING GIST (location)")

    create index(:activities, [:creator_id])
    create index(:activities, [:mode])
    create index(:activities, [:status])
    create index(:activities, [:starts_at])
    create index(:activities, [:preset_id])
    create index(:activities, [:status, :mode, :starts_at])
  end

  def down do
    drop table(:activities)
    execute("DROP TYPE IF EXISTS activity_status")
    execute("DROP TYPE IF EXISTS activity_mode")
  end
end
