let quotes = [];
let selectedCategory = "all";

// Load quotes from localStorage or set default
function loadQuotes() {
  const stored = localStorage.getItem("quotes");
  quotes = stored ? JSON.parse(stored) : [
    { text: "Believe in yourself.", category: "Motivation" },
    { text: "Stay curious.", category: "Learning" },
    { text: "Work smart, not just hard.", category: "Productivity" }
  ];
  saveQuotes();

  const lastFilter = localStorage.getItem("selectedCategory");
  if (lastFilter) selectedCategory = lastFilter;
}

// Save quotes array to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Show a random quote filtered by category
function showRandomQuote() {
  const display = document.getElementById("quoteDisplay");
  const filtered = selectedCategory === "all"
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);

  if (filtered.length === 0) {
    display.innerHTML = "<p>No quotes for this category.</p>";
    return;
  }

  const random = filtered[Math.floor(Math.random() * filtered.length)];
  display.innerHTML = `<p>"${random.text}"</p><small>Category: ${random.category}</small>`;
  sessionStorage.setItem("lastViewedQuote", JSON.stringify(random));
}

// Add a new quote from user input
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();
  if (!text || !category) {
    showNotification("Please fill both fields.", "red");
    return;
  }

  const newQuote = { text, category };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  postQuoteToServer(newQuote);
  showNotification("Quote added successfully!", "green");

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}

// Create the form UI for adding quotes and import/export controls
function createAddQuoteForm() {
  const container = document.getElementById("formContainer");

  const textInput = document.createElement("input");
  textInput.type = "text";
  textInput.id = "newQuoteText";
  textInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.type = "text";
  categoryInput.id = "newQuoteCategory";
  categoryInput.placeholder = "Enter quote category";

  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Quote";
  addBtn.onclick = addQuote;

  const exportBtn = document.getElementById("exportQuotesButton");
  exportBtn.style.display = "inline-block";
  exportBtn.onclick = exportToJsonFile;

  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.accept = ".json";
  importInput.onchange = importFromJsonFile;

  container.append(textInput, categoryInput, addBtn, document.createElement("br"), exportBtn, importInput);
}

// Export quotes as a JSON file
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Import quotes from a JSON file
function importFromJsonFile(event) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        quotes.push(...imported);
        saveQuotes();
        populateCategories();
        showNotification("Quotes imported successfully!", "green");
      } else {
        throw new Error();
      }
    } catch {
      showNotification("Invalid JSON file.", "red");
    }
  };
  reader.readAsText(event.target.files[0]);
}

// Populate categories dropdown dynamically
function populateCategories() {
  const select = document.getElementById("categoryFilter");
  const categories = new Set(quotes.map(q => q.category));
  select.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
  select.value = selectedCategory;
}

// Handle category filter change
function filterQuotes() {
  selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selectedCategory);
  showRandomQuote();
}

// Show notifications for UI feedback
function showNotification(message, color = "green") {
  const note = document.getElementById("notification");
  note.style.color = color;
  note.textContent = message;
  setTimeout(() => { note.textContent = ""; }, 4000);
}

// Fetch quotes from mock server and return if new quotes were added (conflict resolution)
async function fetchQuotesFromServer() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
  const data = await res.json();
  let conflictResolved = false;

  data.forEach(item => {
    const quote = { text: item.title, category: "Server" };
    const exists = quotes.some(q => q.text === quote.text && q.category === quote.category);
    if (!exists) {
      quotes.push(quote);
      conflictResolved = true;
    }
  });

  return conflictResolved;
}

// Post a new quote to the mock server (no response handling needed)
async function postQuoteToServer(quote) {
  try {
    await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: quote.text, body: quote.category })
    });
  } catch (error) {
    console.error("Failed to post to server", error);
  }
}

// The syncQuotes function required by ALX:
// Sync with server, update local storage, resolve conflicts, show notifications
async function syncQuotes() {
  showNotification("Syncing with server...", "blue");
  try {
    const updated = await fetchQuotesFromServer();

    if (updated) {
      saveQuotes();
      populateCategories();
      showNotification("New quotes synced from server. Conflict resolved.", "green");
    } else {
      showNotification("No new quotes from server.", "gray");
    }
  } catch (error) {
    showNotification("Failed to sync with server.", "red");
  }
}

// Bootstrap app
document.getElementById("newQuote").addEventListener("click", showRandomQuote);

loadQuotes();
createAddQuoteForm();
populateCategories();
showRandomQuote();

syncQuotes();
setInterval(syncQuotes, 30000); // Periodic sync every 30 seconds
