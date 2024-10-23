"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";

import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/lib/user";

export const register = async (values: z.infer<typeof RegisterSchema>) => {

    const validatedFields = RegisterSchema.safeParse(values);

    if(!validatedFields.success) {
        return {
            error: validatedFields.error.errors[0].message,
        };
    }
    const { email, password, name } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingUser = await getUserByEmail(email);
    if(existingUser) {
        return {
            error: "User already exists",
        };
    }
    await prisma.user.create({ 
        data: {
            email,
            password: hashedPassword,
            username:name,
        },
    });
    return {
        success: true,
    };
};