/* =====================================================
   MARKETMATE
   CLEAN SUPABASE VERSION
===================================================== */

const SUPABASE_URL =
  "https://otyeuloadcpatrzqdgqm.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_dpHep6Xucmr8wgEN2nekLw_lZGnik0i";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =====================================================
   STATE
===================================================== */

let currentUser = null;

let products = [];
let sales = [];
let expenses = [];
let customers = [];

let posCart = [];

let businessProfile = {
  businessName: "",
  ownerName: "",
  phone: "",
  address: ""
};


/* =====================================================
   HELPERS
===================================================== */

function money(value) {
  return "₦" + Number(value || 0).toLocaleString("en-NG");
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function isToday(value) {
  const date = new Date(value);
  const today = new Date();

  return date.toDateString() === today.toDateString();
}

function isThisWeek(value) {
  const date = new Date(value);
  const today = new Date();

  const firstDay = new Date(today);

  firstDay.setDate(
    today.getDate() - today.getDay()
  );

  firstDay.setHours(0, 0, 0, 0);

  return date >= firstDay && date <= today;
}

function isThisMonth(value) {
  const date = new Date(value);
  const today = new Date();

  return (
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function requireUser() {
  if (!currentUser) {
    alert("Please log in first.");
    return false;
  }

  return true;
}


/* =====================================================
   AUTH
===================================================== */

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

  const { data, error } =
    await supabaseClient.auth.signUp({
      email,
      password
    });

  if (error) {
    alert(error.message);
    return;
  }

  if (data.session) {
    currentUser = data.user;
    showApp();
    await loadAllData();
  } else {
    alert(
      "Account created successfully. Check your email to confirm your account."
    );

    showLogin();
  }
}


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
  posCart = [];

  businessProfile = {
    businessName: "",
    ownerName: "",
    phone: "",
    address: ""
  };

  showLogin();
}

async function logout() {
  await logoutUser();
}


function showSignup() {

  document
    .getElementById("loginForm")
    .classList.add("hidden");

  document
    .getElementById("signupForm")
    .classList.remove("hidden");
}


function showLogin() {

  document
    .getElementById("signupForm")
    .classList.add("hidden");

  document
    .getElementById("loginForm")
    .classList.remove("hidden");
}


function showApp() {

  document
    .getElementById("authScreen")
    .classList.add("hidden");

  document
    .getElementById("appShell")
    .classList.remove("hidden");
}


/* =====================================================
   DATA MAPPING
===================================================== */

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
    receiptNumber: row.receipt_number || "",
    product: row.product || "",
    quantity: Number(row.quantity || 0),
    amount: Number(row.amount || 0),
    date: row.created_at
  };
}


function mapExpense(row) {

  return {
    ...row,
    id: Number(row.id),
    name: row.name || "",
    amount: Number(row.amount || 0),
    date: row.created_at
  };
}


/* =====================================================
   LOAD DATA
===================================================== */

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
      .order("created_at", { ascending: false }),

    supabaseClient
      .from("sales")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false }),

    supabaseClient
      .from("expenses")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false }),

    supabaseClient
      .from("customers")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false }),

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
  displayPOSProducts();
  renderPOSCart();
  displayCustomers();
  displayHistory();
  loadBusinessProfile();
}


/* =====================================================
   SESSION
===================================================== */

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

    document
      .getElementById("authScreen")
      .classList.remove("hidden");

    document
      .getElementById("appShell")
      .classList.add("hidden");
  }
}


supabaseClient.auth.onAuthStateChange(
  (event, session) => {

    if (event === "SIGNED_IN" && session) {

      currentUser =
        session.user;

      showApp();

      setTimeout(
        () => loadAllData(),
        0
      );
    }

    if (event === "SIGNED_OUT") {

      currentUser = null;

      products = [];
      sales = [];
      expenses = [];
      customers = [];
      posCart = [];

      document
        .getElementById("authScreen")
        .classList.remove("hidden");

      document
        .getElementById("appShell")
        .classList.add("hidden");
    }

  }
);


