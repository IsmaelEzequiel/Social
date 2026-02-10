defmodule Impulse.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create_query = "CREATE TYPE user_status AS ENUM ('active', 'shadow_banned', 'suspended')"
    drop_query = "DROP TYPE IF EXISTS user_status"
    execute(create_query, drop_query)

    create_query = "CREATE TYPE subscription_tier AS ENUM ('free', 'pro')"
    drop_query = "DROP TYPE IF EXISTS subscription_tier"
    execute(create_query, drop_query)

    create table(:users, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("gen_random_uuid()")
      add :phone_hash, :string, size: 64, null: false
      add :display_name, :string, size: 30, null: false
      add :avatar_preset, :integer, null: false, default: 1
      add :preferred_presets, {:array, :integer}, null: false, default: []
      add :zone_id, references(:zones, type: :binary_id, on_delete: :nilify_all)
      add :trust_score, :float, null: false, default: 0.5
      add :device_fingerprint, :string, size: 64, null: false
      add :subscription_tier, :subscription_tier, null: false, default: "free"
      add :subscription_expires_at, :utc_datetime
      add :status, :user_status, null: false, default: "active"
      add :activities_joined_count, :integer, null: false, default: 0
      add :activities_created_count, :integer, null: false, default: 0

      timestamps(type: :utc_datetime)
    end

    create unique_index(:users, [:phone_hash])
    create unique_index(:users, [:device_fingerprint])
    create index(:users, [:zone_id])
    create index(:users, [:trust_score])
    create index(:users, [:status])
  end
end
