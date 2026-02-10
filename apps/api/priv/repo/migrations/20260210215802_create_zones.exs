defmodule Impulse.Repo.Migrations.CreateZones do
  use Ecto.Migration

  def up do
    create table(:zones, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("gen_random_uuid()")
      add :city, :string, size: 50, null: false
      add :name, :string, size: 50, null: false

      timestamps(type: :utc_datetime, updated_at: false)
    end

    execute("SELECT AddGeometryColumn('zones', 'geometry', 4326, 'POLYGON', 2)")
    execute("ALTER TABLE zones ALTER COLUMN geometry SET NOT NULL")
    execute("CREATE INDEX idx_zones_geometry ON zones USING GIST (geometry)")
    create index(:zones, [:city])
  end

  def down do
    drop table(:zones)
  end
end
