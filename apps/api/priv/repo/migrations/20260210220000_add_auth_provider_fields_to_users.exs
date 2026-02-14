defmodule Impulse.Repo.Migrations.AddAuthProviderFieldsToUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :auth_provider, :string, default: "phone", null: false
      add :auth_provider_id, :string
      add :email, :string
    end

    # Make phone_hash nullable (social login users won't have one)
    execute "ALTER TABLE users ALTER COLUMN phone_hash DROP NOT NULL",
            "ALTER TABLE users ALTER COLUMN phone_hash SET NOT NULL"

    # Drop old unique index on phone_hash
    drop_if_exists unique_index(:users, [:phone_hash])

    # Partial unique index: phone_hash must be unique only when present
    create unique_index(:users, [:phone_hash],
             where: "phone_hash IS NOT NULL",
             name: :users_phone_hash_index
           )

    # Composite unique index for social auth providers
    create unique_index(:users, [:auth_provider, :auth_provider_id],
             where: "auth_provider_id IS NOT NULL",
             name: :users_auth_provider_provider_id_index
           )
  end
end
