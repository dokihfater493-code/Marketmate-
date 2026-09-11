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

  // Hide all pages
  document
    .querySelectorAll(".page")
    .forEach(section => {
      section.classList.remove("active");
    });

  // Show selected page
  const selected =
    document.getElementById(page);

  if (selected) {
    selected.classList.add("active");
  }

  // Update sidebar navigation
  document
    .querySelectorAll(".sidebar-link")
    .forEach(link => {

      link.classList.remove("active");

      const onclick =
        link.getAttribute("onclick");

      if (
        onclick &&
        onclick.includes(`'${page}'`)
      ) {
        link.classList.add("active");
      }
    });

  // Update mobile navigation
  document
    .querySelectorAll(".mobile-nav button")
    .forEach(button => {

      button.classList.remove("active");

      const onclick =
        button.getAttribute("onclick");

      if (
        onclick &&
        onclick.includes(`'${page}'`)
      ) {
        button.classList.add("active");
      }
    });

  // Refresh application data
  updateDashboard();
  displayProducts();
  updateSaleProducts();
  displayCustomers();
  displayHistory();
  loadBusinessProfile();

  // Scroll to top
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
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

  const form =
    document.getElementById(
      "productForm"
    );

  if (form) {
    form.style.display = "block";
  }
}

function closeProductForm() {

  const form =
    document.getElementById(
      "productForm"
    );

  if (form) {
    form.style.display = "none";
  }
}

// =====================================

async function addProduct() {

  if (!requireUser()) return;

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
      )?.value || 5
    );

  if (!name) {
    alert("Enter product name.");
    return;
  }

  if (price < 0) {
    alert("Enter a valid price.");
    return;
  }

  if (stock < 0) {
    alert("Enter a valid stock quantity.");
    return;
  }

  const { data, error } =
    await supabaseClient
      .from("products")
      .insert([
        {
          user_id: currentUser.id,
          name,
          price,
          stock,
          low_stock: lowStock
        }
      ])
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

  alert(
    "Product added successfully."
  );

  const nameInput =
    document.getElementById(
      "productName"
    );

  const priceInput =
    document.getElementById(
      "productPrice"
    );

  const stockInput =
    document.getElementById(
      "productStock"
    );

  if (nameInput) {
    nameInput.value = "";
  }

  if (priceInput) {
    priceInput.value = "";
  }

  if (stockInput) {
    stockInput.value = "";
  }

  const lowStockInput =
    document.getElementById(
      "productLowStock"
    );

  if (lowStockInput) {
    lowStockInput.value = "5";
  }

  closeProductForm();

  displayProducts();
  updateSaleProducts();
  displayPOSProducts();
  updateDashboard();
}

// =====================================

function displayProducts() {

  const list =
    document.getElementById(
      "productList"
    );

  if (!list) return;

  if (
    products.length === 0
  ) {
    list.innerHTML = `
      <div class="empty">
        <h3>No products yet</h3>
        <p>Add your first product to start managing your inventory.</p>
      </div>
    `;

    return;
  }

  list.innerHTML =
    products
      .map(
        product => {

          const stockClass =
            product.stock <=
            product.lowStock
              ? "low-stock"
              : "";

          return `
            <div class="product-card ${stockClass}">

              <div class="product-info">

                <h3>
                  ${escapeHTML(
                    product.name
                  )}
                </h3>

                <p>
                  Price:
                  <strong>
                    ₦${product.price.toLocaleString()}
                  </strong>
                </p>

                <p>
                  Stock:
                  <strong>
                    ${product.stock}
                  </strong>
                </p>

              </div>

              <div class="product-actions">

                <button
                  class="danger-btn"
                  onclick="deleteProduct(${product.id})"
                >
                  Delete
                </button>

              </div>

            </div>
          `;
        }
      )
      .join("");
}

// =====================================

async function deleteProduct(id) {

  if (!requireUser()) return;

  const product =
    products.find(
      p => p.id === id
    );

  if (!product) return;

  const confirmed =
    confirm(
      `Delete ${product.name}?`
    );

  if (!confirmed) return;

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
    alert(error.message);
    return;
  }

  products =
    products.filter(
      p => p.id !== id
    );

  displayProducts();
  updateSaleProducts();
  displayPOSProducts();
  updateDashboard();

  alert(
    "Product deleted successfully."
  );
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
    select.innerHTML = `
      <option value="">
        No products available
      </option>
    `;

    return;
  }

  select.innerHTML = `
    <option value="">
      Select product
    </option>

    ${
      products
        .map(
          product => `
            <option
              value="${product.id}"
            >
              ${escapeHTML(
                product.name
              )}
              — ₦${product.price.toLocaleString()}
              — Stock: ${product.stock}
            </option>
          `
        )
        .join("")
    }
  `;
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

  if (!productId) {
    alert(
      "Please select a product."
    );
    return;
  }

  if (
    !quantity ||
    quantity <= 0
  ) {
    alert(
      "Enter a valid quantity."
    );
    return;
  }

  const product =
    products.find(
      p => p.id === productId
    );

  if (!product) {
    alert(
      "Product not found."
    );
    return;
  }

  if (
    quantity >
    product.stock
  ) {
    alert(
      `Only ${product.stock} units available.`
    );
    return;
  }

  const amount =
    product.price *
    quantity;

  const receiptNumber =
    "MM-" +
    Date.now();

  const { data, error } =
    await supabaseClient
      .from("sales")
      .insert([
        {
          user_id:
            currentUser.id,

          receipt_number:
            receiptNumber,

          product:
            product.name,

          quantity,

          amount
        }
      ])
      .select()
      .single();

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  const newStock =
    product.stock -
    quantity;

  const {
    data: updatedProduct,
    error: stockError
  } =
    await supabaseClient
      .from("products")
      .update({
        stock: newStock
      })
      .eq("id", product.id)
      .eq(
        "user_id",
        currentUser.id
      )
      .select()
      .single();

  if (stockError) {
    console.error(
      stockError
    );

    alert(
      "Sale recorded, but stock could not be updated."
    );

    return;
  }

  const sale =
    mapSale(data);

  sales.unshift(sale);

  Object.assign(
    product,
    mapProduct(
      updatedProduct
    )
  );

  alert(
    `Sale recorded successfully.\nReceipt: ${receiptNumber}`
  );

  const quantityInput =
    document.getElementById(
      "saleQuantity"
    );

  if (quantityInput) {
    quantityInput.value = "";
  }

  const productSelect =
    document.getElementById(
      "saleProduct"
    );

  if (productSelect) {
    productSelect.value = "";
  }

  displayProducts();
  updateSaleProducts();
  displayPOSProducts();
  displayHistory();
  updateDashboard();

  showReceipt(
    sale
  );
}

