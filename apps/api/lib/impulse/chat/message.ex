defmodule Impulse.Chat.Message do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "messages" do
    field :body, :string
    field :expires_at, :utc_datetime

    belongs_to :activity, Impulse.Activities.Activity
    belongs_to :user, Impulse.Accounts.User

    timestamps(type: :utc_datetime, updated_at: false)
  end

  def changeset(message, attrs) do
    message
    |> cast(attrs, [:activity_id, :user_id, :body, :expires_at])
    |> validate_required([:activity_id, :user_id, :body, :expires_at])
    |> validate_length(:body, min: 1, max: 500)
  end
end
