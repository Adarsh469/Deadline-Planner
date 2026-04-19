import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/http";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password } = body as {
            name?: string;
            email?: string;
            password?: string;
        };

        if (!email || !password) {
            return jsonResponse(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return jsonResponse(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return jsonResponse(
                { error: "An account with this email already exists" },
                { status: 409 }
            );
        }

        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: {
                name: name || email.split("@")[0],
                email,
                password: hashedPassword,
            },
        });

        return jsonResponse(
            { data: { id: user.id, email: user.email, name: user.name } },
            { status: 201 }
        );
    } catch (error) {
        console.error("signup.failed", error);
        return jsonResponse(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
