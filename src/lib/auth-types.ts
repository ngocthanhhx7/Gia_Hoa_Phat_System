import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      role: string;
      address?: string | null;
      phone?: string | null;
    };
  }

  interface User {
    role?: string;
  }
}

// Auth.js v5 uses @auth/core for JWT types
declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    address?: string | null;
    phone?: string | null;
  }
}