// =====================================
// EXPENSES
// =====================================

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

  if (!name) {
    alert(
      "Enter expense name."
    );
    return;
  }

  if (
    !amount ||
    amount <= 0
  ) {
    alert(
      "Enter a valid expense amount."
    );
    return;
  }

  const { data, error } =
    await supabaseClient
      .from("expenses")
      .insert([
        {
          user_id:
            currentUser.id,

          name,

          amount
        }
      ])
      .select()
      .single();

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  expenses.unshift(
    mapExpense(data)
  );

  alert(
    "Expense recorded successfully."
  );

  const nameInput =
    document.getElementById(
      "expenseName"
    );

  const amountInput =
    document.getElementById(
      "expenseAmount"
    );

  if (nameInput) {
    nameInput.value = "";
  }

  if (amountInput) {
    amountInput.value = "";
  }

  displayHistory();
  updateDashboard();
}

// =====================================
// CUSTOMERS
// =====================================

function openCustomerForm() {

  const form =
    document.getElementById(
      "customerForm"
    );

  if (form) {
    form.style.display =
      "block";
  }
}

function closeCustomerForm() {

  const form =
    document.getElementById(
      "customerForm"
    );

  if (form) {
    form.style.display =
      "none";
  }
}

// =====================================

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

  const email =
    document.getElementById(
      "customerEmail"
    )?.value.trim() || "";

  if (!name) {
    alert(
      "Enter customer name."
    );
    return;
  }

  const { data, error } =
    await supabaseClient
      .from("customers")
      .insert([
        {
          user_id:
            currentUser.id,

          name,

          phone,

          email
        }
      ])
      .select()
      .single();

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  customers.unshift(data);

  alert(
    "Customer added successfully."
  );

  const nameInput =
    document.getElementById(
      "customerName"
    );

  const phoneInput =
    document.getElementById(
      "customerPhone"
    );

  const emailInput =
    document.getElementById(
      "customerEmail"
    );

  if (nameInput) {
    nameInput.value = "";
  }

  if (phoneInput) {
    phoneInput.value = "";
  }

  if (emailInput) {
    emailInput.value = "";
  }

  closeCustomerForm();

  displayCustomers();
}

// =====================================

function displayCustomers() {

  const list =
    document.getElementById(
      "customerList"
    );

  if (!list) return;

  if (
    customers.length === 0
  ) {
    list.innerHTML = `
      <div class="empty">
        <h3>No customers yet</h3>
        <p>Add your first customer.</p>
      </div>
    `;

    return;
  }

  list.innerHTML =
    customers
      .map(
        customer => `
          <div class="customer-card">

            <div>

              <h3>
                ${escapeHTML(
                  customer.name || ""
                )}
              </h3>

              <p>
                📞 ${
                  escapeHTML(
                    customer.phone || "No phone"
                  )
                }
              </p>

              ${
                customer.email
                  ? `
                    <p>
                      ✉️ ${
                        escapeHTML(
                          customer.email
                        )
                      }
                    </p>
                  `
                  : ""
              }

            </div>

            <div>

              ${
                customer.phone
                  ? `
                    <button
                      class="primary-btn"
                      onclick="messageCustomer('${escapeAttribute(customer.phone)}')"
                    >
                      WhatsApp
                    </button>
                  `
                  : ""
              }

            </div>

          </div>
        `
      )
      .join("");
}

// =====================================

function messageCustomer(phone) {

  if (!phone) {
    alert(
      "Customer has no phone number."
    );
    return;
  }

  const cleanPhone =
    phone.replace(
      /[^0-9]/g,
      ""
    );

  const url =
    "https://wa.me/" +
    cleanPhone;

  window.open(
    url,
    "_blank"
  );
}

// =====================================
// BUSINESS PROFILE
// =====================================

async function saveBusinessProfile() {

  if (!requireUser()) return;

  const businessName =
    document.getElementById(
      "businessName"
    )?.value.trim() || "";

  const ownerName =
    document.getElementById(
      "ownerName"
    )?.value.trim() || "";

  const phone =
    document.getElementById(
      "businessPhone"
    )?.value.trim() || "";

  const address =
    document.getElementById(
      "businessAddress"
    )?.value.trim() || "";

  const { error } =
    await supabaseClient
      .from("businesses")
      .upsert(
        {
          id:
            currentUser.id,

          business_name:
            businessName,

          owner_name:
            ownerName,

          phone,

          address
        },
        {
          onConflict: "id"
        }
      );

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  businessProfile = {
    businessName,
    ownerName,
    phone,
    address
  };

  alert(
    "Business profile saved successfully."
  );
}

// =====================================

