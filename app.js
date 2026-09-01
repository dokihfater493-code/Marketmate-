// =====================================
// MARKETMATE
// COMPLETE BUSINESS MANAGEMENT APP
// =====================================
// =====================================
// MARKETMATE - SUPABASE CONNECTION
// =====================================

const SUPABASE_URL =
  "https://otyeuloadcpatrzqdgqm.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_dpHep6Xucmr8wgEN2nekLw_lZGnik0i";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

console.log("MarketMate JavaScript loaded");
console.log(
  "Supabase loaded:",
  !!window.supabase
);
// =====================================
// AUTHENTICATION
// =====================================

async function signupUser() {

  const email =
    document.getElementById("signupEmail")
      .value.trim();

  const password =
    document.getElementById("signupPassword")
      .value;

  const confirm =
    document.getElementById("signupConfirm")
      .value;


  if (!email || !password) {
    alert("Please enter your email and password.");
    return;
  }


  if (password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }


  if (password !== confirm) {
    alert("Passwords do not match.");
    return;
  }


  const { data, error } =
    await supabaseClient.auth.signUp({
      email: email,
      password: password
    });


  if (error) {
    alert(error.message);
    return;
  }


  alert(
    "Account created successfully! Check your email to confirm your account."
  );


  showLogin();
}


async function loginUser() {

  const email =
    document.getElementById("loginEmail")
      .value.trim();

  const password =
    document.getElementById("loginPassword")
      .value;


  if (!email || !password) {
    alert("Enter your email and password.");
    return;
  }


  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });


  if (error) {
    alert(error.message);
    return;
  }


  showApp();
}


async function logoutUser() {

  const { error } =
    await supabaseClient.auth.signOut();


  if (error) {
    alert(error.message);
    return;
  }


  showLogin();
}


function showSignup() {

  document.getElementById(
    "loginForm"
  ).style.display = "none";

  document.getElementById(
    "signupForm"
  ).style.display = "block";
}


function showLogin() {

  document.getElementById(
    "loginForm"
  ).style.display = "block";

  document.getElementById(
    "signupForm"
  ).style.display = "none";
}


function showApp() {

  document.getElementById(
    "authScreen"
  ).style.display = "none";
}


async function checkUser() {

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();


  if (session) {

    showApp();

  } else {

    document.getElementById(
      "authScreen"
    ).style.display = "flex";

  }
}


// Check login when app starts
checkUser();
let products =
  JSON.parse(localStorage.getItem("products")) || [];

let sales =
  JSON.parse(localStorage.getItem("sales")) || [];

let expenses =
  JSON.parse(localStorage.getItem("expenses")) || [];

let customers =
  JSON.parse(localStorage.getItem("customers")) || [];

let businessProfile =
  JSON.parse(localStorage.getItem("businessProfile")) || {
    businessName: "",
    ownerName: "",
    phone: "",
    address: ""
  };


// =====================================
// SAVE DATA
// =====================================

function saveData() {

  localStorage.setItem(
    "products",
    JSON.stringify(products)
  );

  localStorage.setItem(
    "sales",
    JSON.stringify(sales)
  );

  localStorage.setItem(
    "expenses",
    JSON.stringify(expenses)
  );

  localStorage.setItem(
    "customers",
    JSON.stringify(customers)
  );

  localStorage.setItem(
    "businessProfile",
    JSON.stringify(businessProfile)
  );
}


// =====================================
// NAVIGATION
// =====================================

function showPage(page) {

  document.querySelectorAll(".page").forEach(
    section => {
      section.classList.remove("active");
    }
  );

  const selected =
    document.getElementById(page);

  if (selected) {
    selected.classList.add("active");
  }

  updateDashboard();
  displayProducts();
  updateSaleProducts();
  displayCustomers();
  displayHistory();
  loadBusinessProfile();
}


// =====================================
// DATE HELPERS
// =====================================

