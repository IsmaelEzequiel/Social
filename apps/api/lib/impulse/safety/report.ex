defmodule Impulse.Safety.Report do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "reports" do
    field :reason, :string
    field :details, :string

    field :status, Ecto.Enum,
      values: [:pending, :verified, :dismissed, :false_report],
      default: :pending

    belongs_to :reporter, Impulse.Accounts.User
    belongs_to :reported, Impulse.Accounts.User
    belongs_to :activity, Impulse.Activities.Activity

    timestamps(type: :utc_datetime, updated_at: false)
  end

  def changeset(report, attrs) do
    report
    |> cast(attrs, [:reporter_id, :reported_id, :activity_id, :reason, :details])
    |> validate_required([:reporter_id, :reported_id, :reason])
    |> validate_length(:reason, min: 1, max: 50)
    |> validate_length(:details, max: 500)
    |> foreign_key_constraint(:reporter_id)
    |> foreign_key_constraint(:reported_id)
  end
end
