"use client"
import { signIn} from "next-auth/react";

const LoginPageButton = () => {
    return   <button onClick={() => void signIn()} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
    Log in to get started
  </button>
}
 
export default LoginPageButton;