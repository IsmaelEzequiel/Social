defmodule Impulse.Geo.Zone do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "zones" do
    field :city, :string
    field :name, :string
    field :geometry, Geo.PostGIS.Geometry

    timestamps(type: :utc_datetime, updated_at: false)
  end

  def changeset(zone, attrs) do
    zone
    |> cast(attrs, [:city, :name, :geometry])
    |> validate_required([:city, :name, :geometry])
    |> validate_length(:city, min: 1, max: 50)
    |> validate_length(:name, min: 1, max: 50)
  end
end
