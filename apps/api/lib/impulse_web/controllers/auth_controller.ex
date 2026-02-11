defmodule ImpulseWeb.AuthController do
  use ImpulseWeb, :controller

  alias Impulse.Accounts
  alias Impulse.Accounts.Auth0
  alias Impulse.Accounts.SmsVerification
  alias Impulse.Guardian

  def request_code(conn, %{"phone" => phone}) do
    case SmsVerification.request_code(phone) do
      :ok ->
        conn
        |> put_status(:ok)
        |> json(%{message: "Verification code sent"})

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "sms_failed", message: to_string(reason)})
    end
  end

  def verify(conn, %{"phone" => phone, "code" => code, "device_fingerprint" => fingerprint}) do
    with :ok <- SmsVerification.check_code(phone, code),
         phone_hash <- hash_phone(phone),
         {:ok, user} <-
           Accounts.register_or_login(%{
             phone_hash: phone_hash,
             display_name: "Impulser",
             device_fingerprint: fingerprint
           }),
         {:ok, access_token, _claims} <- Guardian.encode_and_sign(user, %{}, ttl: {15, :minute}),
         {:ok, refresh_token, _claims} <-
           Guardian.encode_and_sign(user, %{"typ" => "refresh"}, ttl: {30, :day}) do
      conn
      |> put_status(:ok)
      |> render(:auth_tokens,
        user: user,
        access_token: access_token,
        refresh_token: refresh_token
      )
    else
      {:error, :invalid_code} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "invalid_code", message: "The verification code is incorrect"})

      {:error, %Ecto.Changeset{} = changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> put_view(ImpulseWeb.ErrorJSON)
        |> render("422.json", changeset: changeset)

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "verification_failed", message: to_string(reason)})
    end
  end

  def refresh(conn, %{"refresh_token" => refresh_token}) do
    with {:ok, claims} <- Guardian.decode_and_verify(refresh_token),
         %{"typ" => "refresh"} <- claims,
         {:ok, user} <- Guardian.resource_from_claims(claims),
         {:ok, new_access, _claims} <- Guardian.encode_and_sign(user, %{}, ttl: {15, :minute}),
         {:ok, new_refresh, _claims} <-
           Guardian.encode_and_sign(user, %{"typ" => "refresh"}, ttl: {30, :day}) do
      conn
      |> put_status(:ok)
      |> render(:auth_tokens, user: user, access_token: new_access, refresh_token: new_refresh)
    else
      _ ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "invalid_refresh_token", message: "Invalid or expired refresh token"})
    end
  end

  def social_login(conn, %{"id_token" => id_token, "device_fingerprint" => fingerprint}) do
    with {:ok, identity} <- Auth0.verify_and_extract(id_token),
         {:ok, user} <-
           Accounts.register_or_login_social(%{
             auth_provider: identity.provider,
             auth_provider_id: identity.provider_id,
             email: identity.email,
             display_name: identity.name || "Impulser",
             device_fingerprint: fingerprint
           }),
         {:ok, access_token, _claims} <- Guardian.encode_and_sign(user, %{}, ttl: {15, :minute}),
         {:ok, refresh_token, _claims} <-
           Guardian.encode_and_sign(user, %{"typ" => "refresh"}, ttl: {30, :day}) do
      conn
      |> put_status(:ok)
      |> render(:auth_tokens,
        user: user,
        access_token: access_token,
        refresh_token: refresh_token
      )
    else
      {:error, :invalid_signature} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "invalid_token", message: "Invalid Auth0 token signature"})

      {:error, :token_expired} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "token_expired", message: "Auth0 token has expired"})

      {:error, :unsupported_provider} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "unsupported_provider", message: "Only Google and Apple sign-in are supported"})

      {:error, %Ecto.Changeset{} = changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> put_view(ImpulseWeb.ErrorJSON)
        |> render("422.json", changeset: changeset)

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "social_login_failed", message: to_string(reason)})
    end
  end

  defp hash_phone(phone) do
    :crypto.hash(:sha256, phone) |> Base.encode16(case: :lower)
  end
end
