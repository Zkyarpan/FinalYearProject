export interface SendVerificationEmailParams {
    email: string;
    verifyCode: string;
  }
  
  export interface VerificationEmailResponse {
    success: boolean;
    message: string;
  }
  