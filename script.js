const STORAGE_KEY = 'debt-tracker-data';

const defaultData = {
    'Jan P.': [
        { desc: 'Zapłacił moją kartą', amount: 5, date: '2026-04-08T10:00:00.000Z' }
    ],
    'Jakub Wilk': [
        { desc: 'Za puszkę gazowanego Tymbarka', amount: 4.5, date: '2026-04-08T10:30:00.000Z' }
    ],
    'Dawid Meteush': [
        { desc: 'ej ma ktos pozyczyc 2 zl', amount: 2, date: '2026-04-08T11:00:00.000Z' }
    ]
};

const allowedPeople = Object.keys(defaultData);

const peopleContainer = document.querySelector('#people-container');
const detailsView = document.querySelector('#details-view');
const historyList = document.querySelector('#history-list');
const selectedPersonAvatar = document.querySelector('#selected-person-avatar');
const personNameHeader = document.querySelector('#selected-person-name');
const selectedPersonBalance = document.querySelector('#selected-person-balance');
const totalBalance = document.querySelector('#total-balance');
const peopleCount = document.querySelector('#people-count');
const closeButton = document.querySelector('#close-btn');

let data = loadData();
let activePerson = null;

function getPersonAvatarUrl(name) {
    if (name === 'Jan P.') {
        return 'assets/Jan P.jpg';
    }

    if (name === 'Jakub Wilk') {
        return 'assets/Jakub W.jpg';
    }

    if (name === 'Dawid Meteush') {
        return 'assets/Dawid M.jpg';
    }

    return '';
}

function normalizeEntries(entries) {
    const uniqueEntries = [];
    const seenKeys = new Set();

    entries.forEach((entry) => {
        const isValidEntry = entry && typeof entry === 'object' && typeof entry.desc === 'string';

        if (!isValidEntry) {
            return;
        }

        const key = `${entry.desc}`;

        if (seenKeys.has(key)) {
            return;
        }

        seenKeys.add(key);
        uniqueEntries.push({
            desc: entry.desc,
            amount: Number(entry.amount) || 0,
            date: entry.date || new Date().toISOString(),
            note: entry.note || ''
        });
    });

    return uniqueEntries;
}

function loadData() {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
        return JSON.parse(JSON.stringify(defaultData));
    }

    try {
        const parsedData = JSON.parse(savedData);
        if (!parsedData || typeof parsedData !== 'object') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
            return JSON.parse(JSON.stringify(defaultData));
        }

        const filteredData = {};

        allowedPeople.forEach((name) => {
            const defaultEntries = Array.isArray(defaultData[name]) ? JSON.parse(JSON.stringify(defaultData[name])) : [];
                if (name === 'Jakub Wilk') {
                    filteredData[name] = defaultEntries;
                    return;
                }

                const savedEntries = Array.isArray(parsedData[name]) ? parsedData[name] : [];

                filteredData[name] = normalizeEntries([...defaultEntries, ...savedEntries]);
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredData));
        return filteredData;
    } catch {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
        return JSON.parse(JSON.stringify(defaultData));
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function formatCurrency(value) {
    const roundedValue = Number(value) || 0;
    const sign = roundedValue > 0 ? '+' : '';
    return `${sign}${roundedValue.toFixed(2).replace(/\.00$/, '')} zł`;
}

function getPersonBalance(entries) {
    return entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
}

function getTotalBalance() {
    return Object.values(data).reduce((sum, entries) => sum + getPersonBalance(entries), 0);
}

function getSortedPeople() {
    return Object.entries(data).sort((left, right) => {
        const leftBalance = getPersonBalance(left[1]);
        const rightBalance = getPersonBalance(right[1]);
        return rightBalance - leftBalance;
    });
}

function renderPeopleList() {
    peopleContainer.innerHTML = '';

    const people = getSortedPeople();

    if (people.length === 0) {
        peopleContainer.innerHTML = '<p class="label">Brak wpisów. Dodaj pierwszą osobę.</p>';
        return;
    }

    people.forEach(([name, entries]) => {
        const balance = getPersonBalance(entries);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'person-btn';
        button.dataset.personName = name;
        button.innerHTML = `
            <div class="person-card-top">
                <img class="person-avatar" src="${getPersonAvatarUrl(name)}" alt="${name}">
                <strong>${name}</strong>
            </div>
            <div class="person-meta">
                <span>${entries.length} transakcj${entries.length === 1 ? 'a' : entries.length >= 2 && entries.length <= 4 ? 'e' : 'i'}</span>
                <span class="${balance > 0 ? 'balance-positive' : balance < 0 ? 'balance-negative' : 'balance-zero'}">${formatCurrency(balance)}</span>
            </div>
        `;
        peopleContainer.appendChild(button);
    });
}

function updateSummary() {
    const balance = getTotalBalance();
    totalBalance.textContent = formatCurrency(balance);
    peopleCount.textContent = String(Object.keys(data).length);
}

function openPersonDetails(name) {
    activePerson = name;
    detailsView.classList.remove('hidden');
    personNameHeader.textContent = name;
    selectedPersonAvatar.src = getPersonAvatarUrl(name) || 'assets/Jan P.jpg';
    selectedPersonAvatar.alt = name;

    const balance = getPersonBalance(data[name]);
    selectedPersonBalance.textContent = `Saldo: ${formatCurrency(balance)}`;

    historyList.innerHTML = '';

    const entries = [...data[name]].reverse();

    if (entries.length === 0) {
        historyList.innerHTML = '<p class="label">Brak transakcji.</p>';
        return;
    }

    entries.forEach((entry) => {
        const item = document.createElement('div');
        item.className = 'history-item';

        const formattedAmount = formatCurrency(entry.amount);
        const isPositive = Number(entry.amount) > 0;
        const dateText = entry.date ? new Date(entry.date).toLocaleDateString('pl-PL') : '';

        item.innerHTML = `
            <div>
                <p class="history-desc">${entry.desc}</p>
                <p class="history-date">${dateText}</p>
            </div>
            <span class="history-amount ${isPositive ? 'balance-positive' : 'balance-negative'}">${formattedAmount}</span>
        `;

        historyList.appendChild(item);
    });
}

function renderAll() {
    updateSummary();
    renderPeopleList();

    if (activePerson && data[activePerson]) {
        openPersonDetails(activePerson);
    }
}

peopleContainer.addEventListener('click', (event) => {
    const button = event.target.closest('.person-btn');

    if (!button) {
        return;
    }

    const name = button.dataset.personName;
    if (name) {
        openPersonDetails(name);
    }
});

closeButton.addEventListener('click', (event) => {
    event.preventDefault();
    activePerson = null;
    detailsView.classList.add('hidden');
});

renderAll();