let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let goals = JSON.parse(localStorage.getItem("goals")) || [];
let myCharts = {};

document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const searchInput = document.getElementById('searchInput');

  // Mode toggle
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const activeBtn = document.querySelector('.chart-toggle-panel button.active') ||
                      document.querySelector('.chart-toggle-panel button');
    updateChart(activeBtn.dataset.chart);
  });

  // Sidebar navigation
  document.querySelectorAll('.sidebar li').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
      item.classList.add('active');

      const target = item.getAttribute('data-section');
      document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
      document.getElementById(target).classList.add('active');

      searchInput.style.display = target === 'transactions' ? 'inline-block' : 'none';
      if (target === 'dashboard') {
        const activeBtn = document.querySelector('.chart-toggle-panel button.active') ||
                          document.querySelector('.chart-toggle-panel button');
        updateChart(activeBtn.dataset.chart);
      }
    });
  });

  // Add transaction
  document.getElementById('transactionForm').addEventListener('submit', e => {
    e.preventDefault();
    const desc = document.getElementById('desc').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;

    if (!desc || !amount || amount <= 0) return alert("Enter valid transaction details!");

    const transaction = {
      desc,
      amount,
      category,
      date: new Date().toLocaleDateString(),
      type: category.toLowerCase()
    };

    transactions.push(transaction);
    saveData();
    updateList();
    updateChart();
    generateStatements();
    if (transaction.type === 'savings') updateGoals(amount);
    e.target.reset();
  });

  // Add goal
  document.getElementById('goalForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('goalName').value;
    const target = parseFloat(document.getElementById('goalTarget').value);
    if (!name || !target || target <= 0) return alert("Enter valid goal details!");
    const goal = { name, target, saved: 0 };
    goals.push(goal);
    saveData();
    renderGoals();
    e.target.reset();
  });

  // Search
  searchInput.addEventListener('input', updateList);

  // Chart toggle panel listener
  document.querySelector('.chart-toggle-panel').addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON') {
      document.querySelectorAll('.chart-toggle-panel button').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      updateChart(e.target.dataset.chart);
    }
  });

  // Initial render
  updateList();
  renderGoals();
  updateChart('doughnut');
  generateStatements();
});

// Save to Local Storage
function saveData() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
  localStorage.setItem("goals", JSON.stringify(goals));
}

// Update Transaction List
function updateList() {
  const list = document.getElementById('transactionList');
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  list.innerHTML = '';

  transactions
    .filter(t =>
      t.desc.toLowerCase().includes(searchTerm) ||
      t.category.toLowerCase().includes(searchTerm) ||
      t.date.includes(searchTerm)
    )
    .forEach(t => {
      const item = document.createElement('li');
      item.className = 'transaction-item';
      const amountClass = t.type;
      item.innerHTML = `
        <div class="transaction-left">
          <span class="transaction-date">${t.date}</span>
          <span class="transaction-desc">${t.desc}</span>
        </div>
        <div class="transaction-right">
          <span class="transaction-category ${t.category.toLowerCase()}">${t.category}</span>
          <span class="transaction-amount ${amountClass}">₹${t.amount}</span>
        </div>
      `;
      list.appendChild(item);
    });
}

