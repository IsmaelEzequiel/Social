defmodule Impulse.Notifications.PushWorker do
  use Oban.Worker, queue: :notifications, max_attempts: 3

  alias Impulse.Notifications

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id, "title" => title, "body" => body} = args}) do
    data = Map.get(args, "data", %{})
    tokens = Notifications.get_push_tokens(user_id)

    Enum.each(tokens, fn %{token: token, platform: platform} ->
      send_push(platform, token, title, body, data)
    end)

    :ok
  end

  defp send_push("ios", token, title, body, data) do
    # APNs via Req HTTP client
    payload = %{
      aps: %{
        alert: %{title: title, body: body},
        sound: "default",
        badge: 1
      },
      data: data
    }

    apns_url = System.get_env("APNS_URL") || "https://api.sandbox.push.apple.com"

    Req.post("#{apns_url}/3/device/#{token}",
      json: payload,
      headers: [
        {"apns-topic", System.get_env("APNS_TOPIC") || "com.impulse.app"},
        {"apns-push-type", "alert"},
        {"authorization", "bearer #{apns_auth_token()}"}
      ]
    )
  end

  defp send_push("android", token, title, body, data) do
    # FCM v1
    fcm_url = "https://fcm.googleapis.com/v1/projects/#{fcm_project_id()}/messages:send"

    payload = %{
      message: %{
        token: token,
        notification: %{title: title, body: body},
        data: stringify_map(data),
        android: %{priority: "high"}
      }
    }

    Req.post(fcm_url,
      json: payload,
      headers: [{"authorization", "Bearer #{fcm_auth_token()}"}]
    )
  end

  defp send_push(_platform, _token, _title, _body, _data), do: :ok

  defp apns_auth_token, do: System.get_env("APNS_AUTH_TOKEN") || "test_token"
  defp fcm_project_id, do: System.get_env("FCM_PROJECT_ID") || "impulse-dev"
  defp fcm_auth_token, do: System.get_env("FCM_AUTH_TOKEN") || "test_token"

  defp stringify_map(map) do
    Map.new(map, fn {k, v} -> {to_string(k), to_string(v)} end)
  end
end
