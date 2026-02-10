defmodule Impulse.Billing.Subscription do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "subscriptions" do
    field :stripe_customer_id, :string
    field :stripe_subscription_id, :string
    field :status, Ecto.Enum, values: [:active, :past_due, :cancelled, :expired]
    field :current_period_end, :utc_datetime

    belongs_to :user, Impulse.Accounts.User

    timestamps(type: :utc_datetime)
  end

  def changeset(sub, attrs) do
    sub
    |> cast(attrs, [
      :user_id,
      :stripe_customer_id,
      :stripe_subscription_id,
      :status,
      :current_period_end
    ])
    |> validate_required([
      :user_id,
      :stripe_customer_id,
      :stripe_subscription_id,
      :status,
      :current_period_end
    ])
    |> unique_constraint(:user_id)
  end
end
