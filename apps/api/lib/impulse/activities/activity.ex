defmodule Impulse.Activities.Activity do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "activities" do
    field :mode, Ecto.Enum, values: [:flash, :planned, :recurring]
    field :title, :string
    field :location, Geo.PostGIS.Geometry
    field :location_name, :string
    field :starts_at, :utc_datetime
    field :duration_minutes, :integer
    field :max_participants, :integer
    field :min_participants, :integer, default: 3

    field :status, Ecto.Enum,
      values: [:open, :full, :active, :completed, :cancelled],
      default: :open

    field :visibility_score, :float
    field :confirmed_count, :integer, default: 0
    field :recurring_rule, :map

    belongs_to :creator, Impulse.Accounts.User
    belongs_to :preset, Impulse.Gamification.Preset

    timestamps(type: :utc_datetime, updated_at: false)
  end

  @required_fields [
    :mode,
    :title,
    :starts_at,
    :duration_minutes,
    :max_participants,
    :creator_id,
    :preset_id,
    :visibility_score
  ]
  @optional_fields [:location_name, :min_participants, :status, :confirmed_count, :recurring_rule]

  def changeset(activity, attrs) do
    activity
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_length(:title, min: 1, max: 60)
    |> validate_length(:location_name, max: 100)
    |> validate_number(:duration_minutes,
      greater_than_or_equal_to: 30,
      less_than_or_equal_to: 360
    )
    |> validate_number(:max_participants, greater_than_or_equal_to: 3, less_than_or_equal_to: 20)
    |> validate_number(:min_participants, greater_than_or_equal_to: 2, less_than_or_equal_to: 20)
    |> validate_mode_constraints()
    |> foreign_key_constraint(:creator_id)
    |> foreign_key_constraint(:preset_id)
  end

  defp validate_mode_constraints(changeset) do
    case get_field(changeset, :mode) do
      :flash -> validate_flash_constraints(changeset)
      :planned -> validate_planned_constraints(changeset)
      _ -> changeset
    end
  end

  defp validate_flash_constraints(changeset) do
    changeset
    |> validate_change(:starts_at, fn :starts_at, starts_at ->
      now = DateTime.utc_now()
      max_start = DateTime.add(now, 2, :hour)

      if DateTime.compare(starts_at, max_start) == :gt do
        [starts_at: "flash activities must start within 2 hours"]
      else
        []
      end
    end)
  end

  defp validate_planned_constraints(changeset) do
    changeset
    |> validate_change(:starts_at, fn :starts_at, starts_at ->
      now = DateTime.utc_now()
      min_start = DateTime.add(now, 1, :hour)
      max_start = DateTime.add(now, 7 * 24, :hour)

      cond do
        DateTime.compare(starts_at, min_start) == :lt ->
          [starts_at: "planned activities must start at least 1 hour from now"]

        DateTime.compare(starts_at, max_start) == :gt ->
          [starts_at: "planned activities must start within 7 days"]

        true ->
          []
      end
    end)
  end

  @valid_transitions %{
    open: [:full, :active, :cancelled],
    full: [:open, :active],
    active: [:completed, :cancelled]
  }

  def valid_transition?(from, to) do
    to in Map.get(@valid_transitions, from, [])
  end
end
