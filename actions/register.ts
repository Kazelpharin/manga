"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/lib/user";
import { signIn } from "@/auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

export const register = async (
  values: z.infer<typeof RegisterSchema>,
  callbackUrl?: string
) => {
    const validatedFields = RegisterSchema.safeParse(values);
    
    if (!validatedFields.success) {
        return {
            error: validatedFields.error.errors[0].message,
        };
    }
    
    const { email, password, name } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const existingUser = await getUserByEmail(email);
    
    if (existingUser) {
        return {
            error: "User already exists",
        };
    }
    
    try {
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                username: name,
            },
        });

        const signInResult = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (signInResult?.error) {
            return {
                error: "Failed to sign in after registration",
            };
        }

        return {
            success: true,
            redirectUrl: callbackUrl || DEFAULT_LOGIN_REDIRECT,
        };
    } catch (error) {
        return {
            error: "An error occurred during registration",
        };
    }
};