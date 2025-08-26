// 卡牌数据结构
const suits = [
    { name: 'spades', symbol: '♠', color: 'black' },
    { name: 'hearts', symbol: '♥', color: 'red' },
    { name: 'diamonds', symbol: '♦', color: 'red' },
    { name: 'clubs', symbol: '♣', color: 'black' }
];

const ranks = [
    { name: 'A', value: 14, displayValue: 1 },
    { name: '2', value: 2, displayValue: 2 },
    { name: '3', value: 3, displayValue: 3 },
    { name: '4', value: 4, displayValue: 4 },
    { name: '5', value: 5, displayValue: 5 },
    { name: '6', value: 6, displayValue: 6 },
    { name: '7', value: 7, displayValue: 7 },
    { name: '8', value: 8, displayValue: 8 },
    { name: '9', value: 9, displayValue: 9 },
    { name: '10', value: 10, displayValue: 10 },
    { name: 'J', value: 11, displayValue: 11 },
    { name: 'Q', value: 12, displayValue: 12 },
    { name: 'K', value: 13, displayValue: 13 }
];

// Balatro Hand Type Scores
const handTypes = {
    'High Card': { chips: 5, mult: 1, name: 'High Card' },
    'Pair': { chips: 10, mult: 2, name: 'Pair' },
    'Two Pair': { chips: 20, mult: 2, name: 'Two Pair' },
    'Three of a Kind': { chips: 30, mult: 3, name: 'Three of a Kind' },
    'Straight': { chips: 30, mult: 4, name: 'Straight' },
    'Flush': { chips: 35, mult: 4, name: 'Flush' },
    'Full House': { chips: 40, mult: 4, name: 'Full House' },
    'Four of a Kind': { chips: 60, mult: 7, name: 'Four of a Kind' },
    'Straight Flush': { chips: 100, mult: 8, name: 'Straight Flush' },
    'Royal Flush': { chips: 100, mult: 8, name: 'Royal Flush' }
};

// 全局状态
let selectedCards = [];
let allCards = [];

// 初始化游戏
function initGame() {
    createDeck();
    setupEventListeners();
    updateDisplay();
}

// Create deck with suits in separate rows
function createDeck() {
    const deckElement = document.getElementById('deck');
    allCards = [];

    suits.forEach(suit => {
        // Create suit row container
        const suitRow = document.createElement('div');
        suitRow.className = 'suit-row';
        suitRow.innerHTML = `<div class="suit-label ${suit.color}">${suit.symbol} ${suit.name.toUpperCase()}</div>`;
        
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'suit-cards';
        
        ranks.forEach(rank => {
            const card = {
                suit: suit.name,
                suitSymbol: suit.symbol,
                suitColor: suit.color,
                rank: rank.name,
                value: rank.value,
                displayValue: rank.displayValue,
                id: `${suit.name}-${rank.name}`
            };
            
            allCards.push(card);
            
            const cardElement = createCardElement(card);
            cardsContainer.appendChild(cardElement);
        });
        
        suitRow.appendChild(cardsContainer);
        deckElement.appendChild(suitRow);
    });
}

// 创建卡牌元素
function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = `card ${card.suitColor}`;
    cardDiv.dataset.cardId = card.id;
    cardDiv.innerHTML = `
        <div class="card-suit">${card.suitSymbol}</div>
        <div class="card-rank">${card.rank}</div>
    `;
    
    cardDiv.addEventListener('click', () => toggleCard(card));
    
    return cardDiv;
}

// 切换卡牌选择状态
function toggleCard(card) {
    const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
    
    if (selectedCards.find(c => c.id === card.id)) {
        // 取消选择
        selectedCards = selectedCards.filter(c => c.id !== card.id);
        cardElement.classList.remove('selected');
    } else {
        // 选择卡牌
        if (selectedCards.length < 5) {
            selectedCards.push(card);
            cardElement.classList.add('selected');
        }
    }
    
    updateCardStates();
    updateDisplay();
}

// 更新卡牌状态
function updateCardStates() {
    const cardElements = document.querySelectorAll('.card');
    cardElements.forEach(cardElement => {
        const isSelected = cardElement.classList.contains('selected');
        if (!isSelected && selectedCards.length >= 5) {
            cardElement.classList.add('disabled');
        } else {
            cardElement.classList.remove('disabled');
        }
    });
}

// 更新显示
function updateDisplay() {
    updateSelectedCardsDisplay();
    updateResultDisplay();
}

// 更新已选择卡牌显示
function updateSelectedCardsDisplay() {
    const selectedHandElement = document.getElementById('selected-hand');
    const selectedCountElement = document.getElementById('selected-count');
    
    selectedCountElement.textContent = selectedCards.length;
    selectedHandElement.innerHTML = '';
    
    selectedCards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = `selected-card ${card.suitColor}`;
        cardDiv.innerHTML = `
            <div class="card-suit">${card.suitSymbol}</div>
            <div class="card-rank">${card.rank}</div>
        `;
        selectedHandElement.appendChild(cardDiv);
    });
    
    if (selectedCards.length === 0) {
        selectedHandElement.innerHTML = '<div style="color: #666; font-style: italic;">Please select cards</div>';
    }
}

