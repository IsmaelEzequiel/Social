defmodule ImpulseWeb.Plugs.RateLimitPlug do
  @moduledoc "Simple in-memory rate limiter using ETS."
  import Plug.Conn
  import Phoenix.Controller, only: [json: 2]

  @table :rate_limit_buckets
  @default_limit 60
  @default_window_ms 60_000

  def init(opts) do
    unless :ets.info(@table) != :undefined do
      :ets.new(@table, [:set, :public, :named_table])
    end

    opts
  end

  def call(conn, opts) do
    limit = Keyword.get(opts, :limit, @default_limit)
    window_ms = Keyword.get(opts, :window_ms, @default_window_ms)
    key = rate_limit_key(conn)

    case check_rate(key, limit, window_ms) do
      {:allow, count} ->
        conn
        |> put_resp_header("x-ratelimit-limit", to_string(limit))
        |> put_resp_header("x-ratelimit-remaining", to_string(limit - count))

      :deny ->
        conn
        |> put_status(:too_many_requests)
        |> json(%{error: "rate_limited", message: "Too many requests"})
        |> halt()
    end
  end

  defp rate_limit_key(conn) do
    ip = conn.remote_ip |> :inet.ntoa() |> to_string()
    "#{ip}:#{conn.request_path}"
  end

  defp check_rate(key, limit, window_ms) do
    now = System.monotonic_time(:millisecond)

    case :ets.lookup(@table, key) do
      [{^key, count, window_start}] when now - window_start < window_ms ->
        if count >= limit do
          :deny
        else
          :ets.update_counter(@table, key, {2, 1})
          {:allow, count + 1}
        end

      _ ->
        :ets.insert(@table, {key, 1, now})
        {:allow, 1}
    end
  end
end
