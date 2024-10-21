"use server";

import * as z from "zod";
import { AuthError } from "next-auth";

import { prisma } from "@/lib/db";
import { signIn } from "@/auth";
import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/lib/user";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

export const login = async (
    values: z.infer<typeof LoginSchema>,
    callbackUrl?: string | null,

) => {
    const validatedFields = LoginSchema.safeParse(values);
    if (!validatedFields.success) {
        throw new AuthError("Invalid fields");
    }
    const { email, password } = values;
    const existingUser = await getUserByEmail(email);
    if (!existingUser) {
        throw new AuthError("User not found");
    }
    try{
        await signIn("credentials", {
            email,
            password,
            redirectTo: callbackUrl || DEFAULT_LOGIN_REDIRECT,
        })
    }
    catch (error) {
        if (error instanceof AuthError) {
          switch (error.type) {
            case "CredentialsSignin":
              return { error: "Invalid credentials!" }
            default:
              return { error: "Something went wrong!" }
          }
        }
    
        throw error;
    }
}