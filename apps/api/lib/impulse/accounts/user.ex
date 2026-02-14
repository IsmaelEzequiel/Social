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
    field :auth_provider, :string, default: "phone"
    field :auth_provider_id, :string
    field :email, :string

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

  @social_required_fields [:auth_provider, :auth_provider_id, :display_name, :device_fingerprint]
  @social_optional_fields [:email | @optional_fields]

  def registration_changeset(user, attrs) do
    user
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_length(:display_name, min: 2, max: 30)
    |> validate_format(:display_name, ~r/^[a-zA-ZÀ-ÿ0-9 \-]+$/)
    |> validate_length(:phone_hash, is: 64)
    |> validate_length(:device_fingerprint, is: 64)
    |> validate_inclusion(:avatar_preset, 1..20)
    |> unique_constraint(:phone_hash, name: :users_phone_hash_index)
  end

  def social_registration_changeset(user, attrs) do
    user
    |> cast(attrs, @social_required_fields ++ @social_optional_fields)
    |> validate_required(@social_required_fields)
    |> sanitize_display_name()
    |> validate_length(:display_name, min: 2, max: 30)
    |> validate_format(:display_name, ~r/^[a-zA-ZÀ-ÿ0-9 \-]+$/)
    |> validate_length(:device_fingerprint, is: 64)
    |> validate_inclusion(:avatar_preset, 1..20)
    |> validate_inclusion(:auth_provider, ["google", "apple"])
    |> unique_constraint([:auth_provider, :auth_provider_id],
      name: :users_auth_provider_provider_id_index
    )
  end

  def profile_changeset(user, attrs) do
    user
    |> cast(attrs, [:display_name, :avatar_preset, :preferred_presets, :zone_id])
    |> validate_length(:display_name, min: 2, max: 30)
    |> validate_format(:display_name, ~r/^[a-zA-ZÀ-ÿ0-9 \-]+$/)
    |> validate_inclusion(:avatar_preset, 1..20)
  end

  defp sanitize_display_name(changeset) do
    case get_change(changeset, :display_name) do
      nil ->
        changeset

      name ->
        sanitized =
          name
          |> String.replace(~r/[^a-zA-ZÀ-ÿ0-9 \-]/, "")
          |> String.replace(~r/ +/, " ")
          |> String.trim()

        put_change(changeset, :display_name, sanitized)
    end
  end

  def trust_changeset(user, attrs) do
    user
    |> cast(attrs, [:trust_score, :status])
    |> validate_number(:trust_score, greater_than_or_equal_to: 0.0, less_than_or_equal_to: 1.0)
  end
end
