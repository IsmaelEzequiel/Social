defmodule Impulse.Repo.Migrations.AddPushTokenToDeviceRecords do
  use Ecto.Migration

  def change do
    alter table(:device_records) do
      add :push_token, :text
    end
  end
end
