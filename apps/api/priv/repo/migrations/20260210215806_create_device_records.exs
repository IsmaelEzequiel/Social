defmodule Impulse.Repo.Migrations.CreateDeviceRecords do
  use Ecto.Migration

  def change do
    create_query = "CREATE TYPE device_platform AS ENUM ('ios', 'android')"
    drop_query = "DROP TYPE IF EXISTS device_platform"
    execute(create_query, drop_query)

    create table(:device_records, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("gen_random_uuid()")
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :fingerprint, :string, size: 64, null: false
      add :platform, :device_platform, null: false
      add :last_seen_at, :utc_datetime, null: false
    end

    create index(:device_records, [:fingerprint])
    create index(:device_records, [:user_id])
  end
end
