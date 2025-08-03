/* ----------------------------------------------------------
   Configuration
---------------------------------------------------------- */
const CSV_URL =
  "https://raw.githubusercontent.com/jayachandrangs/JustClubs/main/Clubs.csv";

const FALLBACK_CLUBS = [
  { name: "Citywest", url: "https://citywest-justclubs.onrender.com/" },
  { name: "PreProd",  url: "https://citywest-shuttleup.onrender.com/" },
];

/* ----------------------------------------------------------
   Utilities
---------------------------------------------------------- */
function goToPage(page) {
  window.location.href = page;
}

function parseCSV(text) {
  const result = [];
  const rows = text.trim().split(/\r?\n/);

  if (rows.length <= 1) {
    console.warn("CSV has no data rows");
    return result;
  }

  for (let i = 1; i < rows.length; i++) {
    const line = rows[i].trim();
    if (!line) continue;

    const comma = line.indexOf(",");
    if (comma === -1) {
      console.warn("Skipping malformed row:", line);
      continue;
    }

    const name = line.slice(0, comma).trim();
    const url  = line.slice(comma + 1).trim();
    if (name && url) result.push({ name, url });
  }
  return result;
}

/* ----------------------------------------------------------
   Login Authentication Function
---------------------------------------------------------- */
async function attemptLogin(clubURL, password, maxAttempts = 3, timeoutMs = 30000) {
  const loginUrl = `${clubURL.replace(/\/$/, '')}/api/auth/login`;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Login attempt ${attempt}/${maxAttempts} to: ${loginUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'volunteer@justclubs.ie',
          password: password
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Login successful');
        return { success: true, data: data };
      } else if (response.status === 401 || response.status === 403) {
        console.log('Authentication failed - wrong credentials');
        return { 
          success: false, 
          error: 'auth_failed', 
          message: 'Password is wrong, check Your CLUB name and enter correct Password.' 
        };
      } else {
        console.log(`Login failed with status: ${response.status}`);
        if (attempt === maxAttempts) {
          return { 
            success: false, 
            error: 'server_error', 
            message: 'Internet not available or Server Down' 
          };
        }
      }
    } catch (error) {
      console.error(`Login attempt ${attempt} failed:`, error);
      
      if (error.name === 'AbortError') {
        console.log('Login request timed out');
      }
      
      if (attempt === maxAttempts) {
        return { 
          success: false, 
          error: 'network_error', 
          message: 'Internet not available or Server Down' 
        };
      }
      
      // Wait 2 seconds before next attempt (except for last attempt)
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  return { 
    success: false, 
    error: 'max_attempts', 
    message: 'Internet not available or Server Down' 
  };
}


/* ----------------------------------------------------------
   Main
---------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  const clubSelect    = document.getElementById("clubSelect");
  const passwordInput = document.getElementById("password");
  const form          = document.getElementById("clubForm");
  const resetBtn      = document.getElementById("resetBtn");

  /* 1 – Load club list -------------------------------------------------- */
  let clubs = [];
  try {
    const resp = await fetch(CSV_URL, { cache: "no-cache", mode: "cors" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const csvText = await resp.text();
    clubs = parseCSV(csvText);
    console.info(`Downloaded CSV: ${clubs.length} clubs`);
  } catch (err) {
    console.error("Could not fetch or parse CSV:", err);
  }

  if (clubs.length === 0) {
    console.warn("Using fallback club list");
    clubs = FALLBACK_CLUBS;
  }

  clubs.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));

  clubSelect.innerHTML =
    '<option value="" disabled selected>Select your club…</option>';

  clubs.forEach(c => {
    const opt   = document.createElement("option");
    opt.value   = JSON.stringify(c);
    opt.textContent = c.name;
    clubSelect.appendChild(opt);
  });

  /* 2 – Restore previous selection ------------------------------------ */
  const stored = JSON.parse(localStorage.getItem("ClubProfile") || "{}");
  if (stored.ClubName && stored.ClubURL) {
    for (const o of clubSelect.options) {
      if (!o.value) continue;
      const { name, url } = JSON.parse(o.value);
      if (name === stored.ClubName && url === stored.ClubURL) {
        o.selected = true;
        break;
      }
    }

    // Auto-fill password if available
    if (stored.Password) {
      passwordInput.value = stored.Password;
    }
  }

  /* 3 – Submit handler with Login Authentication -------------------- */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!clubSelect.value) {
      alert("Please select your club.");
      return;
    }
    const { name, url } = JSON.parse(clubSelect.value);

    const password = passwordInput.value.trim();
    if (!password) {
      alert("Please enter a password.");
      return;
    }

    // Disable form during login attempt
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in...";

    try {
      // Attempt login
      const loginResult = await attemptLogin(url, password);
      
      if (loginResult.success) {
        // Store profile data
        localStorage.setItem(
          "ClubProfile",
          JSON.stringify({ ClubName: name, ClubURL: url, Password: password })
        );
        
        // Navigate to next page
        goToPage("DynamicCourts.html");
      } else {
        // Show error message
        alert(loginResult.message);
      }
    } catch (error) {
      console.error("Unexpected error during login:", error);
      alert("Internet not available or Server Down");
    } finally {
      // Re-enable form
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });

  /* 4 – Reset handler -------------------------------------------------- */
  resetBtn.addEventListener("click", () => {
    localStorage.removeItem("ClubProfile");
    location.reload();
  });
});