function loadBusinessProfile() {

  const businessName =
    document.getElementById(
      "businessName"
    );

  const ownerName =
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

  if (businessName) {
    businessName.value =
      businessProfile.businessName;
  }

  if (ownerName) {
    ownerName.value =
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

  // Update visible business name
  document
    .querySelectorAll(
      ".business-name"
    )
    .forEach(element => {
      element.textContent =
        businessProfile.businessName ||
        "MarketMate";
    });

  document
    .querySelectorAll(
      "[data-business-name]"
    )
    .forEach(element => {
      element.textContent =
        businessProfile.businessName ||
        "MarketMate";
    });
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

  const combined = [
    ...sales.map(
      sale => ({
        type: "sale",
        date: sale.date,
        data: sale
      })
    ),

    ...expenses.map(
      expense => ({
        type: "expense",
        date: expense.date,
        data: expense
      })
    )
  ].sort(
    (a, b) =>
      new Date(b.date) -
      new Date(a.date)
  );

  if (
    combined.length === 0
  ) {
    list.innerHTML = `
      <div class="empty">
        <h3>No transaction history</h3>
        <p>Your sales and expenses will appear here.</p>
      </div>
    `;

    return;
  }

  list.innerHTML =
    combined
      .map(item => {

        if (
          item.type ===
          "sale"
        ) {

          const sale =
            item.data;

          return `
            <div class="history-item sale-item">

              <div>

                <strong>
                  🛒 Sale
                </strong>

                <h3>
                  ${escapeHTML(
                    sale.product || ""
                  )}
                </h3>

                <p>
                  Quantity:
                  ${sale.quantity}
                </p>

                <small>
                  ${formatDate(
                    sale.date
                  )}
                </small>

              </div>

              <div class="history-amount positive">
                +₦${sale.amount.toLocaleString()}
              </div>

            </div>
          `;
        }

        const expense =
          item.data;

        return `
          <div class="history-item expense-item">

            <div>

              <strong>
                💸 Expense
              </strong>

              <h3>
                ${escapeHTML(
                  expense.name || ""
                )}
              </h3>

              <small>
                ${formatDate(
                  expense.date
                )}
              </small>

            </div>

            <div class="history-amount negative">
              -₦${expense.amount.toLocaleString()}
            </div>

          </div>
        `;
      })
      .join("");
}

// =====================================
// REPORTS
// =====================================

function showReport(type) {

  const report =
    document.getElementById(
      "reportResult"
    );

  if (!report) return;

  let filteredSales =
    sales;

  let filteredExpenses =
    expenses;

  if (
    type === "today"
  ) {

    filteredSales =
      sales.filter(
        sale =>
          isToday(sale.date)
      );

    filteredExpenses =
      expenses.filter(
        expense =>
          isToday(expense.date)
      );
  }

  if (
    type === "week"
  ) {

    filteredSales =
      sales.filter(
        sale =>
          isThisWeek(
            sale.date
          )
      );

    filteredExpenses =
      expenses.filter(
        expense =>
          isThisWeek(
            expense.date
          )
      );
  }

  if (
    type === "month"
  ) {

    filteredSales =
      sales.filter(
        sale =>
          isThisMonth(
            sale.date
          )
      );

    filteredExpenses =
      expenses.filter(
        expense =>
          isThisMonth(
            expense.date
          )
      );
  }

  const totalSales =
    filteredSales.reduce(
      (sum, sale) =>
        sum + sale.amount,
      0
    );

  const totalExpenses =
    filteredExpenses.reduce(
      (sum, expense) =>
        sum + expense.amount,
      0
    );

  const profit =
    totalSales -
    totalExpenses;

  const totalItems =
    filteredSales.reduce(
      (sum, sale) =>
        sum + sale.quantity,
      0
    );

  report.innerHTML = `
    <div class="report-card">

      <h2>
        ${
          type === "today"
            ? "Today's Report"
            : type === "week"
              ? "This Week's Report"
              : "This Month's Report"
        }
      </h2>

      <div class="report-grid">

        <div>
          <span>Total Sales</span>
          <strong>
            ₦${totalSales.toLocaleString()}
          </strong>
        </div>

        <div>
          <span>Expenses</span>
          <strong>
            ₦${totalExpenses.toLocaleString()}
          </strong>
        </div>

        <div>
          <span>Profit</span>
          <strong>
            ₦${profit.toLocaleString()}
          </strong>
        </div>

        <div>
          <span>Items Sold</span>
          <strong>
            ${totalItems}
          </strong>
        </div>

      </div>

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

  const receipt =
    document.getElementById(
      "receiptContent"
    );

  if (!modal || !receipt) {
    return;
  }

  receipt.innerHTML = `
    <div class="receipt">

      <div class="receipt-header">

        <h2>
          ${
            escapeHTML(
              businessProfile.businessName ||
              "MarketMate"
            )
          }
        </h2>

        ${
          businessProfile.phone
            ? `
              <p>
                ${escapeHTML(
                  businessProfile.phone
                )}
              </p>
            `
            : ""
        }

        ${
          businessProfile.address
            ? `
              <p>
                ${escapeHTML(
                  businessProfile.address
                )}
              </p>
            `
            : ""
        }

        <hr>

        <h3>
          SALES RECEIPT
        </h3>

      </div>

      <div class="receipt-details">

        <p>
          <strong>
            Receipt:
          </strong>

          ${escapeHTML(
            sale.receiptNumber ||
            ""
          )}
        </p>

        <p>
          <strong>
            Date:
          </strong>

          ${formatDate(
            sale.date
          )}
        </p>

      </div>

      <div class="receipt-item">

        <div>
          <strong>
            ${escapeHTML(
              sale.product || ""
            )}
          </strong>

          <p>
            ${sale.quantity}
            ×
            ₦${(
              sale.amount /
              sale.quantity
            ).toLocaleString()}
          </p>
        </div>

        <strong>
          ₦${sale.amount.toLocaleString()}
        </strong>

      </div>

      <hr>

      <div class="receipt-total">

        <span>
          TOTAL
        </span>

        <strong>
          ₦${sale.amount.toLocaleString()}
        </strong>

      </div>

      <div class="receipt-footer">
        <p>
          Thank you for your business!
        </p>

        <small>
          Powered by MarketMate
        </small>
      </div>

    </div>
  `;

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

async function shareReceipt() {

  const receipt =
    document.getElementById(
      "receiptContent"
    );

  if (!receipt) return;

  const text =
    receipt.innerText;

  if (
    navigator.share
  ) {

    try {

      await navigator.share({
        title:
          "MarketMate Receipt",
        text
      });

    } catch (error) {

      console.log(
        "Share cancelled."
      );

    }

  } else {

    try {

      await navigator.clipboard.writeText(
        text
      );

      alert(
        "Receipt copied to clipboard."
      );

    } catch (error) {

      alert(
        "Could not share receipt."
      );
    }
  }
}

// =====================================
// POS
// =====================================

let posCart = [];

// =====================================

function displayPOSProducts() {

  const list =
    document.getElementById(
      "posProducts"
    );

  if (!list) return;

  if (
    products.length === 0
  ) {
    list.innerHTML = `
      <div class="empty">
        <h3>No products</h3>
        <p>Add products to start selling.</p>
      </div>
    `;

    return;
  }

  list.innerHTML =
    products
      .map(
        product => {

          const disabled =
            product.stock <= 0;

          return `
            <button
              class="pos-product ${
                disabled
                  ? "disabled"
                  : ""
              }"
              ${
                disabled
                  ? "disabled"
                  : `onclick="addToPOSCart(${product.id})"`
              }
            >

              <span class="pos-product-name">
                ${escapeHTML(
                  product.name
                )}
              </span>

              <span class="pos-product-price">
                ₦${product.price.toLocaleString()}
              </span>

              <small>
                ${
                  disabled
                    ? "Out of stock"
                    : `${product.stock} in stock`
                }
              </small>

            </button>
          `;
        }
      )
      .join("");
}

// =====================================

function addToPOSCart(id) {

  const product =
    products.find(
      p => p.id === id
    );

  if (!product) return;

  if (
    product.stock <= 0
  ) {
    alert(
      "This product is out of stock."
    );
    return;
  }

  const existing =
    posCart.find(
      item =>
        item.productId === id
    );

  if (existing) {

    if (
      existing.quantity >=
      product.stock
    ) {
      alert(
        "You cannot add more than the available stock."
      );

      return;
    }

    existing.quantity += 1;

  } else {

    posCart.push({
      productId: id,
      quantity: 1
    });
  }

  renderPOSCart();
}

// =====================================

function renderPOSCart() {

  const cart =
    document.getElementById(
      "posCart"
    );

  const totalElement =
    document.getElementById(
      "posTotal"
    );

  if (!cart) return;

  if (
    posCart.length === 0
  ) {

    cart.innerHTML = `
      <div class="empty">
        Cart is empty
      </div>
    `;

    if (totalElement) {
      totalElement.textContent =
        "₦0";
    }

    return;
  }

  let total = 0;

  cart.innerHTML =
    posCart
      .map(
        item => {

          const product =
            products.find(
              p =>
                p.id ===
                item.productId
            );

          if (!product) {
            return "";
          }

          const subtotal =
            product.price *
            item.quantity;

          total += subtotal;

          return `
            <div class="cart-item">

              <div>

                <strong>
                  ${escapeHTML(
                    product.name
                  )}
                </strong>

                <p>
                  ₦${product.price.toLocaleString()}
                  ×
                  ${item.quantity}
                </p>

              </div>

              <div class="cart-controls">

                <button
                  onclick="changePOSQuantity(${product.id}, -1)"
                >
                  −
                </button>

                <span>
                  ${item.quantity}
                </span>

                <button
                  onclick="changePOSQuantity(${product.id}, 1)"
                >
                  +
                </button>

              </div>

              <strong>
                ₦${subtotal.toLocaleString()}
              </strong>

            </div>
          `;
        }
      )
      .join("");

  if (totalElement) {
    totalElement.textContent =
      "₦" +
      total.toLocaleString();
  }
}

// =====================================

function changePOSQuantity(
  id,
  change
) {

  const item =
    posCart.find(
      cartItem =>
        cartItem.productId ===
        id
    );

  const product =
    products.find(
      p => p.id === id
    );

  if (!item || !product) {
    return;
  }

  item.quantity += change;

  if (
    item.quantity <= 0
  ) {

    posCart =
      posCart.filter(
        cartItem =>
          cartItem.productId !==
          id
      );

  } else if (
    item.quantity >
    product.stock
  ) {

    item.quantity =
      product.stock;

    alert(
      "You cannot exceed available stock."
    );
  }

  renderPOSCart();
}

// =====================================

async function checkoutPOS() {

  if (!requireUser()) return;

  if (
    posCart.length === 0
  ) {
    alert(
      "Your cart is empty."
    );
    return;
  }

  const confirmed =
    confirm(
      "Complete this sale?"
    );

  if (!confirmed) {
    return;
  }

  for (
    const item of posCart
  ) {

    const product =
      products.find(
        p =>
          p.id ===
          item.productId
      );

    if (!product) {
      continue;
    }

    if (
      item.quantity >
      product.stock
    ) {
      alert(
        `${product.name} does not have enough stock.`
      );
      return;
    }
  }

  const receiptNumber =
    "MM-" +
    Date.now();

  const createdSales = [];

  for (
    const item of posCart
  ) {

    const product =
      products.find(
        p =>
          p.id ===
          item.productId
      );

    if (!product) {
      continue;
    }

    const amount =
      product.price *
      item.quantity;

    const {
      data,
      error
    } =
      await supabaseClient
        .from("sales")
        .insert([
          {
            user_id:
              currentUser.id,

            receipt_number:
              receiptNumber,

            product:
              product.name,

            quantity:
              item.quantity,

            amount
          }
        ])
        .select()
        .single();

    if (error) {

      console.error(error);

      alert(
        "Could not complete the sale: " +
        error.message
      );

      return;
    }

    createdSales.push(
      mapSale(data)
    );

    const newStock =
      product.stock -
      item.quantity;

    const {
      data:
        updatedProduct,
      error:
        stockError
    } =
      await supabaseClient
        .from("products")
        .update({
          stock:
            newStock
        })
        .eq(
          "id",
          product.id
        )
        .eq(
          "user_id",
          currentUser.id
        )
        .select()
        .single();

    if (stockError) {

      console.error(
        stockError
      );

      alert(
        "Sale was recorded but stock update failed."
      );

      return;
    }

    Object.assign(
      product,
      mapProduct(
        updatedProduct
      )
    );
  }

  sales.unshift(
    ...createdSales
  );

  posCart = [];

  renderPOSCart();

  displayProducts();
  displayPOSProducts();
  updateSaleProducts();
  displayHistory();
  updateDashboard();

  alert(
    `Sale completed successfully!\nReceipt: ${receiptNumber}`
  );

  if (
    createdSales.length === 1
  ) {
    showReceipt(
      createdSales[0]
    );
  }
}

// =====================================

function refreshPOS() {
  displayPOSProducts();
  renderPOSCart();
  updateDashboard();
}

// =====================================
// HELPERS
// =====================================

function escapeHTML(value) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

// =====================================

function escapeAttribute(value) {

  return String(
    value ?? ""
  )
    .replace(
      /\\/g,
      "\\\\"
    )
    .replace(
      /'/g,
      "\\'"
    );
}

// =====================================

function formatDate(dateString) {

  if (!dateString) {
    return "";
  }

  const date =
    new Date(dateString);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleString(
    "en-NG",
    {
      dateStyle:
        "medium",
      timeStyle:
        "short"
    }
  );
}

// =====================================
// INITIALIZE
// =====================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    console.log(
      "MarketMate starting..."
    );

    displayPOSProducts();
    renderPOSCart();

    await checkUser();

  }
);

// =====================================
// GLOBAL FUNCTIONS
// =====================================

window.signupUser =
  signupUser;

window.loginUser =
  loginUser;

window.logoutUser =
  logoutUser;

window.logout =
  logout;

window.showSignup =
  showSignup;

window.showLogin =
  showLogin;

window.showApp =
  showApp;

window.showPage =
  showPage;

window.openProductForm =
  openProductForm;

window.closeProductForm =
  closeProductForm;

window.addProduct =
  addProduct;

window.deleteProduct =
  deleteProduct;

window.recordSale =
  recordSale;

window.recordExpense =
  recordExpense;

window.openCustomerForm =
  openCustomerForm;

window.closeCustomerForm =
  closeCustomerForm;

window.addCustomer =
  addCustomer;

window.messageCustomer =
  messageCustomer;

window.saveBusinessProfile =
  saveBusinessProfile;

window.showReport =
  showReport;

window.showReceipt =
  showReceipt;

window.closeReceipt =
  closeReceipt;

window.shareReceipt =
  shareReceipt;

window.displayPOSProducts =
  displayPOSProducts;

window.addToPOSCart =
  addToPOSCart;

window.renderPOSCart =
  renderPOSCart;

window.changePOSQuantity =
  changePOSQuantity;

window.checkoutPOS =
  checkoutPOS;

window.refreshPOS =
  refreshPOS;

console.log(
  "MarketMate loaded successfully."
);
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

  const businessName =
    document
      .getElementById(
        "businessName"
      )
      ?.value
      .trim() || "";

  const ownerName =
    document
      .getElementById(
        "ownerName"
      )
      ?.value
      .trim() || "";

  const phone =
    document
      .getElementById(
        "businessPhone"
      )
      ?.value
      .trim() || "";

  const address =
    document
      .getElementById(
        "businessAddress"
      )
      ?.value
      .trim() || "";

  const {
    data,
    error
  } =
    await supabaseClient
      .from("businesses")
      .upsert(
        {
          id:
            currentUser.id,

          business_name:
            businessName,

          owner_name:
            ownerName,

          phone:
            phone,

          address:
            address
        },
        {
          onConflict:
            "id"
        }
      )
      .select()
      .single();

  if (error) {

    console.error(error);

    alert(
      "Could not save business profile: " +
      error.message
    );

    return;
  }

  businessProfile = {
    businessName:
      data.business_name || "",

    ownerName:
      data.owner_name || "",

    phone:
      data.phone || "",

    address:
      data.address || ""
  };

  loadBusinessProfile();

  alert(
    "Business profile saved successfully!"
  );
}

// =====================================

function loadBusinessProfile() {

  const businessName =
    document.getElementById(
      "businessName"
    );

  const ownerName =
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

  if (businessName) {
    businessName.value =
      businessProfile.businessName ||
      "";
  }

  if (ownerName) {
    ownerName.value =
      businessProfile.ownerName ||
      "";
  }

  if (phone) {
    phone.value =
      businessProfile.phone ||
      "";
  }

  if (address) {
    address.value =
      businessProfile.address ||
      "";
  }

  document
    .querySelectorAll(
      ".business-name"
    )
    .forEach(element => {

      element.textContent =
        businessProfile.businessName ||
        "MarketMate";

    });

  document
    .querySelectorAll(
      "[data-business-name]"
    )
    .forEach(element => {

      element.textContent =
        businessProfile.businessName ||
        "MarketMate";

    });
}

// =====================================
// TRANSACTION HISTORY
// =====================================

function displayHistory() {

  const list =
    document.getElementById(
      "historyList"
    );

  if (!list) return;

  const allTransactions = [];

  sales.forEach(
    sale => {

      allTransactions.push({
        type:
          "sale",

        date:
          sale.date,

        data:
          sale
      });

    }
  );

  expenses.forEach(
    expense => {

      allTransactions.push({
        type:
          "expense",

        date:
          expense.date,

        data:
          expense
      });

    }
  );

  allTransactions.sort(
    (a, b) =>
      new Date(b.date) -
      new Date(a.date)
  );

  if (
    allTransactions.length ===
    0
  ) {

    list.innerHTML = `
      <div class="empty">
        <h3>
          No transactions yet
        </h3>

        <p>
          Sales and expenses will
          appear here.
        </p>
      </div>
    `;

    return;
  }

  list.innerHTML =
    allTransactions
      .map(
        transaction => {

          if (
            transaction.type ===
            "sale"
          ) {

            const sale =
              transaction.data;

            return `
              <div
                class="history-item sale"
              >

                <div
                  class="history-icon"
                >
                  🛒
                </div>

                <div
                  class="history-info"
                >

                  <strong>
                    Sale
                  </strong>

                  <h4>
                    ${escapeHTML(
                      sale.product
                    )}
                  </h4>

                  <p>
                    Quantity:
                    ${sale.quantity}
                  </p>

                  <small>
                    Receipt:
                    ${escapeHTML(
                      sale.receiptNumber ||
                      ""
                    )}
                  </small>

                  <small>
                    ${formatDate(
                      sale.date
                    )}
                  </small>

                </div>

                <div
                  class="history-value positive"
                >
                  +₦${sale.amount.toLocaleString()}
                </div>

              </div>
            `;
          }

          const expense =
            transaction.data;

          return `
            <div
              class="history-item expense"
            >

              <div
                class="history-icon"
              >
                💸
              </div>

              <div
                class="history-info"
              >

                <strong>
                  Expense
                </strong>

                <h4>
                  ${escapeHTML(
                    expense.name
                  )}
                </h4>

                <small>
                  ${formatDate(
                    expense.date
                  )}
                </small>

              </div>

              <div
                class="history-value negative"
              >
                -₦${expense.amount.toLocaleString()}
              </div>

            </div>
          `;
        }
      )
      .join("");
}

// =====================================
// REPORTS
// =====================================

function showReport(type) {

  const report =
    document.getElementById(
      "reportResult"
    );

  if (!report) return;

  let selectedSales =
    [...sales];

  let selectedExpenses =
    [...expenses];

  if (
    type === "today"
  ) {

    selectedSales =
      sales.filter(
        sale =>
          isToday(
            sale.date
          )
      );

    selectedExpenses =
      expenses.filter(
        expense =>
          isToday(
            expense.date
          )
      );
  }

  if (
    type === "week"
  ) {

    selectedSales =
      sales.filter(
        sale =>
          isThisWeek(
            sale.date
          )
      );

    selectedExpenses =
      expenses.filter(
        expense =>
          isThisWeek(
            expense.date
          )
      );
  }

  if (
    type === "month"
  ) {

    selectedSales =
      sales.filter(
        sale =>
          isThisMonth(
            sale.date
          )
      );

    selectedExpenses =
      expenses.filter(
        expense =>
          isThisMonth(
            expense.date
          )
      );
  }

  const totalSales =
    selectedSales.reduce(
      (
        total,
        sale
      ) =>
        total +
        Number(
          sale.amount || 0
        ),
      0
    );

  const totalExpenses =
    selectedExpenses.reduce(
      (
        total,
        expense
      ) =>
        total +
        Number(
          expense.amount || 0
        ),
      0
    );

  const profit =
    totalSales -
    totalExpenses;

  const itemsSold =
    selectedSales.reduce(
      (
        total,
        sale
      ) =>
        total +
        Number(
          sale.quantity || 0
        ),
      0
    );

  report.innerHTML = `
    <div
      class="report-summary"
    >

      <div
        class="report-header"
      >

        <div>

          <span>
            Report
          </span>

          <h2>
            ${
              type === "today"
                ? "Today"
                : type === "week"
                  ? "This Week"
                  : "This Month"
            }
          </h2>

        </div>

        <div>
          📊
        </div>

      </div>

      <div
        class="report-grid"
      >

        <div
          class="report-box"
        >

          <span>
            Total Sales
          </span>

          <strong>
            ₦${totalSales.toLocaleString()}
          </strong>

        </div>

        <div
          class="report-box"
        >

          <span>
            Expenses
          </span>

          <strong>
            ₦${totalExpenses.toLocaleString()}
          </strong>

        </div>

        <div
          class="report-box"
        >

          <span>
            Profit
          </span>

          <strong>
            ₦${profit.toLocaleString()}
          </strong>

        </div>

        <div
          class="report-box"
        >

          <span>
            Items Sold
          </span>

          <strong>
            ${itemsSold}
          </strong>

        </div>

      </div>

      <div
        class="report-footer"
      >

        <p>
          Transactions:
          ${
            selectedSales.length +
            selectedExpenses.length
          }
        </p>

      </div>

    </div>
  `;
});

// =====================================
// RECEIPT
// =====================================

function showReceipt(sale) {

  const modal =
    document.getElementById(
      "receiptModal"
    );

  const content =
    document.getElementById(
      "receiptContent"
    );

  if (
    !modal ||
    !content
  ) {
    return;
  }

  const unitPrice =
    sale.quantity
      ? sale.amount /
        sale.quantity
      : sale.amount;

  content.innerHTML = `
    <div
      class="receipt"
      id="printReceipt"
    >

      <div
        class="receipt-header"
      >

        <h2>
          ${escapeHTML(
            businessProfile.businessName ||
            "MarketMate"
          )}
        </h2>

        ${
          businessProfile.ownerName
            ? `
              <p>
                ${escapeHTML(
                  businessProfile.ownerName
                )}
              </p>
            `
            : ""
        }

        ${
          businessProfile.phone
            ? `
              <p>
                ${escapeHTML(
                  businessProfile.phone
                )}
              </p>
            `
            : ""
        }

        ${
          businessProfile.address
            ? `
              <p>
                ${escapeHTML(
                  businessProfile.address
                )}
              </p>
            `
            : ""
        }

        <div
          class="receipt-line"
        ></div>

        <h3>
          SALES RECEIPT
        </h3>

      </div>

      <div
        class="receipt-meta"
      >

        <p>
          <span>
            Receipt No.
          </span>

          <strong>
            ${escapeHTML(
              sale.receiptNumber ||
              ""
            )}
          </strong>
        </p>

        <p>
          <span>
            Date
          </span>

          <strong>
            ${formatDate(
              sale.date
            )}
          </strong>
        </p>

      </div>

      <div
        class="receipt-items"
      >

        <div
          class="receipt-item"
        >

          <div>

            <strong>
              ${escapeHTML(
                sale.product
              )}
            </strong>

            <small>
              ${sale.quantity}
              ×
              ₦${unitPrice.toLocaleString()}
            </small>

          </div>

          <strong>
            ₦${sale.amount.toLocaleString()}
          </strong>

        </div>

      </div>

      <div
        class="receipt-line"
      ></div>

      <div
        class="receipt-total"
      >

        <span>
          TOTAL
        </span>

        <strong>
          ₦${sale.amount.toLocaleString()}
        </strong>

      </div>

      <div
        class="receipt-footer"
      >

        <p>
          Thank you for your business!
        </p>

        <small>
          Powered by MarketMate
        </small>

      </div>

    </div>
  `;

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

async function shareReceipt() {

  const content =
    document.getElementById(
      "receiptContent"
    );

  if (!content) return;

  const text =
    content.innerText;

  if (
    navigator.share
  ) {

    try {

      await navigator.share({
        title:
          "MarketMate Receipt",

        text:
          text
      });

    } catch (error) {

      console.log(
        "Sharing cancelled."
      );
    }

    return;
  }

  try {

    await navigator.clipboard
      .writeText(
        text
      );

    alert(
      "Receipt copied successfully."
    );

  } catch (error) {

    console.error(error);

    alert(
      "Could not copy receipt."
    );
  }
}

// =====================================
// PRINT RECEIPT
// =====================================

function printReceipt() {

  const receipt =
    document.getElementById(
      "printReceipt"
    );

  if (!receipt) return;

  const printWindow =
    window.open(
      "",
      "_blank"
    );

  if (!printWindow) {

    alert(
      "Please allow pop-ups to print the receipt."
    );

    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>

    <html>

    <head>

      <title>
        MarketMate Receipt
      </title>

      <meta
        name="viewport"
        content="width=device-width,initial-scale=1"
      >

      <style>

        * {
          box-sizing: border-box;
        }

        body {
          font-family:
            Arial,
            sans-serif;

          margin: 0;
          padding: 20px;

          background: white;
        }

        .receipt {
          max-width: 400px;
          margin: auto;
        }

        h2,
        h3,
        p {
          margin-top: 0;
        }

        .receipt-header {
          text-align: center;
        }

        .receipt-line {
          border-top:
            1px dashed #999;

          margin:
            15px 0;
        }

        .receipt-meta p,
        .receipt-item,
        .receipt-total {
          display: flex;

          justify-content:
            space-between;

          gap: 20px;
        }

        .receipt-item {
          padding:
            10px 0;
        }

        .receipt-item small {
          display: block;
          margin-top: 5px;
        }

        .receipt-total {
          font-size: 20px;
          font-weight: bold;
        }

        .receipt-footer {
          text-align: center;
          margin-top: 30px;
        }

        @media print {

          body {
            padding: 0;
          }

        }

      </style>

    </head>

    <body>

      ${receipt.outerHTML}

      <script>

        window.onload =
          function() {

            window.print();

            setTimeout(
              function() {
                window.close();
              },
              500
            );

          };

      <\/script>

    </body>

    </html>
  `);

  printWindow.document.close();
}

