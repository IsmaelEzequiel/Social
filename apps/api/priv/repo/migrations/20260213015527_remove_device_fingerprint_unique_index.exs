defmodule Impulse.Repo.Migrations.RemoveDeviceFingerprintUniqueIndex do
  use Ecto.Migration

  def change do
    drop_if_exists unique_index(:users, [:device_fingerprint])
    create index(:users, [:device_fingerprint])
  end
end
