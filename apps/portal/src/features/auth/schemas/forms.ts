import {
  ForgotPasswordRequestSchema,
  LoginRequestSchema,
  ResetPasswordRequestSchema,
  StudentRegistrationRequestSchema,
  TeacherRegistrationRequestSchema,
  type LoginRequest,
  type StudentRegistrationRequest,
  type TeacherRegistrationRequest,
} from "@noldg/api/contracts/auth";

export const LoginFormSchema = LoginRequestSchema;
export const StudentRegistrationFormSchema = StudentRegistrationRequestSchema;
export const TeacherRegistrationFormSchema = TeacherRegistrationRequestSchema;
export const ForgotPasswordFormSchema = ForgotPasswordRequestSchema;
export const ResetPasswordFormSchema = ResetPasswordRequestSchema;

export interface StudentRegistrationFormValues extends StudentRegistrationRequest {
  passwordConfirmation: string;
}

export interface TeacherRegistrationFormValues extends TeacherRegistrationRequest {
  passwordConfirmation: string;
}

export type LoginFormValues = LoginRequest;
export interface ResetPasswordFormValues {
  email: string;
  code: string;
  password: string;
  passwordConfirmation: string;
}
