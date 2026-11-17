"use client"

import { useState } from "react"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState("sign-in")

  return (
    <div className="grid gap-12 py-4 lg:grid-cols-2 lg:gap-24">
      <div className="hidden lg:block">
        <h1 className="display max-w-[11ch]">Your Garb <em>account</em></h1>
        <p className="mt-5 max-w-sm text-body text-[#3d3d3d]">
          Check out faster, keep your addresses, and see every order in one place.
        </p>
        <p className="mt-10 text-label text-[#3d3d3d]">
          Selling with us? <a href="/seller" className="link">Go to the seller login</a>.
        </p>
      </div>
      <div>
      {currentView === "sign-in" ? (
        <Login setCurrentView={setCurrentView} />
      ) : (
        <Register setCurrentView={setCurrentView} />
      )}
      </div>
    </div>
  )
}

export default LoginTemplate