// =====================================
// POS SYSTEM
// =====================================

let posCart = [];

// =====================================

function displayPOSProducts() {

  const container =
    document.getElementById(
      "posProducts"
    );

  if (!container) return;

  if (
    products.length === 0
  ) {

    container.innerHTML = `
      <div class="empty">
        <h3>
          No products available
        </h3>

        <p>
          Add products to begin selling.
        </p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    products
      .map(
        product => {

          const outOfStock =
            product.stock <= 0;

          return `
            <button
              class="pos-product ${
                outOfStock
                  ? "disabled"
                  : ""
              }"

              ${
                outOfStock
                  ? "disabled"
                  : `onclick="addToPOSCart(${product.id})"`
              }
            >

              <span
                class="pos-product-name"
              >
                ${escapeHTML(
                  product.name
                )}
              </span>

              <span
                class="pos-product-price"
              >
                ₦${product.price.toLocaleString()}
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
        }
      )
      .join("");
}

// =====================================

function addToPOSCart(id) {

  const product =
    products.find(
      p =>
        Number(p.id) ===
        Number(id)
    );

  if (!product) return;

  if (
    product.stock <= 0
  ) {

    alert(
      "This product is out of stock."
    );

    return;
  }

  const existing =
    posCart.find(
      item =>
        Number(
          item.productId
        ) ===
        Number(id)
    );

  if (existing) {

    if (
      existing.quantity >=
      product.stock
    ) {

      alert(
        "You cannot add more than the available stock."
      );

      return;
    }

    existing.quantity += 1;

  } else {

    posCart.push({
      productId:
        product.id,

      quantity:
        1
    });
  }

  renderPOSCart();
}

