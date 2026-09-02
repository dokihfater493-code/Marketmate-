// =====================================
// MARKETMATE
// SUPABASE VERSION
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

// =====================================
// APP DATA
// =====================================

let currentUser = null;

let products = [];
let sales = [];
let expenses = [];
let customers = [];

let businessProfile = {
  businessName: "",
  ownerName: "",
  phone: "",
  address: ""
};

// =====================================
// AUTH
// =====================================

async function signupUser() {
  const email =
    document.getElementById("signupEmail").value.trim();

  const password =
    document.getElementById("signupPassword").value;

  const confirm =
    document.getElementById("signupConfirm").value;

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

  const { error } =
    await supabaseClient.auth.signUp({
      email,
      password
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

// =====================================

async function loginUser() {
  const email =
    document.getElementById("loginEmail").value.trim();

  const password =
    document.getElementById("loginPassword").value;

  if (!email || !password) {
    alert("Enter your email and password.");
    return;
  }

  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    alert(error.message);
    return;
  }

  currentUser = data.user;

  showApp();

  await loadAllData();
}

// =====================================

async function logoutUser() {
  const { error } =
    await supabaseClient.auth.signOut();

  if (error) {
    alert(error.message);
    return;
  }

  currentUser = null;

  products = [];
  sales = [];
  expenses = [];
  customers = [];

  businessProfile = {
    businessName: "",
    ownerName: "",
    phone: "",
    address: ""
  };

  showLogin();
}

// Keep compatibility with existing HTML
async function logout() {
  await logoutUser();
}

// =====================================

function showSignup() {
  const loginForm =
    document.getElementById("loginForm");

  const signupForm =
    document.getElementById("signupForm");

  if (loginForm) {
    loginForm.style.display = "none";
  }

  if (signupForm) {
    signupForm.style.display = "block";
  }
}

// =====================================

function showLogin() {
  const loginForm =
    document.getElementById("loginForm");

  const signupForm =
    document.getElementById("signupForm");

  if (loginForm) {
    loginForm.style.display = "block";
  }

  if (signupForm) {
    signupForm.style.display = "none";
  }
}

// =====================================

function showApp() {
  const authScreen =
    document.getElementById("authScreen");

  if (authScreen) {
    authScreen.style.display = "none";
  }
}

// =====================================
// USER CHECK
// =====================================

function requireUser() {
  if (!currentUser) {
    alert("Please log in first.");
    return false;
  }

  return true;
}

// =====================================
// DATA MAPPING
// =====================================

function mapProduct(row) {
  return {
    ...row,
    id: Number(row.id),
    name: row.name || "",
    price: Number(row.price || 0),
    stock: Number(row.stock || 0),
    lowStock: Number(row.low_stock ?? 5)
  };
}

function mapSale(row) {
  return {
    ...row,
    id: Number(row.id),
    receiptNumber: row.receipt_number,
    product: row.product,
    quantity: Number(row.quantity || 0),
    amount: Number(row.amount || 0),
    date: row.created_at
  };
}

function mapExpense(row) {
  return {
    ...row,
    id: Number(row.id),
    name: row.name,
    amount: Number(row.amount || 0),
    date: row.created_at
  };
}

// =====================================
// LOAD ALL SUPABASE DATA
// =====================================

async function loadAllData() {
  if (!currentUser) return;

  const uid = currentUser.id;

  const [
    productsResult,
    salesResult,
    expensesResult,
    customersResult,
    businessResult
  ] = await Promise.all([
    supabaseClient
      .from("products")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", {
        ascending: false
      }),

    supabaseClient
      .from("sales")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", {
        ascending: false
      }),

    supabaseClient
      .from("expenses")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", {
        ascending: false
      }),

    supabaseClient
      .from("customers")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", {
        ascending: false
      }),

    supabaseClient
      .from("businesses")
      .select("*")
      .eq("id", uid)
      .maybeSingle()
  ]);

  const results = [
    productsResult,
    salesResult,
    expensesResult,
    customersResult,
    businessResult
  ];

  const failed = results.find(
    result => result.error
  );

  if (failed) {
    console.error(failed.error);

    alert(
      "Could not load saved data: " +
      failed.error.message
    );

    return;
  }

  products =
    (productsResult.data || [])
      .map(mapProduct);

  sales =
    (salesResult.data || [])
      .map(mapSale);

  expenses =
    (expensesResult.data || [])
      .map(mapExpense);

  customers =
    customersResult.data || [];

  const business =
    businessResult.data;

  if (business) {
    businessProfile = {
      businessName:
        business.business_name || "",

      ownerName:
        business.owner_name || "",

      phone:
        business.phone || "",

      address:
        business.address || ""
    };
  } else {
    businessProfile = {
      businessName: "",
      ownerName: "",
      phone: "",
      address: ""
    };
  }

  updateDashboard();
  displayProducts();
  updateSaleProducts();
  displayCustomers();
  displayHistory();
  loadBusinessProfile();
}

