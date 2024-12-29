import LoginPage from "@/components/LoginPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login to Mentallity",
};

const Login = () => {
  return (
    <div>
      <LoginPage />
    </div>
  );
};

export default Login;