// =====================================

function renderPOSCart() {

  const cart =
    document.getElementById(
      "posCart"
    );

  const totalElement =
    document.getElementById(
      "posTotal"
    );

  const countElement =
    document.getElementById(
      "posCartCount"
    );

  if (!cart) return;

  let total = 0;
  let count = 0;

  if (
    posCart.length === 0
  ) {

    cart.innerHTML = `
      <div class="empty">
        🛒 Your cart is empty.
      </div>
    `;

    if (totalElement) {
      totalElement.textContent =
        "₦0";
    }

    if (countElement) {
      countElement.textContent =
        "0";
    }

    return;
  }

  cart.innerHTML =
    posCart
      .map(
        item => {

          const product =
            products.find(
              p =>
                Number(p.id) ===
                Number(
                  item.productId
                )
            );

          if (!product) {
            return "";
          }

          const subtotal =
            product.price *
            item.quantity;

          total += subtotal;

          count +=
            item.quantity;

          return `
            <div
              class="cart-item"
            >

              <div
                class="cart-product"
              >

                <strong>
                  ${escapeHTML(
                    product.name
                  )}
                </strong>

                <small>
                  ₦${product.price.toLocaleString()}
                  each
                </small>

              </div>

              <div
                class="cart-controls"
              >

                <button
                  type="button"
                  onclick="changePOSQuantity(
                    ${product.id},
                    -1
                  )"
                >
                  −
                </button>

                <span>
                  ${item.quantity}
                  // =====================================
// POS QUANTITY CONTROL
// =====================================

function changePOSQuantity(
  id,
  change
) {

  const item =
    posCart.find(
      cartItem =>
        Number(
          cartItem.productId
        ) === Number(id)
    );

  const product =
    products.find(
      p =>
        Number(p.id) ===
        Number(id)
    );

  if (
    !item ||
    !product
  ) {
    return;
  }

  item.quantity += change;

  // Remove item when quantity reaches zero
  if (
    item.quantity <= 0
  ) {

    posCart =
      posCart.filter(
        cartItem =>
          Number(
            cartItem.productId
          ) !== Number(id)
      );

  }

  // Don't allow quantity above stock
  if (
    item.quantity >
    product.stock
  ) {

    item.quantity =
      product.stock;

    alert(
      "You cannot sell more than the available stock."
    );
  }

  renderPOSCart();
}

// =====================================
// CLEAR POS CART
// =====================================

function clearPOSCart() {

  if (
    posCart.length === 0
  ) {
    return;
  }

  if (
    !confirm(
      "Clear all items from the cart?"
    )
  ) {
    return;
  }

  posCart = [];

  renderPOSCart();
}

// =====================================
// POS CHECKOUT
// =====================================

async function checkoutPOS() {

  if (!requireUser()) {
    return;
  }

  if (
    posCart.length === 0
  ) {

    alert(
      "Your cart is empty."
    );

    return;
  }

  // Verify stock before checkout
  for (
    const item of posCart
  ) {

    const product =
      products.find(
        p =>
          Number(p.id) ===
          Number(
            item.productId
          )
      );

    if (!product) {
      alert(
        "One of the products in your cart no longer exists."
      );

      return;
    }

    if (
      item.quantity <= 0
    ) {

      alert(
        "Invalid product quantity."
      );

      return;
    }

    if (
      item.quantity >
      product.stock
    ) {

      alert(
        `${product.name} only has ${product.stock} available.`
      );

      return;
    }
  }

  // Calculate total
  let total = 0;

  posCart.forEach(
    item => {

      const product =
        products.find(
          p =>
            Number(p.id) ===
            Number(
              item.productId
            )
        );

      if (product) {

        total +=
          product.price *
          item.quantity;
      }
    }
  );

  const confirmed =
    confirm(
      `Complete sale for ₦${total.toLocaleString()}?`
    );

  if (!confirmed) {
    return;
  }

  const receiptNumber =
    "MM-" +
    Date.now();

  const createdSales = [];

  // ===================================
  // PROCESS EACH CART ITEM
  // ===================================

  for (
    const item of posCart
  ) {

    const product =
      products.find(
        p =>
          Number(p.id) ===
          Number(
            item.productId
          )
      );

    if (!product) {
      continue;
    }

    const amount =
      product.price *
      item.quantity;

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
            item.quantity,

          amount:
            amount,

          receipt_number:
            receiptNumber
        })
        .select()
        .single();

    if (error) {

      console.error(error);

      alert(
        "Could not complete the sale: " +
        error.message
      );

      return;
    }

    createdSales.push(
      mapSale(data)
    );

    // Update stock
    const newStock =
      product.stock -
      item.quantity;

    const {
      data:
        updatedProduct,
      error:
        stockError
    } =
      await supabaseClient
        .from("products")
        .update({
          stock:
            newStock
        })
        .eq(
          "id",
          product.id
        )
        .eq(
          "user_id",
          currentUser.id
        )
        .select()
        .single();

    if (stockError) {

      console.error(
        stockError
      );

      alert(
        "The sale was recorded, but stock could not be updated."
      );

      return;
    }

    // Update local product
    Object.assign(
      product,
      mapProduct(
        updatedProduct
      )
    );
  }

  // Add sales to local history
  sales.unshift(
    ...createdSales
  );

  // Clear cart
  posCart = [];

  renderPOSCart();

  // Refresh application
  displayProducts();
  displayPOSProducts();
  updateSaleProducts();
  displayHistory();
  updateDashboard();

  alert(
    `Sale completed successfully!\nReceipt: ${receiptNumber}`
  );

  // Show receipt for single-item sale
  if (
    createdSales.length ===
    1
  ) {

    showReceipt(
      createdSales[0]
    );

  } else {

    // For multiple products,
    // create a combined receipt object
    const combinedSale = {

      receiptNumber:
        receiptNumber,

      product:
        `${createdSales.length} products`,

      quantity:
        createdSales.reduce(
          (
            sum,
            sale
          ) =>
            sum +
            sale.quantity,
          0
        ),

      amount:
        createdSales.reduce(
          (
            sum,
            sale
          ) =>
            sum +
            sale.amount,
          0
        ),

      date:
        new Date().toISOString()
    };

    showReceipt(
      combinedSale
    );
  }
}

// =====================================
// REFRESH POS
// =====================================

function refreshPOS() {

  displayPOSProducts();

  renderPOSCart();

  updateSaleProducts();

  updateDashboard();
}

// =====================================
// SEARCH PRODUCTS
// =====================================

function searchProducts() {

  displayProducts();
}

// =====================================
// SEARCH CUSTOMERS
// =====================================

function searchCustomers() {

  displayCustomers();
}

// =====================================
// SEARCH POS PRODUCTS
// =====================================

function searchPOSProducts() {

  const input =
    document.getElementById(
      "posProductSearch"
    );

  const container =
    document.getElementById(
      "posProducts"
    );

  if (
    !container
  ) {
    return;
  }

  const search =
    input
      ?.value
      .toLowerCase()
      .trim() || "";

  const filtered =
    products.filter(
      product =>
        product.name
          .toLowerCase()
          .includes(search)
    );

  if (
    filtered.length ===
    0
  ) {

    container.innerHTML = `
      <div class="empty">
        No products found.
      </div>
    `;

    return;
  }

  container.innerHTML =
    filtered
      .map(
        product => {

          const outOfStock =
            product.stock <=
            0;

          return `
            <button
              type="button"
              class="pos-product ${
                outOfStock
                  ? "disabled"
                  : ""
              }"

              ${
                outOfStock
                  ? "disabled"
                  : `onclick="addToPOSCart(${product.id})"`
              }
            >

              <span>
                ${escapeHTML(
                  product.name
                )}
              </span>

              <strong>
                ₦${product.price.toLocaleString()}
              </strong>

              <small>
                ${
                  outOfStock
                    ? "Out of stock"
                    : `${product.stock} available`
                }
              </small>

            </button>
          `;
        }
      )
      .join("");
}

// =====================================
// ESCAPE HTML
// =====================================

function escapeHTML(value) {

  return String(
    value ?? ""
  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );
}

// =====================================
// ESCAPE ATTRIBUTE
// =====================================

function escapeAttribute(
  value
) {

  return String(
    value ?? ""
  )

    .replace(
      /\\/g,
      "\\\\"
    )

    .replace(
      /'/g,
      "\\'"
    )

    .replace(
      /"/g,
      "&quot;"
    );
}

// =====================================
// FORMAT DATE
// =====================================

function formatDate(
  dateString
) {

  if (!dateString) {
    return "";
  }

  const date =
    new Date(
      dateString
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";
  }

  return date.toLocaleString(
    "en-NG",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short"
    }
  );
}

// =====================================
// TODAY
// =====================================

function isToday(
  dateString
) {

  const date =
    new Date(
      dateString
    );

  const today =
    new Date();

  return (
    date.toDateString() ===
    today.toDateString()
  );
}

// =====================================
// THIS WEEK
// =====================================

function isThisWeek(
  dateString
) {

  const date =
    new Date(
      dateString
    );

  const today =
    new Date();

  const firstDay =
    new Date(
      today
    );

  firstDay.setDate(
    today.getDate() -
    today.getDay()
  );

  firstDay.setHours(
    0,
    0,
    0,
    0
  );

  return date >=
    firstDay;
}

// =====================================
// THIS MONTH
// =====================================

function isThisMonth(
  dateString
) {

  const date =
    new Date(
      dateString
    );

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
          isToday(
            sale.date
          )
      )
      .reduce(
        (
          total,
          sale
        ) =>
          total +
          Number(
            sale.amount || 0
          ),
        0
      );

  const todayExpenses =
    expenses
      .filter(
        expense =>
          isToday(
            expense.date
          )
      )
      .reduce(
        (
          total,
          expense
        ) =>
          total +
          Number(
            expense.amount || 0
          ),
        0
      );

  const profit =
    todaySales -
    todayExpenses;

  const salesElement =
    document.getElementById(
      "todaySales"
    );

  const expensesElement =
    document.getElementById(
      "todayExpenses"
    );

  const profitElement =
    document.getElementById(
      "todayProfit"
    );

  const productElement =
    document.getElementById(
      "productTotal"
    );

  if (
    salesElement
  ) {

    salesElement.textContent =
      "₦" +
      todaySales.toLocaleString();
  }

  if (
    expensesElement
  ) {

    expensesElement.textContent =
      "₦" +
      todayExpenses.toLocaleString();
  }

  if (
    profitElement
  ) {

    profitElement.textContent =
      "₦" +
      profit.toLocaleString();
  }

  if (
    productElement
  ) {

    productElement.textContent =
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
        Number(
          product.stock
        ) <=
        Number(
          product.lowStock
        )
    );

  if (
    lowStock.length ===
    0
  ) {

    list.innerHTML = `
      <div class="empty">
        <strong>
          ✅ Inventory looks good
        </strong>

        <p>
          No products are currently low in stock.
        </p>
      </div>
    `;

    return;
  }

  list.innerHTML =
    lowStock
      .map(
        product => `
          <div
            class="low-stock-item"
          >

            <div>

              <strong>
                ⚠️ ${escapeHTML(
                  product.name
                )}
              </strong>

              <p>
                Only
                <strong>
                  ${product.stock}
                </strong>
                left.
              </p>

            </div>

            <span>
              Low stock
            </span>

          </div>
        `
      )
      .join("");}

// =====================================
// CLOSE MODALS WHEN CLICKING OUTSIDE
// =====================================

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

    if (
      event.target ===
      productModal
    ) {

      closeProductForm();
    }

    if (
      event.target ===
      customerModal
    ) {

      closeCustomerForm();
    }

    if (
      event.target ===
      receiptModal
    ) {

      closeReceipt();
    }
  }
);

// =====================================
// INITIALIZE MARKETMATE
// =====================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    console.log(
      "🚀 MarketMate starting..."
    );

    // Prepare POS
    displayPOSProducts();

    renderPOSCart();

    // Check authentication
    await checkUser();

    console.log(
      "✅ MarketMate initialized."
    );
  }
);

// =====================================
// GLOBAL FUNCTIONS
// =====================================

window.signupUser =
  signupUser;

window.loginUser =
  loginUser;

window.logoutUser =
  logoutUser;

window.logout =
  logout;

window.showSignup =
  showSignup;

window.showLogin =
  showLogin;

window.showApp =
  showApp;

window.showPage =
  showPage;

window.openProductForm =
  openProductForm;

window.closeProductForm =
  closeProductForm;

window.addProduct =
  addProduct;

window.displayProducts =
  displayProducts;

window.deleteProduct =
  deleteProduct;

window.updateSaleProducts =
  updateSaleProducts;

window.recordSale =
  recordSale;

window.recordExpense =
  recordExpense;

window.openCustomerForm =
  openCustomerForm;

window.closeCustomerForm =
  closeCustomerForm;

window.addCustomer =
  addCustomer;

window.displayCustomers =
  displayCustomers;

window.messageCustomer =
  messageCustomer;

window.saveBusinessProfile =
  saveBusinessProfile;

window.loadBusinessProfile =
  loadBusinessProfile;

window.displayHistory =
  displayHistory;

window.showReport =
  showReport;

window.showReceipt =
  showReceipt;

window.closeReceipt =
  closeReceipt;

window.shareReceipt =
  shareReceipt;

window.printReceipt =
  printReceipt;

window.displayPOSProducts =
  displayPOSProducts;

window.addToPOSCart =
  addToPOSCart;

window.renderPOSCart =
  renderPOSCart;

window.changePOSQuantity =
  changePOSQuantity;

window.clearPOSCart =
  clearPOSCart;

window.checkoutPOS =
  checkoutPOS;

window.refreshPOS =
  refreshPOS;

window.searchProducts =
  searchProducts;

window.searchCustomers =
  searchCustomers;

window.searchPOSProducts =
  searchPOSProducts;

// =====================================
// READY
// =====================================

console.log(
  "MarketMate app.js loaded successfully."
);             