// Chart Functions
function updateChart(selected = 'doughnut') {
  const income = sumType('income');
  const expense = sumType('expense');
  const savings = sumType('savings');
  animateValue('grandTotal', 0, income - expense - savings, 800);

  const monthlyLabels = [...new Set(transactions.map(t => t.date.split('/')[1]))].sort();
  const incomeMonthly = monthlyLabels.map(month =>
    transactions.filter(t => t.type === 'income' && t.date.split('/')[1] === month)
      .reduce((sum, t) => sum + t.amount, 0)
  );
  const expenseMonthly = monthlyLabels.map(month =>
    transactions.filter(t => t.type === 'expense' && t.date.split('/')[1] === month)
      .reduce((sum, t) => sum + t.amount, 0)
  );
  const savingsMonthly = monthlyLabels.map(month =>
    transactions.filter(t => t.type === 'savings' && t.date.split('/')[1] === month)
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const categoryLabels = [...new Set(transactions.map(t => t.category))];
  const expenseByCategory = categoryLabels.map(cat =>
    transactions.filter(t => t.category === cat && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const textColor = document.body.classList.contains('dark-mode') ? '#fff' : '#000';

  const chartConfigs = {
    doughnut: {
      type: 'doughnut',
      data: {
        labels: ['Income', 'Expense', 'Savings'],
        datasets: [{
          data: [income, expense, savings],
          backgroundColor: ['#43a047', '#e53935', '#1e88e5']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: textColor } }
        }
      }
    },
    bar: {
      type: 'bar',
      data: {
        labels: categoryLabels,
        datasets: [{
          label: 'Expense by Category',
          data: expenseByCategory,
          backgroundColor: '#e53935'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: textColor } },
          y: { ticks: { color: textColor }, beginAtZero: true }
        }
      }
    },
    line: {
      type: 'line',
      data: {
        labels: monthlyLabels,
        datasets: [
          { label: 'Income', data: incomeMonthly, borderColor: '#43a047', fill: false },
          { label: 'Expense', data: expenseMonthly, borderColor: '#e53935', fill: false },
          { label: 'Savings', data: savingsMonthly, borderColor: '#1e88e5', fill: false }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: textColor } }
        },
        scales: {
          x: { ticks: { color: textColor } },
          y: { ticks: { color: textColor }, beginAtZero: true }
        }
      }
    },
    stacked: {
      type: 'bar',
      data: {
        labels: monthlyLabels,
        datasets: [
          { label: 'Income', data: incomeMonthly, backgroundColor: '#43a047', stack: 'Stack 0' },
          { label: 'Expense', data: expenseMonthly, backgroundColor: '#e53935', stack: 'Stack 0' },
          { label: 'Savings', data: savingsMonthly, backgroundColor: '#1e88e5', stack: 'Stack 0' }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: textColor } }
        },
        scales: {
          x: { stacked: true, ticks: { color: textColor } },
          y: { stacked: true, ticks: { color: textColor }, beginAtZero: true }
        }
      }
    }
  };

  document.querySelectorAll('.chart-container canvas').forEach(c => c.style.display = 'none');
  Object.entries(myCharts).forEach(([key, chart]) => {
    if (chart) chart.destroy();
    myCharts[key] = null;
  });

  const activeCanvas = document.getElementById(`chart-${selected}`);
  if (!activeCanvas) return;
  activeCanvas.style.display = 'block';
  myCharts[selected] = new Chart(activeCanvas.getContext('2d'), chartConfigs[selected]);
}

// Helpers
function sumType(type) {
  return transactions.filter(t => t.type === type).reduce((sum, t) => sum + t.amount, 0);
}

