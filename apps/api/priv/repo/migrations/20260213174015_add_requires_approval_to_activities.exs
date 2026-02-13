defmodule Impulse.Repo.Migrations.AddRequiresApprovalToActivities do
  use Ecto.Migration

  def change do
    alter table(:activities) do
      add :requires_approval, :boolean, default: false, null: false
    end
  end
end