/* =====================================================
   NAVIGATION
===================================================== */

function showPage(page) {

  document
    .querySelectorAll(".page")
    .forEach(section => {
      section.classList.remove("active");
    });

  const selected =
    document.getElementById(page);

  if (selected) {
    selected.classList.add("active");
  }

  document
    .querySelectorAll(".nav-item, .mobile-nav button")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page === page
      );

    });

  updateDashboard();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =====================================================
   DASHBOARD
===================================================== */

function updateDashboard() {

  const todaySales =
    sales
      .filter(sale => isToday(sale.date))
      .reduce(
        (total, sale) =>
          total + Number(sale.amount || 0),
        0
      );

  const todayExpenses =
    expenses
      .filter(expense => isToday(expense.date))
      .reduce(
        (total, expense) =>
          total + Number(expense.amount || 0),
        0
      );

  const profit =
    todaySales - todayExpenses;

  document.getElementById(
    "todaySales"
  ).textContent = money(todaySales);

  document.getElementById(
    "todayExpenses"
  ).textContent = money(todayExpenses);

  document.getElementById(
    "todayProfit"
  ).textContent = money(profit);

  document.getElementById(
    "productTotal"
  ).textContent = products.length;

  const name =
    businessProfile.businessName ||
    "MarketMate";

  document.getElementById(
    "appBusinessName"
  ).textContent = name;

  displayLowStock();
}


function displayLowStock() {

  const list =
    document.getElementById("lowStockList");

  if (!list) return;

  const lowStock =
    products.filter(
      product =>
        Number(product.stock) <=
        Number(product.lowStock)
    );

  if (!lowStock.length) {

    list.innerHTML = `
      <div class="empty">
        <strong>✓ Inventory looks good</strong>
        <p>No products are currently low in stock.</p>
      </div>
    `;

    return;
  }

  list.innerHTML =
    lowStock.map(product => `
      <div class="low-stock-item">
        <div>
          <strong>${escapeHTML(product.name)}</strong>
          <p>
            Only ${Number(product.stock)} left in stock.
          </p>
        </div>

        <span>Low stock</span>
      </div>
    `).join("");
}


/* =====================================================
   PRODUCTS
===================================================== */

function openProductForm() {

  const modal =
    document.getElementById("productModal");

  modal.classList.remove("hidden");
}


function closeProductForm() {

  const modal =
    document.getElementById("productModal");

  modal.classList.add("hidden");
}


async function addProduct() {

  if (!requireUser()) return;

  const name =
    document.getElementById("productName")
      .value.trim();

  const price =
    Number(
      document.getElementById("productPrice")
        .value
    );

  const stock =
    Number(
      document.getElementById("productStock")
        .value
    );

  const lowStock =
    Number(
      document.getElementById("productLowStock")
        .value || 5
    );

  if (!name) {
    alert("Enter product name.");
    return;
  }

  if (price < 0 || !Number.isFinite(price)) {
    alert("Enter a valid price.");
    return;
  }

  if (stock < 0 || !Number.isFinite(stock)) {
    alert("Enter a valid stock quantity.");
    return;
  }

  const {
    data,
    error
  } =
    await supabaseClient
      .from("products")
      .insert({
        user_id: currentUser.id,
        name,
        price,
        stock,
        low_stock: lowStock
      })
      .select()
      .single();

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  products.unshift(
    mapProduct(data)
  );

  document.getElementById("productName").value = "";
  document.getElementById("productPrice").value = "";
  document.getElementById("productStock").value = "";
  document.getElementById("productLowStock").value = "5";

  closeProductForm();

  displayProducts();
  displayPOSProducts();
  updateDashboard();
}


