defmodule Impulse.Trust.TrustEvent do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @event_weights %{
    "attended" => 0.03,
    "created_completed" => 0.05,
    "no_show" => -0.08,
    "cancelled_late" => -0.04,
    "cancelled_early" => -0.01,
    "positive_feedback" => 0.02,
    "negative_feedback" => -0.03,
    "reported" => -0.06,
    "report_verified" => -0.15,
    "false_report" => -0.10,
    "consecutive_active" => 0.01,
    "device_change" => -0.10
  }

  schema "trust_events" do
    field :event_type, :string
    field :delta, :float
    field :score_after, :float
    field :reference_id, :binary_id

    belongs_to :user, Impulse.Accounts.User

    timestamps(type: :utc_datetime, updated_at: false)
  end

  def changeset(event, attrs) do
    event
    |> cast(attrs, [:user_id, :event_type, :delta, :score_after, :reference_id])
    |> validate_required([:user_id, :event_type, :delta, :score_after])
    |> validate_inclusion(:event_type, Map.keys(@event_weights))
  end

  def weight_for(event_type), do: Map.get(@event_weights, event_type, 0.0)
  def event_weights, do: @event_weights
end
