defmodule Impulse.Gamification do
  import Ecto.Query
  alias Impulse.Repo
  alias Impulse.Gamification.{Badge, Trophy}

  def list_badges(user_id) do
    from(b in Badge,
      where: b.user_id == ^user_id and is_nil(b.revoked_at),
      order_by: [desc: b.earned_at]
    )
    |> Repo.all()
  end

  def list_trophies(user_id) do
    from(t in Trophy,
      where: t.user_id == ^user_id,
      order_by: [desc: t.earned_at]
    )
    |> Repo.all()
  end

  def award_badge(user_id, type) do
    %Badge{}
    |> Badge.changeset(%{user_id: user_id, type: type, earned_at: DateTime.utc_now()})
    |> Repo.insert()
  end

  def revoke_badge(user_id, type) do
    from(b in Badge,
      where: b.user_id == ^user_id and b.type == ^type and is_nil(b.revoked_at)
    )
    |> Repo.update_all(set: [revoked_at: DateTime.utc_now()])
  end

  def award_trophy(user_id, type) do
    %Trophy{}
    |> Trophy.changeset(%{user_id: user_id, type: type, earned_at: DateTime.utc_now()})
    |> Repo.insert(on_conflict: :nothing)
  end

  def check_trophy_milestones(user) do
    cond do
      user.activities_joined_count >= 100 -> award_trophy(user.id, "centurion")
      user.activities_joined_count >= 50 -> award_trophy(user.id, "half_century")
      user.activities_joined_count >= 10 -> award_trophy(user.id, "first_ten")
      user.activities_created_count >= 50 -> award_trophy(user.id, "organizer_pro")
      user.activities_created_count >= 10 -> award_trophy(user.id, "organizer")
      true -> :noop
    end
  end
end
