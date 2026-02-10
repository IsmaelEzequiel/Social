defmodule Impulse.Notifications.Triggers do
  @moduledoc """
  Notification triggers for activity lifecycle events.
  Called from contexts/workers when events occur.
  """

  alias Impulse.Notifications

  def nearby_activity(user_id, activity) do
    Notifications.send_to_user(
      user_id,
      "Atividade por perto!",
      "#{activity.title} esta acontecendo perto de voce",
      %{type: "nearby_activity", activity_id: activity.id}
    )
  end

  def confirmation_reminder(user_id, activity) do
    Notifications.send_to_user(
      user_id,
      "Confirme sua presenca!",
      "#{activity.title} comeca em breve. Confirme que voce vai.",
      %{type: "confirmation_reminder", activity_id: activity.id}
    )
  end

  def badge_earned(user_id, badge_type) do
    Notifications.send_to_user(
      user_id,
      "Nova conquista!",
      "Voce desbloqueou: #{badge_type}",
      %{type: "badge_earned", badge_type: badge_type}
    )
  end

  def trophy_unlocked(user_id, trophy_type) do
    Notifications.send_to_user(
      user_id,
      "Trofeu desbloqueado!",
      "Voce conquistou o trofeu: #{trophy_type}",
      %{type: "trophy_unlocked", trophy_type: trophy_type}
    )
  end

  def activity_starting(activity_id) do
    Notifications.send_to_activity_participants(
      activity_id,
      "Atividade comecando!",
      "Sua atividade esta prestes a comecar",
      %{type: "activity_starting", activity_id: activity_id}
    )
  end

  def activity_cancelled(activity_id, reason) do
    Notifications.send_to_activity_participants(
      activity_id,
      "Atividade cancelada",
      "A atividade foi cancelada: #{reason}",
      %{type: "activity_cancelled", activity_id: activity_id}
    )
  end

  def activity_completed(activity_id) do
    Notifications.send_to_activity_participants(
      activity_id,
      "Atividade finalizada!",
      "Como foi? Deixe seu feedback.",
      %{type: "activity_completed", activity_id: activity_id}
    )
  end
end
