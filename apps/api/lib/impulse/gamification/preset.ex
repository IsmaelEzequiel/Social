defmodule Impulse.Gamification.Preset do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "presets" do
    field :name, :string
    field :icon, :string
    field :locale, :string, default: "pt-BR"
    field :allowed_hours, :map
    field :max_duration, :integer, default: 240
    field :sort_order, :integer, default: 0
    field :active, :boolean, default: true

    timestamps(type: :utc_datetime, updated_at: false)
  end

  def changeset(preset, attrs) do
    preset
    |> cast(attrs, [:name, :icon, :locale, :allowed_hours, :max_duration, :sort_order, :active])
    |> validate_required([:name, :icon, :locale, :allowed_hours])
    |> validate_length(:name, min: 1, max: 40)
    |> validate_length(:icon, min: 1, max: 50)
  end
end
