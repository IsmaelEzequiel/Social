defmodule Impulse.Activities.Participation do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "participations" do
    field :status, Ecto.Enum,
      values: [:pending, :joined, :confirmed, :attended, :no_show, :cancelled],
      default: :joined

    field :joined_at, :utc_datetime
    field :confirmed_at, :utc_datetime
    field :attended_at, :utc_datetime
    field :feedback_score, :integer
    field :feedback_text, :string

    belongs_to :user, Impulse.Accounts.User
    belongs_to :activity, Impulse.Activities.Activity
  end

  def changeset(participation, attrs) do
    participation
    |> cast(attrs, [:user_id, :activity_id, :status, :joined_at])
    |> validate_required([:user_id, :activity_id, :joined_at])
    |> unique_constraint([:user_id, :activity_id])
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:activity_id)
  end

  def confirm_changeset(participation) do
    participation
    |> change(status: :confirmed, confirmed_at: DateTime.utc_now())
  end

  def cancel_changeset(participation) do
    participation
    |> change(status: :cancelled)
  end

  def attend_changeset(participation) do
    participation
    |> change(status: :attended, attended_at: DateTime.utc_now())
  end

  def no_show_changeset(participation) do
    participation
    |> change(status: :no_show)
  end

  def feedback_changeset(participation, attrs) do
    participation
    |> cast(attrs, [:feedback_score, :feedback_text])
    |> validate_inclusion(:feedback_score, 1..5)
    |> validate_length(:feedback_text, max: 200)
  end

  def approve_changeset(participation) do
    participation
    |> change(status: :joined, joined_at: DateTime.utc_now())
  end

  def reject_changeset(participation) do
    participation
    |> change(status: :cancelled)
  end

  @valid_transitions %{
    pending: [:joined, :cancelled],
    joined: [:confirmed, :cancelled, :attended, :no_show],
    confirmed: [:cancelled, :attended, :no_show]
  }

  def valid_transition?(from, to) do
    to in Map.get(@valid_transitions, from, [])
  end
end
