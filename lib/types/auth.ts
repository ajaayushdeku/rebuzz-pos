export type LoginRequest = {
  email_or_phone: string;
  password: string;
};

export type LoginResponse = {
  status: string;
  data: {
    isFirstLogin: boolean;
    token: string;
    userId: string;
    isSubscribed: boolean;
    role: string;
    subscriptionType: string;
    hasPrinter: string;
    currency: string;
  };
};