function isToday(dateString) {

  const date =
    new Date(dateString);

  const today =
    new Date();

  return (
    date.toDateString() ===
    today.toDateString()
  );
}


function isThisWeek(dateString) {

  const date =
    new Date(dateString);

  const today =
    new Date();

  const firstDay =
    new Date(today);

  firstDay.setDate(
    today.getDate() -
    today.getDay()
  );

  firstDay.setHours(0,0,0,0);

  return date >= firstDay;
}


function isThisMonth(dateString) {

  const date =
    new Date(dateString);

  const today =
    new Date();

  return (
    date.getMonth() ===
    today.getMonth() &&
    date.getFullYear() ===
    today.getFullYear()
  );
}


// =====================================
// DASHBOARD
// =====================================

function updateDashboard() {

  const todaySales =
    sales
      .filter(sale => isToday(sale.date))
      .reduce(
        (sum, sale) =>
          sum + sale.amount,
        0
      );

  const todayExpenses =
    expenses
      .filter(expense => isToday(expense.date))
      .reduce(
        (sum, expense) =>
          sum + expense.amount,
        0
      );

  const todayProfit =
    todaySales -
    todayExpenses;


  document.getElementById(
    "todaySales"
  ).textContent =
    "₦" +
    todaySales.toLocaleString();


  document.getElementById(
    "todayExpenses"
  ).textContent =
    "₦" +
    todayExpenses.toLocaleString();


  document.getElementById(
    "todayProfit"
  ).textContent =
    "₦" +
    todayProfit.toLocaleString();


  document.getElementById(
    "productTotal"
  ).textContent =
    products.length;


  displayLowStock();
}


// =====================================
// LOW STOCK
// =====================================

function displayLowStock() {

  const list =
    document.getElementById(
      "lowStockList"
    );

  const lowStock =
    products.filter(
      product =>
        product.stock <=
        product.lowStock
    );


  if (lowStock.length === 0) {

    list.innerHTML = `
      <div class="empty">
        ✅ All products have enough stock.
      </div>
    `;

    return;
  }


  list.innerHTML =
    lowStock.map(product => `

      <div class="product low-stock">

        <strong>
          ⚠️ ${product.name}
        </strong>

        <p>
          Only ${product.stock}
          left in stock.
        </p>

      </div>

    `).join("");
}


// =====================================
// PRODUCTS
// =====================================

function openProductForm() {

  document.getElementById(
    "productModal"
  ).style.display = "flex";
}


function closeProductForm() {

  document.getElementById(
    "productModal"
  ).style.display = "none";
}


function addProduct() {

  const name =
    document.getElementById(
      "productName"
    ).value.trim();

  const price =
    Number(
      document.getElementById(
        "productPrice"
      ).value
    );

  const stock =
    Number(
      document.getElementById(
        "productStock"
      ).value
    );

  const lowStock =
    Number(
      document.getElementById(
        "productLowStock"
      ).value
    );


  if (
    !name ||
    price <= 0 ||
    stock < 0
  ) {

    alert(
      "Please enter valid product information."
    );

    return;
  }


  products.push({

    id:
      Date.now(),

    name:
      name,

    price:
      price,

    stock:
      stock,

    lowStock:
      lowStock >= 0
        ? lowStock
        : 5

  });


  saveData();


  document.getElementById(
    "productName"
  ).value = "";

  document.getElementById(
    "productPrice"
  ).value = "";

  document.getElementById(
    "productStock"
  ).value = "";

  document.getElementById(
    "productLowStock"
  ).value = "5";


  closeProductForm();

  displayProducts();
  updateSaleProducts();
  updateDashboard();


  alert(
    "Product added successfully!"
  );
}


