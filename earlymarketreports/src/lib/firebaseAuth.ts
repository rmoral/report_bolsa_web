import { db } from "./firebaseAdmin";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export type UserRole = "user" | "admin";
export type SubscriptionPlan = "lite" | "pro";

export interface FirestoreUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  plan: SubscriptionPlan;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  plan: SubscriptionPlan;
}): Promise<{ id: string; email: string; plan: SubscriptionPlan }> {
  const { name, email, password, plan } = userData;
  
  // Verificar si el usuario ya existe
  const existingUsers = await db.collection("users")
    .where("email", "==", email.toLowerCase())
    .limit(1)
    .get();
    
  if (!existingUsers.empty) {
    throw new Error("Email ya registrado");
  }
  
  // Hash de la contraseña
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Crear usuario en Firestore
  const userRef = await db.collection("users").add({
    name,
    email: email.toLowerCase(),
    passwordHash,
    plan,
    role: "user",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  return {
    id: userRef.id,
    email: email.toLowerCase(),
    plan,
  };
}

export async function authenticateUser(email: string, password: string): Promise<{
  token: string;
  user: { id: string; email: string; plan: SubscriptionPlan; role: UserRole };
}> {
  // Buscar usuario por email
  const users = await db.collection("users")
    .where("email", "==", email.toLowerCase())
    .where("isActive", "==", true)
    .limit(1)
    .get();
    
  if (users.empty) {
    throw new Error("Credenciales inválidas");
  }
  
  const userDoc = users.docs[0];
  const userData = userDoc.data() as Omit<FirestoreUser, "id">;
  
  // Verificar contraseña
  const isValidPassword = await bcrypt.compare(password, userData.passwordHash);
  if (!isValidPassword) {
    throw new Error("Credenciales inválidas");
  }
  
  // Generar JWT
  const token = jwt.sign(
    { 
      sub: userDoc.id, 
      role: userData.role, 
      plan: userData.plan 
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );
  
  return {
    token,
    user: {
      id: userDoc.id,
      email: userData.email,
      plan: userData.plan,
      role: userData.role,
    },
  };
}

export async function getUserById(userId: string): Promise<FirestoreUser | null> {
  const userDoc = await db.collection("users").doc(userId).get();
  
  if (!userDoc.exists) {
    return null;
  }
  
  return {
    id: userDoc.id,
    ...userDoc.data(),
  } as FirestoreUser;
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  await db.collection("users").doc(userId).update({
    role,
    updatedAt: new Date().toISOString(),
  });
}
