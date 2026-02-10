defmodule Impulse.Repo.Migrations.CreateSubscriptions do
  use Ecto.Migration

  def change do
    create_query =
      "CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'expired')"

    drop_query = "DROP TYPE IF EXISTS subscription_status"
    execute(create_query, drop_query)

    create table(:subscriptions, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("gen_random_uuid()")
      add :user_id, references(:users, type: :binary_id, on_delete: :nothing), null: false
      add :stripe_customer_id, :string, size: 50, null: false
      add :stripe_subscription_id, :string, size: 50, null: false
      add :status, :subscription_status, null: false
      add :current_period_end, :utc_datetime, null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:subscriptions, [:user_id])
    create index(:subscriptions, [:stripe_customer_id])
    create index(:subscriptions, [:stripe_subscription_id])
  end
end
