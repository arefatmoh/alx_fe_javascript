/* ---------------------------  Globals & Storage  -------------------------- */
let quotes = [];
let selectedCategory = "all";

/* ------------------------- 1️⃣  Local‑Storage CRUD ------------------------- */
const LS_QUOTES          = "quotes";
const LS_SELECTED_FILTER = "selectedCategory";

function loadQuotes() {
  const stored = localStorage.getItem(LS_QUOTES);
  quotes = stored ? JSON.parse(stored) : [
    { text: "Believe in yourself.",       category: "Motivation"  },
    { text: "Stay curious.",              category: "Learning"    },
    { text: "Work smart, not just hard.", category: "Productivity"}
  ];
  saveQuotes();

  const last = localStorage.getItem(LS_SELECTED_FILTER);
  if (last) selectedCategory = last;
}
function saveQuotes() {
  localStorage.setItem(LS_QUOTES, JSON.stringify(quotes));
}

/* ------------------- 2️⃣  Mock‑Server API (using JSONPlaceholder) --------- */
/* GET = fetchQuotesFromServer  |  POST = postQuoteToServer                  */
async function fetchQuotesFromServer() {
  const res  = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
  const data = await res.json();  // [{id, title, body, …}, …]
  return data.map(p => ({ text: p.title, category: "Server" }));
}
async function postQuoteToServer(quoteObj) {
  await fetch("https://jsonplaceholder.typicode.com/posts", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify({ title: quoteObj.text, body: quoteObj.category })
  });
}

/* -------------------- 3️⃣  Sync & Conflict‑Resolution --------------------- */
async function syncQuotes() {
  showNotification("Syncing with server…", "blue");
  try {
    const serverQuotes = await fetchQuotesFromServer();
    let merged = false;

    serverQuotes.forEach(sq => {
      const exists = quotes.some(lq =>
        lq.text === sq.text && lq.category === sq.category);
      if (!exists) { quotes.push(sq); merged = true; }
    });

    if (merged) {
      saveQuotes();
      populateCategories();
      showNotification("New quotes merged from server.", "green");
    } else {
      showNotification("No new quotes on server.", "gray");
    }
  } catch (e) {
    showNotification("Server unreachable – working offline.", "red");
  }
}

/* ------------------------- 4️⃣  UI Notifications -------------------------- */
function showNotification(msg, color="green") {
  const n = document.getElementById("notification");
  n.style.color = color;
  n.textContent = msg;
  setTimeout(() => (n.textContent = ""), 4000);
}

/* ------------------------- 5️⃣  Quote Display Logic ----------------------- */
function showRandomQuote() {
  const box  = document.getElementById("quoteDisplay");
  const pool = selectedCategory === "all"
             ? quotes
             : quotes.filter(q => q.category === selectedCategory);

  if (!pool.length) { box.innerHTML = "<p>No quotes for this category.</p>"; return; }

  const q = pool[Math.floor(Math.random()*pool.length)];
  box.innerHTML = `<p>"${q.text}"</p><small>Category: ${q.category}</small>`;
  sessionStorage.setItem("lastViewedQuote", JSON.stringify(q));
}

/* ------------------------- 6️⃣  Adding New Quotes ------------------------- */
function addQuote() {
  const txt = document.getElementById("newQuoteText").value.trim();
  const cat = document.getElementById("newQuoteCategory").value.trim();
  if (!txt || !cat) return showNotification("Fill both fields.", "red");

  const newQ = { text: txt, category: cat };
  quotes.push(newQ);
  saveQuotes();              // local
  postQuoteToServer(newQ);   // server (POST)
  populateCategories();      // new category maybe
  showNotification("Quote added & synced!", "green");

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}

/* ---------------------- 7️⃣  Export & Import (JSON) ----------------------- */
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes,null,2)], {type:"application/json"});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "quotes.json"; a.click();
  URL.revokeObjectURL(url);
}
function importFromJsonFile(e) {
  const reader = new FileReader();
  reader.onload = evt => {
    try {
      const arr = JSON.parse(evt.target.result);
      if (!Array.isArray(arr)) throw 0;
      quotes.push(...arr);
      saveQuotes(); populateCategories();
      showNotification("Quotes imported!", "green");
    } catch { showNotification("Bad JSON file.", "red"); }
  };
  reader.readAsText(e.target.files[0]);
}

/* ------------------------- 8️⃣  Category Dropdown ------------------------- */
function populateCategories() {
  const sel = document.getElementById("categoryFilter");
  const cats = new Set(quotes.map(q => q.category));
  sel.innerHTML = '<option value="all">All Categories</option>';
  cats.forEach(c => {
    const o = document.createElement("option");
    o.value = c; o.textContent = c; sel.appendChild(o);
  });
  sel.value = selectedCategory;
}
function filterQuotes() {
  selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem(LS_SELECTED_
