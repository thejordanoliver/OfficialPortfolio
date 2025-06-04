const darkLightButton = document.getElementById("darkLightModeButton");
const moonIcon = document.querySelector(".environment-moon");
const baseAssetPath = "./assets";

// Helper: Update icon based on theme
function updateIcon(theme) {
  moonIcon.src = `${baseAssetPath}/Dark/Environment/${
    theme === "dark" ? "Sun" : "Moon"
  }.svg`;
}

// Helper: Show copy confirmation message
function showCopyMessage(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.className = "copy-toast"; // You need to style this in CSS
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2000);
}

// Theme toggle logic
function toggleTheme() {
  const isDarkMode = document.body.classList.toggle("dark-mode");
  const newTheme = isDarkMode ? "dark" : "light";
  localStorage.setItem("theme", newTheme);
  updateIcon(newTheme);
}

// Initialize theme on page load
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  }
  updateIcon(savedTheme);
});

// Event listeners
darkLightButton.addEventListener("click", toggleTheme);

document.querySelectorAll(".copybutton").forEach((button) => {
  button.addEventListener("click", () => {
    const textToCopy = button.getAttribute("data-copy-text");
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        showCopyMessage(`Copied: ${textToCopy}`);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const downloadBtn = document.getElementById("downloadResumeBtn");
  const toast = document.getElementById("toast");
  const resumeLink = document.getElementById("resumeLink");

  downloadBtn.addEventListener("click", () => {
    // Trigger resume download
    resumeLink.click();

    // Show toast
    showToast("Resume downloaded!");
  });

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }
});

var typingEffect = new Typed(".multiText", {
  strings: ["Designer", "Developer"],
  loop: true,
  backDelay: 500,
  backSpeed: 80,
  typeSpeed: 100,
});

const btn = document.querySelector(".burger");
const menu = document.querySelector(".nav-menu");

btn.addEventListener("click", () => {
  btn.classList.toggle("change");
  menu.classList.toggle("is-active");
});
