import { useState } from "react";
import { ArrowRight, BusFront, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import "../styles/Auth.css";

function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  return "";
}

function maskPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (digits.length < 10) {
    return phone;
  }

  return `+91 ${digits.slice(-10, -6)}${"•".repeat(4)}${digits.slice(-2)}`;
}

export default function Login() {
  const { markPhoneVerified } = useAuth();

  const [name, setName] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const phone = formatPhone(phoneInput);

  async function sendOtp(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const cleanName = name.trim();

    if (cleanName.length < 2) {
      setError("Please enter your name.");
      return;
    }

    if (!phone) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    setSending(true);

    const { error: otpError } =
      await supabase.auth.signInWithOtp({
        phone,
      });

    setSending(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }

    setStep("otp");
    setMessage(`OTP sent to ${maskPhone(phone)}.`);
  }

  async function verifyOtp(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const cleanOtp = otp.replace(/\D/g, "");

    if (cleanOtp.length !== 6) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    setVerifying(true);

    const {
      data,
      error: verifyError,
    } = await supabase.auth.verifyOtp({
      phone,
      token: cleanOtp,
      type: "sms",
    });

    if (verifyError) {
      setVerifying(false);
      setError(verifyError.message);
      return;
    }

    const verifiedUser = data?.user;

    if (!verifiedUser) {
      setVerifying(false);
      setError("Phone verification succeeded, but no user session was returned.");
      return;
    }

    const { error: profileError } =
      await supabase.auth.updateUser({
        data: {
          full_name: name.trim(),
        },
      });

    if (profileError) {
      console.warn(
        "PAYANI name metadata update failed:",
        profileError
      );
    }

    setVerifying(false);
  }

  function changePhone() {
    setStep("phone");
    setOtp("");
    setError("");
    setMessage("");
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark">
            <BusFront size={25} strokeWidth={2.6} />
          </div>

          <div>
            <strong>PAYANI</strong>
            <span>SmartBus</span>
          </div>
        </div>

        <div className="auth-heading">
          <span className="auth-eyebrow">
            SMART PUBLIC TRANSPORT
          </span>

          <h1>
            {step === "phone"
              ? "Welcome to PAYANI"
              : "Verify your phone"}
          </h1>

          <p>
            {step === "phone"
              ? "Enter your name and mobile number to continue."
              : `Enter the OTP sent to ${maskPhone(phone)}.`}
          </p>
        </div>

        {step === "phone" ? (
          <form
            className="auth-form"
            onSubmit={sendOtp}
          >
            <label>
              <span>Name</span>
              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Enter your name"
                autoComplete="name"
                maxLength={80}
              />
            </label>

            <label>
              <span>Phone number</span>
              <div className="phone-input-wrap">
                <span>+91</span>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(event) =>
                    setPhoneInput(
                      event.target.value.replace(/\D/g, "").slice(0, 10)
                    )
                  }
                  placeholder="9876543210"
                  autoComplete="tel"
                  inputMode="numeric"
                />
              </div>
            </label>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="auth-primary-button"
              disabled={sending}
            >
              {sending
                ? "Sending OTP..."
                : "Send OTP"}
              <ArrowRight size={17} />
            </button>
          </form>
        ) : (
          <form
            className="auth-form"
            onSubmit={verifyOtp}
          >
            <label>
              <span>6-digit OTP</span>
              <input
                className="otp-input"
                type="text"
                value={otp}
                onChange={(event) =>
                  setOtp(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6)
                  )
                }
                placeholder="123456"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
              />
            </label>

            {message && (
              <div className="auth-message">
                {message}
              </div>
            )}

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="auth-primary-button"
              disabled={verifying}
            >
              {verifying
                ? "Verifying..."
                : "Verify & Continue"}
              <ShieldCheck size={17} />
            </button>

            <button
              type="button"
              className="auth-secondary-button"
              onClick={changePhone}
              disabled={verifying}
            >
              Change phone number
            </button>
          </form>
        )}

        <div className="auth-footer-note">
          Phone verification keeps your PAYANI account protected.
          You will be asked to verify your phone again after 48 hours.
        </div>
      </section>
    </main>
  );
}
