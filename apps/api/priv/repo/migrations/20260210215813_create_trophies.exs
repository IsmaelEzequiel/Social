defmodule Impulse.Repo.Migrations.CreateTrophies do
  use Ecto.Migration

  def change do
    create table(:trophies, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("gen_random_uuid()")
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :type, :string, size: 30, null: false
      add :earned_at, :utc_datetime, null: false
    end

    create unique_index(:trophies, [:user_id, :type])
    create index(:trophies, [:user_id])
  end
end