function displayProducts() {

  const list =
    document.getElementById("productList");

  if (!list) return;

  const search =
    (
      document.getElementById("productSearch")
        ?.value || ""
    ).toLowerCase();

  const filtered =
    products.filter(
      product =>
        product.name
          .toLowerCase()
          .includes(search)
    );

  if (!filtered.length) {

    list.innerHTML = `
      <div class="empty">
        <h3>No products found</h3>
        <p>Add your first product to start managing inventory.</p>
      </div>
    `;

    return;
  }

  list.innerHTML =
    filtered.map(product => {

      const low =
        Number(product.stock) <=
        Number(product.lowStock);

      return `
        <div class="product-row">

          <div>
            <h3>${escapeHTML(product.name)}</h3>

            <div class="product-meta">
              <span>
                Price: <strong>${money(product.price)}</strong>
              </span>

              <span class="${low ? "stock-low" : "stock-good"}">
                Stock: ${product.stock}
              </span>

              ${low ? "<span class='stock-low'>Low stock</span>" : ""}
            </div>
          </div>

          <div class="product-actions">
            <button
              class="secondary"
              onclick="deleteProduct(${product.id})">
              Delete
            </button>
          </div>

        </div>
      `;
    }).join("");
}


async function deleteProduct(id) {

  if (!requireUser()) return;

  const product =
    products.find(
      item => Number(item.id) === Number(id)
    );

  if (!product) return;

  if (
    !confirm(
      `Delete ${product.name}?`
    )
  ) {
    return;
  }

  const { error } =
    await supabaseClient
      .from("products")
      .delete()
      .eq("id", id)
      .eq("user_id", currentUser.id);

  if (error) {
    alert(error.message);
    return;
  }

  products =
    products.filter(
      item =>
        Number(item.id) !== Number(id)
    );

  posCart =
    posCart.filter(
      item =>
        Number(item.productId) !== Number(id)
    );

  displayProducts();
  displayPOSProducts();
  renderPOSCart();
  updateDashboard();
}


/* =====================================================
   POS
===================================================== */

function displayPOSProducts() {

  const grid =
    document.getElementById(
      "posProductGrid"
    );

  if (!grid) return;

  const search =
    (
      document.getElementById("posSearch")
        ?.value || ""
    ).toLowerCase();

  const filtered =
    products.filter(
      product =>
        product.name
          .toLowerCase()
          .includes(search)
    );

  if (!filtered.length) {

    grid.innerHTML = `
      <div class="empty">
        <h3>No products available</h3>
        <p>Add products to begin selling.</p>
      </div>
    `;

    return;
  }

  grid.innerHTML =
    filtered.map(product => {

      const outOfStock =
        Number(product.stock) <= 0;

      return `
        <button
          class="pos-product"
          ${outOfStock ? "disabled" : ""}
          onclick="addToPOSCart(${product.id})">

          <span class="pos-product-name">
            ${escapeHTML(product.name)}
          </span>

          <span class="pos-product-price">
            ${money(product.price)}
          </span>

          <small>
            ${
              outOfStock
                ? "Out of stock"
                : `${product.stock} available`
            }
          </small>

        </button>
      `;
    }).join("");
}


function addToPOSCart(id) {

  const product =
    products.find(
      item =>
        Number(item.id) === Number(id)
    );

  if (!product) return;

  if (Number(product.stock) <= 0) {
    alert("This product is out of stock.");
    return;
  }

  const existing =
    posCart.find(
      item =>
        Number(item.productId) ===
        Number(id)
    );

  if (existing) {

    if (
      existing.quantity >=
      Number(product.stock)
    ) {
      alert(
        "You cannot add more than the available stock."
      );

      return;
    }

    existing.quantity += 1;

  } else {

    posCart.push({
      productId: product.id,
      quantity: 1
    });

  }

  renderPOSCart();
}


