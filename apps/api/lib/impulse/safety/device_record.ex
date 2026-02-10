defmodule Impulse.Safety.DeviceRecord do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "device_records" do
    field :fingerprint, :string
    field :platform, Ecto.Enum, values: [:ios, :android]
    field :push_token, :string
    field :last_seen_at, :utc_datetime

    belongs_to :user, Impulse.Accounts.User
  end

  def changeset(record, attrs) do
    record
    |> cast(attrs, [:fingerprint, :platform, :push_token, :last_seen_at, :user_id])
    |> validate_required([:fingerprint, :platform, :last_seen_at, :user_id])
    |> validate_length(:fingerprint, is: 64)
    |> foreign_key_constraint(:user_id)
  end
end
