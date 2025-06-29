let quotes = [];
let selectedCategory = "all";

// Simulated "Server" Quotes (mock server)
let serverQuotes = [
  { text: "Be the change.", category: "Inspiration" },
  { text: "Stay humble.", category: "Character" }
];

// Load quotes from localStorage
function loadQuotes() {
  const storedQuotes = localStorage.getItem("quotes");
  if (storedQuotes) {
    quotes = JSON.parse(storedQuotes);
  } else {
    quotes = [
      { text: "Believe in yourself.", category: "Motivation" },
      { text: "Stay curious.", category: "Learning" },
      { text: "Work smart, not just hard.", category: "Productivity" }
    ];
    saveQuotes();
  }

  // Load last selected filter
  const lastFilter = localStorage.getItem("selectedCategory");
  if (lastFilter) {
    selectedCategory = lastFilter;
  }
}

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Show a random quote based on filter
function showRandomQuote() {
  const quoteDisplay = document.getElementById("quoteDisplay");
  let filteredQuotes = quotes;

  if (selectedCategory !== "all") {
    filteredQuotes = quotes.filter(q => q.category === selectedCategory);
  }

  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML = `<p>No quotes available for this category.</p>`;
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];
  quoteDisplay.innerHTML = `<p>"${quote.text}"</p><small>Category: ${quote.category}</small>`;

  sessionStorage.setItem("lastViewedQuote", JSON.stringify(quote));
}

// Add a new quote
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const newText = textInput.value.trim();
  const newCategory = categoryInput.value.trim();

  if (newText && newCategory) {
    quotes.push({ text: newText, category: newCategory });
    saveQuotes();
    populateCategories();
    textInput.value = "";
    categoryInput.value = "";
    showNotification("Quote added successfully!", "green");
  } else {
    showNotification("Please fill in both fields.", "red");
  }
}

// Create form inputs and buttons
function createAddQuoteForm() {
  const formContainer = document.getElementById("formContainer");

  const quoteInput = document.createElement("input");
  quoteInput.type = "text";
  quoteInput.id = "newQuoteText";
  quoteInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.type = "text";
  categoryInput.id = "newQuoteCategory";
  categoryInput.placeholder = "Enter quote category";

  const addButton = document.createElement("button");
  addButton.textContent = "Add Quote";
  addButton.addEventListener("click", addQuote);

  const exportBtn = document.createElement("button");
  exportBtn.textContent = "Export Quotes";
  exportBtn.id = "exportQuotesButton";
  exportBtn.onclick = exportToJsonFile;

  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.id = "importFile";
  importInput.accept = ".json";
  importInput.onchange = importFromJsonFile;

  formContainer.appendChild(quoteInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addButton);
  formContainer.appendChild(document.createElement("br"));
  formContainer.appendChild(exportBtn);
  formContainer.appendChild(importInput);
}

// Export quotes to JSON file
function exportToJsonFile() {
  const jsonString = JSON.stringify(quotes, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  link.click();
  URL.revokeObjectURL(url);
}

// Import quotes from JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        showNotification("Quotes imported successfully!", "green");
      } else {
        showNotification("Invalid JSON format.", "red");
      }
    } catch {
      showNotification("Failed to parse file.", "red");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// Populate categories into dropdown
function populateCategories() {
  const categorySet = new Set(quotes.map(q => q.category));
  const filter = document.getElementById("categoryFilter");
  filter.innerHTML = `<option value="all">All Categories</option>`;

  categorySet.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    filter.appendChild(option);
  });

  filter.value = selectedCategory;
}

// Filter quotes
function filterQuotes() {
  const filter = document.getElementById("categoryFilter");
  selectedCategory = filter.value;
  localStorage.setItem("selectedCategory", selectedCategory);
  showRandomQuote();
}

// Show notification message
function showNotification(message, color = "green") {
  const notify = document.getElementById("notification");
  notify.style.color = color;
  notify.textContent = message;
  setTimeout(() => {
    notify.textContent = "";
  }, 4000);
}

// Simulate server sync and conflict resolution
function syncWithServer() {
  console.log("🔄 Syncing with server...");
  const fetchedServerQuotes = serverQuotes;
  let hasConflict = false;

  fetchedServerQuotes.forEach((serverQuote) => {
    const exists = quotes.some(
      (localQuote) =>
        localQuote.text === serverQuote.text &&
        localQuote.category === serverQuote.category
    );

    if (!exists) {
      hasConflict = true;
      quotes.push(serverQuote);
    }
  });

  if (hasConflict) {
    saveQuotes();
    populateCategories();
    showNotification("New quotes synced from server.", "blue");
  } else {
    console.log("✅ No new updates from server.");
  }
}

// Event listeners
document.getElementById("newQuote").addEventListener("click", showRandomQuote);

// Initialize
loadQuotes();
createAddQuoteForm();
populateCategories();
showRandomQuote();
syncWithServer();
setInterval(syncWithServer, 30000); // Sync every 30s
