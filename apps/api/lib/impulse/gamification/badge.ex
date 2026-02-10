defmodule Impulse.Gamification.Badge do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "badges" do
    field :type, :string
    field :earned_at, :utc_datetime
    field :revoked_at, :utc_datetime

    belongs_to :user, Impulse.Accounts.User
  end

  def changeset(badge, attrs) do
    badge
    |> cast(attrs, [:user_id, :type, :earned_at, :revoked_at])
    |> validate_required([:user_id, :type, :earned_at])
  end
end
