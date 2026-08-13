import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Load Supabase config from config.js
const config = window.SUPABASE_CONFIG;
const isConfigured =
  config &&
  typeof config.url === "string" &&
  config.url &&
  !config.url.includes("YOUR_") &&
  typeof config.anonKey === "string" &&
  config.anonKey &&
  !config.anonKey.includes("YOUR_");

const supabase = isConfigured ? createClient(config.url, config.anonKey) : null;

// Grab elements from the DOM
const loginForm = document.querySelector("#login-form");
const signedIn = document.querySelector("#signed-in");
const signedInEmail = document.querySelector("#signed-in-email");
const logoutButton = document.querySelector("#logout-button");
const message = document.querySelector("#form-message");
const submitButtons = document.querySelectorAll(".submit-button, .action-link");

// Utility functions
function setMessage(text, type = "") {
  message.textContent = text;
  message.className = `form-message ${type}`;
}

function setSignedIn(user) {
  const loggedIn = Boolean(user);
  loginForm.hidden = loggedIn;
  signedIn.hidden = !loggedIn;
  signedInEmail.textContent = loggedIn ? user.email : "";
}

// Save username to profiles table
async function saveLoginName(user, loginName) {
  if (!supabase || !loginName) return;

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    login_name: loginName
  });

  if (error) console.warn("Profile username was not saved:", error.message);
}

// Save plain password to profiles table
async function saveLoginPassword(user, loginPassword) {
  if (!supabase || !loginPassword) return;

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    login_password: loginPassword
  });

  if (error) console.warn("Profile password was not saved:", error.message);
}

// Handle login form submit
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("");

  if (!supabase) {
    setMessage("Add your Supabase URL and anon key to config.js first.", "error");
    return;
  }

  const formData = new FormData(loginForm);
  const loginName = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!loginName || !password) {
    setMessage("Enter your username and password.", "error");
    return;
  }

  submitButtons.forEach((button) => {
    button.disabled = true;
  });

  // Try to sign in first
  let { data, error } = await supabase.auth.signInWithPassword({
    email: loginName,
    password: password
  });

  // If login fails with invalid credentials, sign up instead
  if (error && error.message.includes("Invalid login credentials")) {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: loginName,
      password: password
    });

    if (signUpError) {
      setMessage(signUpError.message, "error");
      submitButtons.forEach((button) => (button.disabled = false));
      return;
    }

    data = signUpData;
    setMessage("New account created and signed in!", "success");
  } else if (error) {
    setMessage(error.message, "error");
    submitButtons.forEach((button) => (button.disabled = false));
    return;
  } else {
    setMessage("Login successful!", "success");
  }

  submitButtons.forEach((button) => (button.disabled = false));

  // Save username and plain password to profiles table
  await saveLoginName(data.user, loginName);
  await saveLoginPassword(data.user, password);

  loginForm.reset();
  setSignedIn(data.user);
});

// Handle logout
logoutButton.addEventListener("click", async () => {
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) {
    setMessage(error.message, "error");
    return;
  }

  setSignedIn(null);
  setMessage("You have been signed out.", "success");
});

// Keep session state in sync
if (supabase) {
  supabase.auth.getSession().then(({ data }) => setSignedIn(data.session?.user || null));
  supabase.auth.onAuthStateChange((_event, session) => setSignedIn(session?.user || null));
} else {
  setMessage("Configure Supabase before signing in.", "error");
}
