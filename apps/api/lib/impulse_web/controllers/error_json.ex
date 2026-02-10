defmodule ImpulseWeb.ErrorJSON do
  def render("400.json", _assigns) do
    %{error: "bad_request", message: "Bad request"}
  end

  def render("401.json", _assigns) do
    %{error: "unauthorized", message: "Authentication required"}
  end

  def render("403.json", _assigns) do
    %{error: "forbidden", message: "Access denied"}
  end

  def render("404.json", _assigns) do
    %{error: "not_found", message: "Resource not found"}
  end

  def render("422.json", %{changeset: changeset}) do
    errors =
      Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
        Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
          opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
        end)
      end)

    %{error: "unprocessable_entity", message: "Validation failed", details: errors}
  end

  def render("422.json", _assigns) do
    %{error: "unprocessable_entity", message: "Unprocessable entity"}
  end

  def render("429.json", _assigns) do
    %{error: "rate_limited", message: "Too many requests"}
  end

  def render("500.json", _assigns) do
    %{error: "internal_server_error", message: "Internal server error"}
  end

  def render(template, _assigns) do
    %{error: Phoenix.Controller.status_message_from_template(template)}
  end
end
