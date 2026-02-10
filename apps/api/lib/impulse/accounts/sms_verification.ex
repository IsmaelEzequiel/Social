defmodule Impulse.Accounts.SmsVerification do
  @moduledoc "Twilio Verify integration for phone-based authentication."

  @twilio_base_url "https://verify.twilio.com/v2"

  def request_code(phone_number) do
    service_sid = twilio_verify_service_sid()

    url = "#{@twilio_base_url}/Services/#{service_sid}/Verifications"

    body = %{
      "To" => phone_number,
      "Channel" => "sms"
    }

    case Req.post(url, form: body, auth: twilio_auth()) do
      {:ok, %{status: status}} when status in 200..299 ->
        :ok

      {:ok, %{status: status, body: body}} ->
        {:error, "Twilio error: #{status} - #{inspect(body)}"}

      {:error, reason} ->
        {:error, "Request failed: #{inspect(reason)}"}
    end
  end

  def check_code(phone_number, code) do
    service_sid = twilio_verify_service_sid()

    url = "#{@twilio_base_url}/Services/#{service_sid}/VerificationCheck"

    body = %{
      "To" => phone_number,
      "Code" => code
    }

    case Req.post(url, form: body, auth: twilio_auth()) do
      {:ok, %{status: status, body: %{"status" => "approved"}}} when status in 200..299 ->
        :ok

      {:ok, %{status: status, body: %{"status" => "pending"}}} when status in 200..299 ->
        {:error, :invalid_code}

      {:ok, %{status: _status, body: body}} ->
        {:error, "Verification failed: #{inspect(body)}"}

      {:error, reason} ->
        {:error, "Request failed: #{inspect(reason)}"}
    end
  end

  defp twilio_auth do
    account_sid = System.get_env("TWILIO_ACCOUNT_SID") || "test_sid"
    auth_token = System.get_env("TWILIO_AUTH_TOKEN") || "test_token"
    {:basic, "#{account_sid}:#{auth_token}"}
  end

  defp twilio_verify_service_sid do
    System.get_env("TWILIO_VERIFY_SERVICE_SID") || "test_service_sid"
  end
end
