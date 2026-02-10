defmodule ImpulseWeb.WebhookController do
  use ImpulseWeb, :controller

  alias Impulse.Billing

  def stripe(conn, _params) do
    with {:ok, raw_body, conn} <- Plug.Conn.read_body(conn),
         signature <- Plug.Conn.get_req_header(conn, "stripe-signature") |> List.first(),
         {:ok, event} <- verify_stripe_signature(raw_body, signature) do
      handle_stripe_event(event)
      json(conn, %{received: true})
    else
      _ ->
        conn |> put_status(:bad_request) |> json(%{error: "invalid_webhook"})
    end
  end

  defp verify_stripe_signature(raw_body, signature) do
    webhook_secret = System.get_env("STRIPE_WEBHOOK_SECRET") || "whsec_test"

    case Stripity.Stripe.Webhook.construct_event(raw_body, signature, webhook_secret) do
      {:ok, event} -> {:ok, event}
      {:error, _} -> {:error, :invalid_signature}
    end
  end

  defp handle_stripe_event(%{type: type, data: data})
       when type in [
              "customer.subscription.created",
              "customer.subscription.updated",
              "customer.subscription.deleted"
            ] do
    Billing.sync_subscription_from_webhook(data)
  end

  defp handle_stripe_event(_event), do: :ok
end