function displayProducts() {

  const list =
    document.getElementById(
      "productList"
    );

  if (!list) return;


  const search =
    document.getElementById(
      "productSearch"
    )?.value
    .toLowerCase() || "";


  const filtered =
    products.filter(
      product =>
        product.name
          .toLowerCase()
          .includes(search)
    );


  if (filtered.length === 0) {

    list.innerHTML = `
      <div class="empty">
        No products found.
      </div>
    `;

    return;
  }


  list.innerHTML =
    filtered.map(product => `

      <div class="product
        ${product.stock <= product.lowStock
          ? "low-stock"
          : "good-stock"}">

        <strong>
          ${product.name}
        </strong>

        <p>
          Price:
          ₦${product.price.toLocaleString()}
        </p>

        <p>
          Stock:
          ${product.stock}
        </p>

        ${
          product.stock <= product.lowStock
            ? `
              <p class="danger">
                ⚠️ Low stock
              </p>
            `
            : ""
        }

        <button
          class="secondary"
          onclick="deleteProduct(${product.id})">

          Delete

        </button>

      </div>

    `).join("");
}


function deleteProduct(id) {

  const confirmDelete =
    confirm(
      "Delete this product?"
    );

  if (!confirmDelete) return;


  products =
    products.filter(
      product =>
        product.id !== id
    );


  saveData();

  displayProducts();
  updateSaleProducts();
  updateDashboard();
}


// =====================================
// SALES
// =====================================

function updateSaleProducts() {

  const select =
    document.getElementById(
      "saleProduct"
    );

  if (!select) return;


  if (products.length === 0) {

    select.innerHTML =
      `<option>
        No products available
      </option>`;

    return;
  }


  select.innerHTML =
    products.map(product => `

      <option value="${product.id}">

        ${product.name}
        - ₦${product.price.toLocaleString()}
        (${product.stock} left)

      </option>

    `).join("");
}


function recordSale() {

  const productId =
    Number(
      document.getElementById(
        "saleProduct"
      ).value
    );

  const quantity =
    Number(
      document.getElementById(
        "saleQuantity"
      ).value
    );


  const product =
    products.find(
      p =>
        p.id === productId
    );


  if (!product) {

    alert(
      "Please add a product first."
    );

    return;
  }


  if (quantity <= 0) {

    alert(
      "Enter a valid quantity."
    );

    return;
  }


  if (quantity > product.stock) {

    alert(
      "Not enough stock available."
    );

    return;
  }


  const total =
    product.price *
    quantity;


  product.stock -=
    quantity;


  const sale = {

    id:
      Date.now(),

    receiptNumber:
      "MM-" +
      Date.now(),

    product:
      product.name,

    quantity:
      quantity,

    amount:
      total,

    date:
      new Date().toISOString()

  };


  sales.push(sale);

  saveData();


  document.getElementById(
    "saleQuantity"
  ).value = "";


  updateDashboard();
  displayProducts();
  updateSaleProducts();
  displayHistory();


  showReceipt(sale);
}


// =====================================
// EXPENSES
// =====================================

function recordExpense() {

  const name =
    document.getElementById(
      "expenseName"
    ).value.trim();

  const amount =
    Number(
      document.getElementById(
        "expenseAmount"
      ).value
    );


  if (!name || amount <= 0) {

    alert(
      "Enter a valid expense."
    );

    return;
  }


  expenses.push({

    id:
      Date.now(),

    name:
      name,

    amount:
      amount,

    date:
      new Date().toISOString()

  });


  saveData();


  document.getElementById(
    "expenseName"
  ).value = "";


  document.getElementById(
    "expenseAmount"
  ).value = "";


  updateDashboard();
  displayHistory();


  alert(
    "Expense saved successfully!"
  );
}


// =====================================
// CUSTOMERS
// =====================================

function openCustomerForm() {

  document.getElementById(
    "customerModal"
  ).style.display = "flex";
}


function closeCustomerForm() {

  document.getElementById(
    "customerModal"
  ).style.display = "none";
}


