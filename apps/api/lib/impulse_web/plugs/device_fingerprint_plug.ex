defmodule ImpulseWeb.Plugs.DeviceFingerprintPlug do
  @moduledoc "Extracts X-Device-Fingerprint header and assigns it."
  import Plug.Conn
  import Phoenix.Controller, only: [json: 2]

  def init(opts), do: opts

  def call(conn, _opts) do
    case get_req_header(conn, "x-device-fingerprint") do
      [fingerprint] when byte_size(fingerprint) == 64 ->
        assign(conn, :device_fingerprint, fingerprint)

      _ ->
        conn
        |> put_status(:bad_request)
        |> json(%{
          error: "missing_fingerprint",
          message: "X-Device-Fingerprint header is required"
        })
        |> halt()
    end
  end
end
