defmodule Impulse.Repo.Migrations.CreateReports do
  use Ecto.Migration

  def change do
    create_query =
      "CREATE TYPE report_status AS ENUM ('pending', 'verified', 'dismissed', 'false_report')"

    drop_query = "DROP TYPE IF EXISTS report_status"
    execute(create_query, drop_query)

    create table(:reports, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("gen_random_uuid()")
      add :reporter_id, references(:users, type: :binary_id, on_delete: :nothing), null: false
      add :reported_id, references(:users, type: :binary_id, on_delete: :nothing), null: false
      add :activity_id, references(:activities, type: :binary_id, on_delete: :nothing)
      add :reason, :string, size: 50, null: false
      add :details, :string, size: 500
      add :status, :report_status, null: false, default: "pending"

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create index(:reports, [:reporter_id])
    create index(:reports, [:reported_id])
    create index(:reports, [:status])
  end
end