// =====================================
// CHECK USER
// =====================================

async function checkUser() {
  const {
    data,
    error
  } =
    await supabaseClient.auth.getSession();

  if (error) {
    console.error(error);
    return;
  }

  if (data.session) {
    currentUser =
      data.session.user;

    showApp();

    await loadAllData();
  } else {
    currentUser = null;

    const authScreen =
      document.getElementById(
        "authScreen"
      );

    if (authScreen) {
      authScreen.style.display = "flex";
    }
  }
}

// =====================================
// AUTH STATE
// =====================================

supabaseClient.auth.onAuthStateChange(
  async (event, session) => {

    console.log(
      "Auth event:",
      event
    );

    if (
      event === "SIGNED_IN" &&
      session
    ) {
      currentUser =
        session.user;

      showApp();

      await loadAllData();
    }

    if (
      event === "SIGNED_OUT"
    ) {
      currentUser = null;

      products = [];
      sales = [];
      expenses = [];
      customers = [];

      window.location.href =
        "index.html";
    }
  }
);

// =====================================
// NAVIGATION
// =====================================

function showPage(page) {

  document
    .querySelectorAll(".page")
    .forEach(section => {
      section.classList.remove(
        "active"
      );
    });

  const selected =
    document.getElementById(page);

  if (selected) {
    selected.classList.add(
      "active"
    );
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

// =====================================

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

  firstDay.setHours(
    0, 0, 0, 0
  );

  return date >= firstDay;
}

// =====================================

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
      .filter(
        sale =>
          isToday(sale.date)
      )
      .reduce(
        (sum, sale) =>
          sum + sale.amount,
        0
      );

  const todayExpenses =
    expenses
      .filter(
        expense =>
          isToday(expense.date)
      )
      .reduce(
        (sum, expense) =>
          sum + expense.amount,
        0
      );

  const todayProfit =
    todaySales -
    todayExpenses;

  const todaySalesElement =
    document.getElementById(
      "todaySales"
    );

  if (todaySalesElement) {
    todaySalesElement.textContent =
      "₦" +
      todaySales.toLocaleString();
  }

  const todayExpensesElement =
    document.getElementById(
      "todayExpenses"
    );

  if (todayExpensesElement) {
    todayExpensesElement.textContent =
      "₦" +
      todayExpenses.toLocaleString();
  }

  const todayProfitElement =
    document.getElementById(
      "todayProfit"
    );

  if (todayProfitElement) {
    todayProfitElement.textContent =
      "₦" +
      todayProfit.toLocaleString();
  }

  const productTotal =
    document.getElementById(
      "productTotal"
    );

  if (productTotal) {
    productTotal.textContent =
      products.length;
  }

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

  if (!list) return;

  const lowStock =
    products.filter(
      product =>
        product.stock <=
        product.lowStock
    );

  if (
    lowStock.length === 0
  ) {
    list.innerHTML = `
      <div class="empty">
        ✅ All products have enough stock.
      </div>
    `;

    return;
  }

  list.innerHTML =
    lowStock
      .map(
        product => `
          <div class="product low-stock">
            <strong>
              ⚠️ ${product.name}
            </strong>

            <p>
              Only ${product.stock}
              left in stock.
            </p>
          </div>
        `
      )
      .join("");
}

