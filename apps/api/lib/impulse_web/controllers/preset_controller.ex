defmodule ImpulseWeb.PresetController do
  use ImpulseWeb, :controller

  alias Impulse.Gamification.Presets

  def index(conn, params) do
    locale = Map.get(params, "locale", "pt-BR")
    presets = Presets.list_by_locale(locale)
    render(conn, :index, presets: presets)
  end
end
