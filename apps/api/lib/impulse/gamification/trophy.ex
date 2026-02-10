defmodule Impulse.Gamification.Trophy do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "trophies" do
    field :type, :string
    field :earned_at, :utc_datetime

    belongs_to :user, Impulse.Accounts.User
  end

  def changeset(trophy, attrs) do
    trophy
    |> cast(attrs, [:user_id, :type, :earned_at])
    |> validate_required([:user_id, :type, :earned_at])
    |> unique_constraint([:user_id, :type])
  end
end