// =====================================
// PRODUCTS
// =====================================

function openProductForm() {

  const modal =
    document.getElementById(
      "productModal"
    );

  if (modal) {
    modal.style.display =
      "flex";
  }
}

// =====================================

function closeProductForm() {

  const modal =
    document.getElementById(
      "productModal"
    );

  if (modal) {
    modal.style.display =
      "none";
  }
}

// =====================================

async function addProduct() {

  if (!requireUser()) return;

  const name =
    document
      .getElementById(
        "productName"
      )
      .value
      .trim();

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

  const {
    data,
    error
  } =
    await supabaseClient
      .from("products")
      .insert({
        user_id:
          currentUser.id,

        name:
          name,

        price:
          price,

        stock:
          stock,

        low_stock:
          Number.isFinite(
            lowStock
          )
            ? lowStock
            : 5
      })
      .select()
      .single();

  if (error) {

    console.error(error);

    alert(
      "Could not save product: " +
      error.message
    );

    return;
  }

  products.unshift(
    mapProduct(data)
  );

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

// =====================================

function displayProducts() {

  const list =
    document.getElementById(
      "productList"
    );

  if (!list) return;

  const search =
    document
      .getElementById(
        "productSearch"
      )
      ?.value
      .toLowerCase() || "";

  const filtered =
    products.filter(
      product =>
        product.name
          .toLowerCase()
          .includes(search)
    );

  if (
    filtered.length === 0
  ) {

    list.innerHTML = `
      <div class="empty">
        No products found.
      </div>
    `;

    return;
  }

  list.innerHTML =
    filtered
      .map(
        product => `
          <div class="product
            ${
              product.stock <=
              product.lowStock
                ? "low-stock"
                : "good-stock"
            }">

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
              product.stock <=
              product.lowStock
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
        `
      )
      .join("");
}

// =====================================

async function deleteProduct(id) {

  if (!requireUser()) return;

  if (
    !confirm(
      "Delete this product?"
    )
  ) {
    return;
  }

  const { error } =
    await supabaseClient
      .from("products")
      .delete()
      .eq("id", id)
      .eq(
        "user_id",
        currentUser.id
      );

  if (error) {

    console.error(error);

    alert(
      "Could not delete product: " +
      error.message
    );

    return;
  }

  products =
    products.filter(
      product =>
        Number(product.id) !==
        Number(id)
    );

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

  if (
    products.length === 0
  ) {

    select.innerHTML =
      `<option>
        No products available
      </option>`;

    return;
  }

  select.innerHTML =
    products
      .map(
        product => `
          <option
            value="${product.id}">
            ${product.name}
            - ₦${product.price.toLocaleString()}
            (${product.stock} left)
          </option>
        `
      )
      .join("");
}

// =====================================

async function recordSale() {

  if (!requireUser()) return;

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
        Number(p.id) ===
        productId
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

  if (
    quantity >
    product.stock
  ) {
    alert(
      "Not enough stock available."
    );

    return;
  }

  const total =
    product.price *
    quantity;

  const receiptNumber =
    "MM-" +
    Date.now();

  // Update stock first
  const {
    error: stockError
  } =
    await supabaseClient
      .from("products")
      .update({
        stock:
          product.stock -
          quantity
      })
      .eq(
        "id",
        product.id
      )
      .eq(
        "user_id",
        currentUser.id
      );

  if (stockError) {

    console.error(
      stockError
    );

    alert(
      "Could not update stock: " +
      stockError.message
    );

    return;
  }

  // Save sale
  const {
    data,
    error
  } =
    await supabaseClient
      .from("sales")
      .insert({
        user_id:
          currentUser.id,

        product:
          product.name,

        quantity:
          quantity,

        amount:
          total,

        receipt_number:
          receiptNumber
      })
      .select()
      .single();

  if (error) {

    // Restore stock
    await supabaseClient
      .from("products")
      .update({
        stock:
          product.stock
      })
      .eq(
        "id",
        product.id
      )
      .eq(
        "user_id",
        currentUser.id
      );

    console.error(error);

    alert(
      "Could not save sale: " +
      error.message
    );

    return;
  }

  product.stock -=
    quantity;

  const sale =
    mapSale(data);

  sales.unshift(sale);

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

async function recordExpense() {

  if (!requireUser()) return;

  const name =
    document
      .getElementById(
        "expenseName"
      )
      .value
      .trim();

  const amount =
    Number(
      document.getElementById(
        "expenseAmount"
      ).value
    );

  if (
    !name ||
    amount <= 0
  ) {
    alert(
      "Enter a valid expense."
    );

    return;
  }

  const {
    data,
    error
  } =
    await supabaseClient
      .from("expenses")
      .insert({
        user_id:
          currentUser.id,

        name:
          name,

        amount:
          amount
      })
      .select()
      .single();

  if (error) {

    console.error(error);

    alert(
      "Could not save expense: " +
      error.message
    );

    return;
  }

  expenses.unshift(
    mapExpense(data)
  );

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

  const modal =
    document.getElementById(
      "customerModal"
    );

  if (modal) {
    modal.style.display =
      "flex";
  }
}

// =====================================

function closeCustomerForm() {

  const modal =
    document.getElementById(
      "customerModal"
    );

  if (modal) {
    modal.style.display =
      "none";
  }
}

// =====================================

async function addCustomer() {

  if (!requireUser()) return;

  const name =
    document
      .getElementById(
        "customerName"
      )
      .value
      .trim();

  const phone =
    document
      .getElementById(
        "customerPhone"
      )
      .value
      .trim();

  if (
    !name ||
    !phone
  ) {
    alert(
      "Enter customer name and phone number."
    );

    return;
  }

  const {
    data,
    error
  } =
    await supabaseClient
      .from("customers")
      .insert({
        user_id:
          currentUser.id,

        name:
          name,

        phone:
          phone
      })
      .select()
      .single();

  if (error) {

    console.error(error);

    alert(
      "Could not save customer: " +
      error.message
    );

    return;
  }

  customers.unshift(data);

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

// =====================================

function displayCustomers() {

  const list =
    document.getElementById(
      "customerList"
    );

  if (!list) return;

  const search =
    document
      .getElementById(
        "customerSearch"
      )
      ?.value
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

  if (
    filtered.length === 0
  ) {

    list.innerHTML = `
      <div class="empty">
        No customers found.
      </div>
    `;

    return;
  }

  list.innerHTML =
    filtered
      .map(
        customer => `
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
        `
      )
      .join("");
}

// =====================================

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

async function saveBusinessProfile() {

  if (!requireUser()) return;

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

  const {
    error
  } =
    await supabaseClient
      .from("businesses")
      .upsert({
        id:
          currentUser.id,

        business_name:
          businessProfile.businessName,

        owner_name:
          businessProfile.ownerName,

        phone:
          businessProfile.phone,

        address:
          businessProfile.address
      });

  if (error) {

    console.error(error);

    alert(
      "Could not save business profile: " +
      error.message
    );

    return;
  }

  const appName =
    document.getElementById(
      "appBusinessName"
    );

  if (appName) {
    appName.textContent =
      businessProfile.businessName ||
      "MarketMate";
  }

  alert(
    "Business profile saved!"
  );
}

// =====================================

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

  if (name) {
    name.value =
      businessProfile.businessName;
  }

  if (owner) {
    owner.value =
      businessProfile.ownerName;
  }

  if (phone) {
    phone.value =
      businessProfile.phone;
  }

  if (address) {
    address.value =
      businessProfile.address;
  }

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
      type: "💰 Sale",
      text:
        `${item.product} × ${item.quantity}`,
      amount:
        Number(item.amount),
      date:
        item.date
    })),

    ...expenses.map(item => ({
      type: "💳 Expense",
      text:
        item.name,
      amount:
        Number(item.amount),
      date:
        item.date
    }))

  ];

  all.sort(
    (a, b) =>
      new Date(b.date) -
      new Date(a.date)
  );

  if (
    all.length === 0
  ) {

    list.innerHTML = `
      <div class="empty">
        No transactions yet.
      </div>
    `;

    return;
  }

  list.innerHTML =
    all
      .map(
        item => `
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
              ${new Date(
                item.date
              ).toLocaleString()}
            </small>

          </div>
        `
      )
      .join("");
}

