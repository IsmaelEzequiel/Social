defmodule Impulse.Safety do
  alias Impulse.Repo
  alias Impulse.Safety.Report
  alias Impulse.Trust

  def create_report(reporter_id, attrs) do
    changeset_attrs = Map.put(attrs, :reporter_id, reporter_id)

    case %Report{} |> Report.changeset(changeset_attrs) |> Repo.insert() do
      {:ok, report} ->
        Trust.record_event(report.reported_id, "reported", report.id)
        {:ok, report}

      error ->
        error
    end
  end
end
