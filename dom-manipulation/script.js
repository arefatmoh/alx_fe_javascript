let quotes = [];
let selectedCategory = "all";

// Load from localStorage
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

// Save to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Show random quote
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

// Add quote
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

// Create form UI
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

// Export quotes
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Import quotes
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

// Populate categories
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

// Filter quotes
function filterQuotes() {
  selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selectedCategory);
  showRandomQuote();
}

// Notification UI
function showNotification(message, color = "green") {
  const note = document.getElementById("notification");
  note.style.color = color;
  note.textContent = message;
  setTimeout(() => { note.textContent = ""; }, 4000);
}

// Fetch quotes from server (mock API) and update local storage with conflict resolution
async function fetchQuotesFromServer() {
  try {
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

    if (conflictResolved) {
      saveQuotes();
      populateCategories();
      showNotification("New quotes synced from server. Conflict resolved.", "blue");
    } else {
      showNotification("No new quotes from server.", "gray");
    }
  } catch (error) {
    showNotification("Failed to fetch from server.", "red");
  }
}

// Post new quote to mock API
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

// Bootstrap
document.getElementById("newQuote").addEventListener("click", showRandomQuote);

loadQuotes();
createAddQuoteForm();
populateCategories();
showRandomQuote();

// Periodically check for new quotes from the server
setInterval(fetchQuotesFromServer, 30000); // every 30 seconds
