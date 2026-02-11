defmodule Impulse.Accounts.Auth0 do
  @moduledoc """
  Verifies Auth0 ID tokens using JWKS (RS256).
  Extracts user identity (sub, email, name, provider) from verified tokens.
  """

  @jwks_cache_ttl :timer.hours(1)

  @doc """
  Verifies an Auth0 ID token and extracts identity information.

  Returns `{:ok, identity}` with:
    - `sub` — Auth0 subject (e.g. "google-oauth2|12345")
    - `email` — user email (if present)
    - `name` — user display name (if present)
    - `provider` — parsed provider ("google", "apple")
    - `provider_id` — provider-specific user ID

  Returns `{:error, reason}` on failure.
  """
  def verify_and_extract(id_token) do
    with {:ok, jwks} <- fetch_jwks(),
         {:ok, claims} <- verify_token(id_token, jwks),
         {:ok, identity} <- extract_identity(claims) do
      {:ok, identity}
    end
  end

  defp fetch_jwks do
    case get_cached_jwks() do
      {:ok, jwks} ->
        {:ok, jwks}

      :miss ->
        domain = auth0_domain()
        url = "https://#{domain}/.well-known/jwks.json"

        case Req.get(url) do
          {:ok, %{status: 200, body: %{"keys" => keys}}} ->
            jwks = JOSE.JWK.from_map(%{"keys" => keys})
            cache_jwks(jwks)
            {:ok, jwks}

          {:ok, %{status: status}} ->
            {:error, {:jwks_fetch_failed, status}}

          {:error, reason} ->
            {:error, {:jwks_fetch_failed, reason}}
        end
    end
  end

  defp verify_token(id_token, jwks) do
    domain = auth0_domain()
    client_id = auth0_client_id()
    expected_issuer = "https://#{domain}/"

    try do
      {verified, jwt} = JOSE.JWT.verify(jwks, id_token)

      if not verified do
        {:error, :invalid_signature}
      else
        claims = jwt.fields
        now = System.system_time(:second)

        cond do
          claims["iss"] != expected_issuer ->
            {:error, :invalid_issuer}

          claims["aud"] != client_id and client_id not in List.wrap(claims["aud"]) ->
            {:error, :invalid_audience}

          is_integer(claims["exp"]) and claims["exp"] < now ->
            {:error, :token_expired}

          true ->
            {:ok, claims}
        end
      end
    rescue
      _ -> {:error, :token_verification_failed}
    end
  end

  defp extract_identity(claims) do
    sub = claims["sub"]

    case parse_provider(sub) do
      {:ok, provider, provider_id} ->
        {:ok,
         %{
           sub: sub,
           email: claims["email"],
           name: claims["name"] || claims["nickname"],
           provider: provider,
           provider_id: provider_id
         }}

      :error ->
        {:error, :unsupported_provider}
    end
  end

  defp parse_provider("google-oauth2|" <> id), do: {:ok, "google", id}
  defp parse_provider("apple|" <> id), do: {:ok, "apple", id}
  defp parse_provider(_), do: :error

  # Simple ETS-based JWKS cache
  defp get_cached_jwks do
    case :persistent_term.get({__MODULE__, :jwks}, nil) do
      {jwks, cached_at} ->
        if System.monotonic_time(:millisecond) - cached_at < @jwks_cache_ttl do
          {:ok, jwks}
        else
          :miss
        end

      nil ->
        :miss
    end
  end

  defp cache_jwks(jwks) do
    :persistent_term.put({__MODULE__, :jwks}, {jwks, System.monotonic_time(:millisecond)})
  end

  defp auth0_domain do
    Application.fetch_env!(:impulse, :auth0)[:domain]
  end

  defp auth0_client_id do
    Application.fetch_env!(:impulse, :auth0)[:client_id]
  end
end
