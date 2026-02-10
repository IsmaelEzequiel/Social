defmodule Impulse.Billing do
  alias Impulse.Repo
  alias Impulse.Billing.Subscription
  alias Impulse.Accounts

  def create_checkout_session(user) do
    with {:ok, customer} <- Stripity.Stripe.Customer.create(%{metadata: %{user_id: user.id}}),
         {:ok, session} <-
           Stripity.Stripe.Checkout.Session.create(%{
             customer: customer.id,
             mode: "subscription",
             line_items: [%{price: impulse_pro_price_id(), quantity: 1}],
             success_url: "impulse://subscription/success",
             cancel_url: "impulse://subscription/cancel"
           }) do
      {:ok, session.url}
    end
  end

  def sync_subscription_from_webhook(event_data) do
    stripe_sub = event_data["object"]
    user_id = stripe_sub["metadata"]["user_id"]

    if user_id do
      attrs = %{
        user_id: user_id,
        stripe_customer_id: stripe_sub["customer"],
        stripe_subscription_id: stripe_sub["id"],
        status: map_stripe_status(stripe_sub["status"]),
        current_period_end: DateTime.from_unix!(stripe_sub["current_period_end"])
      }

      case Repo.get_by(Subscription, user_id: user_id) do
        nil ->
          %Subscription{} |> Subscription.changeset(attrs) |> Repo.insert()

        sub ->
          sub |> Subscription.changeset(attrs) |> Repo.update()
      end
      |> case do
        {:ok, sub} ->
          tier = if sub.status == :active, do: :pro, else: :free
          user = Accounts.get_user(user_id)
          Accounts.update_trust(user, %{subscription_tier: tier})
          {:ok, sub}

        error ->
          error
      end
    else
      {:error, :no_user_id}
    end
  end

  def cancel_subscription(user) do
    case Repo.get_by(Subscription, user_id: user.id) do
      nil ->
        {:error, :not_found}

      sub ->
        Stripity.Stripe.Subscription.update(sub.stripe_subscription_id, %{
          cancel_at_period_end: true
        })

        sub |> Ecto.Changeset.change(status: :cancelled) |> Repo.update()
    end
  end

  defp map_stripe_status("active"), do: :active
  defp map_stripe_status("past_due"), do: :past_due
  defp map_stripe_status("canceled"), do: :cancelled
  defp map_stripe_status(_), do: :expired

  defp impulse_pro_price_id do
    System.get_env("STRIPE_PRO_PRICE_ID") || "price_test"
  end
end