// Update result display
function updateResultDisplay() {
    if (selectedCards.length === 0) {
        document.getElementById('hand-type').textContent = 'Select cards';
        document.getElementById('base-chips').textContent = '-';
        document.getElementById('multiplier').textContent = '-';
        document.getElementById('final-score').textContent = '-';
        return;
    }
    
    const handType = evaluateHand(selectedCards);
    const handInfo = handTypes[handType];
    
    // 计算基础筹码（包含卡牌点数）
    const cardChips = selectedCards.reduce((sum, card) => sum + card.displayValue, 0);
    const totalChips = handInfo.chips + cardChips;
    const finalScore = totalChips * handInfo.mult;
    
    document.getElementById('hand-type').textContent = handInfo.name;
    document.getElementById('base-chips').textContent = `${handInfo.chips} + ${cardChips} = ${totalChips}`;
    document.getElementById('multiplier').textContent = `${handInfo.mult}x`;
    document.getElementById('final-score').textContent = finalScore;
}

// 牌型识别算法
function evaluateHand(cards) {
    if (cards.length === 0) return 'High Card';
    
    // 按点数排序
    const sortedCards = [...cards].sort((a, b) => a.value - b.value);
    
    // 统计花色和点数
    const suitCounts = {};
    const rankCounts = {};
    
    cards.forEach(card => {
        suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
        rankCounts[card.value] = (rankCounts[card.value] || 0) + 1;
    });
    
    const isFlush = Object.values(suitCounts).some(count => count >= 5);
    const isStraight = checkStraight(sortedCards);
    const rankCountValues = Object.values(rankCounts).sort((a, b) => b - a);
    
    // 判断牌型
    if (isStraight && isFlush) {
        // 检查是否为皇家同花顺 (10, J, Q, K, A)
        const straightValues = getStraightValues(sortedCards);
        if (straightValues.includes(10) && straightValues.includes(14)) {
            return 'Royal Flush';
        }
        return 'Straight Flush';
    }
    
    if (rankCountValues[0] === 4) return 'Four of a Kind';
    if (rankCountValues[0] === 3 && rankCountValues[1] === 2) return 'Full House';
    if (isFlush) return 'Flush';
    if (isStraight) return 'Straight';
    if (rankCountValues[0] === 3) return 'Three of a Kind';
    if (rankCountValues[0] === 2 && rankCountValues[1] === 2) return 'Two Pair';
    if (rankCountValues[0] === 2) return 'Pair';
    
    return 'High Card';
}

// 检查顺子
function checkStraight(sortedCards) {
    if (sortedCards.length < 5) return false;
    
    const values = sortedCards.map(card => card.value);
    const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
    
    if (uniqueValues.length < 5) return false;
    
    // 检查连续的5张牌
    for (let i = 0; i <= uniqueValues.length - 5; i++) {
        let consecutive = true;
        for (let j = 1; j < 5; j++) {
            if (uniqueValues[i + j] !== uniqueValues[i + j - 1] + 1) {
                consecutive = false;
                break;
            }
        }
        if (consecutive) return true;
    }
    
    // 检查 A-2-3-4-5 的特殊顺子
    if (uniqueValues.includes(14) && uniqueValues.includes(2) && 
        uniqueValues.includes(3) && uniqueValues.includes(4) && uniqueValues.includes(5)) {
        return true;
    }
    
    return false;
}

// 获取顺子的值
function getStraightValues(sortedCards) {
    const values = sortedCards.map(card => card.value);
    const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
    
    // 找到顺子的5张牌
    for (let i = 0; i <= uniqueValues.length - 5; i++) {
        let consecutive = true;
        for (let j = 1; j < 5; j++) {
            if (uniqueValues[i + j] !== uniqueValues[i + j - 1] + 1) {
                consecutive = false;
                break;
            }
        }
        if (consecutive) {
            return uniqueValues.slice(i, i + 5);
        }
    }
    
    // 检查 A-2-3-4-5
    if (uniqueValues.includes(14) && uniqueValues.includes(2) && 
        uniqueValues.includes(3) && uniqueValues.includes(4) && uniqueValues.includes(5)) {
        return [14, 2, 3, 4, 5];
    }
    
    return uniqueValues;
}

// 设置事件监听器
function setupEventListeners() {
    document.getElementById('clear-btn').addEventListener('click', clearSelection);
}

// 清空选择
function clearSelection() {
    selectedCards = [];
    document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('selected', 'disabled');
    });
    updateDisplay();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initGame);