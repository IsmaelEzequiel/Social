defmodule Impulse.Gamification.Presets do
  import Ecto.Query
  alias Impulse.Repo
  alias Impulse.Gamification.Preset

  def list_by_locale(locale \\ "pt-BR") do
    from(p in Preset,
      where: p.locale == ^locale and p.active == true,
      order_by: [asc: p.sort_order]
    )
    |> Repo.all()
  end

  def get_preset(id) do
    Repo.get(Preset, id)
  end
end