function addCustomer() {

  const name =
    document.getElementById(
      "customerName"
    ).value.trim();

  const phone =
    document.getElementById(
      "customerPhone"
    ).value.trim();


  if (!name || !phone) {

    alert(
      "Enter customer name and phone number."
    );

    return;
  }


  customers.push({

    id:
      Date.now(),

    name:
      name,

    phone:
      phone

  });


  saveData();


  document.getElementById(
    "customerName"
  ).value = "";

  document.getElementById(
    "customerPhone"
  ).value = "";


  closeCustomerForm();

  displayCustomers();


  alert(
    "Customer added successfully!"
  );
}


function displayCustomers() {

  const list =
    document.getElementById(
      "customerList"
    );

  if (!list) return;


  const search =
    document.getElementById(
      "customerSearch"
    )?.value
    .toLowerCase() || "";


  const filtered =
    customers.filter(
      customer =>
        customer.name
          .toLowerCase()
          .includes(search) ||
        customer.phone
          .includes(search)
    );


  if (filtered.length === 0) {

    list.innerHTML = `
      <div class="empty">
        No customers found.
      </div>
    `;

    return;
  }


  list.innerHTML =
    filtered.map(customer => `

      <div class="customer">

        <strong>
          ${customer.name}
        </strong>

        <p>
          📞 ${customer.phone}
        </p>

        <button
          class="secondary"
          onclick="messageCustomer('${customer.phone}')">

          📲 WhatsApp

        </button>

      </div>

    `).join("");
}


function messageCustomer(phone) {

  const message =
    encodeURIComponent(
      "Hello! Thank you for doing business with us."
    );


  window.open(
    "https://wa.me/" +
    phone +
    "?text=" +
    message,

    "_blank"
  );
}


// =====================================
// BUSINESS PROFILE
// =====================================

function saveBusinessProfile() {

  businessProfile = {

    businessName:
      document.getElementById(
        "businessName"
      ).value.trim(),

    ownerName:
      document.getElementById(
        "ownerName"
      ).value.trim(),

    phone:
      document.getElementById(
        "businessPhone"
      ).value.trim(),

    address:
      document.getElementById(
        "businessAddress"
      ).value.trim()

  };


  saveData();


  document.getElementById(
    "appBusinessName"
  ).textContent =
    businessProfile.businessName ||
    "MarketMate";


  alert(
    "Business profile saved!"
  );
}


function loadBusinessProfile() {

  const name =
    document.getElementById(
      "businessName"
    );

  const owner =
    document.getElementById(
      "ownerName"
    );

  const phone =
    document.getElementById(
      "businessPhone"
    );

  const address =
    document.getElementById(
      "businessAddress"
    );


  if (name)
    name.value =
      businessProfile.businessName;


  if (owner)
    owner.value =
      businessProfile.ownerName;


  if (phone)
    phone.value =
      businessProfile.phone;


  if (address)
    address.value =
      businessProfile.address;


  const appName =
    document.getElementById(
      "appBusinessName"
    );


  if (appName) {

    appName.textContent =
      businessProfile.businessName ||
      "MarketMate";

  }
}


// =====================================
// HISTORY
// =====================================

function displayHistory() {

  const list =
    document.getElementById(
      "historyList"
    );

  if (!list) return;


  const all = [

    ...sales.map(item => ({

      type:
        "💰 Sale",

      text:
        `${item.product} × ${item.quantity}`,

      amount:
        item.amount,

      date:
        item.date

    })),

    ...expenses.map(item => ({

      type:
        "💳 Expense",

      text:
        item.name,

      amount:
        item.amount,

      date:
        item.date

    }))

  ];


  all.sort(
    (a,b) =>
      new Date(b.date) -
      new Date(a.date)
  );


  if (all.length === 0) {

    list.innerHTML = `
      <div class="empty">
        No transactions yet.
      </div>
    `;

    return;
  }


  list.innerHTML =
    all.map(item => `

      <div class="transaction">

        <strong>
          ${item.type}
        </strong>

        <p>
          ${item.text}
        </p>

        <p>
          ₦${item.amount.toLocaleString()}
        </p>

        <small>
          ${new Date(item.date).toLocaleString()}
        </small>

      </div>

    `).join("");
}


