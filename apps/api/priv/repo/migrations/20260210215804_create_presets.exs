defmodule Impulse.Repo.Migrations.CreatePresets do
  use Ecto.Migration

  def change do
    create table(:presets, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("gen_random_uuid()")
      add :name, :string, size: 40, null: false
      add :icon, :string, size: 50, null: false
      add :locale, :string, size: 5, null: false, default: "pt-BR"
      add :allowed_hours, :map, null: false
      add :max_duration, :integer, null: false, default: 240
      add :sort_order, :integer, null: false, default: 0
      add :active, :boolean, null: false, default: true

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create index(:presets, [:locale, :active])
    create index(:presets, [:sort_order])
  end
end