function animateValue(id, start, end, duration) {
  const obj = document.getElementById(id);
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.textContent = `Net Balance: ₹${Math.floor(progress * (end - start) + start)}`;
    if (progress < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}

// Statements
function generateStatements() {
  const container = document.getElementById('statementContainer');
  container.innerHTML = '';
  const grouped = {};

  transactions.forEach(t => {
    const month = t.date.split('/')[1];
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(t);
  });

  for (const month in grouped) {
    const section = document.createElement('div');
    section.innerHTML = `<h3>Month: ${month}</h3>`;
    grouped[month].forEach(t => {
      const p = document.createElement('p');
      p.textContent = `${t.date} - ${t.desc} (${t.category}) ₹${t.amount}`;
      section.appendChild(p);
    });
    container.appendChild(section);
  }
}

// Goals
function renderGoals() {
  const container = document.getElementById('goalList');
  container.innerHTML = '';
  goals.forEach(goal => {
    const percent = Math.min((goal.saved / goal.target) * 100, 100).toFixed(1);
    const card = document.createElement('div');
    card.className = 'goal-card';
    card.innerHTML = `
      <h3>${goal.name}</h3>
      <p>Saved: ₹${goal.saved} / ₹${goal.target} (${percent}%)</p>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${percent}%"></div>
      </div>
    `;
    container.appendChild(card);
  });
}

function updateGoals(amount) {
  goals.forEach(goal => {
    if (goal.saved < goal.target) {
      const remaining = goal.target - goal.saved;
      const contribution = Math.min(amount, remaining);
      goal.saved += contribution;
      amount -= contribution;
    }
  });
  saveData();
  renderGoals();
}


function sumType(type) {
  return transactions
    .filter(t => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);
}

function animateValue(id, start, end, duration) {
  const obj = document.getElementById(id);
  const range = end - start;
  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    obj.textContent = '₹' + Math.floor(start + range * progress).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function updateChart(selected = 'doughnut') {
  const income = sumType('income');
  const expense = sumType('expense');
  const savings = sumType('savings');
  animateValue('grandTotal', 0, income - expense - savings, 800);

  const monthlyLabels = [...new Set(transactions.map(t => t.date.split('/')[1]))].sort();
  const incomeMonthly = monthlyLabels.map(month =>
    transactions.filter(t => t.type === 'income' && t.date.split('/')[1] === month)
      .reduce((sum, t) => sum + t.amount, 0)
  );
  const expenseMonthly = monthlyLabels.map(month =>
    transactions.filter(t => t.type === 'expense' && t.date.split('/')[1] === month)
      .reduce((sum, t) => sum + t.amount, 0)
  );
  const savingsMonthly = monthlyLabels.map(month =>
    transactions.filter(t => t.type === 'savings' && t.date.split('/')[1] === month)
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const categoryLabels = [...new Set(transactions.map(t => t.category))];
  const expenseByCategory = categoryLabels.map(cat =>
    transactions.filter(t => t.category === cat && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const textColor = document.body.classList.contains('dark-mode') ? '#fff' : '#000';

  const chartConfigs = {
    doughnut: {
      type: 'doughnut',
      data: {
        labels: ['Income', 'Expense', 'Savings'],
        datasets: [{
          data: [income, expense, savings],
          backgroundColor: ['#43a047', '#e53935', '#1e88e5']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: textColor }
          }
        }
      }
    },
    bar: {
      type: 'bar',
      data: {
        labels: categoryLabels,
        datasets: [{
          label: 'Expense by Category',
          data: expenseByCategory,
          backgroundColor: '#e53935'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: textColor } },
          y: { ticks: { color: textColor }, beginAtZero: true }
        },
        plugins: { legend: { display: false } }
      }
    },
    line: {
      type: 'line',
      data: {
        labels: monthlyLabels,
        datasets: [
          { label: 'Income', data: incomeMonthly, borderColor: '#43a047', fill: false },
          { label: 'Expense', data: expenseMonthly, borderColor: '#e53935', fill: false },
          { label: 'Savings', data: savingsMonthly, borderColor: '#1e88e5', fill: false }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: textColor } } },
        scales: {
          x: { ticks: { color: textColor } },
          y: { ticks: { color: textColor }, beginAtZero: true }
        }
      }
    },
    stacked: {
      type: 'bar',
      data: {
        labels: monthlyLabels,
        datasets: [
          { label: 'Income', data: incomeMonthly, backgroundColor: '#43a047', stack: 'stack' },
          { label: 'Expense', data: expenseMonthly, backgroundColor: '#e53935', stack: 'stack' },
          { label: 'Savings', data: savingsMonthly, backgroundColor: '#1e88e5', stack: 'stack' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: textColor } } },
        scales: {
          x: { stacked: true, ticks: { color: textColor } },
          y: { stacked: true, ticks: { color: textColor }, beginAtZero: true }
        }
      }
    }
  };

  // Hide all charts and destroy old ones
  document.querySelectorAll('.chart-container canvas').forEach(c => c.style.display = 'none');
  Object.values(myCharts).forEach(ch => ch?.destroy());
  myCharts = {};

  // Show selected chart
  const activeCanvas = document.getElementById(`chart-${selected}`);
  activeCanvas.style.display = 'block';
  myCharts[selected] = new Chart(activeCanvas.getContext('2d'), chartConfigs[selected]);
}

// Chart toggle buttons
document.querySelector('.chart-toggle-panel').addEventListener('click', e => {
  if (e.target.tagName === 'BUTTON') {
    document.querySelectorAll('.chart-toggle-panel button').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    updateChart(e.target.dataset.chart);
  }
});

// Theme toggle refresh
document.getElementById('themeToggle').addEventListener('click', () => {
  const activeBtn = document.querySelector('.chart-toggle-panel button.active') || document.querySelector('.chart-toggle-panel button');
  updateChart(activeBtn.dataset.chart);
});

// Initialize
updateChart('doughnut');

