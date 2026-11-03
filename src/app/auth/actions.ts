"use server";

import * as account from "@/lib/api/account";

// The auth form's calls into our server. The backend checks everything again; these only stop
// obviously wrong input from making a request.

const clean = (value: unknown, max = 200) => (typeof value === "string" ? value.trim().slice(0, max) : "");

export async function signInAction(email: string, password: string) {
  return account.signIn(clean(email), typeof password === "string" ? password.slice(0, 200) : "");
}

export async function signUpAction(fields: account.SignUpFields) {
  return account.signUp({
    username: clean(fields.username, 20),
    firstName: clean(fields.firstName, 60),
    lastName: clean(fields.lastName, 60),
    email: clean(fields.email),
    telephone: clean(fields.telephone, 20),
    mobileOperatorId: Number(fields.mobileOperatorId) || 1,
    password: typeof fields.password === "string" ? fields.password.slice(0, 200) : "",
  });
}

export async function resendVerificationAction(email: string) {
  return account.resendVerification(clean(email));
}

export async function forgotPasswordAction(email: string) {
  return account.forgotPassword(clean(email));
}