// =====================================
// REPORTS
// =====================================

function showReport(period) {

  let salesData = [];
  let expensesData = [];


  if (period === "today") {

    salesData =
      sales.filter(
        sale =>
          isToday(sale.date)
      );

    expensesData =
      expenses.filter(
        expense =>
          isToday(expense.date)
      );

  }


  if (period === "week") {

    salesData =
      sales.filter(
        sale =>
          isThisWeek(sale.date)
      );

    expensesData =
      expenses.filter(
        expense =>
          isThisWeek(expense.date)
      );

  }


  if (period === "month") {

    salesData =
      sales.filter(
        sale =>
          isThisMonth(sale.date)
      );

    expensesData =
      expenses.filter(
        expense =>
          isThisMonth(expense.date)
      );

  }


  const totalSales =
    salesData.reduce(
      (sum, sale) =>
        sum + sale.amount,
      0
    );


  const totalExpenses =
    expensesData.reduce(
      (sum, expense) =>
        sum + expense.amount,
      0
    );


  const profit =
    totalSales -
    totalExpenses;


  document.getElementById(
    "reportSummary"
  ).innerHTML = `

    <div class="summary-row">
      <span>Sales</span>
      <strong>
        ₦${totalSales.toLocaleString()}
      </strong>
    </div>

    <div class="summary-row">
      <span>Expenses</span>
      <strong>
        ₦${totalExpenses.toLocaleString()}
      </strong>
    </div>

    <div class="summary-row">
      <span>Profit</span>
      <strong>
        ₦${profit.toLocaleString()}
      </strong>
    </div>

  `;
}


// =====================================
// RECEIPTS
// =====================================

function showReceipt(sale) {

  const modal =
    document.getElementById(
      "receiptModal"
    );


  document.getElementById(
    "receiptBusiness"
  ).textContent =
    businessProfile.businessName ||
    "My Business";


  document.getElementById(
    "receiptAddress"
  ).textContent =
    businessProfile.address ||
    "";


  document.getElementById(
    "receiptPhone"
  ).textContent =
    businessProfile.phone ||
    "";


  document.getElementById(
    "receiptNumber"
  ).textContent =
    sale.receiptNumber;


  document.getElementById(
    "receiptDate"
  ).textContent =
    new Date(
      sale.date
    ).toLocaleString();


  document.getElementById(
    "receiptProduct"
  ).textContent =
    sale.product;


  document.getElementById(
    "receiptQuantity"
  ).textContent =
    sale.quantity;


  document.getElementById(
    "receiptAmount"
  ).textContent =
    sale.amount.toLocaleString();


  modal.style.display =
    "flex";
}


function closeReceipt() {

  document.getElementById(
    "receiptModal"
  ).style.display =
    "none";
}


function shareReceipt() {

  const business =
    businessProfile.businessName ||
    "My Business";


  const receipt =
    document.getElementById(
      "receiptNumber"
    ).textContent;


  const product =
    document.getElementById(
      "receiptProduct"
    ).textContent;


  const quantity =
    document.getElementById(
      "receiptQuantity"
    ).textContent;


  const amount =
    document.getElementById(
      "receiptAmount"
    ).textContent;


  const message =

`🧾 ${business}

Receipt: ${receipt}

Product: ${product}
Quantity: ${quantity}

Total: ₦${amount}

Thank you for your business! 🙏`;


  window.open(
    "https://wa.me/?text=" +
    encodeURIComponent(message),
    "_blank"
  );
}


// =====================================
// START APP
// =====================================

updateDashboard();

displayProducts();

updateSaleProducts();

displayCustomers();

displayHistory();

loadBusinessProfile();