function renderPOSCart() {

  const cart =
    document.getElementById("posCart");

  const totalElement =
    document.getElementById("posTotal");

  if (!cart) return;

  if (!posCart.length) {

    cart.innerHTML = `
      <div class="empty">
        🛒 Your cart is empty.
      </div>
    `;

    totalElement.textContent = "₦0";

    return;
  }

  let total = 0;

  cart.innerHTML =
    posCart.map(item => {

      const product =
        products.find(
          p =>
            Number(p.id) ===
            Number(item.productId)
        );

      if (!product) return "";

      const subtotal =
        Number(product.price) *
        Number(item.quantity);

      total += subtotal;

      return `
        <div class="cart-item">

          <div class="cart-product">
            <strong>
              ${escapeHTML(product.name)}
            </strong>

            <small>
              ${money(product.price)} each
            </small>
          </div>

          <div class="cart-controls">

            <button
              type="button"
              onclick="changePOSQuantity(${product.id}, -1)">
              −
            </button>

            <strong>${item.quantity}</strong>

            <button
              type="button"
              onclick="changePOSQuantity(${product.id}, 1)">
              +
            </button>

          </div>

        </div>
      `;
    }).join("");

  totalElement.textContent =
    money(total);
}


function changePOSQuantity(id, change) {

  const item =
    posCart.find(
      cartItem =>
        Number(cartItem.productId) ===
        Number(id)
    );

  const product =
    products.find(
      p =>
        Number(p.id) ===
        Number(id)
    );

  if (!item || !product) return;

  item.quantity += change;

  if (item.quantity <= 0) {

    posCart =
      posCart.filter(
        cartItem =>
          Number(cartItem.productId) !==
          Number(id)
      );

  } else if (
    item.quantity >
    Number(product.stock)
  ) {

    item.quantity =
      Number(product.stock);

    alert(
      "You cannot sell more than the available stock."
    );
  }

  renderPOSCart();
}


function clearPOSCart() {

  if (!posCart.length) return;

  if (
    confirm("Clear all items from the cart?")
  ) {
    posCart = [];
    renderPOSCart();
  }
}


/* =====================================================
   CHECKOUT
===================================================== */

async function checkoutPOS() {

  if (!requireUser()) return;

  if (!posCart.length) {
    alert("Your cart is empty.");
    return;
  }

  const receiptNumber =
    "MM-" +
    Date.now();

  const completedSales = [];

  for (const item of posCart) {

    const product =
      products.find(
        p =>
          Number(p.id) ===
          Number(item.productId)
      );

    if (!product) continue;

    if (
      Number(item.quantity) >
      Number(product.stock)
    ) {
      alert(
        `${product.name} does not have enough stock.`
      );

      return;
    }

  }


  for (const item of posCart) {

    const product =
      products.find(
        p =>
          Number(p.id) ===
          Number(item.productId)
      );

    if (!product) continue;

    const total =
      Number(product.price) *
      Number(item.quantity);

    const {
      data,
      error
    } =
      await supabaseClient
        .from("sales")
        .insert({
          user_id: currentUser.id,
          product: product.name,
          quantity: item.quantity,
          amount: total,
          receipt_number: receiptNumber
        })
        .select()
        .single();

    if (error) {

      console.error(error);

      alert(
        "Could not save sale: " +
        error.message
      );

      return;
    }

    const {
      error: stockError
    } =
      await supabaseClient
        .from("products")
        .update({
          stock:
            Number(product.stock) -
            Number(item.quantity)
        })
        .eq("id", product.id)
        .eq("user_id", currentUser.id);

    if (stockError) {

      alert(
        "Sale saved but stock could not be updated: " +
        stockError.message
      );

      return;
    }

    product.stock -=
      Number(item.quantity);

    completedSales.push(
      mapSale(data)
    );

  }


  sales.unshift(
    ...completedSales
  );

  const receiptSale =
    completedSales[0];

  posCart = [];

  renderPOSCart();
  displayPOSProducts();
  displayProducts();
  updateDashboard();
  displayHistory();

  showReceipt(receiptSale);
}


/* =====================================================
   OLD SALE COMPATIBILITY
===================================================== */

function updateSaleProducts() {
  /* Kept for compatibility with older HTML. */
}

