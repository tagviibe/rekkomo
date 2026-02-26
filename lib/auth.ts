import { type NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import bcrypt from "bcryptjs";

const credentialsSchema = z.union([
  z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  z.object({
    phone: z.string().min(8),
    otp: z.string().min(4),
  }),
]);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        phone: { label: "Phone", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          console.error("[AUTH] Invalid credentials format:", parsed.error);
          return null;
        }

        // Email/Password authentication
        if ("email" in parsed.data) {
          const email = parsed.data.email.toLowerCase().trim();
          let user = await prisma.user.findUnique({
            where: { email },
            include: { profile: true },
          });

          // If user doesn't exist, create new user with email/password
          if (!user) {
            const hashedPassword = await bcrypt.hash(parsed.data.password, 10);
            const name = email.split("@")[0]; // Use email prefix as default name
            user = await prisma.user.create({
              data: {
                email,
                password: hashedPassword,
                name: `User ${name}`,
                profile: { create: {} },
              },
              include: { profile: true },
            });
            console.log("[AUTH] Created new user for email:", email);
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              role: user.role,
              username: user.username,
            };
          }

          // If user exists but no password set, set the password (for migration/upgrade)
          if (!user.password) {
            const hashedPassword = await bcrypt.hash(parsed.data.password, 10);
            user = await prisma.user.update({
              where: { id: user.id },
              data: { password: hashedPassword },
              include: { profile: true },
            });
            console.log("[AUTH] Set password for existing user:", email);
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              role: user.role,
              username: user.username,
            };
          }

          // Verify password for existing user
          const valid = await bcrypt.compare(parsed.data.password, user.password);
          if (!valid) {
            console.error("[AUTH] Invalid password for email:", email);
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            username: user.username,
          };
        }

        // Phone/OTP authentication
        if ("phone" in parsed.data && "otp" in parsed.data) {
          // Normalize phone - handle +91 prefix
          let phoneInput = parsed.data.phone.trim();
          if (phoneInput.startsWith("+91")) {
            phoneInput = phoneInput.replace("+91", "");
          }
          const phone = normalizePhone(phoneInput);
          
          if (!isValidPhone(phone)) {
            console.error("[AUTH] Invalid phone number:", phone);
            return null;
          }

          // Store and lookup with country code format
          const phoneWithCode = `+91${phone}`;
          const otpRecord = await prisma.phoneOtp.findUnique({
            where: { phone: phoneWithCode },
          });

          if (!otpRecord) {
            console.error("[AUTH] OTP record not found for phone:", phoneWithCode);
            return null;
          }

          if (otpRecord.expiresAt < new Date()) {
            console.error("[AUTH] OTP expired for phone:", phoneWithCode);
            // Clean up expired OTP
            await prisma.phoneOtp.delete({ where: { phone: phoneWithCode } }).catch(() => {});
            return null;
          }

          const otpValue = parsed.data.otp.trim();
          if (otpValue.length < 4) {
            console.error("[AUTH] OTP too short");
            return null;
          }

          const otpValid = await bcrypt.compare(otpValue, otpRecord.codeHash);
          if (!otpValid) {
            console.error("[AUTH] Invalid OTP for phone:", phoneWithCode);
            return null;
          }

          // Delete used OTP
          await prisma.phoneOtp.delete({ where: { phone: phoneWithCode } }).catch(() => {});

          // Find or create user - search by phone in profile
          let user = await prisma.user.findFirst({
            where: { 
              profile: { 
                phone: phoneWithCode 
              } 
            },
            include: { profile: true },
          });

          if (!user) {
            // Create new user with phone-based email
            const email = `${phone}@otp.rekkomo`;
            user = await prisma.user.create({
              data: {
                email,
                name: `User ${phone.slice(-4)}`, // Last 4 digits as default name
                profile: { 
                  create: { 
                    phone: phoneWithCode 
                  } 
                },
              },
              include: { profile: true },
            });
            console.log("[AUTH] Created new user for phone:", phoneWithCode);
          } else {
            console.log("[AUTH] Found existing user for phone:", phoneWithCode);
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            username: user.username,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      const role = (user as { role?: string } | null)?.role;
      if (role) token.role = role;
      const username = (user as { username?: string } | null)?.username;
      if (username) token.username = username;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) session.user.id = token.id as string;
      if (session.user && token.role) session.user.role = token.role as string;
      if (session.user && token.username)
        session.user.username = token.username as string;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};

export const getAuthSession = () => getServerSession(authOptions);