// =====================================
// REPORTS
// =====================================

function showReport(period) {

  let salesData = [];
  let expensesData = [];

  if (
    period === "today"
  ) {

    salesData =
      sales.filter(
        sale =>
          isToday(
            sale.date
          )
      );

    expensesData =
      expenses.filter(
        expense =>
          isToday(
            expense.date
          )
      );
  }

  if (
    period === "week"
  ) {

    salesData =
      sales.filter(
        sale =>
          isThisWeek(
            sale.date
          )
      );

    expensesData =
      expenses.filter(
        expense =>
          isThisWeek(
            expense.date
          )
      );
  }

  if (
    period === "month"
  ) {

    salesData =
      sales.filter(
        sale =>
          isThisMonth(
            sale.date
          )
      );

    expensesData =
      expenses.filter(
        expense =>
          isThisMonth(
            expense.date
          )
      );
  }

  const totalSales =
    salesData.reduce(
      (sum, sale) =>
        sum +
        Number(sale.amount),
      0
    );

  const totalExpenses =
    expensesData.reduce(
      (sum, expense) =>
        sum +
        Number(expense.amount),
      0
    );

  const profit =
    totalSales -
    totalExpenses;

  const summary =
    document.getElementById(
      "reportSummary"
    );

  if (!summary) return;

  summary.innerHTML = `

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

  if (!modal) return;

  const business =
    document.getElementById(
      "receiptBusiness"
    );

  if (business) {
    business.textContent =
      businessProfile.businessName ||
      "My Business";
  }

  const address =
    document.getElementById(
      "receiptAddress"
    );

  if (address) {
    address.textContent =
      businessProfile.address ||
      "";
  }

  const phone =
    document.getElementById(
      "receiptPhone"
    );

  if (phone) {
    phone.textContent =
      businessProfile.phone ||
      "";
  }

  const receiptNumber =
    document.getElementById(
      "receiptNumber"
    );

  if (receiptNumber) {
    receiptNumber.textContent =
      sale.receiptNumber;
  }

  const receiptDate =
    document.getElementById(
      "receiptDate"
    );

  if (receiptDate) {
    receiptDate.textContent =
      new Date(
        sale.date
      ).toLocaleString();
  }

  const receiptProduct =
    document.getElementById(
      "receiptProduct"
    );

  if (receiptProduct) {
    receiptProduct.textContent =
      sale.product;
  }

  const receiptQuantity =
    document.getElementById(
      "receiptQuantity"
    );

  if (receiptQuantity) {
    receiptQuantity.textContent =
      sale.quantity;
  }

  const receiptAmount =
    document.getElementById(
      "receiptAmount"
    );

  if (receiptAmount) {
    receiptAmount.textContent =
      Number(
        sale.amount
      ).toLocaleString();
  }

  modal.style.display =
    "flex";
}

// =====================================

function closeReceipt() {

  const modal =
    document.getElementById(
      "receiptModal"
    );

  if (modal) {
    modal.style.display =
      "none";
  }
}

// =====================================

function shareReceipt() {

  const business =
    businessProfile.businessName ||
    "My Business";

  const receipt =
    document.getElementById(
      "receiptNumber"
    )?.textContent || "";

  const product =
    document.getElementById(
      "receiptProduct"
    )?.textContent || "";

  const quantity =
    document.getElementById(
      "receiptQuantity"
    )?.textContent || "";

  const amount =
    document.getElementById(
      "receiptAmount"
    )?.textContent || "";

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
// START
// =====================================

console.log(
  "MarketMate JavaScript loaded"
);

console.log(
  "Supabase loaded:",
  !!window.supabase
);

checkUser();