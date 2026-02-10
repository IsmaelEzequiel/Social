defmodule Impulse.Repo.Migrations.CreateBadges do
  use Ecto.Migration

  def change do
    create table(:badges, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("gen_random_uuid()")
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :type, :string, size: 30, null: false
      add :earned_at, :utc_datetime, null: false
      add :revoked_at, :utc_datetime
    end

    create index(:badges, [:user_id])
    create index(:badges, [:user_id, :type])
  end
end
