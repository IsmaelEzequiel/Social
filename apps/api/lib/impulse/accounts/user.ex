defmodule Impulse.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "users" do
    field :phone_hash, :string
    field :display_name, :string
    field :avatar_preset, :integer, default: 1
    field :preferred_presets, {:array, :integer}, default: []
    field :trust_score, :float, default: 0.5
    field :device_fingerprint, :string
    field :subscription_tier, Ecto.Enum, values: [:free, :pro], default: :free
    field :subscription_expires_at, :utc_datetime
    field :status, Ecto.Enum, values: [:active, :shadow_banned, :suspended], default: :active
    field :activities_joined_count, :integer, default: 0
    field :activities_created_count, :integer, default: 0

    belongs_to :zone, Impulse.Geo.Zone

    timestamps(type: :utc_datetime)
  end

  @required_fields [:phone_hash, :display_name, :device_fingerprint]
  @optional_fields [
    :avatar_preset,
    :preferred_presets,
    :zone_id,
    :trust_score,
    :subscription_tier,
    :subscription_expires_at,
    :status,
    :activities_joined_count,
    :activities_created_count
  ]

  def registration_changeset(user, attrs) do
    user
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_length(:display_name, min: 2, max: 30)
    |> validate_format(:display_name, ~r/^[a-zA-ZÀ-ÿ0-9 \-]+$/)
    |> validate_length(:phone_hash, is: 64)
    |> validate_length(:device_fingerprint, is: 64)
    |> validate_inclusion(:avatar_preset, 1..20)
    |> unique_constraint(:phone_hash)
    |> unique_constraint(:device_fingerprint)
  end

  def profile_changeset(user, attrs) do
    user
    |> cast(attrs, [:display_name, :avatar_preset, :preferred_presets, :zone_id])
    |> validate_length(:display_name, min: 2, max: 30)
    |> validate_format(:display_name, ~r/^[a-zA-ZÀ-ÿ0-9 \-]+$/)
    |> validate_inclusion(:avatar_preset, 1..20)
  end

  def trust_changeset(user, attrs) do
    user
    |> cast(attrs, [:trust_score, :status])
    |> validate_number(:trust_score, greater_than_or_equal_to: 0.0, less_than_or_equal_to: 1.0)
  end
end