async function recordSale() {
  await checkoutPOS();
}


/* =====================================================
   EXPENSES
===================================================== */

async function recordExpense() {

  if (!requireUser()) return;

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
    alert("Enter a valid expense.");
    return;
  }

  const {
    data,
    error
  } =
    await supabaseClient
      .from("expenses")
      .insert({
        user_id: currentUser.id,
        name,
        amount
      })
      .select()
      .single();

  if (error) {
    alert(error.message);
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

  alert("Expense saved successfully.");
}


/* =====================================================
   CUSTOMERS
===================================================== */

function openCustomerForm() {

  document
    .getElementById("customerModal")
    .classList.remove("hidden");
}


function closeCustomerForm() {

  document
    .getElementById("customerModal")
    .classList.add("hidden");
}


async function addCustomer() {

  if (!requireUser()) return;

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

  const {
    data,
    error
  } =
    await supabaseClient
      .from("customers")
      .insert({
        user_id: currentUser.id,
        name,
        phone
      })
      .select()
      .single();

  if (error) {
    alert(error.message);
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
}


function displayCustomers() {

  const list =
    document.getElementById(
      "customerList"
    );

  if (!list) return;

  const search =
    (
      document.getElementById(
        "customerSearch"
      )?.value || ""
    ).toLowerCase();

  const filtered =
    customers.filter(customer =>
      String(customer.name || "")
        .toLowerCase()
        .includes(search) ||

      String(customer.phone || "")
        .toLowerCase()
        .includes(search)
    );

  if (!filtered.length) {

    list.innerHTML = `
      <div class="empty">
        <h3>No customers found</h3>
        <p>Add your first customer.</p>
      </div>
    `;

    return;
  }

  list.innerHTML =
    filtered.map(customer => {

      const safePhone =
        String(customer.phone || "")
          .replace(/\D/g, "");

      return `
        <div class="customer-row">

          <div>
            <h3>
              ${escapeHTML(customer.name)}
            </h3>

            <p>
              📞 ${escapeHTML(customer.phone)}
            </p>
          </div>

          <button
            class="secondary"
            onclick="messageCustomer('${safePhone}')">
            📲 WhatsApp
          </button>

        </div>
      `;
    }).join("");
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


/* =====================================================
   BUSINESS PROFILE
===================================================== */

async function saveBusinessProfile() {

  if (!requireUser()) return;

  const businessName =
    document.getElementById(
      "businessName"
    ).value.trim();

  const ownerName =
    document.getElementById(
      "ownerName"
    ).value.trim();

  const phone =
    document.getElementById(
      "businessPhone"
    ).value.trim();

  const address =
    document.getElementById(
      "businessAddress"
    ).value.trim();

  const {
    error
  } =
    await supabaseClient
      .from("businesses")
      .upsert({
        id: currentUser.id,
        business_name: businessName,
        owner_name: ownerName,
        phone,
        address
      });

  if (error) {

    console.error(error);

    alert(
      "Could not save business profile: " +
      error.message
    );

    return;
  }

  businessProfile = {
    businessName,
    ownerName,
    phone,
    address
  };

  updateDashboard();

  alert(
    "Business profile saved successfully."
  );
}


function loadBusinessProfile() {

  document.getElementById(
    "businessName"
  ).value =
    businessProfile.businessName || "";

  document.getElementById(
    "ownerName"
  ).value =
    businessProfile.ownerName || "";

  document.getElementById(
    "businessPhone"
  ).value =
    businessProfile.phone || "";

  document.getElementById(
    "businessAddress"
  ).value =
    businessProfile.address || "";

  document.getElementById(
    "appBusinessName"
  ).textContent =
    businessProfile.businessName ||
    "MarketMate";
}


/* =====================================================
   HISTORY
===================================================== */

function displayHistory() {

  const list =
    document.getElementById(
      "historyList"
    );

  if (!list) return;

  const transactions = [
    ...sales.map(sale => ({
      type: "Sale",
      name: sale.product,
      amount: sale.amount,
      date: sale.date,
      receipt: sale.receiptNumber
    })),

    ...expenses.map(expense => ({
      type: "Expense",
      name: expense.name,
      amount: expense.amount,
      date: expense.date,
      receipt: ""
    }))
  ]
  .sort(
    (a,b) =>
      new Date(b.date) -
      new Date(a.date)
  );

  if (!transactions.length) {

    list.innerHTML = `
      <div class="empty">
        <h3>No transactions yet</h3>
        <p>Your sales and expenses will appear here.</p>
      </div>
    `;

    showReport("today");

    return;
  }

  list.innerHTML =
    transactions.map(item => `
      <div class="transaction-row">

        <div>
          <strong>
            ${escapeHTML(item.name)}
          </strong>

          <p>
            ${item.type} • ${formatDate(item.date)}
          </p>
        </div>

        <strong class="${
          item.type === "Sale"
            ? "stock-good"
            : "stock-low"
        }">
          ${
            item.type === "Sale"
              ? "+"
              : "-"
          }${money(item.amount)}
        </strong>

      </div>
    `).join("");

  showReport("today");
}


function showReport(period) {

  let saleFilter;
  let expenseFilter;

  if (period === "week") {

    saleFilter =
      sale => isThisWeek(sale.date);

    expenseFilter =
      expense => isThisWeek(expense.date);

  } else if (period === "month") {

    saleFilter =
      sale => isThisMonth(sale.date);

    expenseFilter =
      expense => isThisMonth(expense.date);

  } else {

    saleFilter =
      sale => isToday(sale.date);

    expenseFilter =
      expense => isToday(expense.date);
  }

  const filteredSales =
    sales.filter(saleFilter);

  const filteredExpenses =
    expenses.filter(expenseFilter);

  const totalSales =
    filteredSales.reduce(
      (sum, sale) =>
        sum + Number(sale.amount || 0),
      0
    );

  const totalExpenses =
    filteredExpenses.reduce(
      (sum, expense) =>
        sum + Number(expense.amount || 0),
      0
    );

  const profit =
    totalSales - totalExpenses;

  const summary =
    document.getElementById(
      "reportSummary"
    );

  if (!summary) return;

  summary.innerHTML = `

    <div class="summary-box">
      <span>Sales</span>
      <strong>${money(totalSales)}</strong>
    </div>

    <div class="summary-box">
      <span>Expenses</span>
      <strong>${money(totalExpenses)}</strong>
    </div>

    <div class="summary-box">
      <span>Profit</span>
      <strong>${money(profit)}</strong>
    </div>

  `;
}


/* =====================================================
   RECEIPT
===================================================== */

function showReceipt(sale) {

  if (!sale) return;

  document.getElementById(
    "receiptBusiness"
  ).textContent =
    businessProfile.businessName ||
    "MarketMate";

  document.getElementById(
    "receiptAddress"
  ).textContent =
    businessProfile.address || "";

  document.getElementById(
    "receiptPhone"
  ).textContent =
    businessProfile.phone || "";

  document.getElementById(
    "receiptNumber"
  ).textContent =
    sale.receiptNumber || "";

  document.getElementById(
    "receiptDate"
  ).textContent =
    formatDate(sale.date);

  document.getElementById(
    "receiptProduct"
  ).textContent =
    sale.product || "";

  document.getElementById(
    "receiptQuantity"
  ).textContent =
    sale.quantity || 0;

  document.getElementById(
    "receiptAmount"
  ).textContent =
    Number(sale.amount || 0)
      .toLocaleString();

  document
    .getElementById("receiptModal")
    .classList.remove("hidden");
}


function closeReceipt() {

  document
    .getElementById("receiptModal")
    .classList.add("hidden");
}


async function shareReceipt() {

  const receipt =
    document.getElementById("receipt");

  if (!receipt) return;

  const text =
    receipt.innerText;

  if (
    navigator.share
  ) {

    try {

      await navigator.share({
        title: "MarketMate Receipt",
        text
      });

    } catch (error) {
      console.log("Share cancelled.");
    }

    return;
  }

  const business =
    businessProfile.businessName ||
    "MarketMate";

  const message =
    encodeURIComponent(
      `Receipt from ${business}\n\n${text}`
    );

  window.open(
    "https://wa.me/?text=" +
    message,
    "_blank"
  );
}


function printReceipt() {

  const receipt =
    document.getElementById("receipt");

  if (!receipt) return;

  const printWindow =
    window.open(
      "",
      "_blank",
      "width=500,height=700"
    );

  printWindow.document.write(`
    <!DOCTYPE html>

    <html>
    <head>

      <title>MarketMate Receipt</title>

      <style>

        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #111;
        }

        .receipt {
          max-width: 380px;
          margin: auto;
        }

        .receipt-header {
          text-align: center;
        }

        .receipt-row,
        .receipt-total {
          display: flex;
          justify-content: space-between;
          margin: 12px 0;
        }

        .receipt-divider {
          border-top: 1px dashed #aaa;
          margin: 15px 0;
        }

        .receipt-total {
          font-size: 20px;
          font-weight: bold;
        }

        .center {
          text-align: center;
        }

        .receipt-logo {
          width: 40px;
          height: 40px;
          background: #2563eb;
          color: white;
          margin: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
        }

      </style>

    </head>

    <body>

      ${receipt.outerHTML}

      <script>

        window.onload = function() {
          window.print();

          setTimeout(
            () => window.close(),
            500
          );
        };

      <\/script>

    </body>
    </html>
  `);

  printWindow.document.close();
}


/* =====================================================
   CLOSE MODALS
===================================================== */

document.addEventListener(
  "click",
  event => {

    const productModal =
      document.getElementById(
        "productModal"
      );

    const customerModal =
      document.getElementById(
        "customerModal"
      );

    const receiptModal =
      document.getElementById(
        "receiptModal"
      );

    if (event.target === productModal) {
      closeProductForm();
    }

    if (event.target === customerModal) {
      closeCustomerForm();
    }

    if (event.target === receiptModal) {
      closeReceipt();
    }

  }
);


/* =====================================================
   INITIALIZE
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    console.log(
      "🚀 MarketMate starting..."
    );

    await checkUser();

    console.log(
      "✅ MarketMate ready."
    );

  }
);


/* =====================================================
   GLOBAL FUNCTIONS
===================================================== */

window.signupUser = signupUser;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.logout = logout;

window.showSignup = showSignup;
window.showLogin = showLogin;
window.showApp = showApp;

window.showPage = showPage;

window.openProductForm = openProductForm;
window.closeProductForm = closeProductForm;
window.addProduct = addProduct;
window.displayProducts = displayProducts;
window.deleteProduct = deleteProduct;

window.updateSaleProducts = updateSaleProducts;
window.recordSale = recordSale;

window.displayPOSProducts = displayPOSProducts;
window.addToPOSCart = addToPOSCart;
window.renderPOSCart = renderPOSCart;
window.changePOSQuantity = changePOSQuantity;
window.clearPOSCart = clearPOSCart;
window.checkoutPOS = checkoutPOS;

window.recordExpense = recordExpense;

window.openCustomerForm = openCustomerForm;
window.closeCustomerForm = closeCustomerForm;
window.addCustomer = addCustomer;
window.displayCustomers = displayCustomers;
window.messageCustomer = messageCustomer;

window.saveBusinessProfile = saveBusinessProfile;
window.loadBusinessProfile = loadBusinessProfile;

window.displayHistory = displayHistory;
window.showReport = showReport;

window.showReceipt = showReceipt;
window.closeReceipt = closeReceipt;
window.shareReceipt = shareReceipt;
window.printReceipt = printReceipt;

console.log(
  "MarketMate app.js loaded successfully."
);