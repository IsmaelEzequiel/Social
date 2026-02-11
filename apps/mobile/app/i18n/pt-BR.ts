const ptBR = {
  common: {
    ok: "OK!",
    cancel: "Cancelar",
    back: "Voltar",
    logOut: "Sair",
    loading: "Carregando...",
    retry: "Tentar novamente",
    save: "Salvar",
    confirm: "Confirmar",
    delete: "Excluir",
  },
  auth: {
    authMethod: {
      title: "Bem-vindo ao Impulse",
      subtitle: "Escolha como entrar",
      google: "Continuar com Google",
      apple: "Continuar com Apple",
      phone: "Continuar com telefone",
      error: "Erro ao fazer login. Tente novamente.",
    },
    phoneEntry: {
      title: "Entrar no Impulse",
      subtitle: "Digite seu número de celular",
      placeholder: "Seu número",
      send: "Enviar código",
    },
    codeVerification: {
      title: "Código de verificação",
      subtitle: "Enviamos um código para {{phone}}",
      resend: "Reenviar código",
      resendIn: "Reenviar em {{seconds}}s",
    },
    profileSetup: {
      title: "Monte seu perfil",
      displayName: "Como quer ser chamado?",
      displayNamePlaceholder: "Seu nome ou apelido",
      avatar: "Escolha um avatar",
      presets: "O que você curte?",
      zone: "Sua região",
      finish: "Começar!",
    },
  },
  map: {
    title: "Mapa",
    createActivity: "Criar atividade",
    noActivities: "Nenhuma atividade por perto",
    join: "Participar",
    leave: "Sair",
    full: "Lotado",
    participants: "{{count}} participantes",
    startsIn: "Começa em {{time}}",
    endsIn: "Termina em {{time}}",
  },
  activity: {
    flash: "Flash",
    planned: "Planejada",
    create: {
      title: "Nova atividade",
      choosePreset: "Escolha o tipo",
      chooseLocation: "Onde será?",
      chooseTime: "Quando começa?",
      chooseParticipants: "Quantas pessoas?",
      duration: "Duração",
      minutes: "{{count}} min",
      create: "Criar atividade",
    },
    detail: {
      creator: "Criado por {{name}}",
      spotsLeft: "{{count}} vagas restantes",
      confirmed: "{{count}} confirmados",
    },
    chat: {
      placeholder: "Mensagem...",
      ephemeralNotice: "Mensagens são apagadas após a atividade",
    },
    feedback: {
      title: "Como foi?",
      submit: "Enviar",
    },
  },
  upcoming: {
    title: "Próximos",
    empty: "Nenhuma atividade agendada",
    confirm: "Confirmar presença",
  },
  profile: {
    title: "Perfil",
    activitiesJoined: "Participações",
    activitiesCreated: "Criadas",
    badges: "Conquistas",
    trophies: "Troféus",
    subscription: "Impulse Pro",
    settings: "Configurações",
  },
  subscription: {
    title: "Impulse Pro",
    price: "R$ 24,90/mês",
    subscribe: "Assinar",
    cancel: "Cancelar assinatura",
    benefits: {
      unlimitedPlanned: "Atividades planejadas ilimitadas",
      extendedDuration: "Duração de até 6 horas",
      priorityVisibility: "Visibilidade prioritária no mapa",
    },
  },
  errorScreen: {
    title: "Algo deu errado!",
    friendlySubtitle: "Ocorreu um erro inesperado. Tente reiniciar o app.",
    reset: "REINICIAR APP",
    traceTitle: "Erro no stack %{name}",
  },
  emptyStateComponent: {
    generic: {
      heading: "Nada por aqui...",
      content: "Nenhum dado encontrado. Tente atualizar.",
      button: "Tentar novamente",
    },
  },
}

export default ptBR
export type Translations = typeof ptBR
