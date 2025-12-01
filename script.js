(function(){
  const STORAGE_KEY = 'expense-tracker-transactions-v1';
  const form = document.getElementById('transaction-form');
  const nameInput = document.getElementById('name');
  const amountInput = document.getElementById('amount');
  const typeInputs = document.getElementsByName('type');
  const listEl = document.getElementById('transaction-list');
  const balanceEl = document.getElementById('balance');
  const ieEl = document.getElementById('income-expense');
  const msgEl = document.getElementById('message');
  const clearAllBtn = document.getElementById('clear-all');

  let transactions = loadTransactions();
  render();

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    clearMessage();
    const name = nameInput.value.trim();
    let amount = amountInput.value;
    const type = Array.from(typeInputs).find(r=>r.checked).value;

    if(!name){ return showMessage('Please enter a transaction name.', 'warn'); }
    if(amount === '' || isNaN(amount)) { return showMessage('Please enter a valid amount.', 'warn'); }

    amount = parseFloat(amount);
    if(amount === 0) { return showMessage('Amount cannot be zero.', 'warn'); }

    amount = Math.abs(amount);

    const transaction = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,8),
      name,
      amount,
      type,
      createdAt: new Date().toISOString()
    };

    transactions.push(transaction);
    saveTransactions();
    render();
    form.reset();
    document.querySelector('input[name="type"][value="income"]').checked = true;
    showMessage('Transaction added.', 'ok');
  });

  clearAllBtn.addEventListener('click', ()=>{
    if(transactions.length === 0){ showMessage('No transactions to clear.', 'warn'); return; }
    if(!confirm('Clear all transactions? This cannot be undone.')) return;
    transactions = [];
    saveTransactions();
    render();
    showMessage('All transactions cleared.', 'ok');
  });

  function render(){
    listEl.innerHTML = '';

    if(transactions.length === 0){
      const empty = document.createElement('div');
      empty.className = 'small';
      empty.textContent = 'No transactions yet. Add one using the form.';
      listEl.appendChild(empty);
    } else {
      transactions.slice().reverse().forEach(tx => {
        const li = document.createElement('li');
        const meta = document.createElement('div'); meta.className='meta';
        const name = document.createElement('div'); name.className='name'; name.textContent = tx.name;
        const date = document.createElement('div'); date.className='small'; date.textContent = new Date(tx.createdAt).toLocaleString();
        meta.appendChild(name); meta.appendChild(date);

        const right = document.createElement('div'); right.style.display='flex'; right.style.alignItems='center'; right.style.gap='12px';
        const amt = document.createElement('div'); amt.className='amt '+ (tx.type === 'income' ? 'income' : 'expense');
        const sign = tx.type === 'income' ? '+' : '-';
        amt.textContent = sign + ' ₹' + Number(tx.amount).toFixed(2);

        const actions = document.createElement('div'); actions.className='actions';
        const del = document.createElement('button'); del.className='delete'; del.textContent='Delete';
        del.addEventListener('click', ()=>{ deleteTransaction(tx.id); });

        actions.appendChild(del);
        right.appendChild(amt); right.appendChild(actions);

        li.appendChild(meta); li.appendChild(right);
        listEl.appendChild(li);
      });
    }

    updateBalance();
  }

  function updateBalance(){
    const income = transactions.filter(t=>t.type==='income').reduce((s,t)=>s + Number(t.amount),0);
    const expense = transactions.filter(t=>t.type==='expense').reduce((s,t)=>s + Number(t.amount),0);
    const balance = income - expense;

    balanceEl.textContent = '₹' + balance.toFixed(2);
    ieEl.textContent = 'Income: ₹' + income.toFixed(2) + ' • Expense: ₹' + expense.toFixed(2);

    if(balance < 0){ balanceEl.style.color = 'var(--danger)'; }
    else if(balance > 0){ balanceEl.style.color = 'var(--success)'; }
    else { balanceEl.style.color = ''; }
  }

  function deleteTransaction(id){
    transactions = transactions.filter(t=>t.id !== id);
    saveTransactions();
    render();
    showMessage('Transaction removed.', 'ok');
  }

  function saveTransactions(){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch(e){
      console.error('Failed to save to localStorage', e);
      showMessage('Unable to save data in local storage.', 'warn');
    }
  }

  function loadTransactions(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return [];
      const parsed = JSON.parse(raw);
      if(!Array.isArray(parsed)) return [];
      return parsed;
    } catch(e){
      console.error('Failed to load transactions', e);
      return [];
    }
  }

  function showMessage(text, type){
    msgEl.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'msg ' + (type === 'warn' ? 'warn' : 'ok');
    div.textContent = text;
    msgEl.appendChild(div);
    setTimeout(()=>{
      if(msgEl.contains(div)) msgEl.removeChild(div);
    },3500);
  }
  function clearMessage(){ msgEl.innerHTML = ''; }

})();
