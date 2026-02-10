defmodule ImpulseWeb.SubscriptionController do
  use ImpulseWeb, :controller

  alias Impulse.Billing

  def create(conn, _params) do
    user = conn.assigns.current_user

    case Billing.create_checkout_session(user) do
      {:ok, url} ->
        conn
        |> put_status(:created)
        |> json(%{checkout_url: url})

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "checkout_failed", message: inspect(reason)})
    end
  end

  def delete(conn, _params) do
    user = conn.assigns.current_user

    case Billing.cancel_subscription(user) do
      {:ok, _sub} ->
        json(conn, %{message: "Subscription cancelled"})

      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{error: "no_subscription"})
    end
  end
end
