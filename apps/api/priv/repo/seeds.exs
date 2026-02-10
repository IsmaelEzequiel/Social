alias Impulse.Repo
alias Impulse.Gamification.Preset
alias Impulse.Geo.Zone

# Activity Presets (pt-BR)
presets = [
  %{
    name: "Futebol",
    icon: "soccer-ball",
    locale: "pt-BR",
    allowed_hours: %{start: 6, end: 23},
    max_duration: 240,
    sort_order: 1
  },
  %{
    name: "Corrida",
    icon: "running",
    locale: "pt-BR",
    allowed_hours: %{start: 5, end: 22},
    max_duration: 180,
    sort_order: 2
  },
  %{
    name: "Basquete",
    icon: "basketball",
    locale: "pt-BR",
    allowed_hours: %{start: 6, end: 23},
    max_duration: 180,
    sort_order: 3
  },
  %{
    name: "Vôlei",
    icon: "volleyball",
    locale: "pt-BR",
    allowed_hours: %{start: 6, end: 22},
    max_duration: 180,
    sort_order: 4
  },
  %{
    name: "Skate",
    icon: "skateboard",
    locale: "pt-BR",
    allowed_hours: %{start: 7, end: 22},
    max_duration: 240,
    sort_order: 5
  },
  %{
    name: "Ciclismo",
    icon: "bicycle",
    locale: "pt-BR",
    allowed_hours: %{start: 5, end: 21},
    max_duration: 360,
    sort_order: 6
  },
  %{
    name: "Caminhada",
    icon: "walking",
    locale: "pt-BR",
    allowed_hours: %{start: 5, end: 22},
    max_duration: 240,
    sort_order: 7
  },
  %{
    name: "Outros",
    icon: "lightning-bolt",
    locale: "pt-BR",
    allowed_hours: %{start: 6, end: 23},
    max_duration: 240,
    sort_order: 8
  }
]

for attrs <- presets do
  %Preset{}
  |> Preset.changeset(attrs)
  |> Repo.insert!(on_conflict: :nothing)
end

IO.puts("Seeded #{length(presets)} presets")

# São Paulo Zones (simplified polygons)
zones = [
  %{
    city: "São Paulo",
    name: "Vila Madalena",
    geometry: %Geo.Polygon{
      coordinates: [
        [
          {-46.694, -23.553},
          {-46.684, -23.553},
          {-46.684, -23.543},
          {-46.694, -23.543},
          {-46.694, -23.553}
        ]
      ],
      srid: 4326
    }
  },
  %{
    city: "São Paulo",
    name: "Pinheiros",
    geometry: %Geo.Polygon{
      coordinates: [
        [
          {-46.700, -23.570},
          {-46.685, -23.570},
          {-46.685, -23.555},
          {-46.700, -23.555},
          {-46.700, -23.570}
        ]
      ],
      srid: 4326
    }
  },
  %{
    city: "São Paulo",
    name: "Itaim Bibi",
    geometry: %Geo.Polygon{
      coordinates: [
        [
          {-46.685, -23.580},
          {-46.670, -23.580},
          {-46.670, -23.565},
          {-46.685, -23.565},
          {-46.685, -23.580}
        ]
      ],
      srid: 4326
    }
  },
  %{
    city: "São Paulo",
    name: "Moema",
    geometry: %Geo.Polygon{
      coordinates: [
        [
          {-46.670, -23.610},
          {-46.650, -23.610},
          {-46.650, -23.590},
          {-46.670, -23.590},
          {-46.670, -23.610}
        ]
      ],
      srid: 4326
    }
  },
  %{
    city: "São Paulo",
    name: "Jardins",
    geometry: %Geo.Polygon{
      coordinates: [
        [
          {-46.675, -23.570},
          {-46.655, -23.570},
          {-46.655, -23.555},
          {-46.675, -23.555},
          {-46.675, -23.570}
        ]
      ],
      srid: 4326
    }
  },
  %{
    city: "São Paulo",
    name: "Vila Olímpia",
    geometry: %Geo.Polygon{
      coordinates: [
        [
          {-46.690, -23.600},
          {-46.670, -23.600},
          {-46.670, -23.585},
          {-46.690, -23.585},
          {-46.690, -23.600}
        ]
      ],
      srid: 4326
    }
  }
]

for attrs <- zones do
  %Zone{}
  |> Zone.changeset(attrs)
  |> Repo.insert!(on_conflict: :nothing)
end

IO.puts("Seeded #{length(zones)} zones")
