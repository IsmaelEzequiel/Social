defmodule Impulse.Accounts do
  import Ecto.Query
  alias Impulse.Repo
  alias Impulse.Accounts.User

  def get_user(id) do
    Repo.get(User, id)
  end

  def get_user_by_phone_hash(phone_hash) do
    Repo.get_by(User, phone_hash: phone_hash)
  end

  def register_or_login(attrs) do
    case get_user_by_phone_hash(attrs.phone_hash) do
      nil -> create_user(attrs)
      user -> {:ok, user}
    end
  end

  def create_user(attrs) do
    %User{}
    |> User.registration_changeset(attrs)
    |> Repo.insert()
  end

  def update_profile(user, attrs) do
    user
    |> User.profile_changeset(attrs)
    |> Repo.update()
  end

  def update_trust(user, attrs) do
    user
    |> User.trust_changeset(attrs)
    |> Repo.update()
  end

  def get_user_by_provider(auth_provider, auth_provider_id) do
    Repo.get_by(User, auth_provider: auth_provider, auth_provider_id: auth_provider_id)
  end

  def register_or_login_social(attrs) do
    case get_user_by_provider(attrs.auth_provider, attrs.auth_provider_id) do
      nil -> create_social_user(attrs)
      user -> {:ok, user}
    end
  end

  def create_social_user(attrs) do
    %User{}
    |> User.social_registration_changeset(attrs)
    |> Repo.insert()
  end

  def increment_counter(user, field)
      when field in [:activities_joined_count, :activities_created_count] do
    from(u in User, where: u.id == ^user.id)
    |> Repo.update_all(inc: [{field, 1}])
  end
end
