defmodule Impulse.Trust.AttendanceVerification do
  @moduledoc "Verify user attendance via proximity check."

  @attendance_radius_meters 200

  def verify_attendance(user_lat, user_lng, activity_lat, activity_lng) do
    distance = haversine_distance(user_lat, user_lng, activity_lat, activity_lng)
    distance <= @attendance_radius_meters
  end

  defp haversine_distance(lat1, lng1, lat2, lng2) do
    # Earth's radius in meters
    r = 6_371_000

    dlat = deg_to_rad(lat2 - lat1)
    dlng = deg_to_rad(lng2 - lng1)

    a =
      :math.sin(dlat / 2) * :math.sin(dlat / 2) +
        :math.cos(deg_to_rad(lat1)) * :math.cos(deg_to_rad(lat2)) *
          :math.sin(dlng / 2) * :math.sin(dlng / 2)

    c = 2 * :math.atan2(:math.sqrt(a), :math.sqrt(1 - a))
    r * c
  end

  defp deg_to_rad(deg), do: deg * :math.pi() / 180
end
