defmodule Impulse.Trust do
  alias Impulse.Repo
  alias Impulse.Trust.TrustEvent
  alias Impulse.Accounts

  def record_event(user_id, event_type, reference_id \\ nil) do
    user = Accounts.get_user(user_id)
    delta = TrustEvent.weight_for(event_type)
    new_score = clamp(user.trust_score + delta, 0.0, 1.0)

    attrs = %{
      user_id: user_id,
      event_type: event_type,
      delta: delta,
      score_after: new_score,
      reference_id: reference_id
    }

    case %TrustEvent{} |> TrustEvent.changeset(attrs) |> Repo.insert() do
      {:ok, event} ->
        new_status = determine_status(new_score)
        Accounts.update_trust(user, %{trust_score: new_score, status: new_status})
        {:ok, event}

      error ->
        error
    end
  end

  defp determine_status(score) when score < 0.2, do: :shadow_banned
  defp determine_status(_score), do: :active

  defp clamp(value, min, max) do
    value |> max(min) |> min(max)
  end
end
