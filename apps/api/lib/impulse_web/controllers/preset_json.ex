defmodule ImpulseWeb.PresetJSON do
  alias Impulse.Gamification.Preset

  def index(%{presets: presets}) do
    %{data: Enum.map(presets, &preset_data/1)}
  end

  defp preset_data(%Preset{} = p) do
    %{
      id: p.id,
      name: p.name,
      icon: p.icon,
      locale: p.locale,
      allowed_hours: p.allowed_hours,
      max_duration: p.max_duration,
      sort_order: p.sort_order
    }
  end
end
